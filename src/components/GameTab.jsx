import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { fetchAuthenticated } from '../api';
import { 
    Heart, Zap, Crosshair, Clock, Battery, RefreshCw, 
    Star, MessageSquare, Briefcase, Play, AlertCircle, Shield, Backpack
} from 'lucide-react';

const GameTab = ({ onNavigate }) => {
    const { selectedCharacterData: char, fetchPersonaggi } = useCharacter();
    const [favorites, setFavorites] = useState([]);
    const [timers, setTimers] = useState({});

    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('kor35_favorites') || '[]');
        setFavorites(savedFavs);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            if (!char?.oggetti) return;
            const now = Date.now();
            const newTimers = {};
            char.oggetti.forEach(item => {
                if (item.data_fine_attivazione) {
                    const end = new Date(item.data_fine_attivazione).getTime();
                    const diff = Math.max(0, Math.floor((end - now) / 1000));
                    if (diff > 0) newTimers[item.id] = diff;
                }
            });
            setTimers(newTimers);
        }, 1000);
        return () => clearInterval(interval);
    }, [char]);

    const handleStatChange = async (sigla, mode) => {
        try {
            await fetchAuthenticated('/personaggi/api/game/modifica_stat_temp/', {
                method: 'POST',
                body: JSON.stringify({ char_id: char.id, stat_sigla: sigla, mode: mode })
            });
            fetchPersonaggi();
        } catch (error) { console.error("Errore stat:", error); }
    };

    const handleUseItem = async (item) => {
        if (item.cariche_attuali <= 0) return;
        try {
            await fetchAuthenticated('/personaggi/api/game/usa_oggetto/', {
                method: 'POST',
                body: JSON.stringify({ oggetto_id: item.id, char_id: char.id })
            });
            fetchPersonaggi();
        } catch (error) { alert(error.message); }
    };

    const handleRecharge = async (item) => {
        const msg = `Ricaricare ${item.nome}?\nCosto: ${item.costo_ricarica || 0} CR\nMetodo: ${item.testo_ricarica || 'Standard'}`;
        if (window.confirm(msg)) {
            try {
                await fetchAuthenticated('/personaggi/api/game/ricarica_oggetto/', {
                    method: 'POST',
                    body: JSON.stringify({ oggetto_id: item.id, char_id: char.id })
                });
                fetchPersonaggi();
            } catch (error) { alert(error.message); }
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

    // --- FILTRI ---
    // 1. Armi (Equipaggiate + Attacco base presente)
    const weapons = char.oggetti.filter(i => i.is_equipaggiato && i.attacco_base);

    // 2. Oggetti Attivabili (Cariche, Durata, o Mod installate su equipaggiamento)
    const activeItems = char.oggetti.filter(item => {
        // Ha una meccanica di attivazione?
        const hasMechanic = (item.cariche_massime > 0 || item.durata_totale > 0);
        
        // È accessibile?
        // - Fisico: deve essere equipaggiato
        if (item.tipo_oggetto === 'FIS' && !item.is_equipaggiato) return false;
        // - Innesto: deve avere uno slot corpo
        if (item.tipo_oggetto === 'INN' && !item.slot_corpo) return false;
        // - Mod/Materia: deve essere montata su qualcosa che è EQUIPAGGIATO
        if (['MOD', 'MAT'].includes(item.tipo_oggetto)) {
             // Il backend manda la lista piatta, ma per le mod dobbiamo vedere se sono installate
             // Normalmente le mod non appaiono nella lista root "oggetti" del PG se sono dentro un altro oggetto nel JSON annidato
             // Se il tuo JSON le appiattisce, controlla "is_active" dal backend.
             // Se usiamo 'is_active' dal backend, è più sicuro:
             return hasMechanic; 
        }

        return hasMechanic;
    });

    const statCog = char.statistiche_primarie?.find(s => s.sigla === 'COG');
    const capacityMax = statCog ? statCog.valore_max : 10;
    const capacityUsed = char.oggetti.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS').length;

    return (
        <div className="pb-24 px-3 space-y-5 animate-fadeIn text-gray-100 pt-2">
            
            {/* STATISTICHE */}
            <section className="bg-gray-900 rounded-xl p-3 border border-gray-700 shadow-lg">
                <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-2 font-bold flex items-center gap-2"><Heart size={12} /> Parametri Vitali</h3>
                <div className="space-y-3">
                    {char.statistiche_primarie?.map(stat => (
                        stat.sigla !== 'COG' && (
                            <div key={stat.sigla} className="flex items-center justify-between bg-gray-800 p-2 rounded-lg border border-gray-700/50">
                                <div>
                                    <span className="text-xs font-bold text-gray-400">{stat.nome}</span>
                                    <div className="flex items-baseline gap-1">
                                        <span className={`text-2xl font-black ${stat.valore_corrente < stat.valore_max / 3 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{stat.valore_corrente}</span>
                                        <span className="text-xs text-gray-600">/ {stat.valore_max}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleStatChange(stat.sigla, 'consuma')} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-red-900/40 text-red-200 border border-gray-600 flex items-center justify-center active:scale-90 shadow-md font-bold">-1</button>
                                    <button onClick={() => handleStatChange(stat.sigla, 'reset')} className="w-10 h-10 rounded-full bg-gray-700 hover:bg-emerald-900/40 text-emerald-200 border border-gray-600 flex items-center justify-center active:scale-90 shadow-md"><RefreshCw size={16} /></button>
                                </div>
                            </div>
                        )
                    ))}
                    <div className="bg-gray-800 p-2 rounded-lg border border-gray-700/50 mt-2">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><Backpack size={12} /> Capacità Trasporto</span>
                            <span className="text-xs text-indigo-300">{capacityMax - capacityUsed} Liberi / {capacityMax} Max</span>
                        </div>
                        <div className="w-full bg-gray-700 h-2 rounded-full overflow-hidden">
                            <div className={`h-full transition-all ${capacityUsed > capacityMax ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min((capacityUsed / capacityMax) * 100, 100)}%` }} />
                        </div>
                    </div>
                </div>
            </section>

            {/* ATTACCHI BASE (FIX HTML & FORMATTAZIONE) */}
            {weapons.length > 0 && (
                <section>
                    <h3 className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-bold flex items-center gap-2 ml-1"><Crosshair size={12} /> Attacchi Base</h3>
                    <div className="space-y-2">
                        {weapons.map(w => (
                            <div key={w.id} className="bg-red-900/10 border border-red-500/20 p-3 rounded-lg flex justify-between items-center">
                                <div>
                                    <div className="font-bold text-red-100 text-sm">{w.nome}</div>
                                    <div className="text-[10px] text-red-300/70">{w.tipo_oggetto_display}</div>
                                </div>
                                <div className="bg-red-950/50 px-3 py-1 rounded border border-red-500/30">
                                    <span className="font-mono font-bold text-red-400 text-lg">
                                        {/* USA IL CAMPO FORMATTATO DAL BACKEND */}
                                        {w.attacco_formattato || w.attacco_base} 
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* DISPOSITIVI (FIX INTERFACCIA RICARICA) */}
            <section>
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2 ml-1"><Zap size={12} /> Dispositivi & Consumabili</h3>
                <div className="space-y-3">
                    {activeItems.map(item => {
                        const timeLeft = timers[item.id] || 0;
                        const isActive = timeLeft > 0 || (item.is_active && !item.cariche_massime); // Se non ha cariche ma è attivo per altri motivi
                        const isChargeEmpty = item.cariche_massime > 0 && item.cariche_attuali <= 0;
                        const isTimerRunning = timeLeft > 0;

                        return (
                            <div key={item.id} className={`p-3 rounded-lg border transition-all ${isTimerRunning || (!isChargeEmpty && item.is_active) ? 'bg-emerald-900/10 border-emerald-500/50 shadow-emerald-500/10 shadow-lg' : 'bg-gray-800 border-gray-700'}`}>
                                <div className="flex justify-between items-start mb-2">
                                    <div className="w-full">
                                        <div className="flex justify-between w-full">
                                            <div className="font-bold text-gray-200 text-sm flex items-center gap-2">
                                                {item.nome}
                                                <button onClick={() => toggleFavorite(item)} className="text-gray-600 hover:text-yellow-400"><Star size={14} fill={favorites.find(f => f.id === item.id) ? "currentColor" : "none"} /></button>
                                            </div>
                                            {isTimerRunning && (
                                                <div className="text-lg font-mono font-bold text-emerald-400 animate-pulse bg-emerald-900/30 px-2 rounded">
                                                    {new Date(timeLeft * 1000).toISOString().substr(14, 5)}
                                                </div>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-1 text-xs">
                                            {item.cariche_massime > 0 && (
                                                <span className={`flex items-center gap-1 ${isChargeEmpty ? 'text-red-500 font-bold' : 'text-yellow-500'}`}>
                                                    <Battery size={10} /> {item.cariche_attuali} / {item.cariche_massime}
                                                </span>
                                            )}
                                            {item.durata_totale > 0 && (
                                                <span className="flex items-center gap-1 text-blue-400"><Clock size={10} /> {item.durata_totale}s</span>
                                            )}
                                            {!item.is_active && isChargeEmpty && <span className="text-red-500 font-bold uppercase ml-2">DISATTIVATO (SCARICO)</span>}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-3">
                                    {/* Mostra ATTIVA solo se ha cariche E non sta già andando il timer */}
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
                                    
                                    {/* Mostra RICARICA sempre se ha cariche massime */}
                                    {item.cariche_massime > 0 && (
                                        <button 
                                            onClick={() => handleRecharge(item)}
                                            className="px-3 bg-gray-700 hover:bg-gray-600 text-yellow-500 rounded border border-gray-600 flex items-center justify-center"
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

            {/* NOTIFICHE & PRONTUARIO */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => onNavigate('messaggi')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow">
                    <div className="flex gap-2 text-indigo-400 font-bold text-xs"><MessageSquare size={16} /> Messaggi</div>
                    {char.messaggi_non_letti_count > 0 ? <span className="bg-red-500 text-white text-xs font-bold px-2 rounded-full animate-pulse">{char.messaggi_non_letti_count}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
                <button onClick={() => onNavigate('transazioni')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow">
                    <div className="flex gap-2 text-amber-400 font-bold text-xs"><Briefcase size={16} /> Lavori</div>
                    {char.lavori_pendenti_count > 0 ? <span className="bg-amber-500 text-black text-xs font-bold px-2 rounded-full animate-bounce">{char.lavori_pendenti_count}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
            </div>

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
                                {/* FIX HTML RENDERING NEI PREFERITI */}
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