import React, { useState, useEffect } from 'react';
import { Loader2, Hammer, CheckCircle, Clock, User, ArrowRight } from 'lucide-react';
import { completeForging } from '../api';
import { useCharacter } from './CharacterContext';

/**
 * Componente per singolo elemento della coda.
 * Gestisce il conto alla rovescia locale e lo stato del pulsante.
 */
const ForgingItem = ({ item, onComplete, currentCharacterId }) => {
  const [timeLeft, setTimeLeft] = useState(item.secondi_rimanenti);
  const [isProcessing, setIsProcessing] = useState(false);

  // Timer locale per aggiornare il countdown ogni secondo
  useEffect(() => {
    const calculateTimeLeft = () => {
        const now = new Date();
        const end = new Date(item.data_fine);
        const diff = Math.max(0, (end - now) / 1000);
        return diff;
    };

    setTimeLeft(calculateTimeLeft());

    const interval = setInterval(() => {
      const remaining = calculateTimeLeft();
      setTimeLeft(remaining);
      if (remaining <= 0) clearInterval(interval);
    }, 1000);

    return () => clearInterval(interval);
  }, [item.data_fine]);

  const handleCollect = async () => {
    setIsProcessing(true);
    try {
        await onComplete(item.id);
    } catch (e) {
        setIsProcessing(false);
    }
  };

  const isReady = timeLeft <= 0;
  
  // Format MM:SS
  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Logica per determinare se posso ritirare
  // (Il backend invia 'can_collect', ma facciamo un check di sicurezza anche qui)
  const canCollect = item.can_collect !== undefined ? item.can_collect : true;

  return (
    <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center justify-between shadow-sm animate-fadeIn hover:bg-gray-750 transition-colors">
      <div className="flex items-center gap-3">
        {/* Icona Stato */}
        <div className={`p-2 rounded-full ${isReady ? 'bg-green-900/30 text-green-400' : 'bg-amber-900/30 text-amber-500'}`}>
            {isReady ? <CheckCircle size={20} /> : <Hammer size={20} className={timeLeft > 0 ? "animate-pulse" : ""} />}
        </div>
        
        {/* Dettagli Task */}
        <div>
            <h4 className="font-bold text-gray-200 text-sm">{item.infusione_nome}</h4>
            
            {/* Info Extra: Chi lavora per chi */}
            {item.info_extra && (
                <div className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5 font-medium">
                    <User size={12}/> {item.info_extra}
                </div>
            )}

            {/* Timer / Stato */}
            <div className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                <Clock size={12}/>
                {isReady ? (
                    <span className="text-green-400 font-bold">Completato</span>
                ) : (
                    <span>Termina in: <span className="font-mono text-gray-300">{formatTime(timeLeft)}</span></span>
                )}
            </div>
        </div>
      </div>

      {/* Azione: Ritira o Status */}
      {isReady ? (
          canCollect ? (
            <button
                onClick={handleCollect}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded text-xs font-bold transition-all bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 flex items-center gap-2 active:scale-95 disabled:opacity-50"
            >
                {isProcessing ? <Loader2 className="animate-spin" size={14} /> : "Ritira"}
            </button>
          ) : (
            <span className="text-xs text-gray-500 italic px-2 bg-gray-900/50 py-1 rounded">
                In attesa che il cliente ritiri
            </span>
          )
      ) : (
        <div className="text-gray-500 text-xs italic px-2 flex flex-col items-end">
            <span>In lavorazione</span>
        </div>
      )}
    </div>
  );
};

/**
 * Contenitore della Coda.
 */
const ForgingQueue = ({ queue, refetchQueue }) => {
  const { selectedCharacterId, refreshCharacterData } = useCharacter();

  const handleComplete = async (forgiaturaId) => {
    try {
        await completeForging(forgiaturaId, selectedCharacterId);
        // Aggiorna sia la coda (rimuove item) che l'inventario (aggiunge oggetto)
        await Promise.all([refetchQueue(), refreshCharacterData()]);
    } catch (error) {
        alert("Errore nel ritiro: " + error.message);
    }
  };

  if (!queue || queue.length === 0) return null;

  return (
    <div className="mb-6 bg-gray-800/50 border border-gray-700 rounded-lg p-4 shadow-lg">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 flex items-center gap-2 border-b border-gray-700 pb-2">
            <Hammer size={16} className="text-amber-500"/> 
            Coda di Forgiatura <span className="text-gray-600">({queue.length})</span>
        </h3>
        
        <div className="space-y-2">
            {queue.map(item => (
                <ForgingItem 
                    key={item.id} 
                    item={item} 
                    onComplete={handleComplete} 
                    currentCharacterId={selectedCharacterId}
                />
            ))}
        </div>
    </div>
  );
};

export default ForgingQueue;