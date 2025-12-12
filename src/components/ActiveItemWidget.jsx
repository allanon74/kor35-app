import React, { useState, useEffect } from 'react';
import { Zap, Clock, Battery, BatteryWarning, Weight } from 'lucide-react'; // [UPDATE] Import Weight
import { usaCarica } from '../api';

const ActiveItemWidget = ({ item, onUpdate }) => {
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

  const handleActivate = async () => {
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

  const isScarico = item.cariche_attuali <= 0;

  return (
    <div className={`flex justify-between items-center p-3 rounded-md border-l-4 bg-gray-800 shadow-sm transition-all ${
      isScarico ? 'border-red-500 opacity-80' : 'border-green-500'
    }`}>
      
      {/* INFO OGGETTO */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <span className="font-bold text-gray-200">{item.nome}</span>
          {/* [UPDATE] Icona Pesante */}
          {item.is_pesante && (
             <div title="Oggetto Pesante" className="text-orange-400">
               <Weight size={14} />
             </div>
          )}
          {item.slot_corpo && (
            <span className="text-[10px] uppercase font-bold bg-gray-700 text-gray-400 px-1.5 py-0.5 rounded">
              {item.slot_corpo}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2 mt-1 text-sm text-gray-400">
          {isScarico 
            ? <BatteryWarning className="w-4 h-4 text-red-400" /> 
            : <Battery className="w-4 h-4 text-green-400" />
          }
          <span>{item.cariche_attuali} Cariche</span>
        </div>
        {error && <span className="text-xs text-red-400 mt-1">{error}</span>}
      </div>

      {/* AZIONE */}
      <div>
        {timer ? (
          <div className="flex items-center gap-2 bg-gray-900 px-3 py-1.5 rounded text-orange-400 font-mono font-bold">
            <Clock className="w-4 h-4 animate-pulse" />
            {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, '0')}
          </div>
        ) : (
          <button
            onClick={handleActivate}
            disabled={loading || isScarico}
            className={`flex items-center gap-2 px-3 py-1.5 rounded text-sm font-semibold transition-all shadow-md active:scale-95
              ${isScarico 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
          >
            {loading ? (
              <span className="animate-spin">⟳</span>
            ) : (
              <>
                <Zap className="w-4 h-4 fill-current" /> Attiva
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveItemWidget;