import { useCallback } from 'react';
import { useCharacter } from '../components/CharacterContext';

export const useTimers = () => {
    // Accediamo allo stato globale dei timer e alla funzione di aggiornamento nel Context
    const { activeTimers, setActiveTimers } = useCharacter();
    /**
     * Aggiunge o aggiorna un timer nello stato globale.
     * Gestisce sia la durata (secondi) che la data di fine assoluta.
     */
    const addTimer = useCallback((config) => {
        const { 
            id, 
            label, 
            duration, 
            endsAt, 
            alert_suono, 
            notifica_push, 
            messaggio_in_app 
        } = config;

        // Calcoliamo il timestamp di fine (millisecondi)
        // 1. Se il backend ci ha dato una data ISO (endsAt), la convertiamo
        // 2. Altrimenti calcoliamo ora + durata in secondi
        const finalExpiration = endsAt 
            ? new Date(endsAt).getTime() 
            : Date.now() + (parseInt(duration) * 1000);

        setActiveTimers(prevTimers => {
            // Verifichiamo se esiste già un timer con lo stesso ID o Tipo
            // (Per gestire il cumulo visivo lato frontend)
            const existingIndex = prevTimers.findIndex(t => t.id === id);

            const newTimerEntry = {
                id,
                label: label || "Operazione",
                endsAt: finalExpiration,
                // Conserviamo i flag per il componente TimerOverlay
                flags: {
                    sound: alert_suono,
                    push: notifica_push,
                    inApp: messaggio_in_app
                },
                notified: false // Per evitare notifiche multiple dello stesso timer
            };

            if (existingIndex > -1) {
                // Se esiste, lo aggiorniamo (il cumulo del tempo è già calcolato dal backend o qui sopra)
                const updatedTimers = [...prevTimers];
                updatedTimers[existingIndex] = newTimerEntry;
                return updatedTimers;
            }

            // Altrimenti lo aggiungiamo alla lista
            return [...prevTimers, newTimerEntry];
        });
    }, [useTimers]);

    const removeTimer = useCallback((id) => {
        setActiveTimers(prev => prev.filter(t => t.id !== id));
    }, [setActiveTimers]);
    return {
        activeTimers,
        addTimer,
        removeTimer
    };
};