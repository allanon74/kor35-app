const API_BASE_URL = 'https://www.k-o-r-35.it';

/**
 * Helper generico per le chiamate API autenticate.
 * Gestisce l'header Authorization e il caso di token non valido.
 * @param {string} endpoint - L'endpoint API (es. /personaggi/api/personaggi/)
 * @param {object} options - Opzioni standard di fetch (method, body, etc.)
 * @param {function} onLogout - La funzione di logout da App.jsx
 */
export const fetchAuthenticated = async (endpoint, options = {}, onLogout) => {
  const token = localStorage.getItem('kor35_token');
  
  if (!token) {
    console.error('Nessun token trovato, logout in corso.');
    if (onLogout) onLogout();
    return Promise.reject(new Error('Nessun token di autenticazione.'));
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Token ${token}`, // Questo è il formato corretto per DRF TokenAuth
    ...options.headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });

    // Se il token è scaduto o non valido, il server risponde 401 o 403
    if (response.status === 401 || response.status === 403) {
      console.error('Token non valido o scaduto, logout in corso.');
      if (onLogout) onLogout(); // Questo causa il ritorno al login
      throw new Error('Autenticazione fallita.');
    }
    
    if (!response.ok) {
      const errorData = await response.text(); // Prova a leggere l'errore
      throw new Error(`Errore API (${response.status}): ${errorData || response.statusText}`);
    }

    // Gestisce risposte senza corpo (es. 204 No Content)
    if (response.status === 204) {
        return null;
    }

    return await response.json();
  
  } catch (error) {
    console.error(`Errore durante il fetch a ${endpoint}:`, error);
    throw error; // Rilancia l'errore per essere gestito dal chiamante
  }
};

// --- Funzioni API specifiche ---

/**
 * Recupera la lista dei personaggi associati all'utente.
 * URL CORRETTA (basata sui tuoi file urls.py e sul test manuale):
 * /personaggi/ (da kor35/urls.py) + /api/personaggi/ (da personaggi/urls.py)
 */
export const getPersonaggiList = (onLogout) => {
  return fetchAuthenticated('/personaggi/api/personaggi/', { method: 'GET' }, onLogout);
};

/**
 * Recupera i dettagli di un personaggio specifico.
 */
export const getPersonaggioDetail = (id, onLogout) => {
  return fetchAuthenticated(`/personaggi/api/personaggi/${id}/`, { method: 'GET' }, onLogout);
};

export const getQrCodeData = (qrId, onLogout) => {
  // NOTA: l'endpoint del QR code non ha /api/personaggi/ prima,
  // ma /personaggi/api/qrcode/ come da tuo urls.py
  return fetchAuthenticated(`/personaggi/api/qrcode/${qrId}/`, { method: 'GET' }, onLogout);
};

/**
 * Richiede un oggetto da un inventario (azione "Prendi").
 * POST /personaggi/api/transazioni/richiedi/
 */
export const richiediTransazione = (oggettoId, mittenteInventarioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/transazioni/richiedi/', 
    {
      method: 'POST',
      body: JSON.stringify({
        oggetto_id: oggettoId,
        mittente_id: mittenteInventarioId, // L'ID dell'inventario scansionato
      })
    },
    onLogout
  );
};

/**
 * Tenta di rubare un oggetto da un personaggio (azione "Ruba").
 * POST /personaggi/api/transazioni/ruba/
 */
export const rubaOggetto = (oggettoId, targetPersonaggioId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/transazioni/ruba/', 
    {
      method: 'POST',
      body: JSON.stringify({
        oggetto_id: oggettoId,
        target_personaggio_id: targetPersonaggioId,
      })
    },
    onLogout
  );
};

/**
 * Acquisisce un oggetto/attivata da un QR code.
 * POST /personaggi/api/transazioni/acquisisci/
 */
export const acquisisciItem = (qrCodeId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/transazioni/acquisisci/', 
    {
      method: 'POST',
      body: JSON.stringify({
        qrcode_id: qrCodeId,
      })
    },
    onLogout
  );
};

/**
 * Recupera la lista master di tutte le abilità.
 */
export const getAbilitaMasterList = (onLogout) => {
  return fetchAuthenticated('/personaggi/api/abilita/master_list/', { method: 'GET' }, onLogout);
};

/**
 * Tenta di acquisire un'abilità per il personaggio loggato.
 * POST /personaggi/api/personaggio/me/acquisisci_abilita/
 */
export const acquireAbilita = (abilitaId, onLogout) => {
  return fetchAuthenticated(
    '/personaggi/api/personaggio/me/acquisisci_abilita/', 
    {
      method: 'POST',
      body: JSON.stringify({
        abilita_id: abilitaId,
      })
    },
    onLogout
  );
};