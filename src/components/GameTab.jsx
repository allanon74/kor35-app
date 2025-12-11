import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    Heart, Zap, Crosshair, Clock, Battery, RefreshCw, 
    Star, MessageSquare, Briefcase, Play, Backpack, Shield, AlertCircle, Plus, Minus,
    ChevronDown, ChevronUp, ShieldAlert, Hexagon, Activity // <--- AGGIUNTO QUI
} from 'lucide-react';

import { 
    useOptimisticStatChange, 
    useOptimisticUseItem, 
    useOptimisticRecharge 
} from '../hooks/useGameData';

// --- COMPONENTI SVG TATTICI ---

const BodyDamageWidget = ({ stats, maxHp, maxArmor, maxShell, onHit }) => {
    // Definizione zone con curve (C = Cubic Bezier, Q = Quadratic Bezier)
    // Coordinate basate su viewBox="0 0 200 300"
    const zones = [
        { 
            id: 'PV_TR', 
            name: 'Tronco', 
            // Forma torace + addome arrotondata
            d: "M70,55 C70,55 85,65 100,65 C115,65 130,55 130,55 C135,65 135,80 130,130 C120,145 80,145 70,130 C65,80 65,65 70,55 Z",
            cx: 100, cy: 90 
        },
        { 
            id: 'PV_RA', 
            name: 'Braccio Dx', 
            // Spalla arrotondata -> braccio -> mano
            d: "M132,55 C145,52 155,58 155,70 C155,90 150,110 160,135 C162,140 150,145 145,135 C135,110 135,90 132,80 Z", 
            cx: 145, cy: 95 
        },
        { 
            id: 'PV_LA', 
            name: 'Braccio Sx', 
            // Simmetrico al destro
            d: "M68,55 C55,52 45,58 45,70 C45,90 50,110 40,135 C38,140 50,145 55,135 C65,110 65,90 68,80 Z", 
            cx: 55, cy: 95 
        },
        { 
            id: 'PV_RL', 
            name: 'Gamba Dx', 
            // Coscia -> Ginocchio -> Piede
            d: "M105,135 C115,135 125,140 125,150 C125,180 128,210 125,240 C120,250 140,255 130,260 C110,260 110,240 110,220 C110,190 102,150 105,135 Z", 
            cx: 120, cy: 190 
        },
        { 
            id: 'PV_LL', 
            name: 'Gamba Sx', 
            // Simmetrico
            d: "M95,135 C85,135 75,140 75,150 C75,180 72,210 75,240 C80,250 60,255 70,260 C90,260 90,240 90,220 C90,190 98,150 95,135 Z", 
            cx: 80, cy: 190 
        },
    ];

    // Colori di stato (invariati)
    const getZoneColor = (current) => {
        if (current <= 0) return '#ef4444'; // Rosso
        if (current < maxHp / 2) return '#eab308'; // Giallo
        return '#3b82f6'; // Blu
    };

    const armorOpacity = maxArmor > 0 ? (stats['PA_CUR'] / maxArmor) : 0;
    const shellOpacity = maxShell > 0 ? (stats['PG_CUR'] / maxShell) : 0;

    return (
        <div className="relative w-full max-w-[280px] mx-auto aspect-3/4 select-none">
            <svg viewBox="0 0 200 280" className="w-full h-full drop-shadow-2xl">
                <defs>
                    <filter id="glow-shell" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="3" result="blur" />
                        <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                </defs>

                {/* LAYER 1: GUSCIO (Aura ellittica esterna) */}
                <g 
                    opacity={Math.max(0.1, shellOpacity)} 
                    className="transition-all duration-500 cursor-pointer"
                    onClick={() => onHit('PG_CUR', maxShell)}
                    filter="url(#glow-shell)"
                >
                    <ellipse cx="100" cy="130" rx="90" ry="140"
                        fill="transparent" 
                        stroke="#8b5cf6" 
                        strokeWidth="3"
                        strokeDasharray={shellOpacity === 0 ? "4 4" : "0"}
                    />
                    {maxShell > 0 && (
                        <text x="100" y="15" fill="#a78bfa" fontSize="10" textAnchor="middle" fontWeight="bold">
                            GUSCIO {stats['PG_CUR']}/{maxShell}
                        </text>
                    )}
                </g>

                {/* LAYER 2: ARMATURA (Silhouette ingrandita) */}
                <g 
                    opacity={Math.max(0.1, armorOpacity)} 
                    className="transition-all duration-500 cursor-pointer"
                    onClick={() => onHit('PA_CUR', maxArmor)}
                >
                    {/* Disegno semplificato che avvolge il corpo */}
                    <path 
                        d="M100,15 C130,15 165,50 165,130 C165,220 140,265 100,265 C60,265 35,220 35,130 C35,50 70,15 100,15 Z"
                        fill="rgba(16, 185, 129, 0.1)" 
                        stroke="#10b981" 
                        strokeWidth="2"
                        strokeDasharray={armorOpacity === 0 ? "2 2" : "0"}
                    />
                    {maxArmor > 0 && (
                        <text x="100" y="275" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">
                            ARM {stats['PA_CUR']}/{maxArmor}
                        </text>
                    )}
                </g>

                {/* LAYER 3: CORPO (Interno - Zone Interattive) */}
                <g className="filter drop-shadow-md">
                    {/* Testa (Cerchio semplice) */}
                    <circle cx="100" cy="35" r="18" fill="#4b5563" stroke="#9ca3af" />
                    
                    {zones.map(z => {
                        const val = stats[z.id];
                        return (
                            <g key={z.id} onClick={() => onHit(z.id, maxHp)} className="cursor-pointer hover:opacity-80 transition-opacity">
                                <path 
                                    d={z.d} 
                                    fill={getZoneColor(val)} 
                                    stroke="rgba(255,255,255,0.4)" 
                                    strokeWidth="1"
                                    strokeLinejoin="round"
                                />
                                <text x={z.cx} y={z.cy} fill="white" fontSize="10" textAnchor="middle" pointerEvents="none" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>
                                    {val}
                                </text>
                            </g>
                        );
                    })}
                </g>
            </svg>

            {/* Warning Coma */}
            {stats['PV_TR'] <= 0 && (
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-900/90 text-white px-4 py-2 rounded-xl border-2 border-red-500 animate-pulse text-center shadow-2xl z-20">
                    <AlertCircle className="mx-auto mb-1 text-red-400" />
                    <span className="font-black text-lg uppercase tracking-widest">COMA</span>
                </div>
            )}
        </div>
    );
};


