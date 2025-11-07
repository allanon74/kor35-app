import React, { useState, useEffect } from 'react';
import { X, Loader, Scan, Eye, Grab, Sparkles, User, FileText, Bot, Timer } from 'lucide-react';
// Importa le nuove funzioni API
import { richiediTransazione, rubaOggetto, acquisisciItem } from '../api'; 

// 3b. Inventario
const InventarioView = ({ data, onLogout }) => {
  // Timer locale di 10 secondi
  const [cooldownEnd, setCooldownEnd] = useState(0); 
  const [cooldownTimer, setCooldownTimer] = useState(0);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
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
      const response = await richiediTransazione(oggettoId, data.id, onLogout);
      setMessage(`Richiesta per '${oggettoNome}' inviata! Attendi conferma.`);
    } catch (err) {
      setError(err.message);
      setMessage('');
      setCooldownEnd(0); // Resetta cooldown in caso di errore
    }
  };

  const oggettiVisibili = data.oggetti || []; // TODO: Logica Aura

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4">{data.nome || 'Inventario'}</h3>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {message && <p className="text-green-400 mb-4">{message}</p>}
      {isInCooldown && (
         <p className="text-yellow-400 mb-4 flex items-center">
           <Timer size={16} className="mr-2" />
           Cooldown "Prendi" attivo: {cooldownTimer}s
         </p>
      )}
      
      <ul className="space-y-3">
        {oggettiVisibili.map(obj => (
          <li key={obj.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
            <span className="font-semibold">{obj.nome}</span>
            <div className="space-x-2">
              <button className="p-2 bg-blue-600 rounded hover:bg-blue-700" title="Vedi Dettagli (TODO)">
                <Eye size={18} />
              </button>
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

// 3c. Personaggio
const PersonaggioView = ({ data, onLogout, onStealSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const handleRuba = async (oggettoId, oggettoNome) => {
     if (isLoading) return;
     setIsLoading(true);
     setMessage('Tentativo di furto in corso...');
     setError('');

     try {
       // Chiama la nuova API
       const response = await rubaOggetto(oggettoId, data.id, onLogout);
       setMessage(response.success); // Messaggio dal backend
       // Avvia il cooldown globale di 30s e chiudi
       onStealSuccess(); 
     } catch (err) {
       setError(err.message);
       setMessage('');
     } finally {
       setIsLoading(false);
     }
  }

  const oggettiVisibili = data.oggetti_visibili || []; // TODO: Logica Aura

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 flex items-center"><User className="mr-2"/> {data.nome || 'Personaggio'}</h3>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {message && <p className="text-green-400 mb-4">{message}</p>}
      
      <ul className="space-y-3">
        {oggettiVisibili.map(obj => (
          <li key={obj.id} className="flex justify-between items-center p-3 bg-gray-700 rounded-md">
            <span className="font-semibold">{obj.nome}</span>
            <div className="space-x-2">
              <button className="p-2 bg-blue-600 rounded hover:bg-blue-700" title="Vedi Dettagli (TODO)">
                <Eye size={18} />
              </button>
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

// 3d. Oggetto o Attivata (Acquisizione)
const AcquisizioneView = ({ qrId, data, tipo, onLogout, onClose }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleAcquisisci = async () => {
    setIsLoading(true);
    setError('');
    try {
      // Chiama la nuova API
      const response = await acquisisciItem(qrId, onLogout);
      setMessage(response.success);
      // Chiudi la modale dopo un breve ritardo per far leggere il messaggio
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err) {
      setError(err.message);
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h3 className="text-2xl font-bold mb-4 flex items-center">
        {tipo === 'oggetto' ? <Shield className="mr-2" /> : <Sparkles className="mr-2" />}
        {data.nome || 'Oggetto Raro'}
      </h3>
      {error && <p className="text-red-400 mb-4">{error}</p>}
      {message && <p className="text-green-400 mb-4">{message}</p>}
      
      <p className="text-gray-300 mb-4">{data.descrizione || 'Nessuna descrizione.'}</p>
      {/* TODO: Mostra altri dati... */}
      
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


// --- Componente Modale Principale ---

const QrResultModal = ({ data, onClose, onLogout, onStealSuccess }) => {
  
  const renderContent = () => {
    if (!data) {
      return <Loader className="animate-spin" />;
    }
    
    // L'ID del QR scansionato, necessario per 'Acquisisci'
    // Lo prendiamo dal JSON di 'qrcode_scollegato' o dall'ID della 'vista'
    const qrId = data.qrcode_id || data.dati?.qr_code_id; 

    switch (data.tipo_modello) {
      case 'manifesto':
      case 'a_vista':
        return <ManifestoView data={data.dati} />;
      
      case 'inventario':
        return <InventarioView data={data.dati} onLogout={onLogout} />;
        
      case 'personaggio':
        return <PersonaggioView data={data.dati} onLogout={onLogout} onStealSuccess={onStealSuccess} />;

      case 'oggetto':
        return <AcquisizioneView qrId={qrId} data={data.dati} tipo="oggetto" onLogout={onLogout} onClose={onClose} />;
      
      case 'attivata':
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