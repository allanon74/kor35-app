import React, { useState, useEffect, memo, useCallback } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    ShoppingBag, Box, Shield, Zap, Loader2, Wrench, 
    Info, ChevronUp, ChevronDown, Activity, Power, Battery, 
    Clock, RefreshCw, Sparkles, Swords, Lock, User
} from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';
import { useOptimisticEquip, useOptimisticRecharge } from '../hooks/useGameData';

// --- UTILS ---
const formatDuration = (seconds) => {
    if (!seconds) return "";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    const parts = [];
    if (h > 0) parts.push(`${h}h`);
    if (m > 0) parts.push(`${m}m`);
    if (s > 0 || parts.length === 0) parts.push(`${s}s`);
    
    return parts.join(' ');
};

// --- COMPONENTE VISUALE CORPO (SVG ORGANICO 8 SLOT) ---
const InventoryBodyWidget = ({ slots, onSlotClick, selectedItemId }) => {
    const paths = {
        'HD1': { d: "M75,35 C75,20 85,10 100,10 C115,10 125,20 125,35 C125,45 100,48 75,35 Z", name: "Cranio (HD1)" },
        'HD2': { d: "M75,35 C100,48 125,45 125,35 C125,50 115,65 100,65 C85,65 75,50 75,35 Z", name: "Volto (HD2)" },
        'TR1': { d: "M70,55 C70,55 85,65 100,65 C115,65 130,55 130,55 C132,60 133,85 130,100 C100,105 100,105 70,100 C67,85 68,60 70,55 Z", name: "Torace (TR1)" },
        'TR2': { d: "M70,100 C100,105 100,105 130,100 C128,120 120,145 100,145 C80,145 72,120 70,100 Z", name: "Addome (TR2)" },
        'LA': { d: "M68,55 C55,52 45,58 45,70 C45,90 50,110 40,135 C38,140 50,145 55,135 C65,110 65,90 68,80 Z", name: "Braccio Sx (LA)" },
        'RA': { d: "M132,55 C145,52 155,58 155,70 C155,90 150,110 160,135 C162,140 150,145 145,135 C135,110 135,90 132,80 Z", name: "Braccio Dx (RA)" },
        'LL': { d: "M95,135 C85,135 75,140 75,150 C75,180 72,210 75,240 C80,250 60,255 70,260 C90,260 90,240 90,220 C90,190 98,150 95,135 Z", name: "Gamba Sx (LL)" },
        'RL': { d: "M105,135 C115,135 125,140 125,150 C125,180 128,210 125,240 C120,250 140,255 130,260 C110,260 110,240 110,220 C110,190 102,150 105,135 Z", name: "Gamba Dx (RL)" }
    };

    return (
        <div className="relative w-full max-w-[260px] mx-auto drop-shadow-xl select-none">
            <svg viewBox="0 0 200 280" className="w-full h-auto filter drop-shadow-lg">
                <defs>
                    <filter id="glow-selected" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <g opacity="0.2">
                     {Object.values(paths).map((p, i) => <path key={i} d={p.d} fill="#1f2937" stroke="none" />)}
                </g>
                {Object.entries(paths).map(([code, { d, name }]) => {
                    const item = slots[code] && slots[code][0];
                    const isOccupied = !!item;
                    const isSelected = item && item.id === selectedItemId;
                    const auraColor = item?.aura?.colore || '#4b5563'; 
                    const fillColor = isOccupied ? auraColor : 'transparent';
                    const strokeColor = isOccupied ? (isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)') : '#374151';
                    const opacity = isOccupied ? (isSelected ? 1 : 0.7) : 0.1;
                    const cursor = isOccupied ? 'cursor-pointer' : 'cursor-default';
                    const filter = isSelected ? 'url(#glow-selected)' : '';

                    return (
                        <g key={code} onClick={() => isOccupied && onSlotClick(item)} className={`transition-all duration-300 ${cursor}`}>
                            <path d={d} fill={fillColor} stroke={strokeColor} strokeWidth={isSelected ? 2 : 1} fillOpacity={opacity} filter={filter} className={`transition-all duration-300 ${isOccupied ? 'hover:fill-opacity-100 hover:stroke-white' : ''}`} />
                            <title>{name} {isOccupied ? `: ${item.nome}` : '(Vuoto)'}</title>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- COMPONENTE CARD INVENTARIO (MEMOIZED PER PERFORMANCE) ---
// Usa memo per evitare re-render dell'intera lista quando cambia lo stato di un solo elemento
const InventoryItemCard = memo(({ item, isExpanded, onToggleExpand, onEquip, onRecharge, onAssembly }) => {
    const isPhysical = item.tipo_oggetto === 'FIS';
    const canBeModified = (isPhysical || ['INN', 'MUT'].includes(item.tipo_oggetto)) && (item.classe_oggetto_nome || item.tipo_oggetto === 'INN');
    const isActive = item.is_active;

    // Render Statistiche (Solo != 0)
    const renderStats = (statistiche) => {
        if (!statistiche || statistiche.length === 0) return null;
        // Filtra statistiche con valore 0 (inutile mostrarle come +0)
        const activeStats = statistiche.filter(s => s.valore !== 0);
        if (activeStats.length === 0) return null;

        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {activeStats.map((stat, idx) => {
                    // Costruisce la condizione se presente
                    const hasCondition = stat.usa_limitazione_aura || stat.usa_limitazione_elemento || stat.usa_condizione_text;
                    const conditionTitle = stat.condizione_text || "Condizionale";
                    
                    return (
                        <div key={idx} className="flex items-center bg-gray-900 border border-gray-600 rounded px-2 py-1 text-xs shadow-sm">
                            <span className="font-bold text-gray-300 mr-1">{stat.statistica.nome}</span>
                            <span className={`font-mono font-bold ${stat.valore > 0 ? 'text-green-400' : 'text-red-400'}`}>
                                {stat.valore > 0 ? '+' : ''}{stat.valore}
                            </span>
                            {hasCondition && (
                                <div className="ml-1 text-amber-500" title={conditionTitle}>
                                    <Lock size={10} />
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // Render Componenti (Mattoni) con Icone
    const renderComponents = (componenti) => {
        if (!componenti || componenti.length === 0) return null;
        return (
            <div className="flex flex-wrap gap-1 items-center justify-end">
                {componenti.map((comp, idx) => {
                    const val = comp.valore || 1;
                    const icons = [];
                    for(let i=0; i<val; i++) {
                        icons.push(
                            <div key={`${idx}-${i}`} className="w-5 h-5 rounded bg-gray-800 border border-gray-600 flex items-center justify-center p-0.5 shadow-sm" title={comp.caratteristica.nome}>
                                {comp.caratteristica.icona_url ? (
                                    <img src={comp.caratteristica.icona_url} alt={comp.caratteristica.sigla} className="w-full h-full object-contain" />
                                ) : (
                                    <span className="text-[9px] font-bold text-gray-300">{comp.caratteristica.sigla}</span>
                                )}
                            </div>
                        );
                    }
                    return icons;
                })}
            </div>
        );
    };

    // Render Info Cariche
    const renderChargeInfo = () => {
        if (!item.cariche_massime && !item.durata_totale) return null;
        const isLow = item.cariche_attuali === 0;

        return (
            <div className="mt-2 bg-black/20 p-2 rounded border border-gray-600/50 flex flex-col gap-1">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 font-bold ${isLow ? 'text-red-500' : 'text-yellow-500'}`}>
                            <Battery size={14} /> 
                            <span className="text-sm">{item.cariche_attuali}</span> 
                            <span className="text-gray-500">/</span> 
                            <span>{item.cariche_massime || '-'}</span>
                        </span>
                    </div>
                    {(item.cariche_massime > 0 && item.cariche_attuali < item.cariche_massime) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); onRecharge(item); }}
                            className="flex items-center gap-1 px-2 py-0.5 bg-yellow-900/50 hover:bg-yellow-800 text-yellow-200 border border-yellow-700 rounded text-[10px] uppercase font-bold tracking-wide transition-colors"
                        >
                            <RefreshCw size={10} /> {item.costo_ricarica} CR
                        </button>
                    )}
                </div>
                {item.durata_totale > 0 && (
                    <div className="text-[10px] text-blue-300 flex items-center gap-1 border-t border-gray-700/50 pt-1 mt-1">
                        <Clock size={10} /> Durata: {formatDuration(item.durata_totale)}
                    </div>
                )}
            </div>
        );
    };

    const getStatusStyle = () => {
        if (isActive) return 'border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] bg-green-900/10';
        if (item.is_equipaggiato) return 'border-2 border-yellow-600/60 bg-yellow-900/10'; 
        return 'border border-gray-700 bg-gray-800 hover:border-gray-600'; 
    };

    return (
        <div className={`relative p-3 mb-3 rounded-lg flex flex-col transition-all ${getStatusStyle()}`}>
            
            {/* HEADER CARD */}
            <div className="flex items-start justify-between cursor-pointer" onClick={() => onToggleExpand(item.id)}>
                <div className="flex items-center gap-3 w-full">
                    {/* Icona Aura (con fallback) */}
                    <div className="w-10 h-10 rounded bg-gray-900 border border-gray-600 flex items-center justify-center shrink-0 overflow-hidden shadow-inner" title={item.aura?.nome || "Oggetto"}>
                         {item.aura?.icona_url ? (
                             <img src={item.aura.icona_url} className="w-7 h-7 object-contain" alt={item.aura.nome}/>
                         ) : (
                             <Sparkles size={20} color={item.aura?.colore || '#888'}/>
                         )}
                    </div>
                    
                    <div className="flex flex-col w-full">
                        <div className="flex items-center justify-between w-full">
                            <h4 className={`font-bold text-sm sm:text-base leading-tight ${isActive ? 'text-green-400' : item.is_equipaggiato ? 'text-yellow-500' : 'text-gray-200'}`}>
                                {item.nome}
                            </h4>
                            
                            {/* Componenti (Mattoni) in alto a destra */}
                            <div className="ml-auto flex items-center">
                                {renderComponents(item.componenti)}
                                {/* Livello Badge */}
                                {item.livello > 0 && (
                                    <span className="ml-2 text-[9px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600 font-mono shrink-0">
                                        Lv.{item.livello}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <div className="flex justify-between items-center mt-1">
                            <div className="text-[10px] text-gray-500 uppercase tracking-wider flex gap-2">
                                <span>{item.tipo_oggetto_display}</span>
                                {item.classe_oggetto_nome && <span>• {item.classe_oggetto_nome}</span>}
                            </div>
                            
                            {/* Icona Espandi */}
                            <div className="text-gray-500">
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* EXPANDED CONTENT */}
            {isExpanded && (
                <div className="mt-3 animate-fadeIn space-y-3 border-t border-gray-700/50 pt-2">
                    
                    {/* Attacco Base */}
                    {item.attacco_formattato && (
                        <div className="bg-red-900/20 border border-red-900/40 p-2 rounded flex items-center gap-2 text-red-300 text-xs font-bold shadow-inner">
                            <Swords size={14} />
                            <span>ATTACCO: {item.attacco_formattato}</span>
                        </div>
                    )}

                    {/* Statistiche Base e Modificatori */}
                    {renderStats(item.statistiche)}

                    {/* Descrizione */}
                    <div className="text-xs text-gray-300 prose prose-invert prose-sm max-w-none leading-relaxed bg-black/10 p-2 rounded border border-gray-700/30">
                         <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio || item.testo || item.descrizione || "Nessun dato disponibile." }} />
                         {item.data_fine_attivazione && (
                             <div className="mt-2 pt-2 border-t border-gray-700 text-[10px] text-orange-400 font-mono text-right">
                                 Scade: {new Date(item.data_fine_attivazione).toLocaleString()}
                             </div>
                         )}
                    </div>

                    {/* Info Cariche */}
                    {renderChargeInfo()}

                    {/* Potenziamenti Installati */}
                    {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                        <div className="pl-2 border-l-2 border-indigo-500/30 mt-2 bg-indigo-900/5 p-2 rounded">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                                <Zap size={12} /> Moduli Installati:
                            </p>
                            <div className="space-y-2">
                                {item.potenziamenti_installati.map(mod => (
                                    <div key={mod.id} className={`p-2 rounded border text-xs ${mod.is_active !== false ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-red-900/10 border-red-900/30 opacity-70'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-indigo-200">{mod.nome}</span>
                                                <span className="text-[9px] text-gray-500">{mod.tipo_oggetto_display}</span>
                                            </div>
                                            {/* Icone componenti mod */}
                                            {renderComponents(mod.componenti)}
                                        </div>
                                        {/* Statistiche Mod */}
                                        {renderStats(mod.statistiche)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    
                    {/* Bottoni Azione */}
                    <div className="flex gap-2 mt-2 pt-2 border-t border-gray-700/30">
                        {canBeModified && (
                            <button
                                onClick={(e) => { e.stopPropagation(); onAssembly(item); }}
                                className="flex-1 py-2 rounded text-xs font-bold bg-gray-700 hover:bg-gray-600 text-amber-400 border border-gray-600 flex items-center justify-center gap-2 shadow-sm"
                            >
                                <Wrench size={14} /> Modifica
                            </button>
                        )}
                        {isPhysical && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onEquip(item.id); }}
                                className={`flex-1 py-2 rounded text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm ${
                                    item.is_equipaggiato
                                    ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700'
                                    : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600'
                                }`}
                            >
                                {item.is_equipaggiato ? <><Power size={14}/> Rimuovi</> : <><Shield size={14}/> Equipaggia</>}
                            </button>
                        )}
                    </div>

                </div>
            )}
        </div>
    );
});

// --- MAIN INVENTORY TAB ---
const InventoryTab = ({ onLogout }) => {
  const { selectedCharacterData: characterData, isLoading: isContextLoading } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [showAssembly, setShowAssembly] = useState(false);
  const [assemblyHost, setAssemblyHost] = useState(null);
  const [selectedBodyItem, setSelectedBodyItem] = useState(null);
  const [expandedItems, setExpandedItems] = useState({});

  const equipMutation = useOptimisticEquip();
  const rechargeMutation = useOptimisticRecharge();

  useEffect(() => {
    if (characterData?.oggetti) setItems(characterData.oggetti);
    else setItems([]);
  }, [characterData]);

  const handleToggleEquip = (itemId) => equipMutation.mutate({ itemId, charId: characterData.id });

  const handleRecharge = (item) => {
      const costo = item.costo_ricarica || 0;
      const metodo = item.testo_ricarica || "Standard";
      if (window.confirm(`Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${metodo}`)) {
          rechargeMutation.mutate({ oggetto_id: item.id, charId: characterData.id });
      }
  };

  const handleOpenAssembly = (item) => { setAssemblyHost(item); setShowAssembly(true); };
  const handleAssemblyComplete = () => { setShowAssembly(false); setAssemblyHost(null); };
  
  // Toggle ottimizzato
  const toggleExpand = useCallback((itemId) => {
      setExpandedItems(prev => ({ ...prev, [itemId]: !prev[itemId] }));
  }, []);

  if (isContextLoading) return <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!characterData) return <div className="p-4 text-center text-red-400">Nessun personaggio selezionato.</div>;

  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  // Render Helper per liste (utilizza il componente Memoizzato)
  const renderList = (list) => (
      <div className="grid grid-cols-1 gap-2">
          {list.map(item => (
              <InventoryItemCard 
                  key={item.id} 
                  item={item} 
                  isExpanded={!!expandedItems[item.id]}
                  onToggleExpand={toggleExpand}
                  onEquip={handleToggleEquip}
                  onRecharge={handleRecharge}
                  onAssembly={handleOpenAssembly}
              />
          ))}
      </div>
  );
  
  const slots = {};
  const genericItems = [];
  corpoItems.forEach(item => {
      if (item.slot_corpo) {
          if (!slots[item.slot_corpo]) slots[item.slot_corpo] = [];
          slots[item.slot_corpo].push(item);
      } else genericItems.push(item);
  });

  return (
    <div className="pb-24 px-1 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center p-3 rounded-lg border border-gray-700 shadow-sm mb-4 sticky top-0 z-20 backdrop-blur-md bg-gray-800/90">
         <h2 className="text-xl font-bold text-white flex items-center gap-2"><Box className="text-indigo-400" /> Inventario</h2>
         <button onClick={() => setShowShop(true)} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-xs sm:text-sm border border-yellow-500">
            <ShoppingBag size={16} /><span>Negozio</span>
         </button>
      </div>

      <section>
        <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Activity size={16} /> Diagnostica Corporea</h3>
        {corpoItems.length > 0 ? (
            <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
                <div className="w-full md:w-1/3 flex flex-col items-center">
                    <InventoryBodyWidget slots={slots} onSlotClick={setSelectedBodyItem} selectedItemId={selectedBodyItem?.id} />
                    <p className="text-xs text-gray-500 mt-2 text-center italic">Clicca sulle zone colorate per i dettagli</p>
                </div>
                <div className="w-full md:w-2/3 flex flex-col gap-4">
                    <div className={`transition-all duration-300 origin-top ${selectedBodyItem ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
                        {selectedBodyItem && (
                            <div className="bg-gray-800/80 border border-indigo-500/50 rounded-lg p-2 shadow-lg shadow-indigo-900/20 relative animate-fadeIn">
                                <div className="absolute top-2 right-2 z-10">
                                    <button onClick={() => setSelectedBodyItem(null)} className="text-gray-400 hover:text-white bg-gray-900 rounded-full p-1 border border-gray-600"><Info size={14}/></button>
                                </div>
                                <h4 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2 pl-1 flex items-center gap-2"><Activity size={12}/> Dettaglio Impianto</h4>
                                <InventoryItemCard 
                                    item={selectedBodyItem} 
                                    isExpanded={true} 
                                    onToggleExpand={()=>{}} 
                                    onEquip={handleToggleEquip}
                                    onRecharge={handleRecharge}
                                    onAssembly={handleOpenAssembly}
                                />
                            </div>
                        )}
                    </div>
                    {!selectedBodyItem && genericItems.length === 0 && <div className="hidden md:flex h-full items-center justify-center text-gray-600 italic text-sm p-8 border border-dashed border-gray-800 rounded-lg">Seleziona una parte del corpo per vedere l'innesto.</div>}
                    {genericItems.length > 0 && (
                        <div className="border-t border-gray-700 pt-4">
                            <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Potenziamenti Sistemici</h4>
                            {renderList(genericItems)}
                        </div>
                    )}
                </div>
            </div>
        ) : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Sistemi organici standard.</p>}
      </section>

      <section>
        <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Shield size={16} /> Equipaggiamento Attivo</h3>
        {equipItems.length > 0 ? renderList(equipItems) : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Mani vuote.</p>}
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Box size={16} /> Zaino</h3>
        {zainoItems.length > 0 ? renderList(zainoItems) : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Zaino vuoto.</p>}
      </section>

      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      {showAssembly && assemblyHost && <ItemAssemblyModal hostItem={assemblyHost} inventory={items} onClose={() => { setShowAssembly(false); setAssemblyHost(null); }} onRefresh={handleAssemblyComplete} />}
    </div>
  );
};

export default InventoryTab;