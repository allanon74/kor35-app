import React, { useState, useEffect } from 'react';
import { RefreshCw, Zap, Shield, Heart, Activity, Briefcase, Mail, Star, Flame, Droplet } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { apiCall } from '../api';

const GameTab = ({ onNavigate }) => {
  const { selectedCharacterData, refreshData } = useCharacter();
  const [activeTimers, setActiveTimers] = useState({});

  // Aggiornamento locale dei timer per feedback visivo immediato
  useEffect(() => {
    const interval = setInterval(() => {
      if (selectedCharacterData?.oggetti) {
        const now = new Date().getTime();
        const timers = {};
        selectedCharacterData.oggetti.forEach(item => {
          if (item.data_fine_attivazione) {
            const end = new Date(item.data_fine_attivazione).getTime();
            const diff = Math.floor((end - now) / 1000);
            if (diff > 0) timers[item.id] = diff;
          }
        });
        setActiveTimers(timers);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [selectedCharacterData]);

  const handleStatChange = async (sigla, mode) => {
    try {
      await apiCall('/api/game/modifica_stat_temp/', 'POST', {
        char_id: selectedCharacterData.id,
        stat_sigla: sigla,
        mode: mode
      });
      refreshData();
    } catch (error) {
      console.error("Errore stat", error);
    }
  };

  const handleUseItem = async (itemId) => {
    try {
      await apiCall('/api/game/usa_oggetto/', 'POST', { 
          char_id: selectedCharacterData.id,
          oggetto_id: itemId 
      });
      refreshData();
    } catch (error) {
      alert("Impossibile usare oggetto: " + error.message);
    }
  };

  if (!selectedCharacterData) return null;

  // Filtra oggetti "Usabili" (con cariche) che sono equipaggiati o installati
  const usableItems = selectedCharacterData.oggetti.filter(item => {
    // Deve avere cariche O essere un oggetto a tempo attivo
    const hasCharges = item.cariche_attuali > 0 || item.statistica_cariche;
    // Deve essere equipaggiato (se fisico) o installato (se innesto/mod)
    const isEquipped = item.is_equipaggiato || item.ospitato_su || ['MUT', 'INN'].includes(item.tipo_oggetto);
    return hasCharges && isEquipped;
  });

  // Filtra armi equipaggiate per "Attacchi Base"
  const weapons = selectedCharacterData.oggetti.filter(
    item => item.is_equipaggiato && item.attacco_base
  );

  // Configurazione Statistiche Primarie (Personalizza le sigle in base al tuo DB)
  const primaryStats = [
    { sigla: 'SAL', nome: 'Salute', icon: <Heart className="text-red-500" />, color: 'red' },
    { sigla: 'VOL', nome: 'Volontà', icon: <Flame className="text-orange-500" />, color: 'orange' },
    { sigla: 'PSI', nome: 'Psiche', icon: <Star className="text-purple-500" />, color: 'purple' },
    { sigla: 'STA', nome: 'Stamina', icon: <Activity className="text-green-500" />, color: 'green' },
  ];

  return (
    <div className="space-y-6 pb-24 px-2 animate-fadeIn">
      
      {/* 1. STATISTICHE PRIMARIE */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {primaryStats.map(stat => {
          const max = selectedCharacterData.punteggi_base[stat.nome] || 0;
          if (max === 0) return null; // Nascondi se il PG non ha la stat
          
          const current = selectedCharacterData.statistiche_temporanee?.[stat.sigla] ?? max;
          
          return (
            <div key={stat.sigla} className="bg-gray-800 p-3 rounded-xl border border-gray-700 flex items-center justify-between shadow-sm">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-full bg-${stat.color}-900/20`}>{stat.icon}</div>
                <div>
                  <div className="text-xs text-gray-400 uppercase tracking-wider">{stat.nome}</div>
                  <div className="text-2xl font-bold text-white leading-none">
                    {current} <span className="text-sm text-gray-500 font-normal">/ {max}</span>
                  </div>
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleStatChange(stat.sigla, 'consuma')}
                  className="w-10 h-10 flex items-center justify-center bg-red-900/30 text-red-400 rounded-lg hover:bg-red-900/50 active:scale-95 transition-all font-bold border border-red-900/30"
                >
                  -1
                </button>
                <button 
                  onClick={() => handleStatChange(stat.sigla, 'reset')}
                  className="w-10 h-10 flex items-center justify-center bg-emerald-900/30 text-emerald-400 rounded-lg hover:bg-emerald-900/50 active:scale-95 transition-all border border-emerald-900/30"
                >
                  <RefreshCw size={18}/>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. CAPACITA OGGETTI (Sola Lettura) */}
      <div className="bg-gray-900/60 p-3 rounded-lg flex justify-between items-center text-sm border border-gray-700 backdrop-blur-sm">
        <span className="text-gray-400 flex items-center gap-2"><Briefcase size={16}/> Capacità Oggetti (COG)</span>
        <span className="font-mono text-amber-400 font-bold">
           {/* Questo calcolo andrebbe fatto nel backend e passato, qui esempio */}
           Max: {selectedCharacterData.punteggi_base['Capacità Oggetti'] || 0}
        </span>
      </div>

      {/* 3. OGGETTI ATTIVI / RICARICABILI */}
      {usableItems.length > 0 && (
        <section>
          <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 pl-1">Dispositivi & Attivabili</h3>
          <div className="space-y-3">
            {usableItems.map(item => {
              const secondsLeft = activeTimers[item.id] || 0;
              const isTimerActive = secondsLeft > 0;
              
              return (
                <div key={item.id} className={`bg-gray-800 p-4 rounded-xl border transition-all ${isTimerActive ? 'border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-gray-700'}`}>
                  <div className="flex justify-between items-start mb-3">
                    <div>
                        <h4 className={`font-bold ${isTimerActive ? 'text-emerald-300' : 'text-white'}`}>{item.nome}</h4>
                        <div className="text-xs text-gray-500">{item.tipo_oggetto_display}</div>
                    </div>
                    {isTimerActive && (
                      <span className="bg-emerald-900/40 text-emerald-400 font-mono text-sm px-2 py-1 rounded border border-emerald-500/30 animate-pulse flex items-center gap-2">
                        <Activity size={14}/> 
                        {Math.floor(secondsLeft / 60)}:{(secondsLeft % 60).toString().padStart(2, '0')}
                      </span>
                    )}
                  </div>
                  
                  <div className="flex justify-between items-center bg-gray-900/50 p-2 rounded-lg">
                    <div className="text-sm text-gray-400">
                      Cariche: <span className={`${item.cariche_attuali > 0 ? 'text-yellow-400' : 'text-red-500'} font-bold`}>{item.cariche_attuali}</span>
                    </div>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleUseItem(item.id)}
                        disabled={item.cariche_attuali <= 0}
                        className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 disabled:bg-gray-700 disabled:text-gray-500 text-white rounded shadow transition-all active:scale-95 flex items-center gap-1.5 text-sm font-medium"
                      >
                        <Zap size={14}/> Usa
                      </button>
                      {/* Placeholder Ricarica - Logica da implementare */}
                      <button className="p-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded transition-colors">
                        <RefreshCw size={14}/>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. ATTACCHI BASE */}
      {weapons.length > 0 && (
        <section>
          <h3 className="text-gray-500 font-bold uppercase text-xs tracking-wider mb-3 pl-1">Attacchi Base Equipaggiati</h3>
          <div className="grid grid-cols-1 gap-2">
            {weapons.map(w => (
                <div key={w.id} className="bg-red-950/20 border border-red-900/40 p-3 rounded-lg flex items-center gap-3">
                <div className="bg-red-900/20 p-2 rounded-full text-red-400 border border-red-900/30">
                    <Activity size={18}/>
                </div>
                <div>
                    <div className="font-bold text-red-100 text-sm">{w.nome}</div>
                    <div className="text-xs text-red-300/70 font-mono mt-0.5">{w.attacco_base}</div>
                </div>
                </div>
            ))}
          </div>
        </section>
      )}

      {/* 5. NOTIFICHE */}
      <div className="grid grid-cols-2 gap-3 pt-4 border-t border-gray-800">
        <button onClick={() => onNavigate('messaggi')} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-indigo-500 transition-all text-left group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Mail size={48}/></div>
          <div className="text-2xl font-bold text-white mb-1 relative z-10">
            {selectedCharacterData.messaggi_non_letti || 0}
          </div>
          <div className="text-xs text-gray-400 uppercase font-bold relative z-10">Messaggi</div>
        </button>

        <button onClick={() => onNavigate('lavori')} className="bg-gray-800 p-4 rounded-xl border border-gray-700 hover:border-yellow-500 transition-all text-left group relative overflow-hidden">
          <div className="absolute right-0 top-0 p-2 opacity-10 group-hover:opacity-20 transition-opacity"><Briefcase size={48}/></div>
          <div className="text-2xl font-bold text-white mb-1 relative z-10">
            {selectedCharacterData.lavori_pendenti || 0}
          </div>
          <div className="text-xs text-gray-400 uppercase font-bold relative z-10">Lavori</div>
        </button>
      </div>

    </div>
  );
};

export default GameTab;