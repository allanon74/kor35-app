import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api';
import { 
    Heart, Zap, Crosshair, Clock, Battery, RefreshCw, 
    Star, MessageSquare, Briefcase, Play, Backpack, Minus, Shield, Plus
} from 'lucide-react';

const GameTab = ({ onNavigate }) => {
    // USA refreshCharacterData PER AGGIORNARE I DETTAGLI (HP, OGGETTI, ECC.)
    const { selectedCharacterData: char, refreshCharacterData } = useCharacter();
    const [favorites, setFavorites] = useState([]);
    const [timers, setTimers] = useState({});

    // Carica preferiti
    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('kor35_favorites') || '[]');
        setFavorites(savedFavs);
    }, []);

    // Helper: Recupera tutti gli oggetti (anche Mod interne) che hanno meccaniche attive
    const getAllActiveItems = () => {
        if (!char?.oggetti) return [];
        let list = [];
        
        char.oggetti.forEach(item => {
            // Un oggetto ha meccaniche se ha cariche max > 0 o una durata
            const hasMechanics = (obj) => (obj.cariche_massime > 0 || obj.durata_totale > 0);
            
            // 1. Controlla l'oggetto padre (Container)
            let isContainerActive = false;
            // Fisico: deve essere equipaggiato
            if (item.tipo_oggetto === 'FIS' && item.is_equipaggiato) isContainerActive = true;
            // Innesto: deve essere montato (slot_corpo presente)
            if (item.tipo_oggetto === 'INN' && item.slot_corpo) isContainerActive = true;
            // Mutazione: sempre attiva
            if (item.tipo_oggetto === 'MUT') isContainerActive = true;

            // Se l'oggetto stesso è un device usabile
            if (isContainerActive && hasMechanics(item)) {
                list.push(item);
            }

            // 2. Controlla le Mod installate (Solo se il contenitore è attivo!)
            if (isContainerActive && item.potenziamenti_installati) {
                item.potenziamenti_installati.forEach(mod => {
                    if (hasMechanics(mod)) {
                        // Aggiungiamo metadati per la UI per far capire che è una Mod
                        list.push({ 
                            ...mod, 
                            is_mod: true, 
                            parent_name: item.nome,
                            // Le mod ereditano lo stato "attivo" dal padre + le loro condizioni (cariche)
                            // Il backend invia già is_active calcolato correttamente
                        });
                    }
                });
            }
        });
        return list;
    };

    const activeItems = getAllActiveItems();

    // Timer System Locale
    useEffect(() => {
        const interval = setInterval(() => {
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
        }, 1000);
        return () => clearInterval(interval);
    }, [char, activeItems]); 

    // --- AZIONI ---

    const handleStatChange = async (sigla, mode) => {
        try {
            await fetchAuthenticated('/personaggi/api/game/modifica_stat_temp/', {
                method: 'POST',
                body: JSON.stringify({ char_id: char.id, stat_sigla: sigla, mode: mode })
            });
            // IMPORTANTE: Aggiorna i dati locali
            await refreshCharacterData(); 
        } catch (error) {
            console.error("Errore modifica stat:", error);
        }
    };

    const handleUseItem = async (item) => {
        if (item.cariche_attuali <= 0) return;
        try {
            await fetchAuthenticated('/personaggi/api/game/usa_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id: item.id, char_id: char.id })
            });
            await refreshCharacterData();
        } catch (error) { alert("Errore: " + error.message); }
    };

    const handleRecharge = async (item) => {
        const costo = item.costo_ricarica || 0;
        const msg = `Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${item.testo_ricarica || 'Standard'}`;
        
        if (window.confirm(msg)) {
            try {
                await fetchAuthenticated('/personaggi/api/game/ricarica_oggetto/', {
                    method: 'POST',
                    body: JSON.stringify({ oggetto_id: item.id, char_id: char.id })
                });
                await refreshCharacterData();
            } catch (error) { alert("Errore ricarica: " + error.message); }
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

    // Filtri
    const weapons = char.oggetti.filter(i => i.is_equipaggiato && i.attacco_base);
    const statCog = char.statistiche_primarie?.find(s => s.sigla === 'COG');
    const capacityMax = statCog ? statCog.valore_max : 10;
    const capacityUsed = char.oggetti.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS').length;

    return (
        <div className="pb-24 px-2 space-y-4 animate-fadeIn text-gray-100 pt-2">
            
            {/* 1. STATISTICHE (BOX QUADRATI) */}
            <section className="bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-lg">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold flex items-center gap-2">
                    <Heart size={12} /> Parametri Vitali
                </h3>
                
                <div className="grid grid-cols-3 gap-2">
                    {char.statistiche_primarie?.map(stat => (
                        stat.sigla !== 'COG' && (
                            <div key={stat.sigla} className="aspect-square bg-gray-800 rounded-lg border border-gray-700/50 flex flex-col justify-between p-2 shadow-md relative overflow-hidden">
                                <div className="text-center">
                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">{stat.nome}</span>
                                </div>
                                <div className="flex flex-col items-center justify-center -mt-1">
                                    <span className={`text-2xl sm:text-3xl font-black ${stat.valore_corrente < stat.valore_max / 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
                                        {stat.valore_corrente}
                                    </span>
                                    <span className="text-[9px] text-gray-500 font-mono">
                                        / {stat.valore_max}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-1 mt-1 w-full">
                                    <button 
                                        onClick={() => handleStatChange(stat.sigla, 'consuma')}
                                        className="h-7 sm:h-8 rounded bg-red-900/30 hover:bg-red-900/60 text-red-200 border border-red-900/30 flex items-center justify-center active:scale-95 transition-all"
                                    >
                                        <Minus size={12} strokeWidth={3} />
                                    </button>
                                    <button 
                                        onClick={() => handleStatChange(stat.sigla, 'reset')}
                                        className="h-7 sm:h-8 rounded bg-emerald-900/30 hover:bg-emerald-900/60 text-emerald-200 border border-emerald-900/30 flex items-center justify-center active:scale-95 transition-all"
                                    >
                                        <RefreshCw size={12} />
                                    </button>
                                </div>
                            </div>
                        )
                    ))}
                    
                    {/* BOX CAPACITÀ */}
                    <div className="aspect-square bg-gray-800 rounded-lg border border-gray-700/50 flex flex-col justify-between p-2 shadow-md">
                        <div className="text-center">
                             <span className="text-[10px] font-bold text-gray-400 uppercase">Capacità</span>
                        </div>
                        <div className="flex flex-col items-center justify-center">
                            <Backpack size={20} className={capacityUsed > capacityMax ? "text-red-500" : "text-indigo-400"} />
                            <span className="text-lg font-bold mt-1 text-white">{capacityMax - capacityUsed}</span>
                            <span className="text-[8px] text-gray-500 uppercase">Liberi</span>
                        </div>
                         <div className="w-full bg-gray-700 h-1.5 rounded-full overflow-hidden">
                            <div className={`h-full ${capacityUsed > capacityMax ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((capacityUsed / capacityMax) * 100, 100)}%` }} />
                        </div>
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
                                        {/* Il backend ora fornisce attacco_formattato */}
                                        {w.attacco_formattato || w.attacco_base} 
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* 3. DISPOSITIVI & CARICHE */}
            <section>
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2 ml-1">
                    <Zap size={12} /> Dispositivi & Moduli
                </h3>
                <div className="space-y-3">
                    {activeItems.map(item => {
                        const timeLeft = timers[item.id] || 0;
                        const isTimerRunning = timeLeft > 0;
                        // Un oggetto è "scarico" se ha cariche max (quindi è consumabile) e ne ha 0
                        const isChargeEmpty = item.cariche_massime > 0 && item.cariche_attuali <= 0;
                        
                        return (
                            <div key={item.id} className={`p-3 rounded-lg border transition-all ${item.is_active ? 'bg-emerald-900/10 border-emerald-500/50' : 'bg-gray-800 border-gray-700 opacity-90'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-full">
                                        <div className="flex justify-between w-full items-center">
                                            <div className="flex flex-col">
                                                <span className={`font-bold text-sm flex items-center gap-2 ${item.is_active ? 'text-emerald-200' : 'text-gray-400'}`}>
                                                    {item.nome}
                                                    <button onClick={() => toggleFavorite(item)} className="text-gray-600 hover:text-yellow-400"><Star size={14} fill={favorites.find(f => f.id === item.id) ? "currentColor" : "none"} /></button>
                                                </span>
                                                {item.is_mod && (
                                                    <span className="text-[9px] text-indigo-300 uppercase tracking-wider flex items-center gap-1">
                                                        <Shield size={8} /> Mod su: {item.parent_name}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            {/* Timer Attivo */}
                                            {isTimerRunning && (
                                                <div className="text-lg font-mono font-bold text-emerald-400 animate-pulse bg-emerald-900/40 px-2 rounded border border-emerald-500/30">
                                                    {new Date(timeLeft * 1000).toISOString().substr(14, 5)}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 mt-2 text-xs">
                                            {item.cariche_massime > 0 && (
                                                <span className={`flex items-center gap-1 ${isChargeEmpty ? 'text-red-500 font-bold' : 'text-yellow-500'}`}>
                                                    <Battery size={10} /> {item.cariche_attuali} / {item.cariche_massime}
                                                </span>
                                            )}
                                            {item.durata_totale > 0 && (
                                                <span className="flex items-center gap-1 text-blue-400">
                                                    <Clock size={10} /> {item.durata_totale}s
                                                </span>
                                            )}
                                            
                                            {!item.is_active && (
                                                 <span className="text-[9px] text-red-400 border border-red-900/50 px-1 rounded bg-red-900/10 ml-auto">
                                                    {isChargeEmpty ? 'SCARICO' : 'DISATTIVATO'}
                                                 </span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
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
                                        {isTimerRunning ? 'IN FUNZIONE...' : <><Play size={12} fill="currentColor" /> {item.durata_totale > 0 ? 'ATTIVA' : 'USA'}</>}
                                    </button>
                                    
                                    {/* Mostra Ricarica se ha cariche max > 0 */}
                                    {item.cariche_massime > 0 && (
                                        <button 
                                            onClick={() => handleRecharge(item)}
                                            className="px-3 bg-gray-700 hover:bg-gray-600 text-yellow-500 rounded border border-gray-600 flex items-center justify-center transition-colors"
                                            title={`Ricarica (${item.costo_ricarica} CR)`}
                                        >
                                            <RefreshCw size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </section>

            {/* 4. NOTIFICHE */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => onNavigate('messaggi')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750">
                    <div className="flex gap-2 text-indigo-400 font-bold text-xs"><MessageSquare size={16} /> Messaggi</div>
                    {char.messaggi_non_letti_count > 0 ? <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{char.messaggi_non_letti_count}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
                <button onClick={() => onNavigate('transazioni')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750">
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