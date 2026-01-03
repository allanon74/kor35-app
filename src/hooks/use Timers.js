import { useState, useEffect } from 'react';

export const useTimers = (socketMessage) => {
    const [activeTimers, setActiveTimers] = useState({});

    useEffect(() => {
        if (socketMessage?.action === 'TIMER_SYNC') {
            const data = socketMessage.payload;
            setActiveTimers(prev => ({
                ...prev,
                [data.nome]: {
                    ...data,
                    endTime: new Date(data.data_fine).getTime()
                }
            }));
        }
    }, [socketMessage]);

    const removeTimer = (nome) => {
        setActiveTimers(prev => {
            const newTimers = { ...prev };
            delete newTimers[nome];
            return newTimers;
        });
    };

    return { activeTimers, removeTimer };
};