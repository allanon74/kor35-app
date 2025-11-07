import React, { useState, useEffect } from 'react';
import { X, Loader, Scan, Eye, Grab, Sparkles, User, FileText, Bot, Timer } from 'lucide-react';
import { richiediTransazione, rubaOggetto, acquisisciItem } from '../api'; 
import { useCharacter } from './CharacterContext';

//##################################################################
// ## COMPONENTE HELPER 1: MODALE "VEDI OGGETTO" ##
//##################################################################
const OggettoDetailModal = ({ oggetto, onClose }) => {
  return (
    // Overlay (z-index 60, sopra la modale QR che è z-50)
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black bg-opacity-80 p-4">
      <div className="flex flex-col w-full max-w-md bg-gray-900 rounded-lg shadow-2xl overflow-hidden border border-indigo-500">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-indigo-400">{oggetto.nome}</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white"
            aria-label="Chiudi"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenuto */}
        <div className="p-6 overflow-y-auto text-white space-y-4 max-h-[60vh]">
          <p className="text-gray-300">{oggetto.descrizione || "Nessuna descrizione."}</p>
          
          {/* Mostra tutti i dati grezzi dell'oggetto */}
          <details className="mt-4 bg-gray-950 rounded-lg">
            <summary className="text-sm font-semibold text-gray-500 p-2 cursor-pointer">Mostra Dati Grezzi Oggetto</summary>
            <pre className="p-3 overflow-x-auto text-xs text-yellow-300">
              {JSON.stringify(oggetto, null, 2)}
            </pre>
          </details>
        </div>

      </div>
    </div>
  );
};


//##################################################################
// ## FUNZIONE HELPER 2: LOGICA AURA ##
//##################################################################
const getOggettiVisibili = (oggettiDaFiltrare, personaggioAttivo) => {
  if (!personaggioAttivo || !oggettiDaFiltrare || oggettiDaFiltrare.length === 0) {
    return [];
  }

  // !!! --- ASSUNZIONE AURA 1 --- !!!
  // Assumo che i punteggi di aura del PG ATTIVO (che scansiona) 
  // si trovino in `personaggioAttivo.modificatori_calcolati`.
  const aurePersonaggio = personaggioAttivo.modificatori_calcolati;
  
  if (!aurePersonaggio) {
    console.warn("Dati 'modificatori_calcolati' non trovati nel personaggio attivo. Impossibile filtrare per aura.");
    return [];
  }

  return oggettiDaFiltrare.filter(obj => {
    // !!! --- ASSUNZIONE AURA 2 --- !!!
    // Assumo che ogni OGGETTO scansionato abbia un campo stringa 'aura_richiesta'
    const auraRichiesta = obj.aura_richiesta; 

    if (!auraRichiesta) {
      // Se l'oggetto non ha un'aura_richiesta, è visibile a tutti.
      return true;
    }

    const punteggioAura = aurePersonaggio[auraRichiesta] || 0;
    return punteggioAura >= 1;
  });
};


//##################################################################
// ## VISTE QR: TIPO MANIFESTO / A_VISTA (3a, 3e) - MODIFICATO ##
//##################################################################
const ManifestoView = ({ data }) => (
  <div>
    {/* Titolo */}
    <h3 className="text-2xl font-bold mb-4 text-amber-200 text-center">
      {data.nome || 'Manifesto'}
    </h3>
    
    {/* Contenitore e Contenuto (Stesso DIV) */}
    <div
      // Stili pergamena
      className="bg-amber-50 rounded-md shadow-inner p-5 border-4 border-amber-900/30
                 font-serif text-gray-800 text-lg"
      style={{
        // --- I FIX PER IL WRAPPING ---
        
        // 1. Rispetta i <br> e \n E manda a capo il testo
        whiteSpace: 'pre-wrap',
        
        // 2. Forza l'interruzione delle parole molto lunghe
        wordBreak: 'break-word',
        overflowWrap: 'break-word',
        
        // 3. Se qualcosa non va a capo, nascondilo (NO scrollbar orizzontale)
        overflowX: 'hidden',
        
        // 4. Se il testo è lungo, aggiungi scrollbar VERTICALE
        overflowY: 'auto',
        
        // 5. Limita l'altezza per far funzionare lo scroll
        maxHeight: '60vh', 
      }}
      dangerouslySetInnerHTML={{ __html: data.testo }}
    />
  </div>
);

