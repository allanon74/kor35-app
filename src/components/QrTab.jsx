import React, { useState, useRef, useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode'; // Import corretto

const QrTab = ({ onScanSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  
  // Usiamo useRef per tenere traccia dell'istanza dello scanner
  const html5QrCodeRef = useRef(null);
  
  // ID unico per il div del lettore
  const qrReaderId = "qr-reader-element";

  const handleScanData = async (decodedText) => {
    setIsScanning(false); // Ferma lo scanner visivamente
    setIsLoading(true);
    setError('');

    try {
      // Ferma la webcam
      await stopWebcamScan();

      // Invia l'ID al server
      const response = await fetch(`https://www.k-o-r-35.it/oggetti/qr/${decodedText}/`, {
        headers: {
          'Content-Type': 'text/html',
          // Aggiungi qui l'header di autenticazione se necessario
          // 'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });
      
      if (!response.ok) {
        throw new Error(`Errore HTTP ${response.status} nel recuperare i dati.`);
      }
      
      const htmlContent = await response.text();
      onScanSuccess(htmlContent); // Passa l'HTML alla modale
      
    } catch (err) {
      setError(err.message || 'Impossibile caricare i dati QR.');
      // Riavvia lo scanner se c'è un errore e l'utente lo desidera?
      // Per ora, lo lasciamo fermo.
    } finally {
      setIsLoading(false);
    }
  };

  /*
    CORREZIONE 2: Problema "Quadrato Grigio"
    Dobbiamo assicurarci che il div #qr-reader-element sia VISIBILE
    nel DOM *prima* di provare ad avviare Html5Qrcode.
    Usiamo un setTimeout per ritardare l'avvio dello scanner
    di un attimo, dando a React il tempo di aggiornare il DOM.
  */
  const startWebcamScan = () => {
    setError('');
    setIsScanning(true); // 1. Dice a React di mostrare il div

    // 2. Aspetta un attimo che il DOM si aggiorni
    setTimeout(() => {
      // Controlla se l'istanza esiste già e se è in scansione
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        console.log("Scanner già attivo.");
        return;
      }

      try {
        // 3. Ora il div #qr-reader-element è visibile
        if (!html5QrCodeRef.current) {
          html5QrCodeRef.current = new Html5Qrcode(qrReaderId);
        }
        
        const config = { fps: 10, qrbox: { width: 250, height: 250 } };
        
        html5QrCodeRef.current.start(
          { facingMode: "environment" }, // Prova prima la fotocamera posteriore
          config,
          (decodedText, decodedResult) => {
            // Successo
            handleScanData(decodedText);
          },
          (errorMessage) => {
            // Errore durante la scansione (es. non trova QR), non fatale
            // console.warn(`Errore scansione QR: ${errorMessage}`);
          }
        ).catch((err) => {
          // Errore grave (es. permessi negati)
          console.error("Errore avvio webcam:", err);
          setError("Impossibile avviare la webcam. Assicurati di aver dato i permessi.");
          setIsScanning(false);
        });

      } catch (e) {
        console.error("Eccezione Html5Qrcode:", e);
        setError("Errore inizializzazione scanner.");
        setIsScanning(false);
      }
    }, 100); // 100ms di ritardo dovrebbero bastare
  };


  const stopWebcamScan = async () => {
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      try {
        await html5QrCodeRef.current.stop();
        console.log("Scanner fermato.");
      } catch (err) {
        console.error("Errore nel fermare lo scanner:", err);
      }
    }
    setIsScanning(false);
  };

  const handleFileScan = async (event) => {
    const file = event.target.files[0];
    if (!file) {
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Crea un'istanza "usa e getta" per la scansione file
      const fileScanner = new Html5Qrcode(qrReaderId, /* verbose= */ false);
      const decodedText = await fileScanner.scanFile(file, /* showImage= */ false);
      handleScanData(decodedText);
    } catch (err) {
      console.error("Errore scansione file:", err);
      setError("Impossibile leggere il QR code dal file. Prova un'altra immagine.");
    } finally {
      setIsLoading(false);
      // Pulisce il valore dell'input file per permettere di ricaricare lo stesso file
      event.target.value = null; 
    }
  };

  // Cleanup effect per fermare lo scanner quando il componente viene smontato
  useEffect(() => {
    // Ritorna una funzione di cleanup
    return () => {
      stopWebcamScan();
    };
  }, []); // Esegui solo al mount e unmount

  return (
    <div className="flex flex-col items-center p-4">
      <h2 className="text-2xl font-bold mb-6 text-indigo-400">Scansione QR Code</h2>

      {isLoading && (
        <div className="text-center text-lg text-gray-300">
          <p>Caricamento dati...</p>
        </div>
      )}

      {error && (
        <div className="text-center text-red-400 bg-red-900 bg-opacity-50 p-3 rounded-md">
          <p>{error}</p>
        </div>
      )}

      <div className="w-full max-w-md mt-4 space-y-4">
        {!isScanning && !isLoading && (
          <>
            <button
              onClick={startWebcamScan}
              className="w-full px-4 py-3 bg-indigo-600 text-white text-lg font-bold rounded-md shadow-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              Avvia Scansione Webcam
            </button>
            
            <label className="block w-full px-4 py-3 bg-gray-700 text-white text-lg text-center font-bold rounded-md shadow-lg hover:bg-gray-600 cursor-pointer">
              <span>Carica Immagine QR</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileScan}
                className="hidden"
                disabled={isLoading}
              />
            </label>
          </>
        )}
      </div>

      {/* Questo è il riquadro dove apparirà lo scanner */}
      {isScanning && (
        <div className="mt-4 flex flex-col items-center w-full">
          {/* L'altezza h-80 è corretta */}
          <div 
            id={qrReaderId} 
            className="w-full max-w-sm h-80 rounded-lg overflow-hidden shadow-lg bg-gray-700"
          >
            {/* Il video della webcam verrà iniettato qui dalla libreria */}
          </div>
          
          <button
            onClick={stopWebcamScan}
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-md shadow-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
          >
            Ferma Scansione
          </button>
        </div>
      )}

      {/* Questo div è necessario per la scansione da file, 
        ma non deve essere visibile. Lo nascondiamo.
      */}
      {!isScanning && <div id={qrReaderId} className="hidden"></div>}

    </div>
  );
};

export default QrTab;

