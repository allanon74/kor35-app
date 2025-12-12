import React, { useState, useEffect } from 'react';
import { Activity, Battery, Clock, RefreshCw } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { useOptimisticUseItem, useOptimisticRecharge } from '../hooks/useGameData';

const ActiveItemWidget = ({ item, onUpdate }) => {
    // Gestione ottimistica locale tramite hook già esistenti nel padre o passati qui
    const useItemMutation = useOptimisticUseItem();
    const rechargeMutation = useOptimisticRecharge();
    const { selectedCharacterData } = useCharacter(); // Serve per ID e refresh

    const [timeLeft, setTimeLeft] = useState(0);

    // Sincronizza il timer con data_fine_attivazione
    useEffect(() => {
        if (!item.data_fine_attivazione) {
            setTimeLeft(0);
            return;
        }
        const end = new Date(item.data_fine_attivazione).getTime();
        
        const updateTimer = () => {
            const now = new Date().getTime();
            const diff = Math.floor((end - now) / 1000);
            if (diff <= 0) {
                setTimeLeft(0);
                // Opzionale: chiamare onUpdate() se il timer scade per refreshare lo stato
            } else {
                setTimeLeft(diff);
            }
        };

        updateTimer();
        const interval = setInterval(updateTimer, 1000);
        return () => clearInterval(interval);
    }, [item.data_fine_attivazione]);

    const formatTimer = (s) => {
        const min = Math.floor(s / 60);
        const sec = s % 60;
        return `${min}:${sec < 10 ? '0' : ''}${sec}`;
    };

    const handleUseCharge = () => {
        useItemMutation.mutate({ 
            oggetto_id: item.id, 
            charId: selectedCharacterData.id 
        });
    };

    const handleRecharge = () => {
        if (window.confirm(`Ricaricare ${item.nome}?\nCosto: ${item.costo_ricarica} CR\nMetodo: ${item.testo_ricarica}`)) {
            rechargeMutation.mutate({ 
                oggetto_id: item.id, 
                charId: selectedCharacterData.id 
            });
        }
    };

    // Stili dinamici
    const isWorking = timeLeft > 0;
    const hasCharges = item.cariche_attuali > 0;
    const maxCharges = item.cariche_massime || 0;

    return (
        <div className={`p-3 rounded-lg border shadow-sm w-full sm:w-[calc(50%-0.5rem)] flex flex-col gap-2 transition-all ${isWorking ? 'bg-green-900/20 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.1)]' : 'bg-gray-800 border-gray-700'}`}>
            <div className="flex justify-between items-start">
                <span className={`font-bold text-sm ${isWorking ? 'text-green-400' : 'text-gray-300'}`}>{item.nome}</span>
                {/* Indicatore Stato */}
                {isWorking && <span className="animate-pulse text-green-500"><Activity size={14}/></span>}
            </div>

            {/* BARRA CARICHE */}
            {maxCharges > 0 && (
                <div className="bg-black/30 rounded p-1.5 flex justify-between items-center">
                    <div className="flex items-center gap-1.5 text-xs font-mono">
                         <Battery size={14} className={hasCharges ? "text-yellow-400" : "text-red-500"} />
                         <span className={hasCharges ? "text-white" : "text-red-400"}>{item.cariche_attuali} / {maxCharges}</span>
                    </div>
                    {/* Pulsante USA */}
                    <button 
                        onClick={handleUseCharge}
                        disabled={!hasCharges || isWorking} // Disabilita se non ha cariche o se è già attivo
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider ${
                            hasCharges && !isWorking
                            ? 'bg-emerald-600 hover:bg-emerald-500 text-white border-emerald-500' 
                            : 'bg-gray-700 text-gray-500 border-gray-600 cursor-not-allowed'
                        }`}
                    >
                        {isWorking ? 'ATTIVO' : 'ATTIVA'}
                    </button>
                </div>
            )}

            {/* TIMER E RICARICA */}
            <div className="flex justify-between items-end mt-1">
                <div className="flex flex-col">
                    {item.durata_totale > 0 && (
                        <div className={`text-xs font-mono flex items-center gap-1 ${timeLeft > 0 ? 'text-blue-300 font-bold' : 'text-gray-500'}`}>
                            <Clock size={12} />
                            {timeLeft > 0 ? formatTimer(timeLeft) : <span className="text-[10px]">{formatTimer(item.durata_totale)} (Durata)</span>}
                        </div>
                    )}
                </div>

                {item.costo_ricarica > 0 && item.cariche_attuali < maxCharges && (
                    <button 
                        onClick={handleRecharge}
                        className="text-[10px] flex items-center gap-1 text-yellow-500 hover:text-yellow-300 transition-colors"
                        title={item.testo_ricarica}
                    >
                        <RefreshCw size={12} /> Ricarica ({item.costo_ricarica} CR)
                    </button>
                )}
            </div>
        </div>
    );
};

export default ActiveItemWidget;