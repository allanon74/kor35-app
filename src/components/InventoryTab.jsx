import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    ShoppingBag, Box, Shield, Zap, Loader2, Wrench, 
    Info, ChevronUp, User, Activity, Power, Battery, 
    Clock, RefreshCw, Coins 
} from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';
import { useOptimisticEquip, useOptimisticRecharge } from '../hooks/useGameData';

// --- COMPONENTE VISUALE CORPO (SVG ORGANICO 8 SLOT) ---
const InventoryBodyWidget = ({ slots, onSlotClick, selectedItemId }) => {
    // Definizione dei percorsi SVG "organici" per le 8 zone
    // Coordinate ottimizzate su viewBox="0 0 200 300"
    const paths = {
        'HD1': { 
            // Cranio (Parte superiore della testa)
            d: "M75,35 C75,20 85,10 100,10 C115,10 125,20 125,35 C125,45 100,48 75,35 Z", 
            name: "Cranio (HD1)" 
        },
        'HD2': { 
            // Volto/Mandibola (Parte inferiore)
            d: "M75,35 C100,48 125,45 125,35 C125,50 115,65 100,65 C85,65 75,50 75,35 Z", 
            name: "Volto (HD2)" 
        },
        'TR1': { 
            // Torace (Pettorali/Cassa toracica)
            d: "M70,55 C70,55 85,65 100,65 C115,65 130,55 130,55 C132,60 133,85 130,100 C100,105 100,105 70,100 C67,85 68,60 70,55 Z", 
            name: "Torace (TR1)" 
        },
        'TR2': { 
            // Addome (Parte inferiore del tronco)
            d: "M70,100 C100,105 100,105 130,100 C128,120 120,145 100,145 C80,145 72,120 70,100 Z", 
            name: "Addome (TR2)" 
        },
        'LA': { 
            // Braccio Sx
            d: "M68,55 C55,52 45,58 45,70 C45,90 50,110 40,135 C38,140 50,145 55,135 C65,110 65,90 68,80 Z", 
            name: "Braccio Sx (LA)" 
        },
        'RA': { 
            // Braccio Dx
            d: "M132,55 C145,52 155,58 155,70 C155,90 150,110 160,135 C162,140 150,145 145,135 C135,110 135,90 132,80 Z", 
            name: "Braccio Dx (RA)" 
        },
        'LL': { 
            // Gamba Sx
            d: "M95,135 C85,135 75,140 75,150 C75,180 72,210 75,240 C80,250 60,255 70,260 C90,260 90,240 90,220 C90,190 98,150 95,135 Z", 
            name: "Gamba Sx (LL)" 
        },
        'RL': { 
            // Gamba Dx
            d: "M105,135 C115,135 125,140 125,150 C125,180 128,210 125,240 C120,250 140,255 130,260 C110,260 110,240 110,220 C110,190 102,150 105,135 Z", 
            name: "Gamba Dx (RL)" 
        }
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

                {/* Sfondo Sagoma (Grigio Scuro per dare contesto alle zone vuote) */}
                <g opacity="0.2">
                     {/* Unione di tutti i path per fare l'ombra di fondo */}
                     {Object.values(paths).map((p, i) => (
                         <path key={i} d={p.d} fill="#1f2937" stroke="none" />
                     ))}
                </g>
                
                {Object.entries(paths).map(([code, { d, name }]) => {
                    const item = slots[code] && slots[code][0]; // Prendi il primo oggetto nello slot
                    const isOccupied = !!item;
                    const isSelected = item && item.id === selectedItemId;
                    
                    // Colore Aura o Default Grigio se vuoto
                    const auraColor = item?.aura?.colore || '#4b5563'; 
                    
                    // Stili condizionali
                    const fillColor = isOccupied ? auraColor : 'transparent';
                    const strokeColor = isOccupied ? (isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)') : '#374151';
                    const opacity = isOccupied ? (isSelected ? 1 : 0.7) : 0.1;
                    const cursor = isOccupied ? 'cursor-pointer' : 'cursor-default';
                    const filter = isSelected ? 'url(#glow-selected)' : '';

                    return (
                        <g 
                            key={code} 
                            onClick={() => isOccupied && onSlotClick(item)} 
                            className={`transition-all duration-300 ${cursor}`}
                        >
                            <path
                                d={d}
                                fill={fillColor}
                                stroke={strokeColor}
                                strokeWidth={isSelected ? 2 : 1}
                                fillOpacity={opacity}
                                filter={filter}
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

const InventoryTab = ({ onLogout }) => {
  const { selectedCharacterData: characterData, isLoading: isContextLoading } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [showShop, setShowShop] = useState(false);
  const [showAssembly, setShowAssembly] = useState(false);
  const [assemblyHost, setAssemblyHost] = useState(null);
  
  // Stato per l'oggetto selezionato nella vista visuale
  const [selectedBodyItem, setSelectedBodyItem] = useState(null);
  
  const [expandedItems, setExpandedItems] = useState({});

  const equipMutation = useOptimisticEquip();
  const rechargeMutation = useOptimisticRecharge();

  useEffect(() => {
    if (characterData?.oggetti) {
      setItems(characterData.oggetti);
    } else {
      setItems([]);
    }
  }, [characterData]);

  // --- GESTIONE AZIONI ---

  const handleToggleEquip = (itemId) => {
    equipMutation.mutate({ 
        itemId, 
        charId: characterData.id 
    });
  };

  const handleRecharge = (item) => {
      const costo = item.costo_ricarica || 0;
      const metodo = item.testo_ricarica || "Standard";
      const confirmMsg = `Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${metodo}`;
      
      if (window.confirm(confirmMsg)) {
          rechargeMutation.mutate({ 
              oggetto_id: item.id, 
              charId: characterData.id 
          });
      }
  };

  const handleOpenAssembly = (item) => {
    setAssemblyHost(item);
    setShowAssembly(true);
  };

  const handleAssemblyComplete = () => {
    setShowAssembly(false);
    setAssemblyHost(null);
  };

  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // --- HELPERS VISIVI ---

  const getStatusStyle = (item) => {
    if (item.is_active) {
        return 'border-2 border-green-500 shadow-[0_0_15px_rgba(34,197,94,0.2)] bg-green-900/10';
    }
    if (item.is_equipaggiato) {
        return 'border-2 border-yellow-600/60 bg-yellow-900/10'; 
    }
    return 'border border-gray-700 bg-gray-800 hover:border-gray-600'; 
  };

  // --- RENDER COMPONENTI ---

  const renderItemCard = (item, forceExpand = false) => {
    const isPhysical = item.tipo_oggetto === 'FIS';
    const canBeModified = (isPhysical || ['INN', 'MUT'].includes(item.tipo_oggetto)) && (item.classe_oggetto_nome || item.tipo_oggetto === 'INN');
    const isExpanded = forceExpand || !!expandedItems[item.id];
    const isActive = item.is_active;

    const renderChargeInfo = () => {
        if (!item.cariche_massime && !item.durata_totale) return null;
        const isLow = item.cariche_attuali === 0;

        return (
            <div className="mt-2 bg-gray-800 p-2 rounded border border-gray-600 flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2">
                        <span className={`flex items-center gap-1 font-bold ${isLow ? 'text-red-500' : 'text-yellow-500'}`}>
                            <Battery size={12} /> {item.cariche_attuali} / {item.cariche_massime || '-'}
                        </span>
                        {item.durata_totale > 0 && (
                             <span className="flex items-center gap-1 text-blue-400 border-l border-gray-600 pl-2">
                                <Clock size={12} /> {item.durata_totale}s
                             </span>
                        )}
                    </div>
                    {(item.cariche_massime > 0 && item.cariche_attuali < item.cariche_massime) && (
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleRecharge(item); }}
                            className="flex items-center gap-1 px-2 py-1 bg-yellow-700 hover:bg-yellow-600 text-white rounded text-[10px] uppercase font-bold tracking-wide transition-colors"
                        >
                            <RefreshCw size={10} /> Ricarica
                        </button>
                    )}
                </div>
                {item.testo_ricarica && (
                    <div className="text-[10px] text-gray-400 italic border-t border-gray-700 pt-1">
                        Ricarica: {item.testo_ricarica} ({item.costo_ricarica} CR)
                    </div>
                )}
            </div>
        );
    };

    return (
      <div 
        key={item.id} 
        className={`relative p-3 mb-3 rounded-lg flex flex-col transition-all ${getStatusStyle(item)}`}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between">
            <div className="grow w-full">
            
            <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => !forceExpand && toggleExpand(item.id)}>
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-base ${isActive ? 'text-green-400' : item.is_equipaggiato ? 'text-yellow-500' : 'text-gray-200'}`}>
                        {item.nome}
                    </h4>
                    
                    {isActive && (
                        <span className="text-[10px] bg-green-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                            <Power size={10} /> ON
                        </span>
                    )}
                    {item.is_equipaggiato && !isActive && (
                        <span className="text-[10px] bg-yellow-600 text-black px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                            <Shield size={10} /> OFF
                        </span>
                    )}
                </div>
                {!forceExpand && (
                    <button className="text-gray-400 hover:text-white p-1">
                        {isExpanded ? <ChevronUp size={18} /> : <Info size={18} />}
                    </button>
                )}
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-1">
                <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                    {item.tipo_oggetto_display}
                </span>
                {item.classe_oggetto_nome && (
                    <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                        {item.classe_oggetto_nome}
                    </span>
                )}
                {!isExpanded && item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                    <span className="flex items-center gap-1 text-indigo-400">
                        <Zap size={10} /> {item.potenziamenti_installati.length} Mod
                    </span>
                )}
            </div>

            {isExpanded && (
                <div className="mt-3 animate-fadeIn space-y-3">
                    <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-snug p-2 bg-black/20 rounded border border-gray-700/30">
                        <h5 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Specifiche Tecniche</h5>
                        <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio || item.testo || item.descrizione || "Nessun dato disponibile." }} />
                        
                        {item.data_fine_attivazione && (
                            <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-orange-400 font-mono">
                                <span>Scadenza: </span>
                                {new Date(item.data_fine_attivazione).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {renderChargeInfo()}

                    {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                        <div className="pl-2 border-l-2 border-indigo-500/30">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                                <Zap size={12} /> Moduli Installati:
                            </p>
                            <div className="space-y-2">
                                {item.potenziamenti_installati.map(mod => (
                                    <div key={mod.id} className={`p-2 rounded border text-xs ${mod.is_active !== false ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-red-900/10 border-red-900/30 opacity-70'}`}>
                                        <div className="font-bold text-indigo-200 flex justify-between items-center mb-1">
                                            <span>{mod.nome}</span>
                                            <span className="text-[9px] text-gray-500 uppercase tracking-wide">[{mod.tipo_oggetto_display}]</span>
                                        </div>
                                        {mod.descrizione && (
                                            <div 
                                                className="text-gray-400 italic mb-1 leading-tight"
                                                dangerouslySetInnerHTML={{ __html: mod.descrizione }}
                                            />
                                        )}
                                        {mod.cariche_massime > 0 && (
                                            <div className="mt-1 pt-1 border-t border-indigo-500/20 flex flex-wrap gap-2 text-[10px] items-center">
                                                <span className={`flex items-center gap-1 font-bold ${mod.cariche_attuali === 0 ? 'text-red-500' : 'text-yellow-500'}`}>
                                                    <Battery size={10} /> 
                                                    {mod.cariche_attuali} / {mod.cariche_massime}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>

            <div className="shrink-0 flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
                {canBeModified && (
                    <button
                        onClick={(e) => { e.stopPropagation(); handleOpenAssembly(item); }}
                        className="flex-1 sm:flex-none px-3 py-2 rounded text-xs font-bold shadow-sm transition-all active:scale-95 bg-gray-700 hover:bg-gray-600 text-amber-400 border border-gray-600 flex items-center justify-center gap-2"
                        title="Gestisci Mod e Materia"
                    >
                        <Wrench size={14} /> <span className="sm:hidden lg:inline">Modifica</span>
                    </button>
                )}

                {isPhysical && (
                    <button 
                        onClick={(e) => { e.stopPropagation(); handleToggleEquip(item.id); }}
                        className={`flex-1 sm:flex-none px-3 py-2 rounded text-xs font-bold shadow-sm transition-all active:scale-95 ${
                            item.is_equipaggiato
                            ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700'
                            : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600'
                        }`}
                    >
                        {item.is_equipaggiato ? 'Rimuovi' : 'Equipaggia'}
                    </button>
                )}
            </div>
        </div>
      </div>
    );
  };

  const renderBodyVisual = (corpoItems) => {
    // Mappa gli oggetti per slot
    const slots = {};
    const genericItems = [];

    corpoItems.forEach(item => {
        if (item.slot_corpo) {
            if (!slots[item.slot_corpo]) slots[item.slot_corpo] = [];
            slots[item.slot_corpo].push(item);
        } else {
            genericItems.push(item);
        }
    });

    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 mb-6 flex flex-col md:flex-row items-center md:items-start gap-6">
            
            {/* SINISTRA: SILHOUETTE INTERATTIVA */}
            <div className="w-full md:w-1/3 flex flex-col items-center">
                <InventoryBodyWidget 
                    slots={slots} 
                    onSlotClick={setSelectedBodyItem} 
                    selectedItemId={selectedBodyItem?.id}
                />
                <p className="text-xs text-gray-500 mt-2 text-center italic">
                    Clicca sulle zone colorate per i dettagli
                </p>
            </div>

            {/* DESTRA: DETTAGLI O LISTA GENERICA */}
            <div className="w-full md:w-2/3 flex flex-col gap-4">
                
                {/* Pannello Dettaglio Selezione (Animato) */}
                <div className={`transition-all duration-300 origin-top ${selectedBodyItem ? 'opacity-100 scale-100' : 'opacity-0 scale-95 h-0 overflow-hidden'}`}>
                    {selectedBodyItem && (
                        <div className="bg-gray-800/80 border border-indigo-500/50 rounded-lg p-1 shadow-lg shadow-indigo-900/20 relative animate-fadeIn">
                            <div className="absolute top-0 right-0 p-2 z-10">
                                <button onClick={() => setSelectedBodyItem(null)} className="text-gray-400 hover:text-white bg-gray-900 rounded-full p-1 border border-gray-600"><Info size={14}/></button>
                            </div>
                            <h4 className="text-xs uppercase tracking-widest text-indigo-400 font-bold mb-2 pl-2 pt-2 flex items-center gap-2">
                                <Activity size={12}/> Dettaglio Impianto
                            </h4>
                            {renderItemCard(selectedBodyItem, true)}
                        </div>
                    )}
                </div>

                {/* Placeholder quando nulla è selezionato */}
                {!selectedBodyItem && corpoItems.length > 0 && genericItems.length === 0 && (
                    <div className="hidden md:flex h-full items-center justify-center text-gray-600 italic text-sm p-8 border border-dashed border-gray-800 rounded-lg">
                        Seleziona una parte del corpo per vedere l'innesto.
                    </div>
                )}

                {/* Lista Generici (Sistemici/Senza Slot) */}
                {genericItems.length > 0 && (
                    <div className="border-t border-gray-700 pt-4">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Potenziamenti Sistemici (Non localizzati)</h4>
                        <div className="grid grid-cols-1 gap-2">
                            {genericItems.map(item => renderItemCard(item))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
  };
  
  if (isContextLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  
  if (!characterData) {
    return <div className="p-4 text-center text-red-400">Nessun personaggio selezionato.</div>;
  }

  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  return (
    <div className="pb-24 px-1 space-y-6 animate-fadeIn">
      
      <div className="flex justify-between items-center p-3 rounded-lg border border-gray-700 shadow-sm mb-4 sticky top-0 z-20 backdrop-blur-md bg-gray-800/90">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Box className="text-indigo-400" />
            Inventario
         </h2>
         <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-xs sm:text-sm border border-yellow-500"
         >
            <ShoppingBag size={16} />
            <span>Negozio</span>
         </button>
      </div>

      <section>
        <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
          <Activity size={16} /> Diagnostica Corporea
        </h3>
        {corpoItems.length > 0 ? (
            renderBodyVisual(corpoItems)
        ) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Sistemi organici standard. Nessun potenziamento rilevato.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
          <Shield size={16} /> Equipaggiamento Attivo
        </h3>
        {equipItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {equipItems.map(item => renderItemCard(item))}
            </div>
        ) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Mani vuote. Equipaggia qualcosa dallo zaino.
          </p>
        )}
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1">
          <Box size={16} /> Zaino
        </h3>
        {zainoItems.length > 0 ? (
            <div className="grid grid-cols-1 gap-2">
                {zainoItems.map(item => renderItemCard(item))}
            </div>
        ) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Zaino vuoto. Visita il negozio!
          </p>
        )}
      </section>

      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {showAssembly && assemblyHost && (
        <ItemAssemblyModal 
            hostItem={assemblyHost}
            inventory={items}
            onClose={() => {
                setShowAssembly(false);
                setAssemblyHost(null);
            }}
            onRefresh={handleAssemblyComplete}
        />
      )}
    </div>
  );
};

export default InventoryTab;