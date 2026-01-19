import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    ShoppingBag, Box, Shield, Activity, Loader2, Wrench, 
    RefreshCw, Power, Sparkles, AlertTriangle, ChevronDown 
} from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';
import UniversalItemCard from './UniversalItemCard'; // Usa il nuovo componente per le icone
import { useOptimisticEquip, useOptimisticRecharge } from '../hooks/useGameData';

// --- WIDGET SVG DEL CORPO (RIPRISTINATO) ---
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
        <div className="relative w-full max-w-[260px] mx-auto drop-shadow-xl select-none my-4">
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
                    // Logica Aura Colore
                    const auraColor = item?.aura?.colore || '#4b5563'; 
                    
                    return (
                        <g key={code} onClick={() => isOccupied && onSlotClick(item)} className={`transition-all duration-300 ${isOccupied ? 'cursor-pointer' : 'cursor-default'}`}>
                            <path 
                                d={d} 
                                fill={isOccupied ? auraColor : 'transparent'} 
                                stroke={isOccupied ? (isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)') : '#374151'} 
                                strokeWidth={isSelected ? 2 : 1} 
                                fillOpacity={isOccupied ? (isSelected ? 1 : 0.7) : 0.1} 
                                filter={isSelected ? 'url(#glow-selected)' : ''} 
                                className={`transition-all duration-300 ${isOccupied ? 'hover:fill-opacity-100 hover:stroke-white' : ''}`} 
                            />
                            <title>{name} {isOccupied ? `: ${item.nome}` : '(Vuoto)'}</title>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- COMPONENTE LISTA LAZY (RIPRISTINATO) ---
const LazyList = ({ items, renderItem, batchSize = 10 }) => {
    const [visibleCount, setVisibleCount] = useState(batchSize);

    useEffect(() => {
        setVisibleCount(batchSize);
    }, [items, batchSize]);

    return (
        <div className="space-y-2 pb-20">
            {items.slice(0, visibleCount).map(renderItem)}
            {visibleCount < items.length && (
                <button 
                    onClick={() => setVisibleCount(prev => prev + batchSize)}
                    className="w-full py-3 mt-2 text-sm font-bold text-gray-400 bg-gray-800/50 hover:bg-gray-700 border border-dashed border-gray-600 rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                    <ChevronDown size={16} /> Carica altri ({items.length - visibleCount})
                </button>
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
const InventoryTab = () => {
    const { selectedCharacterData: characterData, isLoading, api } = useCharacter();
    
    // Stati UI
    const [activeTab, setActiveTab] = useState('tutti'); // 'tutti', 'equip', 'zaino'
    const [showShop, setShowShop] = useState(false);
    const [showAssembly, setShowAssembly] = useState(false);
    const [assemblyHost, setAssemblyHost] = useState(null);
    const [selectedBodyItem, setSelectedBodyItem] = useState(null); // Per il widget corpo
    const [expandedItems, setExpandedItems] = useState({});

    const equipMutation = useOptimisticEquip();
    const rechargeMutation = useOptimisticRecharge();

    // --- CALCOLO LIMITI (Logica "MainPage" per affidabilità) ---
    const getStatTotal = useCallback((sigla) => {
        if (!characterData?.punteggi) return 0;
        // Cerca la statistica sia piatta che nested
        const stat = characterData.punteggi.find(p => {
            const s = p.caratteristica?.sigla || p.sigla || "";
            return s.toUpperCase() === sigla.toUpperCase();
        });
        // Usa valore_totale se esiste (bonus inclusi)
        return stat ? (stat.valore_totale ?? stat.valore ?? 0) : 0;
    }, [characterData]);

    const maxOGP = useMemo(() => getStatTotal('OGP'), [getStatTotal]);
    const maxCOG = useMemo(() => getStatTotal('COG'), [getStatTotal]);

    const items = characterData?.oggetti || [];

    // Calcolo correnti
    const curOGP = useMemo(() => items.filter(i => i.is_pesante || i.oggetto_base?.is_pesante).length, [items]);
    const curCOG = useMemo(() => items.filter(i => i.is_equipaggiato && ((i.mods && i.mods.length > 0) || (i.innesti && i.innesti.length > 0))).length, [items]);

    // --- HANDLERS ---
    const toggleExpand = useCallback((id) => {
        setExpandedItems(prev => ({...prev, [id]: !prev[id]}));
    }, []);

    const handleEquip = useCallback((item) => {
        // Blocco logico
        if (!item.is_equipaggiato) {
            const isSpecial = (item.mods?.length > 0 || item.innesti?.length > 0);
            if (isSpecial && curCOG >= maxCOG) {
                alert(`LIMITE RAGGIUNTO (COG): Hai equipaggiato ${curCOG}/${maxCOG} oggetti speciali.`);
                return;
            }
        }
        equipMutation.mutate({ itemId: item.id, charId: characterData.id });
    }, [curCOG, maxCOG, equipMutation, characterData]);

    const handleBuy = async (shopItem) => {
        const isPesante = shopItem.is_pesante || shopItem.oggetto_base?.is_pesante;
        if (isPesante && curOGP >= maxOGP) {
            alert(`SOVRACCARICO (OGP): Limite peso raggiunto (${curOGP}/${maxOGP}).`);
            return;
        }
        try {
            await api.buyShopItem(characterData.id, shopItem.id);
            alert("Acquistato!");
        } catch(e) { console.error(e); alert("Errore acquisto."); }
    };

    const handleRecharge = (item) => {
        if(window.confirm(`Ricaricare ${item.nome} per ${item.costo_ricarica || 0} crediti?`)) {
            rechargeMutation.mutate({ oggetto_id: item.id, charId: characterData.id });
        }
    };

    const handleAssembly = (item) => {
        setAssemblyHost(item);
        setShowAssembly(true);
    };

    // --- FILTRAGGIO LISTA ---
    const filteredItems = useMemo(() => {
        let list = [...items];
        if (activeTab === 'equip') {
            list = list.filter(i => i.is_equipaggiato);
        } else if (activeTab === 'zaino') {
            list = list.filter(i => !i.is_equipaggiato);
        }
        // Ordina: Equipaggiati primi
        return list.sort((a,b) => (b.is_equipaggiato - a.is_equipaggiato));
    }, [items, activeTab]);

    // --- GESTIONE WIDGET CORPO ---
    // Prepara gli slot per l'SVG
    const bodySlots = useMemo(() => {
        const slots = {};
        items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto)).forEach(item => {
            if (item.slot_corpo) {
                if (!slots[item.slot_corpo]) slots[item.slot_corpo] = [];
                slots[item.slot_corpo].push(item);
            }
        });
        return slots;
    }, [items]);

    if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="animate-spin"/></div>;
    if (!characterData) return null;

    // --- RENDERER CARD UNIVERSALE ---
    const renderUniversalCard = (item) => {
        const isPhysical = item.tipo_oggetto === 'FIS';
        const canMod = (isPhysical || item.tipo_oggetto === 'INN') && item.classe_oggetto_nome;
        
        const actions = (
            <>
                {canMod && (
                    <button onClick={(e) => { e.stopPropagation(); handleAssembly(item); }} 
                            className="flex-1 py-1.5 rounded bg-gray-700 hover:bg-gray-600 text-amber-400 text-xs font-bold flex items-center justify-center gap-2 border border-gray-600">
                        <Wrench size={12}/> Modifica
                    </button>
                )}
                {item.cariche_massime > 0 && item.cariche_attuali < item.cariche_massime && (
                    <button onClick={(e) => { e.stopPropagation(); handleRecharge(item); }} 
                            className="flex-1 py-1.5 rounded bg-yellow-900/40 hover:bg-yellow-800 text-yellow-200 text-xs font-bold flex items-center justify-center gap-2 border border-yellow-700">
                        <RefreshCw size={12}/> Ricarica
                    </button>
                )}
                {isPhysical && (
                    <button onClick={(e) => { e.stopPropagation(); handleEquip(item); }} 
                            className={`flex-1 py-1.5 rounded text-xs font-bold flex items-center justify-center gap-2 border transition-colors ${
                                item.is_equipaggiato 
                                ? 'bg-red-900/60 text-red-100 border-red-800 hover:bg-red-800' 
                                : 'bg-emerald-800/60 text-emerald-100 border-emerald-700 hover:bg-emerald-700'
                            }`}>
                        {item.is_equipaggiato ? <><Power size={12}/> Rimuovi</> : <><Shield size={12}/> Equipaggia</>}
                    </button>
                )}
            </>
        );

        return (
            <UniversalItemCard
                key={item.id}
                item={item}
                type="OGGETTO"
                isExpanded={!!expandedItems[item.id]}
                onToggle={toggleExpand}
                actions={actions}
            />
        );
    };

    return (
        <div className="pb-24 px-1 space-y-4 animate-fadeIn max-w-3xl mx-auto">
            
            {/* HEADER FISSO */}
            <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-700 pb-2 -mx-1 px-1 shadow-lg rounded-b-xl">
                <div className="flex justify-between items-center py-3 px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Box className="text-indigo-400" /> Inventario
                    </h2>
                    <div className="flex gap-2">
                        <button onClick={() => setShowShop(true)} className="bg-yellow-700 hover:bg-yellow-600 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 shadow-sm border border-yellow-500">
                            <ShoppingBag size={14}/> Negozio
                        </button>
                    </div>
                </div>

                {/* BARRA LIMITI */}
                <div className="flex gap-2 px-2 pb-2">
                     <div className={`flex-1 bg-black/40 p-1.5 rounded border ${curOGP > maxOGP ? 'border-red-500 bg-red-900/10' : 'border-gray-800'} flex justify-between items-center text-xs`}>
                        <span className="text-gray-400 font-bold">PESO (OGP)</span>
                        <span className={`font-mono font-bold ${curOGP > maxOGP ? 'text-red-400' : 'text-green-400'}`}>{curOGP}/{maxOGP}</span>
                     </div>
                     <div className={`flex-1 bg-black/40 p-1.5 rounded border ${curCOG >= maxCOG ? 'border-orange-500 bg-orange-900/10' : 'border-gray-800'} flex justify-between items-center text-xs`}>
                        <span className="text-gray-400 font-bold">SLOT (COG)</span>
                        <span className={`font-mono font-bold ${curCOG >= maxCOG ? 'text-orange-400' : 'text-blue-400'}`}>{curCOG}/{maxCOG}</span>
                     </div>
                </div>

                {/* TAB NAVIGATION */}
                <div className="flex bg-gray-800/50 p-1 rounded mx-2">
                    {['tutti', 'equip', 'zaino'].map(tab => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`flex-1 py-1.5 text-xs font-bold uppercase rounded transition-all ${
                                activeTab === tab 
                                ? 'bg-indigo-600 text-white shadow-sm' 
                                : 'text-gray-400 hover:text-white hover:bg-gray-700'
                            }`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>

            {/* SEZIONE DIAGNOSTICA (WIDGET CORPO) - Visibile solo su tab 'tutti' o se selezionato */}
            {activeTab === 'tutti' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50">
                    <h3 className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-2 flex items-center gap-2 border-b border-gray-800 pb-2">
                        <Activity size={14}/> Diagnostica Innesti
                    </h3>
                    <div className="flex flex-col md:flex-row gap-4 items-center">
                         <div className="shrink-0">
                            <InventoryBodyWidget 
                                slots={bodySlots} 
                                onSlotClick={(item) => setSelectedBodyItem(item)} 
                                selectedItemId={selectedBodyItem?.id} 
                            />
                         </div>
                         <div className="flex-1 w-full min-h-[100px] flex flex-col justify-center">
                             {selectedBodyItem ? (
                                 <div className="animate-fadeIn">
                                     <h4 className="text-xs text-gray-500 uppercase mb-2">Dettaglio Impianto Selezionato</h4>
                                     {renderUniversalCard(selectedBodyItem)}
                                     <button onClick={()=>setSelectedBodyItem(null)} className="text-xs text-indigo-400 underline mt-2">Chiudi dettaglio</button>
                                 </div>
                             ) : (
                                 <div className="text-center text-gray-600 text-xs italic border border-dashed border-gray-700 p-4 rounded">
                                     Seleziona una parte del corpo per visualizzare l'innesto.
                                 </div>
                             )}
                         </div>
                    </div>
                </div>
            )}

            {/* LISTA OGGETTI (LAZY) */}
            <LazyList items={filteredItems} renderItem={renderUniversalCard} />

            {/* MODALI */}
            {showShop && <ShopModal onClose={() => setShowShop(false)} onBuy={handleBuy} credits={characterData.crediti} />}
            {showAssembly && assemblyHost && (
                <ItemAssemblyModal 
                    hostItem={assemblyHost} 
                    inventory={characterData.oggetti} 
                    onClose={() => { setShowAssembly(false); setAssemblyHost(null); }} 
                />
            )}
        </div>
    );
};

export default InventoryTab;