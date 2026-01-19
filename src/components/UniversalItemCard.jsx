import React, { memo } from 'react';
import { 
    ChevronUp, ChevronDown, Sparkles, Swords, Zap, 
    Clock, Battery, AlertTriangle 
} from 'lucide-react';
// Assicurati che il percorso sia corretto nel tuo progetto
import PunteggioDisplay from './PunteggioDisplay';

// --- HELPER: ICONA UNIVERSALE ---
const UniversalIcon = ({ url, color, label, size = "md", shape = "square" }) => {
    const sizeCls = size === "sm" ? "w-6 h-6" : size === "xs" ? "w-4 h-4" : "w-10 h-10";
    const shapeCls = shape === "circle" ? "rounded-full" : "rounded-md";
    // Gestione colore dinamico o fallback
    const borderStyle = { borderColor: color || '#4b5563' }; 
    
    // Normalizzazione URL: Django a volte manda path relativi, a volte assoluti.
    // Se inizia con /, assumiamo sia relativo alla root del sito.
    const imgSrc = url; 

    return (
        <div 
            className={`${sizeCls} ${shapeCls} bg-gray-900 border flex items-center justify-center overflow-hidden shadow-sm shrink-0`}
            style={borderStyle}
            title={label}
        >
            {imgSrc ? (
                <img src={imgSrc} alt={label} className="w-full h-full object-contain p-0.5" />
            ) : (
                <span className="text-[10px] font-bold text-gray-500 select-none">
                    {label ? label.substring(0, 2).toUpperCase() : "?"}
                </span>
            )}
        </div>
    );
};

// --- HELPER: NORMALIZZAZIONE DATI ---
const normalizeItemData = (item, type) => {
    // 1. TESTO: Priorità assoluta al testo calcolato dal backend
    const descrizioneHtml = item.testo_formattato_personaggio || item.testo_formattato || item.descrizione || item.effetto || "";

    let data = {
        id: item.id,
        nome: item.nome || item.nome_personalizzato || "Senza Nome",
        livello: item.livello || item.liv || 0,
        descrizioneHtml: descrizioneHtml,
        aura: null, 
        stats: [],  
        bricks: [], 
        tags: [],
        isActive: item.is_active || false,
        isEquipped: item.is_equipaggiato || false
    };

    // 2. AURA: Gestione eterogenea (Oggetti vs Tecniche)
    const sourceAura = item.aura || item.aura_richiesta;
    if (sourceAura) {
        data.aura = {
            nome: sourceAura.nome,
            colore: sourceAura.colore,
            // Backend Django ImageField: cerca 'icona' o 'icona_url'
            url: sourceAura.icona_url || sourceAura.icona 
        };
    }

    // 3. LOGICA SPECIFICA PER TIPO
    if (type === 'OGGETTO' || type === 'MODULO') {
        // Stats: Unione Modificatori (dall'oggetto specifico) e Statistiche Base (dal template)
        const rawStats = [...(item.modificatori || []), ...(item.statistiche || [])];
        
        data.stats = rawStats.map(s => {
            // Risolve nested objects (modificatore -> statistica)
            const statDef = s.statistica || s; 
            return {
                nome: statDef.nome || s.nome_statistica || "Stat",
                valore: s.valore,
                // Icona: priorità a quella definita nella statistica
                icona: statDef.icona_url || statDef.icona,
                sigla: statDef.sigla || s.sigla
            };
        });
        
        // Componenti (Mattoni)
        data.bricks = (item.componenti || []).map(c => ({
            valore: c.valore || 1,
            nome: c.caratteristica?.nome,
            icona: c.caratteristica?.icona_url || c.caratteristica?.icona
        }));

        // Tags
        if (item.tipo_oggetto_display) data.tags.push({ label: item.tipo_oggetto_display });
        if (item.classe_oggetto_nome) data.tags.push({ label: item.classe_oggetto_nome });
        
        // Flag Pesante (Check profondo)
        if (item.is_pesante || item.oggetto_base?.is_pesante) {
            data.tags.push({ label: "PESANTE", isAlert: true });
        }

    } else if (type === 'TESSITURA' || type === 'CERIMONIALE') {
        data.tags.push({ label: item.scuola_magia || "Arcano" });
        if (item.costo_mana) data.tags.push({ label: `Mana: ${item.costo_mana}` });
        if (item.tempo_lancio) data.tags.push({ label: `Cast: ${item.tempo_lancio}s` });
        
    } else if (type === 'INFUSIONE') {
        data.tags.push({ label: item.slot_richiesto || "Slot Universale" });
    }

    return data;
};

