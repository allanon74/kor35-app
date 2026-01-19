import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    ShoppingBag, Box, Shield, Activity, Loader2, Wrench, 
    RefreshCw, Power, ChevronDown 
} from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';
import UniversalItemCard from './UniversalItemCard';
import { useOptimisticEquip, useOptimisticRecharge } from '../hooks/useGameData';

// --- WIDGET MANICHINO (SVG) - CODICE COMPLETO ---
const InventoryBodyWidget = ({ slots, onSlotClick, selectedItemId }) => {
    const paths = {
        'HD1': { d: "M75,35 C75,20 85,10 100,10 C115,10 125,20 125,35 C125,45 100,48 75,35 Z", name: "Cranio" },
        'HD2': { d: "M75,35 C100,48 125,45 125,35 C125,50 115,65 100,65 C85,65 75,50 75,35 Z", name: "Volto" },
        'TR1': { d: "M70,55 C70,55 85,65 100,65 C115,65 130,55 130,55 C132,60 133,85 130,100 C100,105 100,105 70,100 C67,85 68,60 70,55 Z", name: "Torace" },
        'TR2': { d: "M70,100 C100,105 100,105 130,100 C128,120 120,145 100,145 C80,145 72,120 70,100 Z", name: "Addome" },
        'LA': { d: "M68,55 C55,52 45,58 45,70 C45,90 50,110 40,135 C38,140 50,145 55,135 C65,110 65,90 68,80 Z", name: "Braccio Sx" },
        'RA': { d: "M132,55 C145,52 155,58 155,70 C155,90 150,110 160,135 C162,140 150,145 145,135 C135,110 135,90 132,80 Z", name: "Braccio Dx" },
        'LL': { d: "M95,135 C85,135 75,140 75,150 C75,180 72,210 75,240 C80,250 60,255 70,260 C90,260 90,240 90,220 C90,190 98,150 95,135 Z", name: "Gamba Sx" },
        'RL': { d: "M105,135 C115,135 125,140 125,150 C125,180 128,210 125,240 C120,250 140,255 130,260 C110,260 110,240 110,220 C110,190 102,150 105,135 Z", name: "Gamba Dx" }
    };

    return (
        <div className="relative w-full max-w-[200px] mx-auto drop-shadow-xl select-none my-2">
            <svg viewBox="0 0 200 280" className="w-full h-auto filter drop-shadow-lg">
                <defs>
                    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="2" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>
                <g opacity="0.3">
                     {Object.values(paths).map((p, i) => <path key={i} d={p.d} fill="#1f2937" stroke="none" />)}
                </g>
                {Object.entries(paths).map(([code, { d, name }]) => {
                    const item = slots[code] && slots[code][0];
                    const isOccupied = !!item;
                    const isSelected = item && item.id === selectedItemId;
                    // L'aura colore arriva dall'oggetto -> aura -> colore
                    const color = item?.aura?.colore || '#4b5563'; 
                    
                    return (
                        <g key={code} onClick={() => isOccupied && onSlotClick(item)} className={`transition-all duration-300 ${isOccupied ? 'cursor-pointer' : ''}`}>
                            <path 
                                d={d} 
                                fill={isOccupied ? color : 'transparent'} 
                                stroke={isOccupied ? (isSelected ? '#fff' : 'rgba(255,255,255,0.5)') : '#374151'} 
                                strokeWidth={isSelected ? 2 : 1} 
                                fillOpacity={isOccupied ? 0.8 : 0.1} 
                                filter={isSelected ? 'url(#glow)' : ''} 
                            />
                            <title>{name}</title>
                        </g>
                    );
                })}
            </svg>
        </div>
    );
};

// --- LAZY LIST COMPONENT ---
const LazyList = ({ items, renderItem, batchSize = 10 }) => {
    const [visibleCount, setVisibleCount] = useState(batchSize);
    useEffect(() => { setVisibleCount(batchSize); }, [items, batchSize]);
    
    return (
        <div className="space-y-2 pb-20">
            {items.slice(0, visibleCount).map(renderItem)}
            {visibleCount < items.length && (
                <button onClick={() => setVisibleCount(p => p + batchSize)} className="w-full py-3 text-sm font-bold text-gray-500 bg-gray-900 border border-dashed border-gray-700 rounded-lg">
                    Carica altri...
                </button>
            )}
        </div>
    );
};

