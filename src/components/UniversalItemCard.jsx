import React, { memo } from 'react';
import { 
    ChevronUp, ChevronDown, Sparkles, Box, Shield, Zap, 
    Clock, Battery, Swords, AlertTriangle, Lock, Coins, BookOpen 
} from 'lucide-react';
import PunteggioDisplay from './PunteggioDisplay'; // Assicurati che esista

// --- HELPER PER RISOLVERE I DATI ETEROGENEI ---
const normalizeItemData = (item, type) => {
    // Default
    let data = {
        id: item.id,
        nome: item.nome || item.nome_personalizzato || "Senza Nome",
        livello: item.livello || item.liv || 0,
        descrizione: item.descrizione || item.testo || item.effetto || "",
        aura: null, // { nome, icona, colore }
        stats: [],  // Array normalizzato { nome, valore, icona_url }
        bricks: [], // Componenti
        tags: [],
        extra: null // JSX extra
    };

    // 1. GESTIONE AURA (Oggetti vs Tecniche)
    if (item.aura) data.aura = item.aura; // Oggetti
    else if (item.aura_richiesta) data.aura = item.aura_richiesta; // Tessiture/Infusioni

    // 2. GESTIONE STATS & BRICKS (Mattoni)
    if (type === 'OGGETTO') {
        // Uniamo modificatori e statistiche base
        const rawStats = [...(item.modificatori || []), ...(item.statistiche || [])];
        data.stats = rawStats.map(s => ({
            nome: s.statistica?.nome || s.nome_statistica || "Stat",
            valore: s.valore,
            icona: s.statistica?.icona_url || s.icona_url,
            sigla: s.statistica?.sigla || s.sigla
        }));
        
        data.bricks = item.componenti || [];
        
        // Tags Oggetto
        if (item.tipo_oggetto_display) data.tags.push(item.tipo_oggetto_display);
        if (item.is_pesante || item.oggetto_base?.is_pesante) data.tags.push({ label: "PESANTE", isAlert: true });
        
    } else if (type === 'TESSITURA' || type === 'CERIMONIALE') {
        data.tags.push(item.scuola_magia || "Arcano");
        if (item.costo_mana) data.tags.push(`Mana: ${item.costo_mana}`);
        if (item.tempo_lancio) data.tags.push(`Cast: ${item.tempo_lancio}s`);
        
    } else if (type === 'INFUSIONE') {
        data.tags.push(item.slot_richiesto || "Slot Universale");
    }

    return data;
};

