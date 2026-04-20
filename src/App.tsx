import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Activity, ListChecks, Trash2, Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
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
  quantity?: number; // In grams, default is 100g
}

type FilterOp = 'min' | 'max';
interface NutrientFilter {
  value: number | '';
  op: FilterOp;
}

const nutrientFiltersConfig = [
  { group: 'Macro-nutriments', items: [
    { key: 'energyKcal', label: 'Calories', unit: 'kcal' },
    { key: 'carbs', label: 'Glucides', unit: 'g' },
    { key: 'protein', label: 'Protéines', unit: 'g' },
    { key: 'fat', label: 'Lipides', unit: 'g' },
  ]},
  { group: 'Minéraux & Oligo', items: [
    { key: 'magnesium', label: 'Magnésium', unit: 'mg' },
    { key: 'iron', label: 'Fer', unit: 'mg' },
    { key: 'zinc', label: 'Zinc', unit: 'mg' },
    { key: 'iodine', label: 'Iode', unit: 'µg' },
    { key: 'selenium', label: 'Sélénium', unit: 'µg' },
  ]},
  { group: 'Vitamines B', items: [
    { key: 'vitB2', label: 'Vitamine B2', unit: 'mg' },
    { key: 'vitB6', label: 'Vitamine B6', unit: 'mg' },
    { key: 'vitB9', label: 'Vitamine B9', unit: 'µg' },
    { key: 'vitB12', label: 'Vitamine B12', unit: 'µg' },
  ]},
  { group: 'Vitamines', items: [
    { key: 'vitA', label: 'Vitamine A', unit: 'µg' },
    { key: 'vitC', label: 'Vitamine C', unit: 'mg' },
    { key: 'vitD3', label: 'Vitamine D3', unit: 'µg' },
    { key: 'vitE', label: 'Vitamine E', unit: 'mg' },
  ]},
  { group: 'Acides Aminés', items: [
    { key: 'tyrosine', label: 'L-Tyrosine', unit: 'g' },
  ]}
];

// VNR (Valeurs Nutritionnelles de Référence)
const VNR = {
  energyKcal: 2000,
  protein: 50,
  carbs: 260,
  fat: 70,
  sugars: 90, // added approx for progress bar
  fiber: 30, // added approx for progress bar
  salt: 6, // added approx for progress bar
  magnesium: 375, // mg
  iron: 14, // mg
  zinc: 10, // mg
  iodine: 150, // µg
  selenium: 55, // µg
  vitA: 800, // µg
  vitC: 80, // mg
  vitD3: 5, // µg
  vitE: 12, // mg
  vitB2: 1.4, // mg
  vitB6: 1.4, // mg
  vitB9: 200, // µg
  vitB12: 2.5, // µg
  tyrosine: 2, // g (2000mg base indicative)
};

