import React, { useState, useEffect } from 'react';
import { Zap, Clock, Battery, BatteryWarning, Weight } from 'lucide-react';
import { usaCarica } from '../api';

const ActiveItemWidget = ({ item, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [error, setError] = useState(null);

  // Gestione Timer Corretta (Countdown basato su data_fine)
  useEffect(() => {
    const calculateTimeLeft = () => {
        if (!item.data_fine_attivazione) return 0;
        const now = Date.now();
        const end = new Date(item.data_fine_attivazione).getTime();
        return Math.max(0, Math.floor((end - now) / 1000));
    };

    // Set iniziale
    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
        const remaining = calculateTimeLeft();
        setTimeLeft(remaining);
        if (remaining <= 0 && item.data_fine_attivazione) {
            // Se scade, potremmo voler aggiornare lo stato genitore
            // onUpdate(); // Opzionale: refresh quando scade
        }
    }, 1000);

    return () => clearInterval(interval);
  }, [item.data_fine_attivazione]);

  const handleActivate = async () => {
    if (item.cariche_attuali <= 0) return;
    setLoading(true);
    setError(null);

    try {
      const data = await usaCarica(item.id);
      // La risposta dell'API contiene la nuova data_fine_attivazione
      // Chiamando onUpdate, ricarichiamo i dati del personaggio e il timer si aggiornerà via useEffect
      if (onUpdate) onUpdate();
      
    } catch (err) {
      console.error(err);
      setError("Errore");
    } finally {
      setLoading(false);
    }
  };

  const isScarico = item.cariche_attuali <= 0;
  const isTimerRunning = timeLeft > 0;

  // Formatta timer mm:ss
  const formatTimer = (s) => {
      const min = Math.floor(s / 60);
      const sec = s % 60;
      return `${min}:${String(sec).padStart(2, '0')}`;
  };

  return (
    <div className={`relative flex flex-col justify-between p-3 rounded-lg border bg-gray-800 shadow-md transition-all w-32 min-h-32 hover:border-gray-500 group ${
      isScarico ? 'border-red-500/50 opacity-80' : 'border-gray-700'
    }`}>
      
      {/* HEADER */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex flex-col w-full">
            <span className="font-bold text-gray-200 text-xs leading-tight line-clamp-2 min-h-[2.5em]">{item.nome}</span>
            {item.is_pesante && (
                <div className="absolute top-2 right-2 text-orange-500 bg-gray-900 rounded-full p-0.5 shadow-sm" title="Oggetto Pesante">
                    <Weight size={12} />
                </div>
            )}
        </div>
      </div>
      
      {/* BODY INFO */}
      <div className="flex items-center gap-1.5 mt-auto text-[10px] text-gray-400 font-mono">
          {isScarico 
            ? <BatteryWarning className="w-3 h-3 text-red-400" /> 
            : <Battery className="w-3 h-3 text-green-400" />
          }
          <span>{item.cariche_attuali}</span>
      </div>
      {error && <span className="text-[10px] text-red-400 absolute bottom-1 right-2">{error}</span>}

      {/* FOOTER BUTTON */}
      <div className="mt-2">
        {isTimerRunning ? (
          <div className="flex items-center justify-center gap-1 bg-gray-900 px-2 py-1 rounded text-orange-400 font-mono font-bold text-[10px] border border-orange-900/50 animate-pulse">
            <Clock className="w-3 h-3" />
            {formatTimer(timeLeft)}
          </div>
        ) : (
          <button
            onClick={handleActivate}
            disabled={loading || isScarico}
            className={`w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded text-[10px] font-bold uppercase tracking-wider transition-all active:scale-95
              ${isScarico 
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed border border-gray-600' 
                : 'bg-indigo-600 hover:bg-indigo-500 text-white border border-indigo-500 shadow-sm'
              }`}
          >
            {loading ? (
              <span className="animate-spin">..</span>
            ) : (
              <><Zap className="w-3 h-3 fill-current" /> USA</>
            )}
          </button>
        )}
      </div>
    </div>
  );
};

export default ActiveItemWidget;