const DamageControlPanel = ({ stats, maxHp, maxArmor, maxShell, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    const rows = [
        { id: 'PG_CUR', label: 'Guscio', max: maxShell, color: 'text-purple-400' },
        { id: 'PA_CUR', label: 'Armatura', max: maxArmor, color: 'text-emerald-400' },
        { id: 'PV_TR', label: 'Tronco', max: maxHp, color: 'text-blue-400' },
        { id: 'PV_RA', label: 'Br. Dx', max: maxHp, color: 'text-blue-300' },
        { id: 'PV_LA', label: 'Br. Sx', max: maxHp, color: 'text-blue-300' },
        { id: 'PV_RL', label: 'Gb. Dx', max: maxHp, color: 'text-blue-300' },
        { id: 'PV_LL', label: 'Gb. Sx', max: maxHp, color: 'text-blue-300' },
    ];

    return (
        <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
            <button 
                onClick={() => setIsOpen(!isOpen)}
                className="w-full flex justify-between items-center p-3 bg-gray-900/50 hover:bg-gray-700 transition-colors"
            >
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                    <Crosshair size={14}/> Controlli Manuali
                </span>
                {isOpen ? <ChevronUp size={16}/> : <ChevronDown size={16}/>}
            </button>
            
            {isOpen && (
                <div className="p-2 space-y-1 animate-in slide-in-from-top-2">
                    {rows.map(r => {
                        if (r.max <= 0 && (r.id === 'PG_CUR' || r.id === 'PA_CUR')) return null;
                        const val = stats[r.id];
                        return (
                            <div key={r.id} className="flex items-center justify-between bg-gray-900/30 p-2 rounded">
                                <span className={`text-xs font-bold ${r.color} w-20`}>{r.label}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-xs font-mono text-white w-8 text-right">{val}/{r.max}</span>
                                    <div className="flex gap-1">
                                        <button onClick={() => onChange(r.id, 'add', r.max)} className="p-1 bg-green-900/50 hover:bg-green-700 rounded text-green-200"><Plus size={12}/></button>
                                        <button onClick={() => onChange(r.id, 'consuma', r.max)} className="p-1 bg-red-900/50 hover:bg-red-700 rounded text-red-200"><Minus size={12}/></button>
                                        <button onClick={() => onChange(r.id, 'reset', r.max)} className="p-1 bg-blue-900/50 hover:bg-blue-700 rounded text-blue-200"><RefreshCw size={12}/></button>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    );
};

const ChakraWidget = ({ current, max, onChange }) => {
    return (
        <div className="bg-gray-800 rounded-xl p-3 border border-gray-700 shadow-md">
            <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                    <Hexagon size={12} className="text-pink-500" /> Chakra
                </span>
                <div className="flex gap-2">
                    <button onClick={() => onChange('CHK_CUR', 'add', max)} className="text-xs text-green-400 hover:text-green-300 font-bold px-2 bg-green-900/20 rounded">+1</button>
                    <button onClick={() => onChange('CHK_CUR', 'reset', max)} className="text-gray-500 hover:text-white"><RefreshCw size={12}/></button>
                </div>
            </div>
            
            <div className="flex flex-wrap gap-1.5">
                {[...Array(max)].map((_, i) => (
                    <button 
                        key={i}
                        onClick={() => onChange('CHK_CUR', 'consuma', max)}
                        disabled={i >= current} // Clicca solo sui pieni per svuotarli (logica stack)
                        className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${
                            i < current 
                            ? 'bg-pink-600 border-pink-400 shadow-[0_0_8px_#db2777] scale-100' 
                            : 'bg-gray-900 border-gray-700 scale-90 opacity-50'
                        }`}
                    >
                        {i < current && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </button>
                ))}
            </div>
            <div className="text-right mt-1 text-[9px] text-gray-500 font-mono">
                {current} / {max}
            </div>
        </div>
    );
};

const GameTab = ({ onNavigate }) => {
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

    const getAllActiveItems = useCallback(() => {
        if (!char?.oggetti) return [];
        let list = [];
        char.oggetti.forEach(item => {
            const hasMechanics = (obj) => (obj.cariche_massime > 0 || obj.durata_totale > 0);
            let isContainerActive = false;
            if (item.tipo_oggetto === 'FIS' && item.is_equipaggiato) isContainerActive = true;
            if (item.tipo_oggetto === 'INN' && item.slot_corpo) isContainerActive = true;
            if (item.tipo_oggetto === 'MUT') isContainerActive = true;

            if (isContainerActive && hasMechanics(item)) list.push(item);
            if (isContainerActive && item.potenziamenti_installati) {
                item.potenziamenti_installati.forEach(mod => {
                    if (hasMechanics(mod)) list.push({ ...mod, is_mod: true, parent_name: item.nome });
                });
            }
        });
        return list;
    }, [char]);

    const activeItems = getAllActiveItems();

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
        updateTimers();
        const interval = setInterval(updateTimers, 1000);
        return () => clearInterval(interval);
    }, [updateTimers]); 

    // --- HANDLERS ---

    const handleStatChange = (key, mode, maxOverride) => {
        statMutation.mutate({ 
            charId: char.id, 
            stat_sigla: key, 
            mode,
            max_override: maxOverride // Passiamo il max specifico per permettere il reset corretto
        });
    };

    const handleUseItem = (item) => {
        if (item.cariche_attuali <= 0) return;
        useItemMutation.mutate({ 
            oggetto_id: item.id, 
            charId: char.id,
            durata_totale: item.durata_totale || 0,
            is_aura_zero_off: item.spegni_a_zero_cariche || false 
        });
    };

    const handleRecharge = (item) => {
        const costo = item.costo_ricarica || 0;
        const msg = `Ricaricare ${item.nome}?\nCosto: ${costo} CR\nMetodo: ${item.testo_ricarica || 'Standard'}`;
        if (window.confirm(msg)) {
            rechargeMutation.mutate({ oggetto_id: item.id, charId: char.id });
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

    // --- PREPARAZIONE DATI PER WIDGET TATTICO ---
    const getStatMax = (sigla) => {
        const s = char.statistiche_primarie?.find(x => x.sigla === sigla);
        return s ? s.valore_max : 0;
    };

    const maxHP = getStatMax('PV');
    const maxArmor = getStatMax('PA');
    const maxShell = getStatMax('PG');
    const maxChakra = getStatMax('CHA') || 1; // Fallback

    // Recupera valori correnti dal JSON temporaneo, con fallback al max se non presenti
    const tempStats = char.statistiche_temporanee || {};
    const tacticalStats = {
        'PV_TR': tempStats['PV_TR'] !== undefined ? tempStats['PV_TR'] : maxHP,
        'PV_RA': tempStats['PV_RA'] !== undefined ? tempStats['PV_RA'] : maxHP,
        'PV_LA': tempStats['PV_LA'] !== undefined ? tempStats['PV_LA'] : maxHP,
        'PV_RL': tempStats['PV_RL'] !== undefined ? tempStats['PV_RL'] : maxHP,
        'PV_LL': tempStats['PV_LL'] !== undefined ? tempStats['PV_LL'] : maxHP,
        'PA_CUR': tempStats['PA_CUR'] !== undefined ? tempStats['PA_CUR'] : maxArmor,
        'PG_CUR': tempStats['PG_CUR'] !== undefined ? tempStats['PG_CUR'] : maxShell,
        'CHK_CUR': tempStats['CHK_CUR'] !== undefined ? tempStats['CHK_CUR'] : maxChakra,
    };

    // --- LOGICA CAPACITA' ---
    const statCog = char.statistiche_primarie?.find(s => s.sigla === 'COG');
    const capacityMax = statCog ? statCog.valore_max : 10;
    const capacityConsumers = char.oggetti.filter(i => 
        i.is_equipaggiato && i.tipo_oggetto === 'FIS' && 
        i.potenziamenti_installati && i.potenziamenti_installati.length > 0
    );
    const capacityUsed = capacityConsumers.length;
    const isOverloaded = capacityUsed > capacityMax;

    const weapons = char.oggetti.filter(i => i.is_equipaggiato && i.attacco_base);

    return (
        <div className="pb-24 px-2 space-y-6 animate-fadeIn text-gray-100 pt-2">
            
            {/* 1. SEZIONE TATTICA (Omino + Controlli + Chakra) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* SINISTRA: Scanner Tattico */}
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col items-center">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold w-full flex items-center gap-2">
                        <Activity size={12} /> Status Fisico
                    </h3>
                    
                    <BodyDamageWidget 
                        stats={tacticalStats}
                        maxHp={maxHP}
                        maxArmor={maxArmor}
                        maxShell={maxShell}
                        onHit={(id, max) => handleStatChange(id, 'consuma', max)}
                    />
                </div>

                {/* DESTRA: Controlli e Risorse */}
                <div className="flex flex-col gap-4">
                    
                    {/* Controlli Danni */}
                    <DamageControlPanel 
                        stats={tacticalStats}
                        maxHp={maxHP}
                        maxArmor={maxArmor}
                        maxShell={maxShell}
                        onChange={handleStatChange}
                    />

                    {/* Chakra / Mana */}
                    {(maxChakra > 0) && (
                        <ChakraWidget 
                            current={tacticalStats['CHK_CUR']} 
                            max={maxChakra} 
                            onChange={handleStatChange} 
                        />
                    )}

                    {/* Memory Dump (Capacità) */}
                    <div className={`relative bg-gray-800 rounded-xl border p-3 shadow-md flex flex-col h-32 overflow-hidden ${isOverloaded ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700'}`}>
                        <div className="flex justify-between items-center mb-1">
                             <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <Backpack size={12}/> Oggetti Speciali Equipaggiati
                             </span>
                             <span className={`text-xs font-bold ${isOverloaded ? 'text-red-400' : 'text-indigo-400'}`}>
                                {capacityUsed} / {capacityMax}
                             </span>
                        </div>
                        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                            {capacityConsumers.length > 0 ? (
                                <div className="flex flex-col gap-1 mt-1">
                                    {capacityConsumers.map((item) => (
                                        <div key={item.id} className="flex items-center gap-1.5 bg-gray-900/50 px-1.5 py-1 rounded border border-gray-700/50">
                                            <div className="w-1 h-1 rounded-full bg-indigo-500 shrink-0"></div>
                                            <span className="text-[9px] text-gray-300 truncate w-full font-mono">{item.nome}</span>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="h-full flex flex-col items-center justify-center text-gray-600 opacity-50">
                                    <span className="text-[9px]">Buffer Libero</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* 2. ATTACCHI BASE */}
            {weapons.length > 0 && (
                <section>
                    <h3 className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-bold flex items-center gap-2 ml-1">
                        <Crosshair size={12} /> Sistemi Offensivi
                    </h3>
                    <div className="grid grid-cols-1 gap-2">
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
                    <Zap size={12} /> Dispositivi Attivi
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
                    {activeItems.length === 0 && <p className="text-gray-600 text-xs italic text-center py-4">Nessun dispositivo pronto.</p>}
                </div>
            </section>

            {/* NOTIFICHE & PRONTUARIO */}
            <div className="grid grid-cols-2 gap-3 mt-4">
                <button onClick={() => onNavigate('messaggi')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750 transition-colors">
                    <div className="flex gap-2 text-indigo-400 font-bold text-xs"><MessageSquare size={16} /> Messaggi</div>
                    {unreadCount > 0 ? <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">{unreadCount}</span> : <span className="text-gray-600 text-xs">-</span>}
                </button>
                <button onClick={() => onNavigate('transazioni')} className="bg-gray-800 p-3 rounded-lg border border-gray-700 flex justify-between shadow items-center hover:bg-gray-750 transition-colors">
                    <div className="flex gap-2 text-amber-400 font-bold text-xs"><Briefcase size={16} /> Lavori</div>
                    {char.lavori_pendenti_count > 0 ? <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full animate-bounce">{char.lavori_pendenti_count}</span> : <span className="text-gray-600 text-xs">-</span>}
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