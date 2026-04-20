import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Activity, ListChecks, Trash2 } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RechartsTooltip } from 'recharts';

import { cn } from './lib/utils';
import foodsData from '../public/ciqual.json';

// Types
interface FoodItem {
  code: string | number;
  name: string;
  group: string;
  subgroup?: string;
  energyKcal: number;
  protein: number;
  carbs: number;
  sugars: number;
  fat: number;
  fiber: number;
  salt: number;
  magnesium: number;
  iron: number;
  zinc: number;
  iodine: number;
  selenium: number;
  vitA: number;
  vitC: number;
  vitD3: number;
  vitE: number;
  vitB2: number;
  vitB6: number;
  vitB9: number;
  vitB12: number;
  tyrosine: number;
}

export default function App() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  
  // Filters
  const [minProtein, setMinProtein] = useState<number>(0);
  const [maxKcal, setMaxKcal] = useState<number>(1000);
  
  // Selection List State
  const [selectedItems, setSelectedItems] = useState<FoodItem[]>(() => {
    try {
      const saved = localStorage.getItem('foodSelection');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [rightTab, setRightTab] = useState<'details' | 'list'>('details');

  // Totals Calculation
  // La méthode reduce parcourt tous les items pour en faire la somme.
  // useMemo permet de ne recalculer les totaux que si selectedItems change.
  const totals = useMemo(() => {
    return selectedItems.reduce((acc, item) => ({
      energyKcal: acc.energyKcal + (item.energyKcal || 0),
      protein: acc.protein + (item.protein || 0),
      carbs: acc.carbs + (item.carbs || 0),
      fat: acc.fat + (item.fat || 0),
      sugars: acc.sugars + (item.sugars || 0),
      fiber: acc.fiber + (item.fiber || 0),
      salt: acc.salt + (item.salt || 0),
      magnesium: acc.magnesium + (item.magnesium || 0),
      iron: acc.iron + (item.iron || 0),
      zinc: acc.zinc + (item.zinc || 0),
      iodine: acc.iodine + (item.iodine || 0),
      selenium: acc.selenium + (item.selenium || 0),
      vitA: acc.vitA + (item.vitA || 0),
      vitC: acc.vitC + (item.vitC || 0),
      vitD3: acc.vitD3 + (item.vitD3 || 0),
      vitE: acc.vitE + (item.vitE || 0),
      vitB2: acc.vitB2 + (item.vitB2 || 0),
      vitB6: acc.vitB6 + (item.vitB6 || 0),
      vitB9: acc.vitB9 + (item.vitB9 || 0),
      vitB12: acc.vitB12 + (item.vitB12 || 0),
      tyrosine: acc.tyrosine + (item.tyrosine || 0),
    }), { 
      energyKcal: 0, protein: 0, carbs: 0, fat: 0, sugars: 0, fiber: 0, salt: 0,
      magnesium: 0, iron: 0, zinc: 0, iodine: 0, selenium: 0,
      vitA: 0, vitC: 0, vitD3: 0, vitE: 0, vitB2: 0, vitB6: 0, vitB9: 0, vitB12: 0, tyrosine: 0
    });
  }, [selectedItems]);

  useEffect(() => {
    localStorage.setItem('foodSelection', JSON.stringify(selectedItems));
  }, [selectedItems]);
  
  useEffect(() => {
    // Direct import bypasses all GitHub Pages path and fetch issues!
    setFoods(foodsData as FoodItem[]);
  }, []);
  
  const addToSelection = (food: FoodItem) => {
    if (!selectedItems.some(item => item.code === food.code)) {
      setSelectedItems([...selectedItems, food]);
      setRightTab('list');
    }
  };

  const removeFromSelection = (code: string | number) => {
    setSelectedItems(selectedItems.filter(item => item.code !== code));
  };

  const filteredFoods = useMemo(() => {
    return foods.filter(f => {
      const matchSearch = f.name?.toLowerCase().includes(search.toLowerCase());
      const matchProtein = f.protein >= minProtein;
      const matchKcal = f.energyKcal <= maxKcal;
      return matchSearch && matchProtein && matchKcal;
    }).slice(0, 50); // limit for perf
  }, [foods, search, minProtein, maxKcal]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-4 md:px-6 flex items-center justify-between shadow-sm z-10 shrink-0">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="bg-indigo-600 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xl italic leading-none shrink-0">C</div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">Food <span className="text-indigo-600">Cal</span></h1>
          <span className="ml-2 md:ml-4 hidden sm:inline-block text-xs font-medium px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase tracking-widest shrink-0">v2024.1</span>
        </div>
        <div className="flex-1 max-w-md mx-4 md:mx-8">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-10 pr-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Rechercher un aliment (ex: Pomme, Saumon...)"
            />
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <button className="hidden sm:inline-block text-xs font-semibold px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Exporter JSON
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
            JD
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left Sidebar (Filters) */}
        <aside className="w-64 bg-white border-r border-slate-200 flex-col p-4 gap-6 custom-scroll overflow-y-auto shrink-0 hidden md:flex">
          <section>
            <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
              <Filter className="w-3 h-3" /> Filtres Nutritionnels
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <label>Protéines (g)</label>
                  <span className="text-indigo-600">&gt; {minProtein}g</span>
                </div>
                <input 
                  type="range" min="0" max="100" 
                  value={minProtein} onChange={e => setMinProtein(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <label>Énergie (kcal)</label>
                  <span className="text-indigo-600">0 - {maxKcal}</span>
                </div>
                <input 
                  type="range" min="0" max="1000" 
                  value={maxKcal} onChange={e => setMaxKcal(parseInt(e.target.value))} 
                  className="w-full h-1.5 bg-slate-100 rounded-full appearance-none cursor-pointer accent-indigo-500" 
                />
              </div>
            </div>
          </section>
        </aside>

        {/* Center Grid (Results) */}
        <section className="flex-1 overflow-y-auto custom-scroll p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          <div className="col-span-full mb-1 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredFoods.length} résultat{filteredFoods.length !== 1 ? 's' : ''} {filteredFoods.length === 50 && '(limité)'}
          </div>
          {filteredFoods.map(food => (
            <button
              key={food.code}
              onClick={() => {
                setSelectedFood(food);
                setRightTab('details');
              }}
              className={cn(
                "bg-white border rounded-lg p-3 shadow-sm hover:border-indigo-400 cursor-pointer transition-all border-l-4 text-left focus:outline-none flex flex-col justify-between h-full min-h-[120px]",
                selectedFood?.code === food.code ? "border-indigo-500 ring-1 ring-indigo-500 shadow-md border-l-indigo-500" : "border-slate-200",
                food.energyKcal < 100 ? "border-l-emerald-400" : food.energyKcal < 300 ? "border-l-amber-400" : "border-l-rose-400"
              )}
            >
              <div className="w-full">
                <div className="flex justify-between mb-2 gap-2">
                  <h4 className="font-bold text-sm truncate pr-2 text-slate-800" title={food.name}>{food.name}</h4>
                  <span className="text-[10px] text-slate-400 shrink-0 mt-0.5">ID: {food.code}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-3">
                  <span className="macro-pill bg-emerald-100 text-emerald-700">Pro: {food.protein}g</span>
                  <span className="macro-pill bg-amber-100 text-amber-700">Lip: {food.fat}g</span>
                  <span className="macro-pill text-blue-700 bg-blue-100">Glu: {food.carbs}g</span>
                </div>
              </div>
              <div className="text-lg font-black text-slate-700 mt-auto">
                {food.energyKcal.toFixed(0)} <span className="text-[10px] font-normal text-slate-400 uppercase">kcal / 100g</span>
              </div>
            </button>
          ))}
          {filteredFoods.length === 0 && (
             <div className="col-span-full p-8 text-center text-slate-500 text-sm">Aucun aliment trouvé. Modifiez vos filtres.</div>
          )}
        </section>

        {/* Right Sidebar (Details & List) */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 flex flex-col shrink-0 hidden sm:flex h-full pb-4">
          {/* Tabs */}
          <div className="flex border-b border-slate-200 shrink-0">
            <button 
              onClick={() => setRightTab('details')} 
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 flex justify-center items-center gap-2 transition-colors ${rightTab === 'details' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <Activity className="w-4 h-4" /> Détails
            </button>
            <button 
              onClick={() => setRightTab('list')} 
              className={`flex-1 py-3 text-xs font-bold uppercase tracking-wide border-b-2 flex justify-center items-center gap-2 transition-colors ${rightTab === 'list' ? 'border-indigo-600 text-indigo-700 bg-indigo-50/50' : 'border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-50'}`}
            >
              <ListChecks className="w-4 h-4" /> Ma Liste
              {selectedItems.length > 0 && (
                <span className="bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded-full text-[10px] leading-none mb-0.5">{selectedItems.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-5 flex flex-col">
            {rightTab === 'details' ? (
              // DETAILS TAB
              selectedFood ? (
                <>
                  <div className="text-center">
                    <h2 className="text-lg font-bold text-slate-900">{selectedFood.name}</h2>
                    <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{selectedFood.group}</p>
                  </div>
                  
                  <div className="relative flex justify-center py-2 h-48 w-full -mx-4 overflow-visible shrink-0">
                    <ResponsiveContainer width={240} height={200} className="mx-auto block" style={{overflow: 'visible'}}>
                        <RadarChart cx="50%" cy="50%" outerRadius={70} data={[
                            { subject: 'Protéines', val: selectedFood.protein, fullMark: 100 },
                            { subject: 'Glucides', val: selectedFood.carbs, fullMark: 100 },
                            { subject: 'Sucres', val: selectedFood.sugars, fullMark: 100 },
                            { subject: 'Lipides', val: selectedFood.fat, fullMark: 100 },
                            { subject: 'Fibres', val: selectedFood.fiber, fullMark: 100 },
                        ]}>
                            <PolarGrid stroke="#f1f5f9" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 10, fontWeight: 700 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                            <Radar name={selectedFood.name} dataKey="val" stroke="#4f46e5" fill="#4f46e5" fillOpacity={0.3} />
                            <RechartsTooltip />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-1">
                       <span className="text-3xl font-black text-slate-800">{selectedFood.energyKcal.toFixed(0)}</span><br/>
                       <span className="text-[10px] text-slate-400 uppercase font-bold leading-none">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0">
                    <div className="text-center p-2 bg-emerald-50 rounded-lg">
                      <div className="text-[10px] text-emerald-600 font-bold uppercase">Protéines</div>
                      <div className="text-sm font-bold text-emerald-900">{selectedFood.protein}g</div>
                    </div>
                    <div className="text-center p-2 bg-amber-50 rounded-lg">
                      <div className="text-[10px] text-amber-600 font-bold uppercase">Lipides</div>
                      <div className="text-sm font-bold text-amber-900">{selectedFood.fat}g</div>
                    </div>
                    <div className="text-center p-2 bg-blue-50 rounded-lg">
                      <div className="text-[10px] text-blue-600 font-bold uppercase">Glucides</div>
                      <div className="text-sm font-bold text-blue-900">{selectedFood.carbs}g</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t mt-4 border-slate-100 text-[10px] pb-4 shrink-0 px-1">
                    <div>
                      <h3 className="font-bold uppercase text-slate-500 mb-1.5 border-b border-slate-100 pb-1">Micro-Nutriments (g)</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                        <div className="flex justify-between"><span>Sucres purs</span> <span className="font-medium text-slate-800">{selectedFood.sugars || 0}</span></div>
                        <div className="flex justify-between"><span>Fibres</span> <span className="font-medium text-slate-800">{selectedFood.fiber || 0}</span></div>
                        <div className="flex justify-between"><span>Sel</span> <span className="font-medium text-slate-800">{selectedFood.salt || 0}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold uppercase text-slate-500 mb-1.5 border-b border-slate-100 pb-1">Minéraux & Oligos</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                        <div className="flex justify-between"><span>Magnésium</span> <span className="font-medium text-slate-800">{selectedFood.magnesium || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Fer</span> <span className="font-medium text-slate-800">{selectedFood.iron || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Zinc</span> <span className="font-medium text-slate-800">{selectedFood.zinc || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Iode</span> <span className="font-medium text-slate-800">{selectedFood.iodine || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                        <div className="flex justify-between"><span>Sélénium</span> <span className="font-medium text-slate-800">{selectedFood.selenium || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold uppercase text-slate-500 mb-1.5 border-b border-slate-100 pb-1">Vitamines & Acides Aminés</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-slate-600">
                        <div className="flex justify-between"><span>Vitamine A</span> <span className="font-medium text-slate-800">{selectedFood.vitA || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine C</span> <span className="font-medium text-slate-800">{selectedFood.vitC || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine D3</span> <span className="font-medium text-slate-800">{selectedFood.vitD3 || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine E</span> <span className="font-medium text-slate-800">{selectedFood.vitE || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B2</span> <span className="font-medium text-slate-800">{selectedFood.vitB2 || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B6</span> <span className="font-medium text-slate-800">{selectedFood.vitB6 || 0} <span className="text-[8px] text-slate-400">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B9</span> <span className="font-medium text-slate-800">{selectedFood.vitB9 || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B12</span> <span className="font-medium text-slate-800">{selectedFood.vitB12 || 0} <span className="text-[8px] text-slate-400">µg</span></span></div>
                        <div className="flex col-span-2 justify-between"><span>L-Tyrosine</span> <span className="font-medium text-slate-800">{selectedFood.tyrosine || 0} <span className="text-[8px] text-slate-400">g</span></span></div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => addToSelection(selectedFood)}
                    disabled={selectedItems.some(i => i.code === selectedFood.code)}
                    className="w-full py-2.5 mt-auto bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-slate-300 disabled:cursor-not-allowed shrink-0"
                  >
                    {selectedItems.some(i => i.code === selectedFood.code) ? 'Déjà dans la liste' : 'Ajouter à la liste'}
                  </button>

                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                    <Activity className="w-8 h-8 mb-4 text-slate-200" />
                    <p className="text-xs">Sélectionnez un aliment</p>
                </div>
              )
            ) : (
              // LIST TAB
              <div className="flex flex-col h-full">
                {selectedItems.length > 0 ? (
                  <>
                    <h3 className="font-bold text-sm text-slate-800 mb-3 shrink-0">Aliments sélectionnés</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1 custom-scroll">
                      {selectedItems.map(item => (
                        <div key={item.code} className="p-3 bg-white border border-slate-200 rounded-lg relative shadow-sm hover:border-indigo-200 transition-colors">
                          <button 
                            onClick={() => removeFromSelection(item.code)} 
                            className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                            title="Retirer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <h4 className="font-bold text-xs text-slate-800 pr-6 leading-tight mb-2">{item.name}</h4>
                          <div className="grid grid-cols-2 gap-y-1.5 gap-x-2 text-[10px] text-slate-600">
                            <span className="font-medium text-slate-800">{item.energyKcal.toFixed(0)} kcal</span>
                            <span>Pro: {item.protein.toFixed(1)}g</span>
                            <span>Lip: {item.fat.toFixed(1)}g</span>
                            <span>Glu: {item.carbs.toFixed(1)}g</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200 mt-4 shrink-0 bg-white">
                      <h3 className="font-bold text-sm text-slate-800 mb-3">Résumé Nutritionnel</h3>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                         <div className="p-2.5 bg-slate-50 rounded text-center border border-slate-100">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">Énergie totale</div>
                            <div className="text-xl font-black text-slate-800">{totals.energyKcal.toFixed(0)} <span className="text-[10px] font-normal uppercase text-slate-500">kcal</span></div>
                         </div>
                         <div className="p-2.5 bg-emerald-50 rounded text-center border border-emerald-100">
                            <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Protéines</div>
                            <div className="text-xl font-black text-emerald-900">{totals.protein.toFixed(1)} <span className="text-[10px] font-normal uppercase text-emerald-600">g</span></div>
                         </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                         <div className="p-2.5 bg-blue-50 rounded text-center border border-blue-100">
                            <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">Glucides</div>
                            <div className="text-xl font-black text-blue-900">{totals.carbs.toFixed(1)} <span className="text-[10px] font-normal uppercase text-blue-600">g</span></div>
                         </div>
                         <div className="p-2.5 bg-amber-50 rounded text-center border border-amber-100">
                            <div className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-0.5">Lipides</div>
                            <div className="text-xl font-black text-amber-900">{totals.fat.toFixed(1)} <span className="text-[10px] font-normal uppercase text-amber-600">g</span></div>
                         </div>
                      </div>
                      
                      <div className="flex gap-2 text-[10px] text-slate-500 justify-between mt-3 pt-3 border-t border-slate-100">
                        <span>Sucre: <b className="text-slate-800">{totals.sugars.toFixed(1)}<span className="text-[8px] font-normal">g</span></b></span>
                        <span>Fibre: <b className="text-slate-800">{totals.fiber.toFixed(1)}<span className="text-[8px] font-normal">g</span></b></span>
                        <span>Sel: <b className="text-slate-800">{totals.salt.toFixed(1)}<span className="text-[8px] font-normal">g</span></b></span>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-slate-100 text-[9px]">
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-slate-500">
                           <div className="flex justify-between"><span>Mag:</span> <strong className="text-slate-800">{totals.magnesium.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Fer:</span> <strong className="text-slate-800">{totals.iron.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Zinc:</span> <strong className="text-slate-800">{totals.zinc.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Iod:</span> <strong className="text-slate-800">{totals.iodine.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                           <div className="flex justify-between"><span>Sél:</span> <strong className="text-slate-800">{totals.selenium.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                           <div className="flex justify-between"><span>L-Tyr:</span> <strong className="text-slate-800">{totals.tyrosine.toFixed(2)}<span className="font-normal text-[7px]">g</span></strong></div>
                        </div>
                        <div className="grid grid-cols-3 gap-x-2 gap-y-1 text-slate-500 mt-2">
                           <div className="flex justify-between"><span>Vit A:</span> <strong className="text-slate-800">{totals.vitA.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                           <div className="flex justify-between"><span>Vit C:</span> <strong className="text-slate-800">{totals.vitC.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Vit D3:</span> <strong className="text-slate-800">{totals.vitD3.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                           <div className="flex justify-between"><span>Vit E:</span> <strong className="text-slate-800">{totals.vitE.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Vit B2:</span> <strong className="text-slate-800">{totals.vitB2.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Vit B6:</span> <strong className="text-slate-800">{totals.vitB6.toFixed(1)}<span className="font-normal text-[7px]">mg</span></strong></div>
                           <div className="flex justify-between"><span>Vit B9:</span> <strong className="text-slate-800">{totals.vitB9.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                           <div className="flex justify-between col-span-2 pr-6"><span>Vit B12:</span> <strong className="text-slate-800">{totals.vitB12.toFixed(1)}<span className="font-normal text-[7px]">µg</span></strong></div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                    <ListChecks className="w-8 h-8 mb-4 text-slate-200" />
                    <p className="text-xs">Votre liste est vide</p>
                    <button 
                      onClick={() => setRightTab('details')}
                      className="mt-4 text-indigo-600 hover:underline text-xs font-medium"
                    >
                      Rechercher des aliments
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>
      </main>
    </div>
  );
}
