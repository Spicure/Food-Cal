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
    { key: 'energyKcal', label: 'Calories', unit: 'kcal', sliderMax: 1000 },
    { key: 'carbs', label: 'Glucides', unit: 'g', sliderMax: 100 },
    { key: 'protein', label: 'Protéines', unit: 'g', sliderMax: 100 },
    { key: 'fat', label: 'Lipides', unit: 'g', sliderMax: 100 },
  ]},
  { group: 'Minéraux & Oligo', items: [
    { key: 'magnesium', label: 'Magnésium', unit: 'mg', sliderMax: 1000 },
    { key: 'iron', label: 'Fer', unit: 'mg', sliderMax: 100 },
    { key: 'zinc', label: 'Zinc', unit: 'mg', sliderMax: 50 },
    { key: 'iodine', label: 'Iode', unit: 'µg', sliderMax: 500 },
    { key: 'selenium', label: 'Sélénium', unit: 'µg', sliderMax: 200 },
  ]},
  { group: 'Vitamines B', items: [
    { key: 'vitB2', label: 'Vitamine B2', unit: 'mg', sliderMax: 10 },
    { key: 'vitB6', label: 'Vitamine B6', unit: 'mg', sliderMax: 10 },
    { key: 'vitB9', label: 'Vitamine B9', unit: 'µg', sliderMax: 1000 },
    { key: 'vitB12', label: 'Vitamine B12', unit: 'µg', sliderMax: 100 },
  ]},
  { group: 'Vitamines', items: [
    { key: 'vitA', label: 'Vitamine A', unit: 'µg', sliderMax: 2000 },
    { key: 'vitC', label: 'Vitamine C', unit: 'mg', sliderMax: 500 },
    { key: 'vitD3', label: 'Vitamine D3', unit: 'µg', sliderMax: 50 },
    { key: 'vitE', label: 'Vitamine E', unit: 'mg', sliderMax: 50 },
  ]},
  { group: 'Acides Aminés', items: [
    { key: 'tyrosine', label: 'L-Tyrosine', unit: 'g', sliderMax: 5 },
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

const mapUSDA = (fdcItem: any): FoodItem => {
  const getNutrient = (ids: string[]) => {
    const nut = fdcItem.foodNutrients?.find((n: any) => ids.includes(n.nutrientNumber) || ids.includes(String(n.nutrientId)));
    return nut ? parseFloat(nut.value) : 0;
  };
  return {
    code: 'usda_' + fdcItem.fdcId,
    name: fdcItem.description,
    group: fdcItem.foodCategory || 'USDA',
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
    iodine: getNutrient(['317', '1100']), 
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

export default function App() {
  const [foods, setFoods] = useState<FoodItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFood, setSelectedFood] = useState<FoodItem | null>(null);
  
  const [dataSource, setDataSource] = useState<'ciqual' | 'usda'>(() => {
    return (localStorage.getItem('dataSource') as 'ciqual' | 'usda') || 'ciqual';
  });
  
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
    localStorage.setItem('dataSource', dataSource);
    if (dataSource === 'ciqual') {
      // Direct import bypasses all GitHub Pages path and fetch issues!
      setFoods(foodsData as FoodItem[]);
    } else {
      setFoods([]);
    }
  }, [dataSource]);

  useEffect(() => {
    if (dataSource === 'usda') {
      const controller = new AbortController();
      const delay = setTimeout(() => {
        fetch('https://api.nal.usda.gov/fdc/v1/foods/search?api_key=DEMO_KEY', {
          method: 'POST',
          headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({query: search || 'apple', pageSize: 50, dataType: ['SR Legacy', 'Foundation']}),
          signal: controller.signal
        }).then(r => r.json()).then(d => {
          if (d.foods) {
             setFoods(d.foods.map(mapUSDA));
          }
        }).catch(() => {});
      }, 500);
      return () => { clearTimeout(delay); controller.abort(); };
    }
  }, [search, dataSource]);
  
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
      
      for (const [key, filter] of Object.entries(filters) as [string, NutrientFilter][]) {
        if (filter.value === '') continue;
        
        const foodValue = (f as any)[key] || 0;
        
        if (filter.op === 'min' && foodValue < (filter.value as number)) return false;
        if (filter.op === 'max' && foodValue > (filter.value as number)) return false;
      }
      
      return true;
    });
  }, [foods, search, filters]);

  return (
    <div className="flex flex-col h-screen w-full bg-[#000000] text-[#f5f5f7] font-sans antialiased">
      {/* Header */}
      <header className="h-12 bg-[rgba(0,0,0,0.8)] backdrop-blur-[20px] saturate-[180%] border-b border-[rgba(255,255,255,0.1)] px-4 flex items-center justify-between z-50 shrink-0 relative">
        <div className="flex items-center gap-2 md:gap-4">
          <button 
            className="md:hidden p-1.5 text-white/70 rounded-md hover:bg-white/10" 
            onClick={() => setShowFiltersMobile(!showFiltersMobile)}
          >
            {showFiltersMobile ? <X className="w-5 h-5"/> : <Menu className="w-5 h-5"/>}
          </button>
          <h1 className="text-[17px] font-[600] tracking-[-0.374px] text-white hidden sm:block">Food Cal</h1>
          
          <div className="flex items-center gap-1 bg-white/10 p-1 rounded-full text-[12px] font-[400] tracking-[-0.12px]">
            <button 
              onClick={() => setDataSource('ciqual')} 
              className={cn("px-3 py-1 rounded-full transition-colors", dataSource === 'ciqual' ? "bg-[#0071e3] text-white font-[600]" : "text-white/70 hover:text-white")}
            >
              CIQUAL <span className="hidden md:inline">(FR)</span>
            </button>
            <button 
              onClick={() => setDataSource('usda')} 
              className={cn("px-3 py-1 rounded-full transition-colors", dataSource === 'usda' ? "bg-[#0071e3] text-white font-[600]" : "text-white/70 hover:text-white")}
            >
              USDA <span className="hidden md:inline">(US)</span>
            </button>
          </div>
        </div>
        <div className="flex-1 max-w-md mx-2 md:mx-4 flex justify-end md:justify-center">
          <div className="relative w-full max-w-[240px]">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-white/50">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="block w-full pl-9 pr-3 py-1 bg-[#1d1d1f] border-none rounded-[11px] text-[14px] text-white focus:ring-[2px] focus:ring-[#0071e3] outline-none placeholder-white/50 tracking-tight"
              placeholder="Rechercher..."
            />
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button className="hidden sm:inline-flex text-[14px] font-[400] px-4 py-1 border border-[#0071e3] text-[#2997ff] rounded-[980px] hover:underline transition-all">
            Exporter JSON
          </button>
        </div>
      </header>

      {/* Main Layout */}
      <main className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar (Filters) */}
        <aside className={cn(
          "bg-[#f5f5f7] border-r border-[#d2d2d7] flex-col p-4 custom-scroll overflow-y-auto shrink-0 transition-all absolute md:static z-10 h-full w-72 md:w-64",
          showFiltersMobile ? "flex left-0 shadow-2xl" : "hidden md:flex"
        )}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-[12px] font-[600] text-black/50 uppercase tracking-widest flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5" /> Filtres Avancés
            </h3>
            {Object.values(filters).some(f => (f as NutrientFilter).value !== '') && (
              <button 
                onClick={() => setFilters({})}
                className="text-[12px] font-[400] text-[#0071e3] hover:underline"
              >
                Réinitialiser
              </button>
            )}
          </div>
          
          <div className="space-y-6">
            {nutrientFiltersConfig.map(group => (
              <section key={group.group}>
                <h4 className="text-[10px] font-[700] text-black/40 uppercase border-b border-[#d2d2d7] pb-1 mb-2">{group.group}</h4>
                <div className="space-y-3">
                  {group.items.map(item => {
                    const currentVal = filters[item.key]?.value ?? '';
                    const currentOp = filters[item.key]?.op ?? 'min';
                    
                    return (
                      <div key={item.key} className="flex flex-col gap-1.5">
                        <label className="text-[12px] font-[600] text-black/80 flex justify-between">
                          {item.label}
                        </label>
                        <div className="flex flex-col gap-1.5 bg-white border border-[#d2d2d7] rounded-[11px] p-2 focus-within:border-[#0071e3] focus-within:ring-[1px] focus-within:ring-[#0071e3] transition-all">
                          <div className="flex items-center gap-1">
                            <button 
                              onClick={() => updateFilter(item.key, currentVal, currentOp === 'min' ? 'max' : 'min')}
                              className={cn(
                                "text-[11px] font-[600] px-2 py-0.5 rounded-[5px] transition-colors",
                                currentOp === 'min' ? "bg-[#0071e3] text-white" : "bg-transparent text-black/50 hover:bg-[#f5f5f7] hover:text-black"
                              )}
                              title="Minimum (>=)"
                            >
                              Min
                            </button>
                            <button 
                              onClick={() => updateFilter(item.key, currentVal, currentOp === 'max' ? 'min' : 'max')}
                              className={cn(
                                "text-[11px] font-[600] px-2 py-0.5 rounded-[5px] transition-colors",
                                currentOp === 'max' ? "bg-[#0071e3] text-white" : "bg-transparent text-black/50 hover:bg-[#f5f5f7] hover:text-black"
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
                                placeholder="0"
                                className="w-full bg-transparent border-none text-[12px] text-right pr-6 focus:ring-0 appearance-none outline-none font-[400] h-6 text-black"
                              />
                              <span className="absolute right-1 text-[10px] text-black/40 pointer-events-none select-none">{item.unit}</span>
                            </div>
                          </div>
                          <input 
                              type="range"
                              min="0"
                              max={item.sliderMax}
                              value={currentVal === '' ? 0 : currentVal}
                              onChange={e => updateFilter(item.key, e.target.value)}
                              className="w-full accent-[#0071e3] h-1.5 bg-[#d2d2d7] rounded-lg appearance-none cursor-pointer"
                          />
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
        <section className="flex-1 overflow-y-auto custom-scroll p-4 md:p-6 lg:p-8 grid grid-cols-1 lg:grid-cols-2 gap-4 content-start">
          <div className="col-span-full mb-2 flex justify-between items-center text-[12px] font-[600] text-white/50 tracking-wide uppercase">
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
                "bg-[#1d1d1f] rounded-[18px] p-4 cursor-pointer transition-all border-none focus:outline-none flex flex-col justify-between h-full min-h-[140px] text-left",
                selectedFood?.code === food.code ? "ring-[2px] ring-[#0071e3] shadow-[0_0_0_1px_#0071e3]" : "hover:bg-[#2a2a2d] ring-1 ring-white/5"
              )}
            >
              <div className="w-full">
                <div className="flex justify-between mb-3 gap-2">
                  <h4 className="text-[17px] font-[600] tracking-[-0.374px] text-white leading-tight" title={food.name}>{food.name}</h4>
                  <span className="text-[10px] text-white/30 shrink-0 mt-1 font-mono">ID: {food.code}</span>
                </div>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  <span className="macro-pill bg-[#2a2a2d] text-white/80">Pro <strong className="text-white">{food.protein}g</strong></span>
                  <span className="macro-pill bg-[#2a2a2d] text-white/80">Lip <strong className="text-white">{food.fat}g</strong></span>
                  <span className="macro-pill bg-[#2a2a2d] text-white/80">Glu <strong className="text-white">{food.carbs}g</strong></span>
                </div>
              </div>
              <div className="mt-auto flex items-end">
                <div className={cn("text-[24px] font-[700] tracking-tight leading-none", 
                  food.energyKcal < 100 ? "text-[#34c759]" : food.energyKcal < 300 ? "text-[#ffcc00]" : "text-[#ff3b30]"
                )}>
                  {food.energyKcal.toFixed(0)} <span className="text-[12px] font-[500] text-white/40 ml-1">kcal / 100g</span>
                </div>
              </div>
            </button>
          ))}
          {filteredFoods.length === 0 && (
             <div className="col-span-full p-12 text-center text-white/50 text-[14px]">Aucun aliment trouvé. Modifiez vos filtres.</div>
          )}
        </section>

        {/* Right Sidebar (Details & List) */}
        <aside className="w-full md:w-80 lg:w-96 bg-[#f5f5f7] border-l border-[#d2d2d7] flex flex-col shrink-0 hidden sm:flex h-full pb-0 text-black">
          {/* Tabs */}
          <div className="flex border-b border-[#d2d2d7] shrink-0 px-2 pt-2 bg-[#f5f5f7]">
            <button 
              onClick={() => setRightTab('details')} 
              className={`flex-1 py-2 text-[13px] font-[600] tracking-[-0.08px] rounded-t-lg mx-1 flex justify-center items-center gap-2 transition-colors ${rightTab === 'details' ? 'bg-white text-black shadow-[0_-1px_0_1px_rgba(0,0,0,0.05)] z-10' : 'bg-transparent text-black/50 hover:text-black hover:bg-black/5'}`}
            >
              <Activity className="w-4 h-4" /> Détails
            </button>
            <button 
              onClick={() => setRightTab('list')} 
              className={`flex-1 py-2 text-[13px] font-[600] tracking-[-0.08px] rounded-t-lg mx-1 flex justify-center items-center gap-2 transition-colors ${rightTab === 'list' ? 'bg-white text-black shadow-[0_-1px_0_1px_rgba(0,0,0,0.05)] z-10' : 'bg-transparent text-black/50 hover:text-black hover:bg-black/5'}`}
            >
              <ListChecks className="w-4 h-4" /> Ma Liste
              {selectedItems.length > 0 && (
                <span className="bg-[#0071e3] text-white px-1.5 py-0.5 rounded-full text-[10px] leading-none mb-0.5 font-[600]">{selectedItems.length}</span>
              )}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto custom-scroll p-5 flex flex-col bg-white">
            {rightTab === 'details' ? (
              // DETAILS TAB
              selectedFood ? (
                <>
                  <div className="text-center">
                    <h2 className="text-[19px] font-[600] tracking-[-0.4px] text-black leading-tight">{selectedFood.name}</h2>
                    <p className="text-[12px] font-[400] text-black/50 mt-1 uppercase tracking-widest">{selectedFood.group}</p>
                  </div>
                  
                  <div className="relative flex justify-center py-2 h-48 w-full -mx-4 overflow-visible shrink-0 mt-2">
                    <ResponsiveContainer width={240} height={200} className="mx-auto block" style={{overflow: 'visible'}}>
                        <RadarChart cx="50%" cy="50%" outerRadius={70} data={[
                            { subject: 'Protéines', val: selectedFood.protein, fullMark: 100 },
                            { subject: 'Glucides', val: selectedFood.carbs, fullMark: 100 },
                            { subject: 'Sucres', val: selectedFood.sugars, fullMark: 100 },
                            { subject: 'Lipides', val: selectedFood.fat, fullMark: 100 },
                            { subject: 'Fibres', val: selectedFood.fiber, fullMark: 100 },
                        ]}>
                            <PolarGrid stroke="#f5f5f7" />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: '#86868b', fontSize: 10, fontWeight: 600 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 'dataMax']} tick={false} axisLine={false} />
                            <Radar name={selectedFood.name} dataKey="val" stroke="#0071e3" fill="#0071e3" fillOpacity={0.15} strokeWidth={2} />
                            <RechartsTooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 16px rgba(0,0,0,0.1)' }} />
                        </RadarChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none mt-1">
                       <span className="text-[28px] font-[700] tracking-tight leading-none text-black">{selectedFood.energyKcal.toFixed(0)}</span><br/>
                       <span className="text-[10px] text-black/40 uppercase font-[600] leading-none">kcal</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 shrink-0 my-4">
                    <div className="text-center p-3 bg-[#f5f5f7] rounded-[14px]">
                      <div className="text-[11px] text-black/60 font-[600]">Protéines</div>
                      <div className="text-[17px] font-[600] text-black mt-1 tracking-tight">{selectedFood.protein}g</div>
                    </div>
                    <div className="text-center p-3 bg-[#f5f5f7] rounded-[14px]">
                      <div className="text-[11px] text-black/60 font-[600]">Lipides</div>
                      <div className="text-[17px] font-[600] text-black mt-1 tracking-tight">{selectedFood.fat}g</div>
                    </div>
                    <div className="text-center p-3 bg-[#f5f5f7] rounded-[14px]">
                      <div className="text-[11px] text-black/60 font-[600]">Glucides</div>
                      <div className="text-[17px] font-[600] text-black mt-1 tracking-tight">{selectedFood.carbs}g</div>
                    </div>
                  </div>
                  
                  <div className="space-y-4 pt-4 border-t mt-4 border-[#d2d2d7] text-[11px] pb-4 shrink-0 px-1">
                    <div>
                      <h3 className="font-[600] text-black/40 mb-1.5 pb-1 uppercase tracking-widest">Micro-Nutriments (g)</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-black/80 font-[400]">
                        <div className="flex justify-between"><span>Sucres purs</span> <span className="font-[600] text-black">{selectedFood.sugars || 0}</span></div>
                        <div className="flex justify-between"><span>Fibres</span> <span className="font-[600] text-black">{selectedFood.fiber || 0}</span></div>
                        <div className="flex justify-between"><span>Sel</span> <span className="font-[600] text-black">{selectedFood.salt || 0}</span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-[600] text-black/40 mb-1.5 pt-3 pb-1 border-t border-[#d2d2d7]/50 uppercase tracking-widest">Minéraux & Oligos</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-black/80 font-[400]">
                        <div className="flex justify-between"><span>Magnésium</span> <span className="font-[600] text-black">{selectedFood.magnesium || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Fer</span> <span className="font-[600] text-black">{selectedFood.iron || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Zinc</span> <span className="font-[600] text-black">{selectedFood.zinc || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Iode</span> <span className="font-[600] text-black">{selectedFood.iodine || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                        <div className="flex justify-between"><span>Sélénium</span> <span className="font-[600] text-black">{selectedFood.selenium || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-[600] text-black/40 mb-1.5 pt-3 pb-1 border-t border-[#d2d2d7]/50 uppercase tracking-widest">Vitamines & Ac. Aminés</h3>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-black/80 font-[400]">
                        <div className="flex justify-between"><span>Vitamine A</span> <span className="font-[600] text-black">{selectedFood.vitA || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine C</span> <span className="font-[600] text-black">{selectedFood.vitC || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine D3</span> <span className="font-[600] text-black">{selectedFood.vitD3 || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine E</span> <span className="font-[600] text-black">{selectedFood.vitE || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B2</span> <span className="font-[600] text-black">{selectedFood.vitB2 || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B6</span> <span className="font-[600] text-black">{selectedFood.vitB6 || 0} <span className="text-[9px] text-black/40 font-[400]">mg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B9</span> <span className="font-[600] text-black">{selectedFood.vitB9 || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                        <div className="flex justify-between"><span>Vitamine B12</span> <span className="font-[600] text-black">{selectedFood.vitB12 || 0} <span className="text-[9px] text-black/40 font-[400]">µg</span></span></div>
                        <div className="flex col-span-2 justify-between"><span>L-Tyrosine</span> <span className="font-[600] text-black">{selectedFood.tyrosine || 0} <span className="text-[9px] text-black/40 font-[400]">g</span></span></div>
                      </div>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => addToSelection(selectedFood)}
                    disabled={selectedItems.some(i => i.code === selectedFood.code)}
                    className="w-full py-3 mt-auto bg-[#0071e3] text-white text-[15px] font-[400] rounded-[980px] hover:bg-[#0077ED] transition-colors disabled:bg-black/10 disabled:text-black/30 disabled:cursor-not-allowed shrink-0"
                  >
                    {selectedItems.some(i => i.code === selectedFood.code) ? 'Déjà dans la liste' : 'Ajouter à la liste'}
                  </button>

                </>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-black/40 text-center">
                    <Activity className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-[13px] font-[400]">Sélectionnez un aliment</p>
                </div>
              )
            ) : (
              // LIST TAB
              <div className="flex flex-col h-full">
                {selectedItems.length > 0 ? (
                  <>
                    <h3 className="font-[600] text-[15px] text-black tracking-tight mb-3 shrink-0">Aliments sélectionnés</h3>
                    <div className="flex-1 overflow-y-auto space-y-3 pb-4 pr-1 custom-scroll">
                      {selectedItems.map((item, index) => {
                        const q = item.quantity ?? 100;
                        const factor = q / 100;
                        return (
                          <div key={`${item.code}-${index}`} className="p-3 bg-[#f5f5f7] border border-[#d2d2d7] rounded-[14px] relative transition-colors">
                            <button 
                              onClick={() => removeFromSelection(item.code)} 
                              className="absolute top-2 right-2 p-1.5 text-black/40 hover:text-[#ff3b30] rounded-full transition-colors"
                              title="Retirer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                            <h4 className="font-[600] text-[13px] text-black pr-8 leading-tight mb-3">{item.name}</h4>
                            
                            <div className="flex items-center gap-2 mb-3 bg-white p-2 rounded-[11px] border border-[#d2d2d7]">
                              <label className="text-[10px] font-[600] text-black/50 uppercase tracking-widest shrink-0">Quantité</label>
                              <input 
                                type="range"
                                min="0"
                                max="1000"
                                step="5"
                                value={q}
                                onChange={e => updateItemQuantity(item.code, Number(e.target.value))}
                                className="flex-1 mx-1 accent-[#0071e3] h-1.5 bg-[#d2d2d7] rounded-lg appearance-none cursor-pointer min-w-0"
                              />
                              <div className="relative w-16 shrink-0">
                                <input 
                                  type="number" 
                                  min="0" 
                                  value={q} 
                                  onChange={e => updateItemQuantity(item.code, Number(e.target.value))} 
                                  className="w-full text-right pr-4 pl-1 py-1 text-[13px] font-[400] text-black bg-transparent outline-none" 
                                />
                                <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[10px] text-black/40 font-[600] pointer-events-none">g</span>
                              </div>
                            </div>
                            
                            <div className="grid grid-cols-4 gap-1 text-center bg-white rounded-[11px] py-1.5 border border-[#d2d2d7]">
                              <div>
                                <div className="text-[9px] font-[600] text-black/40 uppercase tracking-wide">Kcal</div>
                                <div className="text-[12px] font-[600] text-black tracking-tight">{((item.energyKcal || 0) * factor).toFixed(0)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-[600] text-black/40 uppercase tracking-wide">Pro</div>
                                <div className="text-[12px] font-[600] text-black tracking-tight">{((item.protein || 0) * factor).toFixed(1)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-[600] text-black/40 uppercase tracking-wide">Lip</div>
                                <div className="text-[12px] font-[600] text-black tracking-tight">{((item.fat || 0) * factor).toFixed(1)}</div>
                              </div>
                              <div>
                                <div className="text-[9px] font-[600] text-black/40 uppercase tracking-wide">Glu</div>
                                <div className="text-[12px] font-[600] text-black tracking-tight">{((item.carbs || 0) * factor).toFixed(1)}</div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                    
                    <div className="pt-4 border-t border-[#d2d2d7] mt-4 shrink-0 bg-white">
                      <h3 className="font-[600] text-[15px] text-black tracking-tight mb-3">Résumé Nutritionnel</h3>
                      
                      <div className="space-y-4">
                        {/* Group: Macro-nutriments */}
                        <div>
                          <h4 className="font-[600] text-[10px] uppercase text-black/40 mb-2 border-b border-[#d2d2d7] pb-1">Macro-nutriments</h4>
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
                                   <div className="flex justify-between items-end mb-0.5 text-[11px] tracking-tight">
                                     <span className="text-black/80 font-[400]">{item.label}</span>
                                     <span className="font-[600] text-black">{item.val.toFixed(1)}<span className="font-[400] text-[10px] text-black/50 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-[600] w-7 inline-block text-right", pct > 100 ? "text-[#ff3b30]" : "text-[#0071e3]")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-[#f5f5f7] rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-[#ff3b30]" : "bg-[#0071e3]")} style={{width: `${Math.min(100, pct)}%`}}></div>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                        </div>

                        {/* Group: Minéraux & Oligos */}
                        <div>
                          <h4 className="font-[600] text-[10px] uppercase text-black/40 mb-2 border-b border-[#d2d2d7] pb-1">Minéraux & Oligos</h4>
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
                                   <div className="flex justify-between items-end mb-0.5 text-[11px] tracking-tight">
                                     <span className="text-black/80 font-[400]">{item.label}</span>
                                     <span className="font-[600] text-black">{item.val.toFixed(1)}<span className="font-[400] text-[10px] text-black/50 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-[600] w-7 inline-block text-right", pct > 100 ? "text-[#ff3b30]" : "text-[#0071e3]")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-[#f5f5f7] rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-[#ff3b30]" : "bg-[#0071e3]")} style={{width: `${Math.min(100, pct)}%`}}></div>
                                   </div>
                                 </div>
                               )
                             })}
                          </div>
                        </div>
                        
                        {/* Group: Vitamines & Acides Aminés */}
                        <div>
                          <h4 className="font-[600] text-[10px] uppercase text-black/40 mb-2 border-b border-[#d2d2d7] pb-1">Vitamines & Ac. Aminés</h4>
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
                                   <div className="flex justify-between items-end mb-0.5 text-[11px] tracking-tight">
                                     <span className="text-black/80 font-[400]">{item.label}</span>
                                     <span className="font-[600] text-black">{item.val.toFixed(1)}<span className="font-[400] text-[10px] text-black/50 ml-0.5">{item.unit}</span> <span className={cn("ml-1 font-[600] w-7 inline-block text-right", pct > 100 ? "text-[#ff3b30]" : "text-[#0071e3]")}>{pct}%</span></span>
                                   </div>
                                   <div className="h-1 bg-[#f5f5f7] rounded-full w-full overflow-hidden">
                                     <div className={cn("h-full transition-all", pct > 100 ? "bg-[#ff3b30]" : "bg-[#0071e3]")} style={{width: `${Math.min(100, pct)}%`}}></div>
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
                  <div className="h-full flex flex-col items-center justify-center text-black/40 text-center">
                    <ListChecks className="w-8 h-8 mb-4 opacity-50" />
                    <p className="text-[13px] font-[400]">Votre liste est vide</p>
                    <button 
                      onClick={() => setRightTab('details')}
                      className="mt-4 text-[#0071e3] hover:underline text-[13px] font-[400]"
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