export default function App() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  
  // Advanced Filters State
  const [filters, setFilters] = useState<Record<string, NutrientFilter>>({});
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);
  
  const updateFilter = (key: string, value: number | '', op?: FilterOp) => {
    setFilters(prev => {
      const current = prev[key] || { value: '', op: 'min' };
      return {
        ...prev,
        [key]: { 
          value: value !== '' ? Number(value) : '', 
          op: op || current.op 
        }
      };
    });
  };

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
    return selectedItems.reduce((acc, item) => {
      const q = item.quantity ?? 100;
      const factor = q / 100;
      return {
        energyKcal: acc.energyKcal + ((item.energyKcal || 0) * factor),
        protein: acc.protein + ((item.protein || 0) * factor),
        carbs: acc.carbs + ((item.carbs || 0) * factor),
        fat: acc.fat + ((item.fat || 0) * factor),
        sugars: acc.sugars + ((item.sugars || 0) * factor),
        fiber: acc.fiber + ((item.fiber || 0) * factor),
        salt: acc.salt + ((item.salt || 0) * factor),
        magnesium: acc.magnesium + ((item.magnesium || 0) * factor),
        iron: acc.iron + ((item.iron || 0) * factor),
        zinc: acc.zinc + ((item.zinc || 0) * factor),
        iodine: acc.iodine + ((item.iodine || 0) * factor),
        selenium: acc.selenium + ((item.selenium || 0) * factor),
        vitA: acc.vitA + ((item.vitA || 0) * factor),
        vitC: acc.vitC + ((item.vitC || 0) * factor),
        vitD3: acc.vitD3 + ((item.vitD3 || 0) * factor),
        vitE: acc.vitE + ((item.vitE || 0) * factor),
        vitB2: acc.vitB2 + ((item.vitB2 || 0) * factor),
        vitB6: acc.vitB6 + ((item.vitB6 || 0) * factor),
        vitB9: acc.vitB9 + ((item.vitB9 || 0) * factor),
        vitB12: acc.vitB12 + ((item.vitB12 || 0) * factor),
        tyrosine: acc.tyrosine + ((item.tyrosine || 0) * factor),
      };
    }, { 
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
      setSelectedItems([...selectedItems, { ...food, quantity: 100 }]);
      setRightTab('list');
    }
  };

  const removeFromSelection = (code: string | number) => {
    setSelectedItems(selectedItems.filter(item => item.code !== code));
  };

  const updateItemQuantity = (code: string | number, quantity: number) => {
    if (quantity < 0) quantity = 0;
    setSelectedItems(prev => prev.map(item => item.code === code ? { ...item, quantity } : item));
  };

  const filteredFoods = useMemo(() => {
    return foods.filter(f => {
      if (search && !f.name?.toLowerCase().includes(search.toLowerCase())) return false;
      
      for (const [key, filter] of Object.entries(filters)) {
        if (filter.value === '') continue;
        
        const foodValue = (f as any)[key] || 0;
        
        if (filter.op === 'min' && foodValue < filter.value) return false;
        if (filter.op === 'max' && foodValue > filter.value) return false;
      }
      
      return true;
    });
  }, [foods, search, filters]);

  return (
    <div className="flex flex-col h-screen w-full bg-slate-50 text-slate-800 font-sans">
      {/* Header */}
      <header className="h-14 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between shadow-sm z-20 shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-3">
          <button 
            className="md:hidden p-1.5 text-slate-500 rounded-md hover:bg-slate-100" 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          >
            {showFiltersMobile ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
          <div className="bg-indigo-600 w-8 h-8 flex items-center justify-center rounded-lg text-white font-bold text-xl italic leading-none shrink-0 hidden sm:flex">C</div>
          <h1 className="text-lg font-bold tracking-tight text-slate-900">Food <span className="text-indigo-600">Cal</span></h1>
          <span className="ml-2 md:ml-4 hidden sm:inline-block text-xs font-medium px-2 py-1 bg-slate-100 border border-slate-200 rounded text-slate-500 uppercase tracking-widest shrink-0">v2024.1</span>
        </div>
        <div className="flex-1 max-w-md mx-2 md:mx-8">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md bg-slate-50 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
              placeholder="Rechercher (ex: Pomme...)"
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="hidden sm:inline-block text-xs font-semibold px-4 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 transition-colors">
            Exporter JSON
          </button>
          <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center text-xs font-bold text-slate-600">
            JD
          </div>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Filters) */}
        <aside className={cn(
          "bg-white border-r border-slate-200 flex-col p-4 custom-scroll overflow-y-auto shrink-0 transition-all absolute md:static z-10 h-full w-72 md:w-64",
          showFiltersMobile ? "flex left-0 shadow-2xl" : "hidden md:flex"
        )}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtres Avancés
            </h3>
            {Object.values(filters).some(f => f.value !== '') && (
              <button 
                onClick={() => setFilters({})}
                className="text-[10px] text-indigo-600 font-bold hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {nutrientFiltersConfig.map(group => (
              <section key={group.group}>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase border-b border-slate-100 pb-1 mb-2">{group.group}</h4>
                <div className="space-y-2">
                  {group.items.map(item => {
                    const currentVal = filters[item.key]?.value ?? '';
                    const currentOp = filters[item.key]?.op ?? 'min';
                    
                    return (
                      <div key={item.key} className="flex flex-col gap-1">
                        <label className="text-xs font-medium text-slate-600 flex justify-between">
                          {item.label}
                        </label>
                        <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded p-0.5 focus-within:ring-1 focus-within:ring-indigo-500 focus-within:border-indigo-500 transition-all">
                          <button 
                            onClick={() => updateFilter(item.key, currentVal, currentOp === 'min' ? 'max' : 'min')}
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-1 rounded text-slate-500 transition-colors border",
                              currentOp === 'min' ? "bg-white border-slate-200 text-indigo-600 shadow-sm" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            )}
                            title="Minimum (>=)"
                          >
                            Min
                          </button>
                          <button 
                            onClick={() => updateFilter(item.key, currentVal, currentOp === 'max' ? 'min' : 'max')}
                            className={cn(
                              "text-[10px] font-bold px-1.5 py-1 rounded text-slate-500 transition-colors border",
                              currentOp === 'max' ? "bg-white border-slate-200 text-rose-600 shadow-sm" : "border-transparent text-slate-400 hover:text-slate-600 hover:bg-slate-200/50"
                            )}
                            title="Maximum (<=)"
                          >
                            Max
                          </button>
                          
                          <div className="flex-1 relative flex items-center">
                            <input 
                              type="number"
                              value={currentVal}
                              onChange={e => updateFilter(item.key, e.target.value)}
                              placeholder="-"
                              className="w-full bg-transparent border-none text-xs text-right pr-6 focus:ring-0 appearance-none outline-none font-medium h-6 text-slate-700"
                            />
                            <span className="absolute right-2 text-[9px] text-slate-400 pointer-events-none select-none">{item.unit}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ))}
          </div>
        </aside>
        
        {/* Overlay for mobile sidebar */}
        {showFiltersMobile && (
          <div 
            className="absolute inset-0 bg-slate-900/20 z-0 md:hidden backdrop-blur-sm transition-all"
            onClick={() => setShowFiltersMobile(false)}
          />
        )}

        {/* Center Grid (Results) */}
        <section className="flex-1 overflow-y-auto custom-scroll p-4 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          <div className="col-span-full mb-1 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
            {filteredFoods.length} résultat{filteredFoods.length !== 1 ? 's' : ''}
          </div>
          {filteredFoods.map((food, index) => (
            <button
              key={`${food.code}-${index}`}
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
                      {selectedItems.map((item, index) => {
                        const q = item.quantity ?? 100;
                        const factor = q / 100;
                        return (
                          <div key={`${item.code}-${index}`} className="p-3 bg-white border border-slate-200 rounded-lg relative shadow-sm hover:border-indigo-200 transition-colors">
                            <button 
                              onClick={() => removeFromSelection(item.code)} 
                              className="absolute top-2 right-2 p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md transition-colors"
                              title="Retirer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <h4 className="font-bold text-xs text-slate-800 pr-8 leading-tight mb-3">{item.name}</h4>
                            
                            <div className="flex items-center gap-2 mb-3 bg-slate-50 p-1.5 rounded border border-slate-100">
                              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest flex-1">Quantité</label>
                              <div className="relative w-20">
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={q} 
                                  onChange={e => updateItemQuantity(item.code, Number(e.target.value))} 
                                  className="w-full text-right pr-4 pl-2 py-1 text-xs font-bold text-slate-800 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-indigo-500 outline-none" 
                                />
                                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-[9px] text-slate-400 font-medium pointer-events-none">g</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1 text-center bg-slate-50 rounded py-1.5 border border-slate-100">
                              <div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">Kcal</div>
                                <div className="text-[10px] font-bold text-slate-700">{((item.energyKcal || 0) * factor).toFixed(0)}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">Pro</div>
                                <div className="text-[10px] font-bold text-slate-700">{((item.protein || 0) * factor).toFixed(1)}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">Lip</div>
                                <div className="text-[10px] font-bold text-slate-700">{((item.fat || 0) * factor).toFixed(1)}</div>
                              </div>
                              <div>
                                <div className="text-[8px] font-bold text-slate-400 uppercase">Glu</div>
                                <div className="text-[10px] font-bold text-slate-700">{((item.carbs || 0) * factor).toFixed(1)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="pt-4 border-t border-slate-200 mt-4 shrink-0 bg-white">
                      <h3 className="font-bold text-sm text-slate-800 mb-3">Résumé Nutritionnel</h3>
                      
                      <div className="space-y-4">
                        {/* Group: Macro-nutriments */}
                        <div>
                          <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2 border-b border-slate-100 pb-1">Macro-nutriments</h4>
                          <div className="space-y-2">
                             {[
                               { label: 'Énergie', val: totals.energyKcal, vnr: VNR.energyKcal, unit: 'kcal' },
                               { label: 'Protéines', val: totals.protein, vnr: VNR.protein, unit: 'g' },
                               { label: 'Glucides', val: totals.carbs, vnr: VNR.carbs, unit: 'g' },
                               { label: 'Lipides', val: totals.fat, vnr: VNR.fat, unit: 'g' },
                               { label: 'Sucres', val: totals.sugars, vnr: VNR.sugars, unit: 'g' },
                               { label: 'Fibres', val: totals.fiber, vnr: VNR.fiber, unit: 'g' },
                               { label: 'Sel', val: totals.salt, vnr: VNR.salt, unit: 'g' },
                             ].map(item => {
                               const pct = Math.round((item.val / item.vnr) * 100);
                               return (
                                 <div key={item.label} className="w-full">
                                   <div className="flex justify-between items-end mb-0.5 text-[9px]">
                                     <span className="text-slate-600 font-medium">{item.label}</span>
                                     <span className="font-bold text-slate-800">{item.val.toFixed(1)}<span className="font-normal text-[8px] text-slate-400 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-bold w-7 inline-block text-right", pct > 100 ? "text-rose-500" : "text-indigo-500")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-rose-500" : "bg-indigo-400")} style={{width: `${Math.min(100, pct)}%`}}></div>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                        </div>

                        {/* Group: Minéraux & Oligos */}
                        <div>
                          <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2 border-b border-slate-100 pb-1">Minéraux & Oligos</h4>
                          <div className="space-y-2">
                             {[
                               { label: 'Magnésium', val: totals.magnesium, vnr: VNR.magnesium, unit: 'mg' },
                               { label: 'Fer', val: totals.iron, vnr: VNR.iron, unit: 'mg' },
                               { label: 'Zinc', val: totals.zinc, vnr: VNR.zinc, unit: 'mg' },
                               { label: 'Iode', val: totals.iodine, vnr: VNR.iodine, unit: 'µg' },
                               { label: 'Sélénium', val: totals.selenium, vnr: VNR.selenium, unit: 'µg' },
                             ].map(item => {
                               const pct = Math.round((item.val / item.vnr) * 100);
                               return (
                                 <div key={item.label} className="w-full">
                                   <div className="flex justify-between items-end mb-0.5 text-[9px]">
                                     <span className="text-slate-600 font-medium">{item.label}</span>
                                     <span className="font-bold text-slate-800">{item.val.toFixed(1)}<span className="font-normal text-[8px] text-slate-400 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-bold w-7 inline-block text-right", pct > 100 ? "text-rose-500" : "text-indigo-500")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-rose-500" : "bg-indigo-400")} style={{width: `${Math.min(100, pct)}%`}}></div>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                        </div>
                        
                        {/* Group: Vitamines & Acides Aminés */}
                        <div>
                          <h4 className="font-bold text-[10px] uppercase text-slate-500 mb-2 border-b border-slate-100 pb-1">Vitamines & Acides Aminés</h4>
                          <div className="space-y-2">
                             {[
                               { label: 'Vitamine A', val: totals.vitA, vnr: VNR.vitA, unit: 'µg' },
                               { label: 'Vitamine C', val: totals.vitC, vnr: VNR.vitC, unit: 'mg' },
                               { label: 'Vitamine D3', val: totals.vitD3, vnr: VNR.vitD3, unit: 'µg' },
                               { label: 'Vitamine E', val: totals.vitE, vnr: VNR.vitE, unit: 'mg' },
                               { label: 'Vitamine B2', val: totals.vitB2, vnr: VNR.vitB2, unit: 'mg' },
                               { label: 'Vitamine B6', val: totals.vitB6, vnr: VNR.vitB6, unit: 'mg' },
                               { label: 'Vitamine B9', val: totals.vitB9, vnr: VNR.vitB9, unit: 'µg' },
                               { label: 'Vitamine B12', val: totals.vitB12, vnr: VNR.vitB12, unit: 'µg' },
                               { label: 'L-Tyrosine', val: totals.tyrosine, vnr: VNR.tyrosine, unit: 'g' },
                             ].map(item => {
                               const pct = Math.round((item.val / item.vnr) * 100);
                               return (
                                 <div key={item.label} className="w-full">
                                   <div className="flex justify-between items-end mb-0.5 text-[9px]">
                                     <span className="text-slate-600 font-medium">{item.label}</span>
                                     <span className="font-bold text-slate-800">{item.val.toFixed(1)}<span className="font-normal text-[8px] text-slate-400 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-bold w-7 inline-block text-right", pct > 100 ? "text-rose-500" : "text-indigo-500")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-slate-100 rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-rose-500" : "bg-indigo-400")} style={{width: `${Math.min(100, pct)}%`}}></div>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
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
