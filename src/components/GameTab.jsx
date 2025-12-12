import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { 
    Heart, Zap, Crosshair, Clock, Battery, RefreshCw, 
    Star, MessageSquare, Briefcase, Play, Backpack, Shield, AlertCircle, Plus, Minus,
    ChevronDown, ChevronUp, ShieldAlert, Hexagon, Activity, Weight 
} from 'lucide-react';

import { 
    useOptimisticStatChange, 
    useOptimisticUseItem, 
    useOptimisticRecharge 
} from '../hooks/useGameData';

import ActiveItemWidget from './ActiveItemWidget'; 

// --- WIDGET DANNI (FIX CLICK LAYER) ---
const BodyDamageWidget = ({ stats, maxHp, maxArmor, maxShell, onHit }) => {
    // Zone del corpo originali (Tutte presenti)
    const zones = [
        { id: 'PV_TR', name: 'Tronco', d: "M70,55 C70,55 85,65 100,65 C115,65 130,55 130,55 C135,65 135,80 130,130 C120,145 80,145 70,130 C65,80 65,65 70,55 Z", cx: 100, cy: 90 },
        { id: 'PV_RA', name: 'Braccio Dx', d: "M132,55 C145,52 155,58 155,70 C155,90 150,110 160,135 C162,140 150,145 145,135 C135,110 135,90 132,80 Z", cx: 145, cy: 95 },
        { id: 'PV_LA', name: 'Braccio Sx', d: "M68,55 C55,52 45,58 45,70 C45,90 50,110 40,135 C38,140 50,145 55,135 C65,110 65,90 68,80 Z", cx: 55, cy: 95 },
        { id: 'PV_RL', name: 'Gamba Dx', d: "M105,135 C115,135 125,140 125,150 C125,180 128,210 125,240 C120,250 140,255 130,260 C110,260 110,240 110,220 C110,190 102,150 105,135 Z", cx: 120, cy: 190 },
        { id: 'PV_LL', name: 'Gamba Sx', d: "M95,135 C85,135 75,140 75,150 C75,180 72,210 75,240 C80,250 60,255 70,260 C90,260 90,240 90,220 C90,190 98,150 95,135 Z", cx: 80, cy: 190 },
    ];

    const getZoneColor = (current) => {
        if (current <= 0) return '#ef4444';
        if (current < maxHp / 2) return '#eab308';
        return '#3b82f6';
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

                {/* LAYER 1: GUSCIO (Sopra le barre HP se cliccabile, altrimenti pass-through) */}
                <g 
                    opacity={Math.max(0.1, shellOpacity)} 
                    className="transition-all duration-500"
                    // IMPORTANTE: Se non c'è shell o è 0, pointer-events: none per cliccare sotto
                    style={{ pointerEvents: maxShell > 0 ? 'auto' : 'none', cursor: maxShell > 0 ? 'pointer' : 'default' }}
                    onClick={() => maxShell > 0 && onHit('PG_CUR', maxShell)}
                    filter="url(#glow-shell)"
                >
                    <ellipse cx="100" cy="130" rx="90" ry="140" fill="transparent" stroke="#8b5cf6" strokeWidth="3" strokeDasharray={shellOpacity === 0 ? "4 4" : "0"} />
                    {maxShell > 0 && <text x="100" y="15" fill="#a78bfa" fontSize="10" textAnchor="middle" fontWeight="bold">GUSCIO {stats['PG_CUR']}/{maxShell}</text>}
                </g>

                {/* LAYER 2: ARMATURA */}
                <g 
                    opacity={Math.max(0.1, armorOpacity)} 
                    className="transition-all duration-500"
                    // FIX: se armatura finita, lascia passare il click
                    style={{ pointerEvents: maxArmor > 0 ? 'auto' : 'none', cursor: maxArmor > 0 ? 'pointer' : 'default' }}
                    onClick={() => maxArmor > 0 && onHit('PA_CUR', maxArmor)}
                >
                    <path d="M100,15 C130,15 165,50 165,130 C165,220 140,265 100,265 C60,265 35,220 35,130 C35,50 70,15 100,15 Z" fill="rgba(16, 185, 129, 0.1)" stroke="#10b981" strokeWidth="2" strokeDasharray={armorOpacity === 0 ? "2 2" : "0"} />
                    {maxArmor > 0 && <text x="100" y="275" fill="#34d399" fontSize="10" textAnchor="middle" fontWeight="bold">ARM {stats['PA_CUR']}/{maxArmor}</text>}
                </g>

                {/* LAYER 3: CORPO */}
                <g className="filter drop-shadow-md">
                    <circle cx="100" cy="35" r="18" fill="#4b5563" stroke="#9ca3af" />
                    {zones.map(z => {
                        const val = stats[z.id];
                        return (
                            <g key={z.id} onClick={() => onHit(z.id, maxHp)} className="cursor-pointer hover:opacity-80 transition-opacity">
                                <path d={z.d} fill={getZoneColor(val)} stroke="rgba(255,255,255,0.4)" strokeWidth="1" strokeLinejoin="round" />
                                <text x={z.cx} y={z.cy} fill="white" fontSize="10" textAnchor="middle" pointerEvents="none" fontWeight="bold" style={{textShadow: '0px 1px 2px black'}}>{val}</text>
                            </g>
                        );
                    })}
                </g>
            </svg>
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
            <button onClick={() => setIsOpen(!isOpen)} className="w-full flex justify-between items-center p-3 bg-gray-900/50 hover:bg-gray-700 transition-colors">
                <span className="text-xs font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2"><Crosshair size={14}/> Controlli Manuali</span>
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
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Hexagon size={12} className="text-pink-500" /> Chakra</span>
                <div className="flex gap-2">
                    <button onClick={() => onChange('CHK_CUR', 'add', max)} className="text-xs text-green-400 hover:text-green-300 font-bold px-2 bg-green-900/20 rounded">+1</button>
                    <button onClick={() => onChange('CHK_CUR', 'reset', max)} className="text-gray-500 hover:text-white"><RefreshCw size={12}/></button>
                </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
                {[...Array(max)].map((_, i) => (
                    <button key={i} onClick={() => onChange('CHK_CUR', 'consuma', max)} disabled={i >= current} className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${i < current ? 'bg-pink-600 border-pink-400 shadow-[0_0_8px_#db2777] scale-100' : 'bg-gray-900 border-gray-700 scale-90 opacity-50'}`}>
                        {i < current && <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />}
                    </button>
                ))}
            </div>
            <div className="text-right mt-1 text-[9px] text-gray-500 font-mono">{current} / {max}</div>
        </div>
    );
};

const CapacityDashboard = ({ capacityUsed, capacityMax, capacityConsumers, heavyUsed, heavyMax, heavyConsumers }) => {
    const isOverloaded = capacityUsed > capacityMax;
    const isHeavyOverloaded = heavyUsed > heavyMax;

    return (
        <div className="w-full bg-gray-800 rounded-xl border border-gray-700 p-3 shadow-md mb-4 flex flex-col md:flex-row gap-4">
            <div className={`flex-1 flex flex-col gap-2 p-2 rounded-lg border bg-gray-900/30 ${isOverloaded ? 'border-red-500/50 bg-red-900/10' : 'border-gray-700/50'}`}>
                <div className="flex justify-between items-center border-b border-gray-700/50 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Backpack size={12} className="text-indigo-400"/> Oggetti Speciali (COG)</span>
                    <span className={`text-xs font-bold font-mono ${isOverloaded ? 'text-red-400' : 'text-indigo-400'}`}>{capacityUsed} / {capacityMax}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {capacityConsumers.length > 0 ? capacityConsumers.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500 shrink-0"></div><span className="text-[10px] text-gray-300 truncate font-mono max-w-[120px]">{item.nome}</span></div>
                    )) : <span className="text-[10px] text-gray-600 italic px-1">Nessuno</span>}
                </div>
            </div>
            <div className={`flex-1 flex flex-col gap-2 p-2 rounded-lg border bg-gray-900/30 ${isHeavyOverloaded ? 'border-orange-500/50 bg-orange-900/10' : 'border-gray-700/50'}`}>
                <div className="flex justify-between items-center border-b border-gray-700/50 pb-1">
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2"><Weight size={12} className="text-orange-400"/> Oggetti Pesanti (OGP)</span>
                    <span className={`text-xs font-bold font-mono ${isHeavyOverloaded ? 'text-orange-400' : 'text-green-400'}`}>{heavyUsed} / {heavyMax}</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                    {heavyConsumers.length > 0 ? heavyConsumers.map((item) => (
                        <div key={item.id} className="flex items-center gap-1.5 bg-gray-800 px-2 py-1 rounded border border-gray-600 shadow-sm"><div className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0"></div><span className="text-[10px] text-gray-300 truncate font-mono max-w-[120px]">{item.nome}</span></div>
                    )) : <span className="text-[10px] text-gray-600 italic px-1">Carico leggero</span>}
                </div>
            </div>
        </div>
    );
};




const GameTab = ({ onNavigate }) => {
    const { selectedCharacterData: char, unreadCount, updateCharacter } = useCharacter();
    const [favorites, setFavorites] = useState([]);
    
    const statMutation = useOptimisticStatChange();
    const useItemMutation = useOptimisticUseItem();
    const rechargeMutation = useOptimisticRecharge();

    useEffect(() => {
        const savedFavs = JSON.parse(localStorage.getItem('kor35_favorites') || '[]');
        setFavorites(savedFavs);
    }, []);

    // Filtro oggetti attivi (dispositivi usabili)
    const activeItems = useMemo(() => {
        if (!char?.oggetti) return [];
        return char.oggetti.filter(item => {
             const isActiveContainer = (item.tipo_oggetto === 'FIS' && item.is_equipaggiato) || 
                                       (['INN', 'MUT'].includes(item.tipo_oggetto) && item.slot_corpo);
             const hasMechanics = item.cariche_massime > 0 || item.durata_totale > 0;
             return isActiveContainer && hasMechanics;
        });
    }, [char]);

    const handleStatChange = (key, mode, maxOverride) => {
        // Safe check se maxOverride è 0/undefined
        statMutation.mutate({ charId: char.id, stat_sigla: key, mode, max_override: maxOverride || 0 });
    };

    const toggleFavorite = (item) => {
        let newFavs;
        if (favorites.find(f => f.id === item.id)) {
            newFavs = favorites.filter(f => f.id !== item.id);
        } else {
            newFavs = [...favorites, { id: item.id, nome: item.nome, testo: item.TestoFormattato }];
        }
        setFavorites(newFavs);
        localStorage.setItem('kor35_favorites', JSON.stringify(newFavs));
    };

    if (!char) return <div className="p-8 text-center text-white">Caricamento...</div>;

    // Statistiche Tattiche
    const maxHP = char.statistiche_primarie?.find(x => x.sigla === 'PV')?.valore_max || 0;
    const maxArmor = char.statistiche_primarie?.find(x => x.sigla === 'PA')?.valore_max || 0;
    const maxShell = char.statistiche_primarie?.find(x => x.sigla === 'PG')?.valore_max || 0;
    const maxChakra = char.statistiche_primarie?.find(x => x.sigla === 'CHA')?.valore_max || 1;

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

    // Logica Capacità
    const statCog = char.statistiche_primarie?.find(s => s.sigla === 'COG');
    const capacityMax = statCog ? statCog.valore_max : 10;
    const capacityConsumers = char.oggetti.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS' && i.potenziamenti_installati?.length > 0);
    const capacityUsed = capacityConsumers.length;
    
    const statOgp = char.statistiche_primarie?.find(s => s.sigla === 'OGP');
    const heavyMax = statOgp ? statOgp.valore_max : 0;
    const heavyConsumers = char.oggetti.filter(i => i.is_equipaggiato && i.is_pesante);
    const heavyUsed = heavyConsumers.length;

    // Filtro Armi
    const weapons = char.oggetti.filter(i => i.is_equipaggiato && i.attacco_base);

    return (
        <div className="pb-24 px-2 space-y-6 animate-fadeIn text-gray-100 pt-2">
            
            <CapacityDashboard 
                capacityUsed={capacityUsed} capacityMax={capacityMax} capacityConsumers={capacityConsumers}
                heavyUsed={heavyUsed} heavyMax={heavyMax} heavyConsumers={heavyConsumers}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gray-900 rounded-xl p-4 border border-gray-700 shadow-lg flex flex-col items-center">
                    <h3 className="text-[10px] uppercase tracking-widest text-gray-500 mb-3 font-bold w-full flex items-center gap-2"><Activity size={12} /> Status Fisico</h3>
                    <BodyDamageWidget stats={tacticalStats} maxHp={maxHP} maxArmor={maxArmor} maxShell={maxShell} onHit={(id, max) => handleStatChange(id, 'consuma', max)} />
                </div>
                <div className="flex flex-col gap-4">
                    <DamageControlPanel stats={tacticalStats} maxHp={maxHP} maxArmor={maxArmor} maxShell={maxShell} onChange={handleStatChange} />
                    {(maxChakra > 0) && <ChakraWidget current={tacticalStats['CHK_CUR']} max={maxChakra} onChange={handleStatChange} />}
                </div>
            </div>

            {/* 2. ATTACCHI BASE (MODIFICATO PER MOSTRORE MOD OFFENSIVE) */}
 {weapons.length > 0 && (
    <section>
        <h3 className="text-[10px] uppercase tracking-widest text-red-400 mb-2 font-bold flex items-center gap-2 ml-1">
            <Crosshair size={12} /> Sistemi Offensivi
        </h3>
        <div className="grid grid-cols-1 gap-2">
            {weapons.map(w => (
                <div key={w.id} className="bg-linear-to-r from-red-900/20 to-gray-900/20 border border-red-500/30 p-3 rounded-lg shadow-sm">
                    {/* Header Arma */}
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <div className="font-bold text-red-100 text-sm flex items-center gap-2">
                                {w.nome}
                                {w.is_pesante && <Weight size={12} className="text-orange-500" title="Oggetto Pesante"/>}
                            </div>
                            <div className="text-[10px] text-red-300/60 uppercase">{w.tipo_oggetto_display}</div>
                        </div>
                        {/* Danno Principale */}
                        <div className="text-right">
                             <div className="text-lg font-mono font-bold text-red-400 drop-shadow-sm">
                                 {w.attacco_formattato || w.attacco_base}
                             </div>
                        </div>
                    </div>

                    {/* Potenziamenti Offensivi INTEGRATI */}
                    {w.potenziamenti_installati && w.potenziamenti_installati.some(m => m.attacco_base) && (
                        <div className="mt-2 space-y-1">
                            {w.potenziamenti_installati.filter(m => m.attacco_base).map(mod => (
                                <div key={mod.id} className="flex justify-between items-center bg-black/30 rounded px-2 py-1 border-l-2 border-yellow-500">
                                    <div className="flex items-center gap-2">
                                        <Zap size={10} className="text-yellow-500" />
                                        <span className="text-xs text-gray-300 font-medium">{mod.nome}</span>
                                    </div>
                                    <span className="font-mono text-xs font-bold text-yellow-100">
                                        {mod.attacco_formattato || mod.attacco_base}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
        </div>
    </section>
)}

            {/* 3. DISPOSITIVI ATTIVI */}
            <section>
                <h3 className="text-[10px] uppercase tracking-widest text-emerald-400 font-bold flex items-center gap-2 mb-2 ml-1">
                    <Zap size={12} /> Dispositivi Attivi
                </h3>
                <div className="flex flex-wrap gap-3">
                    {activeItems.map(item => (
                        <ActiveItemWidget 
                            key={item.id} 
                            item={item} 
                            onUpdate={updateCharacter} // Sync dati
                        />
                    ))}
                    {activeItems.length === 0 && <p className="text-gray-600 text-xs italic w-full text-center py-4">Nessun dispositivo attivo.</p>}
                </div>
            </section>

            {/* NOTIFICHE & PRONTUARIO (Invariati) */}
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