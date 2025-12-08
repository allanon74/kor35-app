import React, { useState, useEffect } from 'react';
import { equipaggiaOggetto } from '../api'; 
import { useCharacter } from './CharacterContext';
import { ShoppingBag, Box, Shield, Zap, Loader2, Wrench, Info, ChevronDown, ChevronUp, User, Activity } from 'lucide-react';
import ShopModal from './ShopModal';
import ItemAssemblyModal from './ItemAssemblyModal';

const InventoryTab = ({ onLogout }) => {
  const { selectedCharacterData: characterData, isLoading: isContextLoading } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // Stati per modale assemblaggio
  const [showAssembly, setShowAssembly] = useState(false);
  const [assemblyHost, setAssemblyHost] = useState(null);

  // --- AGGIUNTA: Stato per gestire l'espansione delle card (descrizioni) ---
  const [expandedItems, setExpandedItems] = useState({});

  useEffect(() => {
    if (characterData?.oggetti) {
      setItems(characterData.oggetti);
    } else {
      setItems([]);
    }
  }, [characterData]);

  const handleToggleEquip = async (itemId) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await equipaggiaOggetto(itemId, characterData.id, onLogout);
      window.location.reload(); 
    } catch (error) {
      console.error("Errore equipaggiamento:", error);
      alert(error.message || "Errore durante l'azione");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenAssembly = (item) => {
    setAssemblyHost(item);
    setShowAssembly(true);
  };

  const handleAssemblyComplete = () => {
    window.location.reload();
  };

  // --- AGGIUNTA: Funzione per espandere/comprimere i dettagli ---
  const toggleExpand = (itemId) => {
    setExpandedItems(prev => ({
      ...prev,
      [itemId]: !prev[itemId]
    }));
  };

  // --- AGGIUNTA: Configurazione dei Slot Corporei per la griglia visiva ---
  // Mappa i codici del backend (models.py) a etichette e posizioni griglia
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

  // --- Render Card Oggetto Generico ---
  const renderItemCard = (item, isCompact = false) => {
    const isPhysical = item.tipo_oggetto === 'FIS';
    const isEquipped = item.is_equipaggiato;
    const canBeModified = (isPhysical || ['INN', 'MUT'].includes(item.tipo_oggetto)) && (item.classe_oggetto_nome || item.tipo_oggetto === 'INN');
    const isExpanded = !!expandedItems[item.id];

    return (
      <div 
        key={item.id} 
        className={`relative p-3 mb-2 rounded-lg border flex flex-col transition-all ${
          isEquipped 
            ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }`}
      >
        <div className="flex flex-col sm:flex-row gap-3 items-start justify-between">
            <div className="grow w-full">
            {/* Intestazione Card */}
            <div className="flex items-center justify-between mb-1 cursor-pointer" onClick={() => toggleExpand(item.id)}>
                <div className="flex items-center gap-2">
                    <h4 className={`font-bold text-base ${isEquipped ? 'text-emerald-300' : 'text-gray-200'}`}>
                    {item.nome}
                    </h4>
                    {isEquipped && (
                        <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                            <Shield size={10} /> Equip
                        </span>
                    )}
                </div>
                {/* Icona Espansione */}
                <button className="text-gray-400 hover:text-white p-1">
                    {isExpanded ? <ChevronUp size={18} /> : <Info size={18} />}
                </button>
            </div>
            
            {/* Badge Tipo e Classe (Sempre visibili) */}
            <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-1">
                <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                {item.tipo_oggetto_display}
                </span>
                {item.classe_oggetto_nome && (
                    <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                    {item.classe_oggetto_nome}
                    </span>
                )}
                {/* Badge riassuntivo mod se compresso */}
                {!isExpanded && item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                    <span className="flex items-center gap-1 text-indigo-400">
                        <Zap size={10} /> {item.potenziamenti_installati.length} Mod
                    </span>
                )}
            </div>

            {/* --- CONTENUTO ESPANDIBILE --- */}
            {isExpanded && (
                <div className="mt-3 animate-fadeIn">
                    {/* Descrizione Principale */}
                    <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-snug p-2 bg-gray-900/50 rounded border border-gray-700/50">
                        <h5 className="text-[10px] uppercase font-bold text-gray-500 mb-1">Descrizione</h5>
                        {item.testo_formattato_personaggio ? (
                            <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio }} />
                        ) : (
                            <p>{item.testo || item.descrizione || "Nessuna descrizione disponibile."}</p>
                        )}
                    </div>

                    {/* Sezione Potenziamenti Dettagliata */}
                    {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
                        <div className="mt-3 pl-2 border-l-2 border-indigo-500/30">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-2 flex items-center gap-1">
                                <Zap size={12} /> Modifiche Installate:
                            </p>
                            <div className="space-y-2">
                                {item.potenziamenti_installati.map(mod => (
                                <div key={mod.id} className="bg-indigo-900/20 p-2 rounded border border-indigo-500/20 text-xs">
                                    <div className="font-bold text-indigo-200 flex justify-between">
                                        <span>{mod.nome}</span>
                                        <span className="text-gray-500 opacity-70">[{mod.tipo_oggetto_display}]</span>
                                    </div>
                                    {mod.cariche_attuali > 0 && (
                                        <div className="text-[10px] text-yellow-500 mt-0.5">Cariche: {mod.cariche_attuali}</div>
                                    )}
                                </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
            </div>

            {/* Pulsanti Azione */}
            <div className="shrink-0 flex flex-row sm:flex-col gap-2 w-full sm:w-auto mt-2 sm:mt-0">
            {canBeModified && (
                <button
                    onClick={(e) => { e.stopPropagation(); handleOpenAssembly(item); }}
                    className="flex-1 sm:flex-none px-3 py-2 rounded text-xs font-bold shadow-sm transition-all active:scale-95 bg-gray-700 hover:bg-gray-600 text-amber-400 border border-gray-600 flex items-center justify-center gap-2"
                    title="Modifica / Assembla"
                >
                    <Wrench size={14} /> <span className="sm:hidden lg:inline">Modifica</span>
                </button>
            )}

            {isPhysical && (
                <button 
                onClick={(e) => { e.stopPropagation(); handleToggleEquip(item.id); }}
                disabled={isLoading}
                className={`flex-1 sm:flex-none px-3 py-2 rounded text-xs font-bold shadow-sm transition-all active:scale-95 ${
                    isEquipped
                    ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700'
                    : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600'
                }`}
                >
                {isEquipped ? 'Rimuovi' : 'Equipaggia'}
                </button>
            )}
            </div>
        </div>
      </div>
    );
  };

  // --- Funzione Render Body Slots ---
  const renderBodyVisual = (corpoItems) => {
    // Organizza gli oggetti per slot
    const slots = {
        'HD1': [], 'HD2': [],
        'TR1': [], 'TR2': [],
        'LA': [], 'RA': [],
        'LL': [], 'RL': [],
        'GENERIC': [] // Per oggetti corpo senza slot definito
    };

    corpoItems.forEach(item => {
        if (item.slot_corpo && slots[item.slot_corpo]) {
            slots[item.slot_corpo].push(item);
        } else {
            slots['GENERIC'].push(item);
        }
    });

    // Helper per renderizzare un singolo slot nella griglia
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
                            <div key={item.id} className="bg-gray-900 border border-gray-600 rounded px-2 py-1 cursor-pointer hover:bg-gray-700 transition-colors" onClick={() => toggleExpand(item.id)}>
                                <div className="flex justify-between items-center">
                                    <span className={`text-xs font-bold truncate ${item.tipo_oggetto === 'INN' ? 'text-cyan-300' : 'text-purple-300'}`}>
                                        {item.nome}
                                    </span>
                                    <Info size={10} className="text-gray-500" />
                                </div>
                                {/* Se espanso, mostra un mini dettaglio anche qui */}
                                {expandedItems[item.id] && (
                                    <div className="mt-1 text-[10px] text-gray-400 leading-tight">
                                        {item.potenziamenti_installati?.length > 0 && <div>Mods: {item.potenziamenti_installati.length}</div>}
                                        <div className="mt-1 pt-1 border-t border-gray-700" dangerouslySetInnerHTML={{__html: item.TestoFormattato?.substring(0, 50) + "..."}} />
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); handleOpenAssembly(item); }}
                                            className="mt-1 w-full text-center bg-gray-700 text-amber-500 text-[9px] py-0.5 rounded"
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
            {/* Sfondo decorativo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-5 pointer-events-none">
                <User size={300} />
            </div>

            {/* Griglia Body */}
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
                {renderSlotArea('HD1')}
                {renderSlotArea('HD2')}
                
                {renderSlotArea('LA')}
                {renderSlotArea('TR1')}
                {renderSlotArea('TR2')}
                {renderSlotArea('RA')}
                
                {renderSlotArea('LL')}
                {renderSlotArea('RL')}
            </div>

            {/* Oggetti Generici (senza slot) */}
            {slots['GENERIC'].length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-700">
                    <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Altri Potenziamenti (Sistemici)</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {slots['GENERIC'].map(item => renderItemCard(item))}
                    </div>
                </div>
            )}
        </div>
    );
  };

  // --- Render Principale ---
  
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
      
      {/* HEADER */}
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

      {/* SEZIONE 1: Body Slots (Innesti & Mutazioni) */}
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

      {/* SEZIONE 2: Equipaggiamento Attivo */}
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

      {/* SEZIONE 3: Zaino */}
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

      {/* Modale Shop */}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* Modale Assemblaggio */}
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