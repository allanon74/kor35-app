import React, { useState, useEffect } from 'react';
import { Loader2, Hammer, CheckCircle } from 'lucide-react';
import { completeForging } from '../api';
import { useCharacter } from './CharacterContext';

const ForgingItem = ({ item, onComplete }) => {
  const [timeLeft, setTimeLeft] = useState(item.secondi_rimanenti);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Calcola il tempo rimanente reale basato sulla data di fine
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

  return (
    <div className="bg-gray-800 border border-gray-700 p-3 rounded-lg flex items-center justify-between shadow-sm animate-fadeIn">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-full ${isReady ? 'bg-green-900/30 text-green-400' : 'bg-orange-900/30 text-orange-400'}`}>
            {isReady ? <CheckCircle size={20} /> : <Hammer size={20} className="animate-pulse" />}
        </div>
        <div>
            <h4 className="font-bold text-gray-200 text-sm">{item.infusione_nome}</h4>
            <div className="text-xs text-gray-400">
                {isReady ? "Pronto per il ritiro" : `Completamento in: ${formatTime(timeLeft)}`}
            </div>
        </div>
      </div>

      <button
        onClick={handleCollect}
        disabled={!isReady || isProcessing}
        className={`px-4 py-1.5 rounded text-sm font-bold transition-all ${
            isReady 
            ? 'bg-green-600 hover:bg-green-500 text-white shadow-lg shadow-green-900/20' 
            : 'bg-gray-700 text-gray-500 cursor-not-allowed'
        }`}
      >
        {isProcessing ? <Loader2 className="animate-spin" size={16} /> : "Ritira"}
      </button>
    </div>
  );
};

const ForgingQueue = ({ queue, refetchQueue }) => {
  const { selectedCharacterId, refreshCharacterData } = useCharacter();

  const handleComplete = async (forgiaturaId) => {
    try {
        await completeForging(forgiaturaId, selectedCharacterId);
        // Aggiorna sia la coda che l'inventario del PG
        await Promise.all([refetchQueue(), refreshCharacterData()]);
    } catch (error) {
        alert("Errore nel ritiro: " + error.message);
        throw error; // Rilancia per gestire lo stato di loading nel figlio
    }
  };

  if (!queue || queue.length === 0) return null;

  return (
    <div className="mb-6 space-y-2">
        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
            Forgia in Corso ({queue.length})
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