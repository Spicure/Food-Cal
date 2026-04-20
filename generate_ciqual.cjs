const axios = require('axios');
const xlsx = require('xlsx');
const fs = require('fs');

const url = "https://ciqual.anses.fr/cms/sites/default/files/inline-files/Table%20Ciqual%202020_FR_2020%2007%2007.xls";

async function fetchCiqual() {
  try {
    console.log("Downloading CIQUAL FR...");
    const response = await axios.get(url, { responseType: 'arraybuffer' });
    console.log("Downloaded. Parsing...");
    const workbook = xlsx.read(response.data, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(sheet);
    
    console.log("Rows count:", data.length);
    console.log("First row keys:", Object.keys(data[0]));
    
    const cleanData = data.map(row => ({
      code: row["alim_code"],
      name: row["alim_nom_fr"] || row["alim_nom_eng"],
      group: row["alim_grp_nom_fr"] || row["alim_grp_nom_eng"],
      subgroup: row["alim_ssgrp_nom_fr"],
      energyKcal: parseNutrient(row["Energie, Règlement UE N° 1169/2011 (kcal/100 g)"]),
      protein: parseNutrient(row["Protéines, N x facteur de Jones (g/100 g)"]),
      carbs: parseNutrient(row["Glucides (g/100 g)"]),
      sugars: parseNutrient(row["Sucres (g/100 g)"]),
      fat: parseNutrient(row["Lipides (g/100 g)"]),
      fiber: parseNutrient(row["Fibres alimentaires (g/100 g)"]),
      salt: parseNutrient(row["Sel chlorure de sodium (g/100 g)"])
    }));

    if (!fs.existsSync('./public')) fs.mkdirSync('./public');
    fs.writeFileSync('./public/ciqual.json', JSON.stringify(cleanData));
    console.log("Saved to public/ciqual.json. Total items:", cleanData.length);
  } catch (err) {
    console.error("Error fetching CIQUAL:", err.message);
  }
}

function parseNutrient(val) {
  if (!val || val === '-' || val.toString().includes('traces')) return 0;
  const num = parseFloat(val.toString().replace(',', '.').replace('<', ''));
  return isNaN(num) ? 0 : num;
}

fetchCiqual();
