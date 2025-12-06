import React, { useState, useEffect } from 'react';
import { 
  getMessages, 
  getAdminSentMessages, 
  markMessageAsRead, 
  deleteMessage 
} from '../api';
import { 
  Mail, 
  Trash2, 
  CheckCircle, 
  Send, 
  RefreshCw, 
  AlertCircle,
  Megaphone,Loader2,
} from 'lucide-react';

// --- IMPORTA IL NUOVO WIDGET ---
import JobRequestsWidget from './JobRequestsWidget';
import ComposeMessageModal from './ComposeMessageModal';

const MessaggiTab = ({ characterId, onLogout }) => {
  // Stati per i messaggi
  const [messages, setMessages] = useState([]);
  const [adminMessages, setAdminMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('received'); // 'received', 'sent'
  
  // Stati per la modale di composizione
  const [isComposeOpen, setIsComposeOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0); // Per forzare il ricaricamento

  // --- FETCH DATI ---
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (activeTab === 'received') {
          // Carica messaggi ricevuti
          const data = await getMessages(characterId, onLogout);
          setMessages(data || []);
        } else {
          // Carica messaggi inviati (solo se admin o logica specifica implementata)
          // Nota: La tua API getAdminSentMessages è per admin, 
          // per i player normali servirebbe un endpoint 'getSentMessages'.
          // Qui uso getMessages come placeholder o lista vuota se non supportato.
          try {
             const data = await getAdminSentMessages(onLogout);
             setAdminMessages(data || []);
          } catch(e) {
             console.warn("Non sei admin o endpoint non accessibile", e);
             setAdminMessages([]);
          }
        }
      } catch (error) {
        console.error("Errore fetch messaggi:", error);
      } finally {
        setLoading(false);
      }
    };

    if (characterId) {
      fetchData();
    }
  }, [characterId, activeTab, refreshTrigger, onLogout]);

  // --- GESTIONE LETTURA ---
  const handleRead = async (msgId, isRead) => {
    if (isRead) return; // Già letto
    try {
      await markMessageAsRead(msgId, characterId, onLogout);
      // Aggiorna stato locale
      setMessages(prev => prev.map(m => 
        m.id === msgId ? { ...m, is_letto_db: true } : m
      ));
    } catch (error) {
      console.error("Errore lettura messaggio:", error);
    }
  };

  // --- GESTIONE CANCELLAZIONE ---
  const handleDelete = async (msgId, e) => {
    e.stopPropagation(); // Evita di aprire il messaggio mentre cancelli
    if (!confirm("Vuoi davvero cancellare questo messaggio?")) return;
    
    try {
      await deleteMessage(msgId, characterId, onLogout);
      setMessages(prev => prev.filter(m => m.id !== msgId));
    } catch (error) {
      console.error("Errore cancellazione:", error);
      alert("Impossibile cancellare il messaggio.");
    }
  };

  const handleRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  return (
    <div className="text-white space-y-6">
      
      {/* ========================================================== */}
      {/* 1. SEZIONE WIDGET LAVORI (Appare solo se ci sono lavori)   */}
      {/* ========================================================== */}
      <JobRequestsWidget characterId={characterId} />


      {/* ========================================================== */}
      {/* 2. HEADER E TAB MESSAGGI                                   */}
      {/* ========================================================== */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-800 p-4 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Mail className="text-indigo-400" /> Centro Messaggi
        </h2>
        
        <div className="flex gap-2">
          <button 
            onClick={() => setIsComposeOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors text-sm font-bold"
          >
            <Send size={16} /> Scrivi
          </button>
          <button 
            onClick={handleRefresh}
            className="bg-gray-700 hover:bg-gray-600 text-gray-200 p-2 rounded-lg transition-colors"
            title="Aggiorna"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* ========================================================== */}
      {/* 3. LISTA MESSAGGI                                          */}
      {/* ========================================================== */}
      <div className="bg-gray-800/50 rounded-lg border border-gray-700 min-h-[300px]">
        {loading ? (
          <div className="flex justify-center items-center h-40 text-gray-400">
            <Loader2 className="animate-spin mr-2" /> Caricamento...
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col justify-center items-center h-40 text-gray-500">
            <Mail size={40} className="mb-2 opacity-50" />
            <p>Nessun messaggio in arrivo.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {messages.map((msg) => {
              const isBroadcast = msg.tipo_messaggio === 'BROADCAST';
              const isRead = msg.is_letto_db;

              return (
                <div 
                  key={msg.id} 
                  onClick={() => handleRead(msg.id, isRead)}
                  className={`
                    p-4 transition-all cursor-pointer hover:bg-gray-700/50 relative group
                    ${!isRead ? 'bg-indigo-900/20 border-l-4 border-indigo-500' : 'opacity-80'}
                  `}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="flex items-center gap-2">
                        {isBroadcast ? (
                            <span className="bg-red-500/20 text-red-400 text-xs px-2 py-0.5 rounded border border-red-500/30 flex items-center gap-1">
                                <Megaphone size={10} /> SISTEMA
                            </span>
                        ) : (
                            <span className="text-indigo-300 text-sm font-bold">
                                {msg.mittente_nome || "Sconosciuto"}
                            </span>
                        )}
                        <span className="text-gray-500 text-xs">
                            {new Date(msg.data_invio).toLocaleString()}
                        </span>
                    </div>
                    
                    {/* Icona Letto/Non Letto */}
                    {!isRead && (
                        <span className="h-2 w-2 rounded-full bg-indigo-500 absolute top-4 right-12"></span>
                    )}
                    
                    <button 
                      onClick={(e) => handleDelete(msg.id, e)}
                      className="text-gray-500 hover:text-red-400 transition-colors p-1"
                      title="Cancella"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h4 className={`text-lg font-bold mb-1 ${!isRead ? 'text-white' : 'text-gray-300'}`}>
                    {msg.titolo}
                  </h4>
                  
                  <div className="text-gray-300 text-sm whitespace-pre-wrap leading-relaxed">
                    {msg.testo}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modale Composizione Messaggio */}
      {isComposeOpen && (
        <ComposeMessageModal 
          isOpen={isComposeOpen} 
          onClose={() => setIsComposeOpen(false)}
          onSuccess={() => {
            setIsComposeOpen(false);
            handleRefresh();
          }}
          senderCharacterId={characterId}
        />
      )}

    </div>
  );
};

export default MessaggiTab;