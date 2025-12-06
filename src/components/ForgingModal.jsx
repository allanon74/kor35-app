import React, { useState, useEffect } from 'react';
import { X, Hammer, ShieldAlert, Check, Loader2, Coins, Send, Clock } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { forgiaOggetto, getCapableArtisans, createForgingRequest } from '../api';

const ForgingModal = ({ infusione, onClose, onRefresh }) => {
  const { selectedCharacterData } = useCharacter();
  
  const [canForgeSelf, setCanForgeSelf] = useState(false);
  const [capableArtisans, setCapableArtisans] = useState([]);
  const [isLoadingInfo, setIsLoadingInfo] = useState(true);
  
  const [selectedTarget, setSelectedTarget] = useState('');
  const [offerCredits, setOfferCredits] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    const loadData = async () => {
      try {
        // 1. Trova artigiani capaci
        const artisans = await getCapableArtisans(selectedCharacterData.id, null, null, infusione.id);
        setCapableArtisans(artisans || []);
        
        // 2. Check se *io* posso forgiare (Logica ottimistica o chiamata server)
        // Qui usiamo una logica semplice: se l'API degli artigiani torna qualcuno, 
        // significa che il server ha validato i requisiti per loro.
        // Per me stesso, proviamo a fare una "dry run" o assumiamo true finché non fallisce.
        // Idealmente, aggiungi un endpoint `/api/forging/check`
        setCanForgeSelf(true); 
      } catch (e) {
        console.error(e);
      } finally {
        setIsLoadingInfo(false);
      }
    };
    loadData();
  }, [infusione]);

  const handleExecute = async () => {
    setIsProcessing(true);
    setMsg({});
    
    try {
      if (selectedTarget === 'ACADEMY') {
         // Accademia (200 CR)
         await forgiaOggetto(infusione.id, selectedCharacterData.id, true);
         setMsg({ type: 'success', text: 'Avviato tramite Accademia! Controlla la coda.' });
      } else if (selectedTarget) {
         // Richiesta Artigiano
         const art = capableArtisans.find(a => a.id == selectedTarget);
         await createForgingRequest(selectedCharacterData.id, infusione.id, art.nome, offerCredits);
         setMsg({ type: 'success', text: `Richiesta inviata a ${art.nome}!` });
      } else {
         // Fai da te
         await forgiaOggetto(infusione.id, selectedCharacterData.id, false);
         setMsg({ type: 'success', text: 'Forgiatura avviata! Controlla la coda.' });
      }
      
      setTimeout(() => { onRefresh(); onClose(); }, 2000);
    } catch (err) {
      setMsg({ type: 'error', text: err.message || "Operazione fallita" });
      // Se fallisce il self-craft, probabilmente mancano requisiti
      if (!selectedTarget) setCanForgeSelf(false);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
       <div className="bg-gray-800 rounded-xl max-w-md w-full p-6 border border-gray-600 shadow-xl animate-fadeIn">
          
          <div className="flex justify-between items-center mb-4 border-b border-gray-700 pb-2">
              <h3 className="text-xl font-bold text-white flex gap-2 items-center">
                  <Hammer className="text-amber-500" size={20}/> 
                  Forgia: {infusione.nome}
              </h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white"><X/></button>
          </div>

          <div className="space-y-5">
              {/* Info Infusione */}
              <div className="bg-gray-900/50 p-3 rounded text-sm text-gray-300 border border-gray-700">
                  {infusione.descrizione || "Nessuna descrizione disponibile."}
                  <div className="mt-2 flex gap-2 text-xs text-gray-500">
                      <span className="bg-gray-800 px-2 py-1 rounded">Livello {infusione.livello}</span>
                  </div>
              </div>
              
              {/* Selezione Metodo */}
              <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Metodo di Lavoro</label>
                  <select 
                      className="w-full bg-gray-900 border-gray-600 text-white rounded p-2 focus:border-indigo-500 outline-none"
                      value={selectedTarget} 
                      onChange={e => setSelectedTarget(e.target.value)}
                  >
                      <option value="">🛠️ Fai da te (Paga Materiali)</option>
                      <option value="ACADEMY">🏛️ Accademia (200 CR)</option>
                      {capableArtisans.length > 0 && (
                          <optgroup label="Artigiani Disponibili">
                              {capableArtisans.map(a => (
                                  <option key={a.id} value={a.id}>👤 {a.nome}</option>
                              ))}
                          </optgroup>
                      )}
                  </select>
              </div>

              {/* Feedback Visivo Timer */}
              <div className="text-xs bg-blue-900/20 text-blue-300 p-2 rounded flex items-start gap-2 border border-blue-800/30">
                  <Clock size={14} className="mt-0.5 shrink-0"/>
                  <span>
                      {selectedTarget === 'ACADEMY' 
                          ? "L'Accademia avvia il lavoro subito, ma dovrai attendere il tempo di forgiatura."
                          : selectedTarget 
                              ? "Il timer partirà quando l'Artigiano accetterà la tua richiesta."
                              : "Il timer partirà immediatamente dopo la conferma."}
                  </span>
              </div>

              {/* Input Offerta (solo se Artigiano) */}
              {selectedTarget && selectedTarget !== 'ACADEMY' && (
                  <div className="animate-fadeIn">
                      <label className="block text-xs font-bold text-gray-400 mb-1">Offerta all'Artigiano (CR)</label>
                      <div className="relative">
                          <Coins className="absolute left-3 top-2.5 text-yellow-500" size={16}/>
                          <input 
                              type="number" 
                              className="w-full bg-gray-900 border-gray-600 text-white rounded p-2 pl-10 focus:border-yellow-500 outline-none"
                              value={offerCredits} 
                              onChange={e=>setOfferCredits(e.target.value)} 
                              placeholder="0"
                          />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">
                          Nota: I costi dei materiali saranno scalati all'artigiano. Includili nell'offerta!
                      </p>
                  </div>
              )}

              {/* Messaggi Errore/Successo */}
              {msg.text && (
                  <div className={`p-3 rounded text-sm border flex items-center gap-2 ${msg.type === 'error' ? 'bg-red-900/20 border-red-800 text-red-300' : 'bg-emerald-900/20 border-emerald-800 text-emerald-300'}`}>
                      {msg.type === 'error' ? <ShieldAlert size={16}/> : <Check size={16}/>}
                      {msg.text}
                  </div>
              )}

              {/* Bottone Azione */}
              <button 
                  onClick={handleExecute} 
                  disabled={isProcessing || isLoadingInfo}
                  className={`
                      w-full py-2.5 rounded-lg font-bold flex justify-center items-center gap-2 transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed
                      ${selectedTarget === 'ACADEMY' 
                          ? 'bg-yellow-600 hover:bg-yellow-500 text-white' 
                          : selectedTarget 
                              ? 'bg-indigo-600 hover:bg-indigo-500 text-white'
                              : 'bg-emerald-600 hover:bg-emerald-500 text-white'}
                  `}
              >
                  {isProcessing ? <Loader2 className="animate-spin"/> : (
                      selectedTarget === 'ACADEMY' ? <Coins size={18}/> : 
                      selectedTarget ? <Send size={18}/> : <Hammer size={18}/>
                  )}
                  {selectedTarget === 'ACADEMY' ? 'Paga 200 CR e Avvia' : 
                   selectedTarget ? 'Invia Richiesta' : 'Inizia Lavoro'}
              </button>
          </div>
       </div>
    </div>
  );
};

export default ForgingModal;