const UniversalItemCard = memo(({ 
    item, 
    type = 'OGGETTO', // OGGETTO, TESSITURA, INFUSIONE, CERIMONIALE
    isExpanded, 
    onToggle, 
    actions, // Bottoni azione (Equipaggia, Compra, ecc.)
    footerInfo // JSX opzionale nel footer (es. Costo crediti)
}) => {
    
    const data = normalizeItemData(item, type);
    
    // Stile Aura
    const auraColor = data.aura?.colore || '#4b5563';
    const borderColor = { borderColor: auraColor };

    // Stile Card (Equipaggiato/Attivo/Standard)
    const getCardStyle = () => {
        if (item.is_active) return 'border-green-500/50 bg-green-900/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
        if (item.is_equipaggiato) return 'border-yellow-600/60 bg-yellow-900/10';
        return 'border-gray-700 bg-gray-800/40 hover:border-gray-600';
    };

    return (
        <div className={`relative mb-2 rounded-lg border flex flex-col transition-all ${getCardStyle()}`}>
            
            {/* --- HEADER --- */}
            <div className="p-2 flex items-center justify-between cursor-pointer gap-3" onClick={() => onToggle && onToggle(item.id)}>
                
                {/* ICONA AURA */}
                <div className="w-10 h-10 shrink-0 rounded bg-gray-900 border flex items-center justify-center overflow-hidden" style={borderColor}>
                    {data.aura?.icona_url || data.aura?.icona ? (
                        <img src={data.aura.icona_url || data.aura.icona} className="w-full h-full object-contain p-0.5" alt="Aura" />
                    ) : (
                        <Sparkles size={20} color={auraColor} />
                    )}
                </div>

                {/* INFO CENTRALI */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm leading-tight truncate ${item.is_equipaggiato ? 'text-yellow-400' : 'text-gray-200'}`}>
                        {data.nome}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                        {data.tags.map((tag, i) => {
                            const isObj = typeof tag === 'object';
                            const label = isObj ? tag.label : tag;
                            const isAlert = isObj ? tag.isAlert : false;
                            return (
                                <span key={i} className={`flex items-center ${isAlert ? "text-red-400 font-bold" : ""}`}>
                                    {isAlert && <AlertTriangle size={10} className="mr-0.5" />}
                                    {label}
                                    {i < data.tags.length - 1 && <span className="mx-1 opacity-50">•</span>}
                                </span>
                            );
                        })}
                    </div>
                </div>

                {/* MATTONI & LIVELLO */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Render Mattoni (Componenti) */}
                    {data.bricks.length > 0 && (
                        <div className="flex gap-0.5">
                            {data.bricks.map((b, idx) => {
                                const url = b.caratteristica?.icona_url;
                                return (
                                    <div key={idx} className="w-4 h-4 bg-gray-800 border border-gray-600 rounded-sm p-px" title={b.caratteristica?.nome}>
                                        {url ? <img src={url} className="w-full h-full object-contain"/> : <div className="bg-gray-500 w-full h-full"/>}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                    {data.livello > 0 && (
                        <span className="text-[10px] bg-gray-700 text-gray-300 px-1.5 py-0.5 rounded border border-gray-600 font-mono">
                            Lv.{data.livello}
                        </span>
                    )}
                </div>

                {/* CHEVRON */}
                <div className="text-gray-500">
                    {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
            </div>

            {/* --- BODY COLLASSABILE --- */}
            {isExpanded && (
                <div className="px-3 pb-3 pt-0 animate-fadeIn border-t border-gray-700/30 mt-1 pt-2">
                    
                    {/* Attacco (Solo oggetti) */}
                    {item.attacco_formattato && (
                        <div className="bg-red-900/20 border border-red-900/40 p-2 rounded flex items-center gap-2 text-red-300 text-xs font-bold mb-2">
                            <Swords size={14} /> <span>{item.attacco_formattato}</span>
                        </div>
                    )}

                    {/* Statistiche con Icone */}
                    {data.stats.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {data.stats.map((stat, idx) => (
                                stat.icona ? (
                                    <PunteggioDisplay key={idx} sigla={stat.sigla} valore={stat.valore} iconaUrl={stat.icona} size="sm" showLabel />
                                ) : (
                                    stat.valore !== 0 && (
                                        <div key={idx} className="bg-gray-900 border border-gray-600 px-2 py-1 rounded text-xs flex gap-1">
                                            <span className="text-gray-400">{stat.nome}</span>
                                            <span className={stat.valore > 0 ? "text-green-400" : "text-red-400"}>{stat.valore > 0 ? '+' : ''}{stat.valore}</span>
                                        </div>
                                    )
                                )
                            ))}
                        </div>
                    )}

                    {/* Descrizione */}
                    <div className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-gray-700/30 mb-2">
                        <div dangerouslySetInnerHTML={{ __html: data.descrizione }} />
                    </div>

                    {/* Moduli Installati (Ricorsione) */}
                    {item.potenziamenti_installati?.length > 0 && (
                        <div className="pl-3 border-l-2 border-indigo-500/30 mb-2">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Moduli</p>
                            {item.potenziamenti_installati.map(mod => (
                                <UniversalItemCard key={mod.id} item={mod} type="OGGETTO" isExpanded={false} />
                            ))}
                        </div>
                    )}

                    {/* Footer Info (es. Costo Crediti) */}
                    {footerInfo && <div className="mb-2">{footerInfo}</div>}

                    {/* Azioni */}
                    {actions && <div className="flex gap-2 pt-2 border-t border-gray-700/30">{actions}</div>}
                </div>
            )}
        </div>
    );
});

export default UniversalItemCard;