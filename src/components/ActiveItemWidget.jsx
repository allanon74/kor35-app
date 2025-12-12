import React, { useState, useEffect } from 'react';
import { Zap, Clock, Battery, BatteryWarning, Weight } from 'lucide-react'; // Aggiunto Weight
import { usaCarica } from '../api';

const ActiveItemWidget = ({ item, onUpdate, onClick }) => { // Aggiunto onClick destrutturato se serve passarlo al div
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(null);
  const [error, setError] = useState(null);

  // Gestione Timer
  useEffect(() => {
    if (!timer) return;
    const interval = setInterval(() => {
      setTimer((prev) => (prev > 0 ? prev - 1 : null));
    }, 1000);
    return () => clearInterval(interval);
  }, [timer]);

  const handleActivate = async (e) => {
    // Evita la propagazione se il widget è cliccabile interamente
    e.stopPropagation(); 

    if (item.cariche_attuali <= 0) return;
    setLoading(true);
    setError(null);

    try {
      const data = await usaCarica(item.id);
      
      // Se l'API restituisce una durata, impostiamo il timer
      if (data.timer_durata > 0) {
        setTimer(data.timer_durata);
      }
      
      // Callback per aggiornare i dati del personaggio (crediti/cariche)
      if (onUpdate) onUpdate();
      
    } catch (err) {
      console.error(err);
      setError("Errore");
    } finally {
      setLoading(false);
    }
  };

  const isScarico = item.cariche_attuali === 0;

  return (
    <div 
      className="relative bg-gray-800 border border-gray-700 rounded-lg p-3 w-40 flex flex-col gap-2 shadow-lg hover:border-gray-500 transition-colors group"
      // Se vuoi che l'intera card sia cliccabile per dettagli, altrimenti rimuovi onClick qui
      onClick={() => onClick && onClick(item)} 
    >
      {/* HEADER: Nome Oggetto e Icone Stato */}
      <div className="flex justify-between items-start">
        <h4 className="text-sm font-bold text-gray-100 leading-tight line-clamp-2 min-h-[2.5em]">
          {item.nome}
        </h4>
        
        <div className="flex flex-col gap-1 items-end">
            {/* Indicatore Oggetto Speciale */}
            {item.is_speciale && (
                <span className="bg-cyan-900 text-cyan-300 text-[10px] px-1.5 py-0.5 rounded border border-cyan-700 font-mono">
                    SPC
                </span>
            )}
            
            {/* --- MODIFICA: Indicatore Oggetto Pesante --- */}
            {item.is_pesante && (
                <div title="Oggetto Pesante (Conta per OGP)" className="text-orange-400 bg-orange-900/30 rounded p-0.5">
                    <Weight size={14} strokeWidth={2.5} />
                </div>
            )}
        </div>
      </div>

      {/* BODY: Info Cariche */}
      <div className="flex items-center justify-between mt-auto">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          {isScarico 
            ? <BatteryWarning className="w-4 h-4 text-red-400" /> 
            : <Battery className="w-4 h-4 text-green-400" />
          }
          <span>{item.cariche_attuali}</span>
        </div>
        {error && <span className="text-[10px] text-red-400">{error}</span>}
      </div>

      {/* FOOTER: Pulsante Azione / Timer */}
      <div className="mt-1">
        {timer ? (
          <div className="flex items-center justify-center gap-2 bg-gray-900 px-2 py-1.5 rounded text-orange-400 font-mono font-bold text-xs border border-orange-900/50">
            <Clock className="w-3.5 h-3.5 animate-pulse" />
            {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
          </div>
        ) : (
          <button
            onClick={handleActivate}
            disabled={loading || isScarico}
            className={`w-full flex items-center justify-center gap-2 px-2 py-1.5 rounded text-xs font-bold uppercase tracking-wider transition-all shadow-md active:scale-95
              ${isScarico 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
                : 'bg-blue-600 hover:bg-blue-500 text-white border border-blue-400 shadow-blue-900/20'
              }`}
          >
            {loading ? (
               <span className="animate-spin">⌛</span> 
            ) : (
               <><Zap size={12} fill="currentColor" /> USA</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveItemWidget;