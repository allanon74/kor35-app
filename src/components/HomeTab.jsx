import React from 'react';

const HomeTab = () => (
  <div className="p-4 text-center">
    <img
      src="/Logo Kor-AD.png" // Cerca il logo nella cartella /public/
      alt="Logo KOR-35"
      className="w-48 h-48 mx-auto mb-6 rounded-full shadow-lg"
      onError={(e) => {
        // Fallback in caso di errore di caricamento
        e.target.onerror = null;
        e.target.src =
          'https://placehold.co/192x192/4A5568/E2E8F0?text=KOR-35';
        e.target.alt = 'Logo KOR-35 Placeholder';
      }}
    />
    <h2 className="text-4xl font-bold text-indigo-400 mb-4">KOR-35</h2>
    <p className="text-lg text-gray-300">
      (Questa è la descrizione della tua app. Puoi modificarla direttamente qui
      nel codice sorgente.)
    </p>
  </div>
);

export default HomeTab;

