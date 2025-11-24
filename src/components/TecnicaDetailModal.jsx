import React from 'react';
import { X, Hexagon, Zap, Book, Box } from 'lucide-react';
import IconaPunteggio from './IconaPunteggio';

const TecnicaDetailModal = ({ tecnica, type, onClose }) => {
  if (!tecnica) return null;

  // --- MODIFICA: Logica Costi ---
  const costoPieno = tecnica.costo_pieno ?? (tecnica.costo_crediti || tecnica.livello * 100);
  const costoEffettivo = tecnica.costo_effettivo ?? costoPieno;
  const hasDiscount = costoEffettivo < costoPieno;

  // Determina icona e colore in base al tipo
  let TypeIcon = Zap;
  let typeColor = "text-indigo-400";
  let typeBg = "bg-indigo-900/30";
  let mainIconUrl = null;
  let mainIconColor = null;

  if (type === "Tessitura") {
    TypeIcon = Book;
    typeColor = "text-blue-400";
    typeBg = "bg-blue-900/30";
    mainIconUrl = tecnica.aura_richiesta?.icona_url;
    mainIconColor = tecnica.aura_richiesta?.colore;
  } else if (type === "Infusione") {
    TypeIcon = Hexagon;
    typeColor = "text-purple-400";
    typeBg = "bg-purple-900/30";
    mainIconUrl = tecnica.aura_richiesta?.icona_url;
    mainIconColor = tecnica.aura_richiesta?.colore;
  } else if (type === "Oggetto") {
    TypeIcon = Box;
    typeColor = "text-amber-400";
    typeBg = "bg-amber-900/30";
    mainIconUrl = tecnica.aura?.icona_url; // Fallback se oggetto ha aura
  }

  // Gestione Elementi/Mattoni (come nel codice originale)
  const renderElements = () => {
    if (tecnica.mattoni && tecnica.mattoni.length > 0) {
        return (
            <div className="flex flex-wrap gap-2 mt-2">
                {tecnica.mattoni.map((m, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded text-xs border border-gray-600">
                        <IconaPunteggio url={m.mattone.icona_url} color={m.mattone.colore} size="xs" />
                        <span className="text-gray-300">{m.mattone.nome} ({m.quantita})</span>
                    </div>
                ))}
            </div>
        )
    }
    if (tecnica.elementi && tecnica.elementi.length > 0) {
         return (
            <div className="flex flex-wrap gap-2 mt-2">
                {tecnica.elementi.map((el, idx) => (
                    <div key={idx} className="flex items-center gap-1 bg-gray-700/50 px-2 py-1 rounded text-xs border border-gray-600">
                        <IconaPunteggio url={el.elemento?.icona_url || el.icona_url} color={el.elemento?.colore || el.colore} size="xs" />
                        <span className="text-gray-300">{el.elemento?.nome || el.nome}</span>
                    </div>
                ))}
            </div>
        )
    }
    return null;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn" onClick={onClose}>
      <div 
        className="bg-gray-800 w-full max-w-lg rounded-xl border border-gray-700 shadow-2xl overflow-hidden transform transition-all animate-slideIn"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gray-900/50 p-6 border-b border-gray-700 flex justify-between items-start">
            <div className="flex gap-4">
                <div className={`p-3 rounded-lg ${typeBg} border border-gray-700 shrink-0`}>
                    {mainIconUrl ? (
                        <IconaPunteggio url={mainIconUrl} color={mainIconColor} size="m" mode="cerchio" />
                    ) : (
                        <TypeIcon className={`w-8 h-8 ${typeColor}`} />
                    )}
                </div>
                <div>
                    <h3 className="text-xl font-bold text-white mb-1">{tecnica.nome}</h3>
                    <div className="flex items-center gap-2 text-sm">
                        <span className={`${typeColor} font-medium uppercase tracking-wider text-xs`}>
                            {type}
                        </span>
                        <span className="text-gray-500">•</span>
                        <span className="text-gray-400">Livello {tecnica.livello}</span>
                    </div>
                    {renderElements()}
                </div>
            </div>
            
            <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-1">
                <X size={24} />
            </button>
        </div>

        {/* Body */}
        <div className="p-6 max-h-[60vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-600 scrollbar-track-transparent">
            
            {/* Statistiche Base (se presenti) */}
            {tecnica.statistiche_base && tecnica.statistiche_base.length > 0 && (
                <div className="mb-6 flex flex-wrap gap-3">
                    {tecnica.statistiche_base.map((stat, i) => (
                        <div key={i} className="bg-gray-900/40 px-3 py-1.5 rounded border border-gray-700 text-xs font-mono text-gray-300">
                            <span className="text-indigo-400 font-bold">{stat.statistica.nome}:</span> {stat.valore}
                        </div>
                    ))}
                </div>
            )}

            {/* Descrizione HTML renderizzata */}
            <div className="prose prose-invert prose-sm max-w-none">
                {/* Usa testo_formattato_personaggio se disponibile (backend rendering), altrimenti fallback */}
                <div dangerouslySetInnerHTML={{ __html: tecnica.testo_formattato_personaggio || tecnica.TestoFormattato || tecnica.testo }} />
            </div>
        </div>

        {/* Footer Info Costo */}
        <div className="bg-gray-900 p-4 border-t border-gray-700 flex justify-between items-center">
            <div className="text-xs text-gray-500">
                ID: {tecnica.id}
            </div>
            
            {/* --- MODIFICA: Visualizzazione Costo Scontato --- */}
            {(costoEffettivo > 0) && (
                <div className="flex items-center gap-3">
                    {hasDiscount && (
                        <span className="text-sm text-red-400 line-through decoration-red-500 opacity-70">
                            {costoPieno} CR
                        </span>
                    )}
                    <div className={`flex items-center gap-1 font-bold ${hasDiscount ? 'text-green-400' : 'text-yellow-500'}`}>
                       <span>{costoEffettivo}</span> <span className="text-xs font-normal text-gray-400">CR</span>
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default TecnicaDetailModal;