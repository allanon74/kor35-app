import React from 'react';
import { useCharacter } from './CharacterContext';
import { Coins, Star, Shield, Dices, Brain, BookOpen, User, Droplet, Sun, Zap } from 'lucide-react';

// --- Componenti Helper per la Scheda ---

// Helper per mostrare una singola statistica
const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
    <div className="flex items-center">
      {icon}
      <span className="ml-2 font-semibold text-gray-300 capitalize">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

// Helper per mostrare una lista (abilità, oggetti)
const ItemList = ({ title, items, keyField = 'id', nameField = 'nome' }) => (
  <div className="mb-6">
    <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">{title}</h3>
    {items && items.length > 0 ? (
      <ul className="list-disc list-inside bg-gray-800 p-4 rounded-lg shadow-inner space-y-2">
        {items.map((item) => (
          <li key={item[keyField]} className="text-gray-300">
            <span className="font-semibold text-white">{item[nameField]}</span>
            {item.descrizione && (
              <p className="text-sm text-gray-400 pl-4">{item.descrizione}</p>
            )}
            {/* Puoi aggiungere altri dettagli qui, es. item.quantita */}
          </li>
        ))}
      </ul>
    ) : (
      <p className="text-gray-500 bg-gray-800 p-4 rounded-lg shadow-inner">Nessun {title.toLowerCase()} trovato.</p>
    )}
  </div>
);

// Helper per il Caricamento
const LoadingComponent = () => (
  <div className="p-8 text-center text-lg text-gray-400">
    Caricamento dati personaggio...
  </div>
);

// --- Componente Principale della Scheda ---

const CharacterSheet = ({ data }) => {
  // Estrai i dati principali. Questi nomi DEVONO corrispondere al JSON!
  const {
    nome,
    crediti,
    punti_caratteristica,
    caratteristiche_base, // Assumiamo sia un oggetto { nome: valore, ... }
    modificatori_calcolati, // Assumiamo sia un oggetto { nome: valore, ... }
    abilita_possedute, // Assumiamo sia un array [ { id, nome, descrizione }, ... ]
    oggetti, // Assumiamo sia un array [ { id, nome, descrizione }, ... ]
    log_eventi // Assumiamo sia un array [ { id, testo_log, data }, ... ]
  } = data;

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-4xl font-bold text-indigo-400 mb-6 text-center">{nome}</h2>
      
      {/* Blocco Valute */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatRow label="Crediti" value={crediti || 0} icon={<Coins className="text-yellow-400" />} />
        <StatRow label="Punti Car." value={punti_caratteristica || 0} icon={<Star className="text-blue-400" />} />
      </div>

      {/* Blocco Caratteristiche (Esempio) */}
      {caratteristiche_base && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Caratteristiche</h3>
          <div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg shadow-inner">
            {Object.entries(caratteristiche_base).map(([key, value]) => (
              <div key={key} className="flex justify-between text-lg">
                <span className="font-bold capitalize text-gray-400">{key}:</span>
                <span className="text-white font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocco Modificatori (Esempio) */}
      {modificatori_calcolati && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Modificatori Calcolati</h3>
          <div className="grid grid-cols-2 gap-4 bg-gray-800 p-4 rounded-lg shadow-inner">
            {Object.entries(modificatori_calcolati).map(([key, value]) => (
              <div key={key} className="flex justify-between text-lg">
                <span className="font-bold capitalize text-gray-400">{key}:</span>
                <span className="text-white font-medium">{value > 0 ? `+${value}` : value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocchi Liste */}
      <ItemList title="Abilità" items={abilita_possedute} />
      <ItemList title="Oggetti" items={oggetti} />

      {/* Blocco Log Eventi (Esempio) */}
      {log_eventi && log_eventi.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Log Eventi</h3>
          <div className="bg-gray-800 p-4 rounded-lg shadow-inner space-y-2 max-h-60 overflow-y-auto">
            {log_eventi.slice(0).reverse().map((log) => ( // .slice(0).reverse() per mostrare i più nuovi prima
              <div key={log.id} className="text-sm text-gray-400 border-b border-gray-700 pb-1">
                <span className="text-gray-500">[{new Date(log.data).toLocaleString('it-IT')}]</span>
                <p className="text-gray-300">{log.testo_log}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Dati Grezzi per Debug (nascosti in un <details>) */}
      <details className="mt-10 bg-gray-950 rounded-lg">
          <summary className="text-lg font-semibold text-gray-500 p-3 cursor-pointer">Mostra Dati Grezzi (per Debug)</summary>
          <pre className="p-4 overflow-x-auto text-xs text-yellow-300">
            {JSON.stringify(data, null, 2)}
          </pre>
      </details>
    </div>
  );
};


// --- Componente Tab ---
const HomeTab = () => {
  const { 
    selectedCharacterData, 
    isLoadingDetail, 
    selectedCharacterId, 
    error 
  } = useCharacter();

  if (isLoadingDetail) {
    return <LoadingComponent />;
  }
  
  if (error && !selectedCharacterData) {
      return <div className="p-4 text-center text-red-400">Errore nel caricamento del personaggio. Riprova.</div>;
  }

  if (!selectedCharacterId) {
    return (
      <div className="p-8 text-center text-gray-400">
        <h2 className="text-2xl font-bold mb-4">Benvenuto!</h2>
        <p className="text-lg">Seleziona un personaggio dal menu in alto per visualizzare la sua scheda.</p>
      </div>
    );
  }
  
  if (!selectedCharacterData) {
      return (
      <div className="p-8 text-center text-gray-400">
        <p>Nessun dato trovato per il personaggio selezionato.</p>
      </div>
      );
  }

  // Se tutto è ok, mostra la scheda
  return <CharacterSheet data={selectedCharacterData} />;
};

export default HomeTab;