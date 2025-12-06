import React, { useState, useEffect } from 'react';
import { Loader2, Hammer, CheckCircle, User, Clock } from 'lucide-react';
import { completeForging } from '../api';
import { useCharacter } from './CharacterContext';

const ForgingItem = ({ item, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(item.secondi_rimanenti);
  const [isProcessing, setIsProcessing] = useState(false);

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
  
  // Se il backend non manda 'can_collect', assumiamo true (comportamento legacy)
  const canCollect = item.can_collect !== undefined ? item.can_collect : true;

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center justify-between shadow-sm animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isReady ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
            {isReady ? <CheckCircle size={20} /> : <Hammer size={20} className="animate-pulse" />}
        </div>
        <div>
            <h4 className="font-bold text-gray-200 text-sm">{item.infusione_nome}</h4>
            
            {/* INFO EXTRA: Chi lavora per chi */}
            {item.info_extra && (
                <div className="text-xs text-indigo-300 flex items-center gap-1 mt-0.5">
                    <User size={12}/> {item.info_extra}
                </div>
            )}

            <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                <Clock size={12}/>
                {isReady ? "Pronto per il ritiro" : `Completamento in: ${formatTime(timeLeft)}`}
            </div>
        </div>
      </div>

      {/* Pulsante Ritira: Visibile solo se pronto E se l'utente è il destinatario */}
      {isReady ? (
          canCollect ? (
            <button
                onClick={handleCollect}
                disabled={isProcessing}
                className="px-4 py-1.5 rounded text-sm font-bold transition-all bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20 flex items-center gap-2"
            >
                {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "Ritira"}
            </button>
          ) : (
            <span className="text-xs text-gray-500 italic px-2">In attesa ritiro</span>
          )
      ) : (
        <div className="text-gray-500 text-xs italic px-2">In corso...</div>
      )}
    </div>
  );
};

const ForgingQueue = ({ queue, refetchQueue }) => {
  const { selectedCharacterId, refreshCharacterData } = useCharacter();

  const handleComplete = async (forgiaturaId) => {
    try {
        await completeForging(forgiaturaId, selectedCharacterId);
        await Promise.all([refetchQueue(), refreshCharacterData()]);
    } catch (error) {
        alert("Errore nel ritiro: " + error.message);
        throw error; 
    }
  };

  if (!queue || queue.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
            <Hammer size={16}/> Coda di Forgiatura ({queue.length})
        </h3>
        <div className="grid gap-2">
            {queue.map(item => (
                <ForgingItem key={item.id} item={item} onComplete={handleComplete} />
            ))}
        </div>
    </div>
  );
};

export default ForgingQueue;