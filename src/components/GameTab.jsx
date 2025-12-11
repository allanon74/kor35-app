import React, { useState, useEffect, useCallback } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    Heart, Zap, Crosshair, Clock, Battery, RefreshCw, 
    Star, MessageSquare, Briefcase, Play, Backpack, Shield
} from 'lucide-react';

import { 
    useOptimisticStatChange, 
    useOptimisticUseItem, 
    useOptimisticRecharge 
} from '../hooks/useGameData';

const GameTab = ({ onNavigate }) => {
    // Usa unreadCount dal context per un conteggio fedele dei messaggi non letti locali
    const { selectedCharacterData: char, unreadCount } = useCharacter();
    const [favorites, setFavorites] = useState([]);
    const [timers, setTimers] = useState({});

    const statMutation = useOptimisticStatChange();
    const useItemMutation = useOptimisticUseItem();
    const rechargeMutation = useOptimisticRecharge();

    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('kor35_favorites') || '[]');
        setFavorites(savedFavs);
    }, []);

    // 2. Logica Appiattimento Oggetti (Recupera anche Mod installate)
    const getAllActiveItems = useCallback(() => {
        if (!char?.oggetti) return [];
        let list = [];
        
        char.oggetti.forEach(item => {
            const hasMechanics = (obj) => (obj.cariche_massime > 0 || obj.durata_totale > 0);
            let isContainerActive = false;
            if (item.tipo_oggetto === 'FIS' && item.is_equipaggiato) isContainerActive = true;
            if (item.tipo_oggetto === 'INN' && item.slot_corpo) isContainerActive = true;
            if (item.tipo_oggetto === 'MUT') isContainerActive = true;

            if (isContainerActive && hasMechanics(item)) {
                list.push(item);
            }
            if (isContainerActive && item.potenziamenti_installati) {
                item.potenziamenti_installati.forEach(mod => {
                    if (hasMechanics(mod)) {
                        list.push({ 
                            ...mod, 
                            is_mod: true, 
                            parent_name: item.nome,
                        });
                    }
                });
            }
        });
        return list;
    }, [char]);

    const activeItems = getAllActiveItems();

    // 3. Timer Locale (Countdown) - Logica Aggiornata per UI Istantanea
    const updateTimers = useCallback(() => {
        const now = Date.now();
        const newTimers = {};
        activeItems.forEach(item => {
            if (item.data_fine_attivazione) {
                const end = new Date(item.data_fine_attivazione).getTime();
                const diff = Math.max(0, Math.floor((end - now) / 1000));
                if (diff > 0) newTimers[item.id] = diff;
            }
        });
        setTimers(newTimers);
    }, [activeItems]);

    useEffect(() => {
        // Esegui subito all'avvio o quando i dati cambiano (es. Optimistic UI ha settato la data)
        updateTimers();
        
        const interval = setInterval(updateTimers, 1000);
        return () => clearInterval(interval);
    }, [updateTimers]); 

    // --- HANDLERS ---

    const handleStatChange = (sigla, mode) => {
        statMutation.mutate({ 
            charId: char.id, 
            stat_sigla: sigla, 
            mode 
        });
    };

    const handleUseItem = (item) => {
        if (item.cariche_attuali <= 0) return;
        
        useItemMutation.mutate({ 
            oggetto_id: item.id, 
            charId: char.id,
            durata_totale: item.durata_totale || 0,
            // Passiamo il flag se presente, altrimenti false
            is_aura_zero_off: item.spegni_a_zero_cariche || false 
        });
    };

    const handleRecharge = (item) => {
        const costo = item.costo_ricarica || 0;
        const msg = `Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${item.testo_ricarica || 'Standard'}`;
        if (window.confirm(msg)) {
            rechargeMutation.mutate({ 
                oggetto_id: item.id, 
                charId: char.id 
            });
        }
    };

    const toggleFavorite = (item) => {
        let newFavs;
        if (favorites.find(f => f.id === item.id)) {
            newFavs = favorites.filter(f => f.id !== item.id);
        } else {
            newFavs = [...favorites, { id: item.id, nome: item.nome, testo: item.TestoFormattato || item.testo_formattato_personaggio }];
        }
        setFavorites(newFavs);
        localStorage.setItem('kor35_favorites', JSON.stringify(newFavs));
    };

    if (!char) return <div className="p-8 text-center text-white">Caricamento...</div>;

    const weapons = char.oggetti.filter(i => i.is_equipaggiato && i.attacco_base);
    
    // --- LOGICA CAPACITA' (COG) ---
    const statCog = char.statistiche_primarie?.find(s => s.sigla === 'COG');
    const capacityMax = statCog ? statCog.valore_max : 10;
    
    // Filtra oggetti che consumano capacità: Fisici + Equipaggiati + (hanno mod installate)
    const capacityConsumers = char.oggetti.filter(i => 
        i.is_equipaggiato && 
        i.tipo_oggetto === 'FIS' && 
        i.potenziamenti_installati && 
        i.potenziamenti_installati.length > 0
    );
    const capacityUsed = capacityConsumers.length;
    const isOverloaded = capacityUsed > capacityMax;

    return (
        <div className="pb-24 px-2 space-y-4 animate-fadeIn text-gray-100 pt-2">
            
            {/* 1. STATISTICHE & CAPACITA' */}
            <section className="bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-lg">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold flex items-center gap-2">
                    <Heart size={12} /> Parametri Vitali
                </h3>
                
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {char.statistiche_primarie?.map(stat => (
                        stat.sigla !== 'COG' && (
                            <div key={stat.sigla} className="relative bg-gray-800 rounded-lg border border-gray-700 p-3 shadow-md flex flex-col justify-between h-32 overflow-hidden group">
                                {/* Intestazione */}
                                <div className="flex justify-between items-start z-10">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{stat.nome}</span>
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); handleStatChange(stat.sigla, 'reset'); }}
                                        className="text-gray-600 hover:text-emerald-400 transition-colors p-1 -mr-2 -mt-2"
                                        title="Ripristina al massimo"
                                    >
                                        <RefreshCw size={14} />
                                    </button>
                                </div>

                                {/* Valore Gigante Cliccabile */}
                                <div 
                                    className="flex-1 flex items-center justify-center cursor-pointer select-none active:scale-95 transition-transform z-10"
                                    onClick={() => handleStatChange(stat.sigla, 'consuma')}
                                >
                                    <span className={`text-5xl font-black tracking-tighter drop-shadow-lg ${stat.valore_corrente <= stat.valore_max / 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {stat.valore_corrente}
                                    </span>
                                </div>

                                {/* Valore Massimo (Angolo basso) */}
                                <div className="absolute bottom-2 right-3 text-right z-10">
                                    <span className="text-xs text-gray-500 font-bold block leading-none">MAX</span>
                                    <span className="text-lg font-bold text-gray-400 leading-none">{stat.valore_max}</span>
                                </div>

                                {/* Barra di sfondo opzionale per colpo d'occhio */}
                                <div 
                                    className="absolute bottom-0 left-0 h-1 bg-indigo-500/50 transition-all duration-500" 
                                    style={{ width: `${(stat.valore_corrente / stat.valore_max) * 100}%` }} 
                                />
                            </div>
                        )
                    ))}
                    
                    {/* BOX CAPACITÀ (Nuovo Design) */}
                    <div className={`relative bg-gray-800 rounded-lg border p-3 shadow-md flex flex-col h-32 overflow-hidden ${isOverloaded ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'}`}>
                        <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Capacità</span>
                             <span className={`text-xs font-bold ${isOverloaded ? 'text-red-400' : 'text-indigo-400'}`}>
                                {capacityUsed} / {capacityMax}
                             </span>
                        </div>
                        
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {capacityConsumers.length > 0 ? (
                                <div className="flex flex-col gap-1 mt-1">
                                    {capacityConsumers.map((item, idx) => (
                                        <div key={item.id} className="flex items-center gap-1.5 bg-gray-900/50 px-1.5 py-1 rounded border border-gray-700/50">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></div>
                                            <span className="text-[9px] text-gray-300 truncate w-full leading-tight font-mono">
                                                {item.nome}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                    <Backpack size={24} />
                                    <span className="text-[9px] mt-1">Buffer Vuoto</span>
                                </div>
                            )}
                        </div>

                        {/* Indicatore Sovraccarico */}
                        {isOverloaded && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 pointer-events-none">
                                <span className="text-red-500 font-black text-xl -rotate-12 border-2 border-red-500 px-2 py-1 rounded">OVERLOAD</span>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* 2. ATTACCHI BASE */}
            {weapons.length > 0 && (
                <section>
                    <h3 className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-bold flex items-center gap-2 ml-1">
                        <Crosshair size={12} /> Attacchi Base
                    </h3>
                    <div className="space-y-2">
                        {weapons.map(w => (
                            <div key={w.id} className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-red-100 text-sm">{w.nome}</div>
                                    <div className="text-[10px] text-red-300/70">{w.tipo_oggetto_display}</div>
                                </div>
                                <div className="bg-red-950/50 px-3 py-1 rounded border border-red-500/30">
                                    <span className="font-mono font-bold text-red-400 text-lg">
                                        {w.attacco_formattato || w.attacco_base} 
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. DISPOSITIVI & MODULI */}
            <section>
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2 ml-1">
                    <Zap size={12} /> Dispositivi & Moduli
                </h3>
                <div className="space-y-3">
                    {activeItems.map(item => {
                        const timeLeft = timers[item.id] || 0;
                        const isTimerRunning = timeLeft > 0;
                        const isChargeEmpty = item.cariche_massime > 0 && item.cariche_attuali <= 0;
                        const durationPct = item.durata_totale > 0 ? (timeLeft / item.durata_totale) * 100 : 0;
                        
                        return (
                            <div key={item.id} className={`p-3 rounded-lg border transition-all relative overflow-hidden ${isTimerRunning ? 'bg-emerald-900/20 border-emerald-500 shadow-lg shadow-emerald-900/20' : 'bg-gray-800 border-gray-700'}`}>
                                
                                {isTimerRunning && (
                                    <div 
                                        className="absolute bottom-0 left-0 h-1 bg-emerald-500 shadow-[0_0_10px_#10b981] transition-all duration-1000 ease-linear" 
                                        style={{width: `${durationPct}%`, zIndex: 1}} 
                                    />
                                )}

                                <div className="flex justify-between items-start mb-2 relative z-10">
                                    <div className="w-full">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm flex items-center gap-2 ${item.is_active ? 'text-emerald-200' : 'text-gray-400'}`}>
                                                    {item.nome}
                                                    <button onClick={() => toggleFavorite(item)} className="text-gray-600 hover:text-yellow-400"><Star size={14} fill={favorites.find(f => f.id === item.id) ? "currentColor" : "none"} /></button>
                                                </span>
                                                {item.is_mod && (
                                                    <span className="text-[9px] text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                                        <Shield size={8} /> Su: {item.parent_name}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {isTimerRunning && (
                                                <div className="flex items-center gap-2 bg-emerald-950/80 px-2 py-1 rounded border border-emerald-500/50 shadow-inner">
                                                    <Clock size={12} className="text-emerald-400 animate-spin" />
                                                    <span className="text-sm font-mono font-bold text-emerald-300 tracking-wider">
                                                        {new Date(timeLeft * 1000).toISOString().substr(14, 5)}
                                                    </span>
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-xs relative z-10">
                                            {item.cariche_massime > 0 && (
                                                <span className={`flex items-center gap-1 ${isChargeEmpty ? 'text-red-500 font-bold' : 'text-yellow-500'}`}>
                                                    <Battery size={10} /> {item.cariche_attuali} / {item.cariche_massime}
                                                </span>
                                            )}
                                            {item.durata_totale > 0 && !isTimerRunning && (
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <Clock size={10} /> {item.durata_totale}s
                                                </span>
                                            )}
                                            {isChargeEmpty && !isTimerRunning && (
                                                <span className="text-red-500 font-bold uppercase ml-auto text-[9px] border border-red-500 px-1 rounded bg-red-900/20">Scarico</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3 relative z-10">
                                    <button 
                                        onClick={() => handleUseItem(item)}
                                        disabled={isTimerRunning || isChargeEmpty}
                                        className={`flex-1 py-2 rounded text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95 ${
                                            isTimerRunning 
                                                ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-700 cursor-default'
                                                : isChargeEmpty
                                                    ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600'
                                                    : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-lg'
                                        }`}
                                    >
                                        {isTimerRunning ? 'ATTIVO...' : <><Play size={12} fill="currentColor" /> {item.durata_totale > 0 ? 'ATTIVA' : 'USA'}</>}
                                    </button>
                                    
                                    {item.cariche_massime > 0 && (
                                        <button 
                                            onClick={() => handleRecharge(item)}
                                            className="px-3 bg-gray-700 text-yellow-500 rounded border border-gray-600 flex items-center justify-center transition-colors hover:bg-gray-600 active:scale-95"
                                            title={`Ricarica (${item.costo_ricarica} CR)`}
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                    {activeItems.length === 0 && <p className="text-gray-600 text-xs italic text-center py-4">Nessun oggetto attivabile disponibile.</p>}
                </div>
            </section>

            {/* 4. NOTIFICHE */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => onNavigate('messaggi')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750 transition-colors">
                    <div className="flex gap-2 text-indigo-400 font-bold text-xs"><MessageSquare size={16} /> Messaggi</div>
                    {/* Usa unreadCount dal Context invece di char.messaggi_non_letti_count */}
                    {unreadCount > 0 ? <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
                <button onClick={() => onNavigate('transazioni')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750 transition-colors">
                    <div className="flex gap-2 text-amber-400 font-bold text-xs"><Briefcase size={16} /> Lavori</div>
                    {char.lavori_pendenti_count > 0 ? <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">{char.lavori_pendenti_count}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
            </div>

            {/* 5. PRONTUARIO */}
            {favorites.length > 0 && (
                <section className="mt-6 pt-4 border-t border-gray-800">
                    <h3 className="text-[10px] uppercase tracking-widest text-yellow-500 mb-3 font-bold flex items-center gap-2 ml-1"><Star size={12} /> Prontuario Rapido</h3>
                    <div className="space-y-3">
                        {favorites.map(fav => (
                            <div key={fav.id} className="bg-yellow-900/5 border border-yellow-700/20 p-3 rounded-lg relative group">
                                <div className="flex justify-between items-start mb-1">
                                    <span className="font-bold text-yellow-200/80 text-sm">{fav.nome}</span>
                                    <button onClick={() => toggleFavorite(fav)} className="text-yellow-800 hover:text-red-400"><Star size={12} fill="currentColor"/></button>
                                </div>
                                <div className="text-[11px] text-gray-400 leading-snug prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: fav.testo }} />
                            </div>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
};

export default GameTab;