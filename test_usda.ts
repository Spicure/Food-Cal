const mapUSDA = (fdcItem: any) => {
  const getNutrient = (ids: string[]) => {
    const nut = fdcItem.foodNutrients.find(n => ids.includes(n.nutrientNumber) || ids.includes(String(n.nutrientId)));
    return nut ? nut.value : 0;
  };
  return {
    code: 'usda_' + fdcItem.fdcId,
    name: fdcItem.description,
    group: fdcItem.foodCategory || 'USDA Item',
    energyKcal: getNutrient(['208', '1008']),
    protein: getNutrient(['203', '1003']),
    carbs: getNutrient(['205', '1005']),
    sugars: getNutrient(['269', '2000']),
    fat: getNutrient(['204', '1004']),
    fiber: getNutrient(['291', '1079']),
    salt: getNutrient(['307', '1093']) / 400, // salt in g from sodium in mg
    magnesium: getNutrient(['304', '1090']),
    iron: getNutrient(['303', '1089']),
    zinc: getNutrient(['309', '1095']),
    iodine: getNutrient(['317', '1100']), // guess
    selenium: getNutrient(['317', '1103']),
    vitA: getNutrient(['320', '1106', '318', '1104']),
    vitC: getNutrient(['401', '1162']),
    vitD3: getNutrient(['326', '1111', '328', '1110']),
    vitE: getNutrient(['323', '1109']),
    vitB2: getNutrient(['405', '1166']),
    vitB6: getNutrient(['415', '1175']),
    vitB9: getNutrient(['417', '1177', '431', '1186']),
    vitB12: getNutrient(['418', '1178']),
    tyrosine: getNutrient(['511', '1222']),
  };
};

fetch('https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY', {
  method: 'POST',
  headers: {'Content-Type': 'application/json'},
  body: JSON.stringify({query: 'apple', pageSize: 1, dataType: ['SR Legacy']})
}).then(r => r.json()).then(d => {
  console.log(mapUSDA(d.foods[0]));
});