//##################################################################
// ## VISTA QR: TIPO INVENTARIO (3b) ##
//##################################################################
const InventarioView = ({ data, onLogout }) => {
  // Timer locale di 10 secondi per "Prendi"
  const [cooldownEnd, setCooldownEnd] = useState(0); 
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewingOggetto, setViewingOggetto] = useState(null); // Stato per modale "Vedi"
  
  // Prendi i dati del personaggio attivo per la logica Aura
  const { selectedCharacterData } = useCharacter();

  const isInCooldown = Date.now() < cooldownEnd;

  // Effetto per il timer visivo
  useEffect(() => {
    if (isInCooldown) {
      const updateTimer = () => {
        const secondsLeft = Math.ceil((cooldownEnd - Date.now()) / 1000);
        setCooldownTimer(secondsLeft > 0 ? secondsLeft : 0);
      };
      updateTimer();
      const interval = setInterval(updateTimer, 1000);
      return () => clearInterval(interval);
    } else {
      setCooldownTimer(0);
    }
  }, [cooldownEnd, isInCooldown]);

  const handlePrendi = async (oggettoId, oggettoNome) => {
    if (isInCooldown) return;
    
    setMessage('Elaborazione...');
    setError('');
    setCooldownEnd(Date.now() + 10000); // Avvia cooldown 10s

    try {
      // Chiama l'API "richiediTransazione"
      const response = await richiediTransazione(oggettoId, data.id, onLogout);
      setMessage(`Richiesta per '${oggettoNome}' inviata! Attendi conferma.`);
    } catch (err) {
      setError(err.message || 'Errore imprevisto.');
      setMessage('');
      setCooldownEnd(0); // Resetta cooldown in caso di errore
    }
  };

  // APPLICA LA LOGICA AURA
  const oggettiVisibili = getOggettiVisibili(data.oggetti, selectedCharacterData);

  return (
    <div>
      {/* Modale "Vedi" (si attiverà quando viewingOggetto non è null) */}
      {viewingOggetto && (
        <OggettoDetailModal 
          oggetto={viewingOggetto} 
          onClose={() => setViewingOggetto(null)} 
        />
      )}

      <h3 className="text-2xl font-bold mb-4">{data.nome || 'Inventario'}</h3>
      {error && <p className="text-red-400 mb-4 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
      {message && <p className="text-green-400 mb-4 bg-green-900 bg-opacity-30 p-2 rounded">{message}</p>}
      {isInCooldown && (
         <p className="text-yellow-400 mb-4 flex items-center">
           <Timer size={16} className="mr-2" />
           Cooldown "Prendi" attivo: {cooldownTimer}s
         </p>
      )}
      
      {oggettiVisibili.length === 0 && (
        <p className="text-gray-500 italic">Nessun oggetto visibile in questo inventario.</p>
      )}

      <ul className="space-y-3">
        {oggettiVisibili.map(obj => (
          <li key={obj.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
            <span className="font-semibold">{obj.nome}</span>
            <div className="space-x-2">
              {/* Pulsante "Vedi" */}
              <button 
                onClick={() => setViewingOggetto(obj)}
                className="p-2 bg-blue-600 rounded hover:bg-blue-700" 
                title="Vedi Dettagli"
              >
                <Eye size={18} />
              </button>
              {/* Pulsante "Prendi" */}
              <button 
                onClick={() => handlePrendi(obj.id, obj.nome)}
                disabled={isInCooldown}
                className={`p-2 bg-green-600 rounded hover:bg-green-700 ${isInCooldown ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Prendi"
              >
                <Grab size={18} />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

//##################################################################
// ## VISTA QR: TIPO PERSONAGGIO (3c) ##
//##################################################################
const PersonaggioView = ({ data, onLogout, onStealSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [viewingOggetto, setViewingOggetto] = useState(null); // Stato per modale "Vedi"

  // Prendi i dati del personaggio attivo per la logica Aura
  const { selectedCharacterData } = useCharacter();
  
  const handleRuba = async (oggettoId, oggettoNome) => {
     if (isLoading) return;
     setIsLoading(true);
     setMessage('Tentativo di furto in corso...');
     setError('');

     try {
       // Chiama la nuova API "rubaOggetto"
       const response = await rubaOggetto(oggettoId, data.id, onLogout);
       setMessage(response.success || `Oggetto '${oggettoNome}' rubato!`);
       // Avvia il cooldown globale di 30s (gestito da MainPage) e chiudi
       onStealSuccess(); 
     } catch (err) {
       setError(err.message || 'Errore imprevisto.');
       setMessage('');
     } finally {
       setIsLoading(false);
     }
  }

  // APPLICA LA LOGICA AURA
  // (Richiede che PersonaggioPublicSerializer esponga 'oggetti')
  const oggettiVisibili = getOggettiVisibili(data.oggetti, selectedCharacterData);

  return (
    <div>
      {/* Modale "Vedi" */}
      {viewingOggetto && (
        <OggettoDetailModal 
          oggetto={viewingOggetto} 
          onClose={() => setViewingOggetto(null)} 
        />
      )}

      <h3 className="text-2xl font-bold mb-4 flex items-center"><User className="mr-2"/> {data.nome || 'Personaggio'}</h3>
      {error && <p className="text-red-400 mb-4 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
      {message && <p className="text-green-400 mb-4 bg-green-900 bg-opacity-30 p-2 rounded">{message}</p>}
      
      {oggettiVisibili.length === 0 && (
        <p className="text-gray-500 italic">Nessun oggetto visibile su questo personaggio.</p>
      )}

      <ul className="space-y-3">
        {oggettiVisibili.map(obj => (
          <li key={obj.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
            <span className="font-semibold">{obj.nome}</span>
            <div className="space-x-2">
              {/* Pulsante "Vedi" */}
              <button 
                onClick={() => setViewingOggetto(obj)}
                className="p-2 bg-blue-600 rounded hover:bg-blue-700" 
                title="Vedi Dettagli"
              >
                <Eye size={18} />
              </button>
              {/* Pulsante "Ruba" */}
              <button 
                onClick={() => handleRuba(obj.id, obj.nome)}
                disabled={isLoading}
                className={`p-2 bg-red-600 rounded hover:bg-red-700 ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                title="Ruba"
              >
                {isLoading ? <Loader size={18} className="animate-spin" /> : <Bot size={18} />}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

//##################################################################
// ## VISTA QR: TIPO OGGETTO / ATTIVATA (3d) ##
//##################################################################
const AcquisizioneView = ({ qrId, data, tipo, onLogout, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAcquisisci = async () => {
    if (!qrId) {
        setError("Errore: ID del QrCode non trovato per l'acquisizione.");
        return;
    }
    setIsLoading(true);
    setError('');
    try {
      // Chiama la nuova API "acquisisciItem"
      const response = await acquisisciItem(qrId, onLogout);
      setMessage(response.success || "Oggetto acquisito!");
      // Chiudi la modale dopo un breve ritardo per far leggere il messaggio
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message || 'Errore imprevisto.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 flex items-center">
        {tipo === 'oggetto' ? <Shield className="mr-2" /> : <Sparkles className="mr-2" />}
        {data.nome || 'Oggetto Raro'}
      </h3>
      {error && <p className="text-red-400 mb-4 bg-red-900 bg-opacity-30 p-2 rounded">{error}</p>}
      {message && <p className="text-green-400 mb-4 bg-green-900 bg-opacity-30 p-2 rounded">{message}</p>}
      
      <p className="text-gray-300 mb-4">{data.descrizione || 'Nessuna descrizione.'}</p>
      
      {/* Mostra altri dati se vuoi... */}
      <details className="mt-4 bg-gray-900 rounded-lg">
        <summary className="text-sm font-semibold text-gray-500 p-2 cursor-pointer">Mostra Dati Grezzi</summary>
        <pre className="p-3 overflow-x-auto text-xs text-yellow-300">
          {JSON.stringify(data, null, 2)}
        </pre>
      </details>
      
      {!message && ( // Nascondi il pulsante dopo l'acquisizione
        <button 
          onClick={handleAcquisisci}
          disabled={isLoading}
          className="w-full mt-6 px-4 py-3 bg-purple-600 text-white text-lg font-bold rounded-md shadow-lg hover:bg-purple-700 disabled:opacity-50"
        >
          {isLoading ? <Loader className="animate-spin mx-auto" /> : 'Acquisisci'}
        </button>
      )}
    </div>
  );
};


//##################################################################
// ## COMPONENTE MODALE PRINCIPALE (EXPORT) ##
//##################################################################
const QrResultModal = ({ data, onClose, onLogout, onStealSuccess }) => {
  
  const renderContent = () => {
    // Gestione iniziale: Dati non ancora caricati
    if (!data) {
      return (
        <div className="flex justify-center items-center h-full">
          <Loader className="animate-spin text-indigo-400" size={48} />
        </div>
      );
    }
    
    // Troviamo l'ID del QR code scansionato.
    const qrId = data.dati?.qr_code_id || data.qrcode_id; 

    // Router per le viste
    switch (data.tipo_modello) {
      case 'manifesto':
      case 'a_vista':
        return <ManifestoView data={data.dati} />;
      
      case 'inventario':
        return <InventarioView data={data.dati} onLogout={onLogout} />;
        
      case 'personaggio':
        return <PersonaggioView data={data.dati} onLogout={onLogout} onStealSuccess={onStealSuccess} />;

      case 'oggetto':
        if (!qrId) { 
            return <p className="text-red-400">Errore: Manca l'ID del QrCode per l'acquisizione.</p>
        }
        return <AcquisizioneView qrId={qrId} data={data.dati} tipo="oggetto" onLogout={onLogout} onClose={onClose} />;
      
      case 'attivata':
        if (!qrId) { 
            return <p className="text-red-400">Errore: Manca l'ID del QrCode per l'acquisizione.</p>
        }
        return <AcquisizioneView qrId={qrId} data={data.dati} tipo="attivata" onLogout={onLogout} onClose={onClose} />;

      case 'qrcode_scollegato':
        return (
          <div className="text-center">
            <Scan size={48} className="mx-auto text-yellow-400 mb-4" />
            <h3 className="text-2xl font-bold mb-2">QR Code non collegato</h3>
            <p className="text-gray-300">{data.messaggio}</p>
            <p className="text-xs text-gray-500 mt-2">ID: {data.qrcode_id}</p>
          </div>
        );

      default:
        return (
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-2 text-red-400">Errore</h3>
            <p className="text-gray-300">Tipo di QR Code non riconosciuto: {data.tipo_modello}</p>
            <pre className="text-xs text-left bg-gray-900 p-2 rounded-md mt-4 overflow-auto">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        );
    }
  };

  return (
    // Overlay (z-index 50)
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75 p-4">
      <div className="flex flex-col w-full h-full max-w-lg max-h-[90dvh] bg-gray-800 rounded-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Risultato Scansione</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 rounded-full hover:bg-gray-700 hover:text-white"
            aria-label="Chiudi"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Contenuto Dinamico */}
        <div className="grow p-6 overflow-y-auto text-white">
          {renderContent()}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 text-center shrink-0">
           <button
            onClick={onClose}
            className="px-6 py-2 font-bold text-white bg-indigo-600 rounded-md shadow-lg hover:bg-indigo-700"
          >
            Chiudi
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrResultModal;