import React, { useState, useEffect } from 'react';
import { equipaggiaOggetto, ricaricaOggetto } from '../api'; 
import { useCharacter } from './CharacterContext';
import { 
    ShoppingBag, Box, Shield, Zap, Loader2, Wrench, 
    Info, ChevronUp, User, Activity, Power, Battery, 
    Clock, RefreshCw 
} from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';

const InventoryTab = ({ onLogout }) => {
  const { selectedCharacterData: characterData, isLoading: isContextLoading, fetchPersonaggi } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Stati per modale assemblaggio
  const [showAssembly, setShowAssembly] = useState(false);
  const [assemblyHost, setAssemblyHost] = useState(null);

  // Stato per gestire l'espansione delle card
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    if (characterData?.oggetti) {
      setItems(characterData.oggetti);
    } else {
      setItems([]);
    }
  }, [characterData]);

  // --- GESTIONE AZIONI ---

  const handleToggleEquip = async (itemId) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await equipaggiaOggetto(itemId, characterData.id, onLogout);
      // Ricarichiamo i dati per aggiornare lo stato
      fetchPersonaggi();
    } catch (error) {
      console.error("Errore equipaggiamento:", error);
      alert(error.message || "Errore durante l'azione");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecharge = async (item) => {
      const costo = item.costo_ricarica || 0;
      const metodo = item.testo_ricarica || "Standard";
      
      const confirmMsg = `Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${metodo}`;
      
      if (window.confirm(confirmMsg)) {
          setIsLoading(true);
          try {
              await ricaricaOggetto(item.id);
              fetchPersonaggi(); // Aggiorna per vedere le nuove cariche
          } catch (error) {
              alert("Errore ricarica: " + error.message);
          } finally {
              setIsLoading(false);
          }
      }
  };

  const handleOpenAssembly = (item) => {
    setAssemblyHost(item);
    setShowAssembly(true);
  };

  const handleAssemblyComplete = () => {
    fetchPersonaggi();
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
        // Equipaggiato ma spento (es. scarico o timer finito)
        return 'border-2 border-yellow-600/60 bg-yellow-900/10'; 
    }
    return 'border border-gray-700 bg-gray-800 hover:border-gray-600'; // Zaino
  };

  // Configurazione slot per la griglia visiva (Body)
  const slotsConfig = {
    'HD1': { label: 'Testa (Pri)', gridArea: 'head1', color: 'border-cyan-500/50' },
    'HD2': { label: 'Testa (Sec)', gridArea: 'head2', color: 'border-cyan-500/30' },
    'TR1': { label: 'Tronco (Pri)', gridArea: 'chest1', color: 'border-orange-500/50' },
    'TR2': { label: 'Tronco (Sec)', gridArea: 'chest2', color: 'border-orange-500/30' },
    'LA':  { label: 'Braccio Sx', gridArea: 'larm',   color: 'border-indigo-500/50' },
    'RA':  { label: 'Braccio Dx', gridArea: 'rarm',   color: 'border-indigo-500/50' },
    'LL':  { label: 'Gamba Sx',   gridArea: 'lleg',   color: 'border-emerald-500/50' },
    'RL':  { label: 'Gamba Dx',   gridArea: 'rleg',   color: 'border-emerald-500/50' },
  };

  // --- RENDER COMPONENTI ---

  const renderItemCard = (item) => {
    const isPhysical = item.tipo_oggetto === 'FIS';
    const canBeModified = (isPhysical || ['INN', 'MUT'].includes(item.tipo_oggetto)) && (item.classe_oggetto_nome || item.tipo_oggetto === 'INN');
    const isExpanded = !!expandedItems[item.id];
    const isActive = item.is_active;

    // Helper per renderizzare info cariche e pulsante ricarica
    const renderChargeInfo = () => {
        // Mostra solo se l'oggetto ha una capacità massima definita (quindi è ricaricabile/consumabile)
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
                    {/* Pulsante Ricarica */}
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
            
            {/* INTESTAZIONE CARD */}
            <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => toggleExpand(item.id)}>
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
                <button className="text-gray-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp size={18} /> : <Info size={18} />}
                </button>
            </div>
            
            {/* BADGE TIPO E MOD */}
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

            {/* --- CONTENUTO ESPANDIBILE --- */}
            {isExpanded && (
                <div className="mt-3 animate-fadeIn space-y-3">
                    
                    {/* Descrizione Principale HTML */}
                    <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-snug p-2 bg-black/20 rounded border border-gray-700/30">
                        <h5 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Specifiche Tecniche</h5>
                        {item.testo_formattato_personaggio ? (
                            <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio }} />
                        ) : (
                            // Fallback con interpretazione HTML anche per testo semplice se contiene tag
                            <div dangerouslySetInnerHTML={{ __html: item.testo || item.descrizione || "Nessun dato disponibile." }} />
                        )}
                        
                        {/* Timer Scadenza */}
                        {item.data_fine_attivazione && (
                            <div className="mt-2 pt-2 border-t border-gray-700 text-xs text-orange-400 font-mono">
                                <span>Scadenza: </span>
                                {new Date(item.data_fine_attivazione).toLocaleString()}
                            </div>
                        )}
                    </div>

                    {/* BOX CARICHE E RICARICA */}
                    {renderChargeInfo()}

                    {/* Lista Moduli Installati */}
                    {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                        <div className="pl-2 border-l-2 border-indigo-500/30">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                                <Zap size={12} /> Moduli Installati:
                            </p>
                            <div className="space-y-2">
                                {item.potenziamenti_installati.map(mod => {
                                    const isModActive = mod.is_active !== undefined ? mod.is_active : true;
                                    
                                    return (
                                        <div key={mod.id} className={`p-2 rounded border text-xs ${isModActive ? 'bg-indigo-900/20 border-indigo-500/20' : 'bg-red-900/10 border-red-900/30 opacity-70'}`}>
                                            <div className="font-bold text-indigo-200 flex justify-between items-center mb-1">
                                                <span>{mod.nome}</span>
                                                <span className="text-[9px] text-gray-500 uppercase tracking-wide">[{mod.tipo_oggetto_display}]</span>
                                            </div>
                                            
                                            {/* Descrizione Mod HTML */}
                                            {mod.descrizione && (
                                                <div 
                                                    className="text-gray-400 italic mb-1 leading-tight"
                                                    dangerouslySetInnerHTML={{ __html: mod.descrizione }}
                                                />
                                            )}

                                            {/* Cariche Mod */}
                                            {mod.cariche_attuali !== undefined && (
                                                <div className={`text-[10px] ${mod.cariche_attuali > 0 ? 'text-yellow-500' : 'text-red-500 font-bold'}`}>
                                                    Stato Carica: {mod.cariche_attuali}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>

            {/* --- PULSANTI AZIONE --- */}
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
                        disabled={isLoading}
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

  // --- RENDER VISUALE CORPO ---
  const renderBodyVisual = (corpoItems) => {
    const slots = {
        'HD1': [], 'HD2': [], 'TR1': [], 'TR2': [],
        'LA': [], 'RA': [], 'LL': [], 'RL': [], 'GENERIC': []
    };

    corpoItems.forEach(item => {
        if (item.slot_corpo && slots[item.slot_corpo]) {
            slots[item.slot_corpo].push(item);
        } else {
            slots['GENERIC'].push(item);
        }
    });

    const renderSlotArea = (code) => {
        const config = slotsConfig[code];
        const itemsInSlot = slots[code];
        const isEmpty = itemsInSlot.length === 0;

        return (
            <div 
                className={`p-2 rounded bg-gray-800/80 border ${isEmpty ? 'border-gray-700 border-dashed' : config.color} min-h-20 flex flex-col`}
                style={{ gridArea: config.gridArea }}
            >
                <div className="text-[10px] uppercase tracking-widest text-gray-500 mb-1 text-center">{config.label}</div>
                {isEmpty ? (
                    <div className="flex-1 flex items-center justify-center text-gray-700 text-xs italic">Vuoto</div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {itemsInSlot.map(item => (
                            <div 
                                key={item.id} 
                                className={`rounded px-2 py-1 cursor-pointer transition-colors border ${item.is_active ? 'bg-cyan-900/30 border-cyan-500/50' : 'bg-red-900/20 border-red-800/30 opacity-70'}`}
                                onClick={() => toggleExpand(item.id)}
                            >
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold truncate ${item.is_active ? 'text-cyan-300' : 'text-red-300 line-through'}`}>
                                        {item.nome}
                                    </span>
                                    <Info size={10} className="text-gray-500" />
                                </div>
                                {expandedItems[item.id] && (
                                    <div className="mt-1 text-[10px] text-gray-400 leading-tight animate-fadeIn">
                                        {item.potenziamenti_installati?.length > 0 && <div>Mods: {item.potenziamenti_installati.length}</div>}
                                        <div 
                                            className="mt-1 pt-1 border-t border-gray-700/50 italic"
                                            dangerouslySetInnerHTML={{ __html: item.descrizione ? item.descrizione.substring(0, 50) + "..." : "..." }}
                                        />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenAssembly(item); }}
                                            className="mt-2 w-full text-center bg-gray-700 hover:bg-gray-600 text-amber-500 text-[9px] py-1 rounded"
                                        >
                                            GESTISCI
                                        </button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="bg-gray-900/50 p-4 rounded-xl border border-gray-700 mb-6 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <User size={300} />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 relative z-10 max-w-3xl mx-auto"
                style={{
                    display: 'grid',
                    gridTemplateAreas: `
                        "head1 head1 head2 head2"
                        "larm chest1 chest2 rarm"
                        "lleg chest1 chest2 rleg"
                    `,
                }}
            >
                {renderSlotArea('HD1')} {renderSlotArea('HD2')}
                {renderSlotArea('LA')} {renderSlotArea('TR1')} {renderSlotArea('TR2')} {renderSlotArea('RA')}
                {renderSlotArea('LL')} {renderSlotArea('RL')}
            </div>
            {slots['GENERIC'].length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Altri Potenziamenti</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {slots['GENERIC'].map(item => renderItemCard(item))}
                    </div>
                </div>
            )}
        </div>
    );
  };

  if (isContextLoading) return <div className="p-8 text-center text-gray-500 flex justify-center"><Loader2 className="animate-spin" /></div>;
  if (!characterData) return <div className="p-4 text-center text-red-400">Nessun personaggio selezionato.</div>;

  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  return (
    <div className="pb-24 px-1 space-y-6 animate-fadeIn">
      <div className="flex justify-between items-center p-3 rounded-lg border border-gray-700 shadow-sm mb-4 sticky top-0 z-20 backdrop-blur-md bg-gray-800/90">
         <h2 className="text-xl font-bold text-white flex items-center gap-2"><Box className="text-indigo-400" /> Inventario</h2>
         <button onClick={() => setShowShop(true)} className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-3 py-1.5 rounded-lg font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-xs sm:text-sm border border-yellow-500">
            <ShoppingBag size={16} /> <span>Negozio</span>
         </button>
      </div>

      <section>
        <h3 className="text-sm font-bold text-indigo-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Activity size={16} /> Diagnostica Corporea</h3>
        {corpoItems.length > 0 ? renderBodyVisual(corpoItems) : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Nessun potenziamento.</p>}
      </section>

      <section>
        <h3 className="text-sm font-bold text-emerald-300 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Shield size={16} /> Equipaggiamento Attivo</h3>
        {equipItems.length > 0 ? <div className="grid grid-cols-1 gap-2">{equipItems.map(item => renderItemCard(item))}</div> : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Mani vuote.</p>}
      </section>

      <section>
        <h3 className="text-sm font-bold text-gray-400 mb-3 flex items-center gap-2 uppercase tracking-wider pl-1"><Box size={16} /> Zaino</h3>
        {zainoItems.length > 0 ? <div className="grid grid-cols-1 gap-2">{zainoItems.map(item => renderItemCard(item))}</div> : <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">Zaino vuoto.</p>}
      </section>

      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
      
      {showAssembly && assemblyHost && (
        <ItemAssemblyModal 
            hostItem={assemblyHost}
            inventory={items}
            onClose={() => { setShowAssembly(false); setAssemblyHost(null); }}
            onRefresh={handleAssemblyComplete}
        />
      )}
    </div>
  );
};

export default InventoryTab;