// --- COMPONENTE PRINCIPALE ---
const InventoryTab = () => {
    const { selectedCharacterData: char, isLoading, api } = useCharacter();
    const [activeTab, setActiveTab] = useState('tutti');
    const [showShop, setShowShop] = useState(false);
    const [showAssembly, setShowAssembly] = useState(false);
    const [assemblyHost, setAssemblyHost] = useState(null);
    const [selectedBodyItem, setSelectedBodyItem] = useState(null);
    const [expanded, setExpanded] = useState({});

    const equipMutation = useOptimisticEquip();
    const rechargeMutation = useOptimisticRecharge();

    // --- CALCOLO LIMITI (RIGOROSO SU VALORE_TOTALE) ---
    const getStatTotal = useCallback((sigla) => {
        if (!char?.punteggi) return 0;
        // Cerca dentro la relazione 'caratteristica'
        const stat = char.punteggi.find(p => p.caratteristica?.sigla === sigla);
        // IMPORTANTE: Leggiamo 'valore_totale' (che ha i bonus), non 'valore'
        return stat ? (stat.valore_totale ?? stat.valore ?? 0) : 0;
    }, [char]);

    const maxOGP = useMemo(() => getStatTotal('OGP'), [getStatTotal]);
    const maxCOG = useMemo(() => getStatTotal('COG'), [getStatTotal]);

    const items = char?.oggetti || [];

    // --- CALCOLO TOTALI CORRENTI ---
    const curOGP = useMemo(() => items.filter(i => 
        i.is_pesante || i.oggetto_base?.is_pesante 
    ).length, [items]);

    const curCOG = useMemo(() => items.filter(i => 
        // Un oggetto occupa slot se è equipaggiato E (ha mod OPPURE ha innesti)
        i.is_equipaggiato && ((i.mods && i.mods.length > 0) || (i.innesti && i.innesti.length > 0))
    ).length, [items]);

    // --- HANDLERS ---
    const toggleExpand = useCallback((id) => setExpanded(p => ({...p, [id]: !p[id]})), []);

    const handleEquip = (item) => {
        // Controllo Limite Slot (COG)
        if (!item.is_equipaggiato) {
            const isSpecial = (item.mods?.length > 0 || item.innesti?.length > 0);
            if (isSpecial && curCOG >= maxCOG) {
                alert(`LIMITE SLOT (COG) RAGGIUNTO: ${curCOG}/${maxCOG}\nNon puoi equipaggiare altri oggetti modificati.`);
                return;
            }
        }
        equipMutation.mutate({ itemId: item.id, charId: char.id });
    };

    const handleBuy = async (shopItem) => {
        // Controllo Limite Peso (OGP)
        const isPesante = shopItem.is_pesante || shopItem.oggetto_base?.is_pesante;
        if (isPesante && curOGP >= maxOGP) {
            alert(`LIMITE PESO (OGP) RAGGIUNTO: ${curOGP}/${maxOGP}`);
            return;
        }
        try { 
            await api.buyShopItem(char.id, shopItem.id); 
            alert("Acquistato!"); 
        } catch(e) { 
            console.error(e); 
            alert("Errore acquisto."); 
        }
    };

    const handleRecharge = (item) => {
        if(window.confirm(`Ricaricare ${item.nome} per ${item.costo_ricarica} crediti?`)) {
            rechargeMutation.mutate({ oggetto_id: item.id, charId: char.id });
        }
    };

    const handleAssembly = (item) => {
        setAssemblyHost(item);
        setShowAssembly(true);
    };

    // --- FILTRI VISUALIZZAZIONE ---
    const filteredItems = useMemo(() => {
        let list = [...items];
        if (activeTab === 'equip') list = list.filter(i => i.is_equipaggiato);
        if (activeTab === 'zaino') list = list.filter(i => !i.is_equipaggiato);
        // Ordina: Equipaggiati in alto
        return list.sort((a,b) => Number(b.is_equipaggiato) - Number(a.is_equipaggiato));
    }, [items, activeTab]);

    // Prepara slot per il widget del corpo
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

    // Wrapper per renderizzare la card con i bottoni specifici
    const renderCard = (item) => {
        const isPhys = item.tipo_oggetto === 'FIS';
        const canMod = (isPhys || item.tipo_oggetto === 'INN') && item.classe_oggetto_nome;
        
        return (
            <UniversalItemCard
                key={item.id}
                item={item}
                type="OGGETTO"
                isExpanded={!!expanded[item.id]}
                onToggle={toggleExpand}
                actions={
                    <>
                        {canMod && (
                            <button onClick={(e)=>{e.stopPropagation(); handleAssembly(item)}} 
                                className="flex-1 py-1.5 rounded bg-gray-700 text-amber-400 text-xs font-bold border border-gray-600 flex justify-center gap-1 hover:bg-gray-600 transition-colors">
                                <Wrench size={12}/> Mod
                            </button>
                        )}
                        {item.cariche_massime > 0 && item.cariche_attuali < item.cariche_massime && (
                            <button onClick={(e)=>{e.stopPropagation(); handleRecharge(item)}} 
                                className="flex-1 py-1.5 rounded bg-yellow-900/40 text-yellow-200 text-xs font-bold border border-yellow-700 flex justify-center gap-1 hover:bg-yellow-800 transition-colors">
                                <RefreshCw size={12}/> Ricarica
                            </button>
                        )}
                        {isPhys && (
                            <button onClick={(e)=>{e.stopPropagation(); handleEquip(item)}} 
                                className={`flex-1 py-1.5 rounded text-xs font-bold border flex justify-center gap-1 transition-colors ${item.is_equipaggiato ? 'bg-red-900/60 text-red-100 border-red-800 hover:bg-red-800' : 'bg-emerald-800/60 text-emerald-100 border-emerald-700 hover:bg-emerald-700'}`}>
                                {item.is_equipaggiato ? <><Power size={12}/> Via</> : <><Shield size={12}/> Usa</>}
                            </button>
                        )}
                    </>
                }
            />
        );
    };

    if (isLoading) return <Loader2 className="animate-spin mx-auto mt-10"/>;
    if (!char) return null;

    return (
        <div className="pb-24 px-1 space-y-4 animate-fadeIn max-w-3xl mx-auto">
            
            {/* HEADER FISSO */}
            <div className="sticky top-0 z-20 bg-gray-900/95 backdrop-blur border-b border-gray-700 pb-2 -mx-1 px-1 shadow-lg rounded-b-xl">
                <div className="flex justify-between items-center py-3 px-2">
                    <h2 className="text-xl font-bold text-white flex items-center gap-2"><Box className="text-indigo-400" /> Inventario</h2>
                    <button onClick={() => setShowShop(true)} className="bg-yellow-700 text-white px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 border border-yellow-500 shadow-md hover:bg-yellow-600 transition-colors">
                        <ShoppingBag size={14}/> Shop
                    </button>
                </div>
                
                {/* BARRA LIMITI */}
                <div className="flex gap-2 px-2 pb-2">
                     <div className={`flex-1 bg-black/40 p-1.5 rounded border ${curOGP > maxOGP ? 'border-red-500 text-red-400' : 'border-gray-800 text-gray-400'} flex justify-between text-xs`}>
                        <span className="font-bold">PESO (OGP)</span><span className="font-mono font-bold">{curOGP}/{maxOGP}</span>
                     </div>
                     <div className={`flex-1 bg-black/40 p-1.5 rounded border ${curCOG >= maxCOG ? 'border-orange-500 text-orange-400' : 'border-gray-800 text-gray-400'} flex justify-between text-xs`}>
                        <span className="font-bold">SLOT (COG)</span><span className="font-mono font-bold">{curCOG}/{maxCOG}</span>
                     </div>
                </div>

                {/* TABS */}
                <div className="flex bg-gray-800/50 p-1 rounded mx-2">
                    {['tutti', 'equip', 'zaino'].map(tab => (
                        <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 py-1.5 text-xs font-bold uppercase rounded transition-all ${activeTab === tab ? 'bg-indigo-600 text-white shadow-sm' : 'text-gray-400 hover:bg-gray-700'}`}>{tab}</button>
                    ))}
                </div>
            </div>

            {/* SEZIONE DIAGNOSTICA (SOLO SU 'TUTTI') */}
            {activeTab === 'tutti' && (
                <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700/50 flex flex-col md:flex-row gap-4 items-center">
                    <div className="shrink-0"><InventoryBodyWidget slots={bodySlots} onSlotClick={setSelectedBodyItem} selectedItemId={selectedBodyItem?.id} /></div>
                    <div className="flex-1 w-full flex flex-col justify-center">
                        {selectedBodyItem ? (
                            <div>
                                <h4 className="text-xs text-gray-500 uppercase mb-2 border-b border-gray-700 pb-1">Impianto Selezionato</h4>
                                {renderCard(selectedBodyItem)}
                                <button onClick={()=>setSelectedBodyItem(null)} className="text-xs text-indigo-400 underline mt-2 block text-center w-full hover:text-indigo-300">Chiudi dettaglio</button>
                            </div>
                        ) : <div className="text-center text-gray-600 text-xs italic border border-dashed border-gray-700 p-4 rounded bg-black/20">Seleziona una parte del corpo per i dettagli.</div>}
                    </div>
                </div>
            )}

            {/* LISTA INFINITA */}
            <LazyList items={filteredItems} renderItem={renderCard} />

            {/* MODALI */}
            {showShop && <ShopModal onClose={() => setShowShop(false)} onBuy={handleBuy} credits={char.crediti} />}
            {showAssembly && assemblyHost && <ItemAssemblyModal hostItem={assemblyHost} inventory={items} onClose={() => {setShowAssembly(false); setAssemblyHost(null);}} />}
        </div>
    );
};

export default InventoryTab;