// --- COMPONENTE EXPORT ---
const UniversalItemCard = memo(({ 
    item, 
    type = 'OGGETTO', 
    isExpanded, 
    onToggle, 
    actions, 
    footerInfo 
}) => {
    
    const data = normalizeItemData(item, type);

    // Stile Bordo Dinamico
    const getCardStyle = () => {
        if (data.isActive) return 'border-green-500/50 bg-green-900/10 shadow-[0_0_10px_rgba(34,197,94,0.1)]';
        if (data.isEquipped) return 'border-yellow-600/60 bg-yellow-900/10';
        return 'border-gray-700 bg-gray-800/40 hover:border-gray-600';
    };

    return (
        <div className={`relative mb-2 rounded-lg border flex flex-col transition-all ${getCardStyle()}`}>
            
            {/* --- HEADER --- */}
            <div className="p-2 flex items-center justify-between cursor-pointer gap-3" onClick={() => onToggle && onToggle(item.id)}>
                
                {/* ICONA AURA */}
                <div className="shrink-0">
                    <UniversalIcon 
                        url={data.aura?.url} 
                        color={data.aura?.colore} 
                        label={data.aura?.nome} 
                        size="md"
                        shape={type === 'TESSITURA' ? 'circle' : 'square'}
                    />
                </div>

                {/* INFO CENTRALI */}
                <div className="flex-1 min-w-0">
                    <h4 className={`font-bold text-sm leading-tight truncate ${data.isEquipped ? 'text-yellow-400' : 'text-gray-200'}`}>
                        {data.nome}
                    </h4>
                    <div className="flex items-center gap-2 text-[10px] text-gray-500 uppercase tracking-wider mt-0.5">
                        {data.tags.map((tag, i) => (
                            <span key={i} className={`flex items-center ${tag.isAlert ? "text-red-400 font-bold" : ""}`}>
                                {tag.isAlert && <AlertTriangle size={10} className="mr-0.5" />}
                                {tag.label}
                                {i < data.tags.length - 1 && <span className="mx-1 opacity-50">•</span>}
                            </span>
                        ))}
                    </div>
                </div>

                {/* MATTONI & LIVELLO */}
                <div className="flex flex-col items-end gap-1 shrink-0">
                    {/* Render Mattoni (Componenti) */}
                    {data.bricks.length > 0 && (
                        <div className="flex flex-wrap justify-end gap-0.5 max-w-[80px]">
                            {data.bricks.map((brick, idx) => (
                                <div key={idx} className="w-4 h-4 bg-gray-800 border border-gray-600 rounded-sm p-px" title={brick.nome}>
                                    {brick.icona ? <img src={brick.icona} className="w-full h-full object-contain" alt={brick.nome}/> : <div className="bg-gray-600 w-full h-full"/>}
                                </div>
                            ))}
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
                    
                    {/* Attacco (Solo oggetti fisici) */}
                    {item.attacco_formattato && (
                        <div className="bg-red-900/20 border border-red-900/40 p-2 rounded flex items-center gap-2 text-red-300 text-xs font-bold mb-2 shadow-inner">
                            <Swords size={14} /> <span>{item.attacco_formattato}</span>
                        </div>
                    )}

                    {/* Statistiche (Usa PunteggioDisplay per le icone) */}
                    {data.stats.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-2">
                            {data.stats.map((stat, idx) => {
                                // Se ha l'icona, usiamo il componente grafico
                                if (stat.icona) {
                                    return (
                                        <PunteggioDisplay 
                                            key={idx} 
                                            sigla={stat.sigla} 
                                            valore={stat.valore} 
                                            iconaUrl={stat.icona} 
                                            size="sm" 
                                            showLabel 
                                        />
                                    );
                                }
                                // Fallback testuale per stats senza icona (solo se valore != 0)
                                if (stat.valore === 0) return null;
                                return (
                                    <div key={idx} className="bg-gray-900 border border-gray-600 px-2 py-1 rounded text-xs flex gap-1 items-center shadow-sm">
                                        <span className="text-gray-400 font-bold">{stat.nome}</span>
                                        <span className={stat.valore > 0 ? "text-green-400 font-mono" : "text-red-400 font-mono"}>
                                            {stat.valore > 0 ? '+' : ''}{stat.valore}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* DESCRIZIONE (HTML renderizzato sicuro) */}
                    <div className="text-xs text-gray-300 bg-black/20 p-2 rounded border border-gray-700/30 mb-2 prose prose-invert max-w-none leading-relaxed">
                        <div dangerouslySetInnerHTML={{ __html: data.descrizioneHtml || "<i>Nessuna descrizione.</i>" }} />
                        
                        {/* Data Scadenza (es. buff temporanei) */}
                        {item.data_fine_attivazione && (
                             <div className="mt-2 pt-2 border-t border-gray-700/50 text-[10px] text-orange-400 font-mono text-right flex items-center justify-end gap-1">
                                 <Clock size={10} /> Scade: {new Date(item.data_fine_attivazione).toLocaleString()}
                             </div>
                        )}
                    </div>

                    {/* Info Cariche e Durata */}
                    {(item.cariche_massime > 0 || item.durata_totale > 0) && (
                        <div className="flex items-center gap-4 bg-gray-900/50 p-2 rounded border border-gray-700/50 text-xs mb-2">
                            {item.cariche_massime > 0 && (
                                <div className="flex items-center gap-2">
                                    <Battery size={14} className={item.cariche_attuali === 0 ? "text-red-500" : "text-yellow-500"}/>
                                    <span className="font-mono font-bold text-gray-200">{item.cariche_attuali} / {item.cariche_massime}</span>
                                </div>
                            )}
                            {item.durata_totale > 0 && (
                                <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
                                    <Clock size={14} className="text-blue-400"/>
                                    <span className="font-mono font-bold text-gray-200">{item.durata_totale}s</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Moduli Installati (Ricorsione per oggetti dentro oggetti) */}
                    {item.potenziamenti_installati?.length > 0 && (
                        <div className="pl-3 border-l-2 border-indigo-500/30 mb-2 mt-2">
                            <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                                <Zap size={10}/> Moduli Installati
                            </p>
                            {item.potenziamenti_installati.map(mod => (
                                <UniversalItemCard 
                                    key={mod.id} 
                                    item={mod} 
                                    type="MODULO" // Usa rendering semplificato se necessario
                                    isExpanded={false} // Chiusi di default
                                />
                            ))}
                        </div>
                    )}

                    {/* Footer Info (Es. Prezzo in crediti) */}
                    {footerInfo && <div className="mb-2 pt-2 border-t border-gray-800">{footerInfo}</div>}

                    {/* Pulsanti Azione */}
                    {actions && <div className="flex gap-2 pt-2 border-t border-gray-700/30">{actions}</div>}
                </div>
            )}
        </div>
    );
});

export default UniversalItemCard;