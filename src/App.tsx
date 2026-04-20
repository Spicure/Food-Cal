import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Activity } from 'lucide-react';
import { ResponsiveContainer, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Tooltip as RechartsTooltip } from 'recharts';

import { cn } from './lib/utils';

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
}

export default function App() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  
  // Filters
  const [minProtein, setMinProtein] = useState<number>(0);
  const [maxKcal, setMaxKcal] = useState<number>(1000);
  
  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}ciqual.json`)
      .then(res => res.json())
      .then(data => {
        setFoods(data);
      })
      .catch(err => console.error("Could not load CIQUAL data", err));
  }, []);

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
          <h1 className="text-lg font-bold tracking-tight text-slate-900 hidden sm:block">Ciqual<span className="text-indigo-600">Explorer</span></h1>
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

          <div className="mt-auto p-3 bg-indigo-900 rounded-lg text-white text-[10px]">
            <p className="opacity-80 leading-relaxed font-light">Données provenant de la base CIQUAL 2024 de l'ANSES. Hébergé sur <b>GitHub Pages</b>.</p>
          </div>
        </aside>

        {/* Center Grid (Results) */}
        <section className="flex-1 overflow-y-auto custom-scroll p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          <div className="col-span-full mb-1 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredFoods.length} résultat{filteredFoods.length !== 1 ? 's' : ''} {filteredFoods.length === 50 && '(limité)'}
          </div>
          {filteredFoods.map(food => (
            <button
              key={food.code}
              onClick={() => setSelectedFood(food)}
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

        {/* Right Sidebar (Details) */}
        <aside className="w-full md:w-80 lg:w-96 bg-white border-l border-slate-200 p-5 flex flex-col gap-6 custom-scroll overflow-y-auto shrink-0 hidden sm:flex">
          {selectedFood ? (
            <>
              <div className="text-center">
                <h2 className="text-lg font-bold text-slate-900">{selectedFood.name}</h2>
                <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest">{selectedFood.group}</p>
              </div>
              
              <div className="relative flex justify-center py-2 h-48 w-full -mx-4 overflow-visible">
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

              <div className="grid grid-cols-3 gap-2">
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
              
              <div className="space-y-3 pt-4 border-t border-slate-100 text-[11px] pb-4">
                <h3 className="font-bold uppercase text-slate-400 text-[10px] mb-2">Micro-nutriments</h3>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Sucres purs</span>
                  <span className="font-bold">{selectedFood.sugars}g</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full w-full">
                   <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, (selectedFood.sugars / (selectedFood.carbs || 1)) * 100)}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-slate-600">Fibres alimentaires</span>
                  <span className="font-bold">{selectedFood.fiber}g</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full w-full">
                   <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, selectedFood.fiber * 3)}%` }}></div>
                </div>
                
                <div className="flex justify-between items-center mt-3">
                  <span className="text-slate-600">Sel / Sodium</span>
                  <span className="font-bold">{selectedFood.salt}g</span>
                </div>
                <div className="h-1 bg-slate-100 rounded-full w-full">
                   <div className="bg-indigo-400 h-full rounded-full" style={{ width: `${Math.min(100, selectedFood.salt * 20)}%` }}></div>
                </div>
              </div>
              
              <button className="w-full py-2.5 mt-auto bg-slate-900 text-white text-xs font-bold rounded-lg hover:bg-slate-800 transition-colors">
                Ajouter au comparateur
              </button>

            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center">
                <Activity className="w-8 h-8 mb-4 text-slate-200" />
                <p className="text-xs">Sélectionnez un aliment</p>
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
