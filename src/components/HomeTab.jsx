import React, { useMemo } from 'react'; // <-- Assicurati che useMemo sia importato
import { useCharacter } from './CharacterContext';
import { Coins, Star } from 'lucide-react';
import PunteggioDisplay from './PunteggioDisplay'; 

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
            
            {/* Interpreta l'HTML nella descrizione */}
            {item.descrizione && (
              <div
                className="text-sm text-gray-400 pl-4 prose prose-invert prose-sm"
                dangerouslySetInnerHTML={{ __html: item.descrizione }}
              />
            )}
            
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
  const { punteggiList } = useCharacter();

  const {
    nome,
    crediti,
    punti_caratteristica,
    caratteristiche_base, 
    modificatori_calcolati, // Ora è indicizzato per 'parametro' (es. 'pv')
    abilita_possedute, 
    oggetti, 
    log_eventi 
  } = data;

  // Calcola le liste per Statistiche Primarie e Caratteristiche
  const { stat_primarie, caratteristiche } = useMemo(() => {
    // Non eseguire finché entrambe le liste non sono pronte
    if (!punteggiList || punteggiList.length === 0 || !caratteristiche_base) {
      return { stat_primarie: [], caratteristiche: [] };
    }

    // Filtra per Statistiche Primarie (ST)
    const primarie = punteggiList.filter(p => p.tipo === 'ST' && p.is_primaria);

    // Mappa le Caratteristiche (CA) ai loro dati completi
    const chars = Object.entries(caratteristiche_base)
      .map(([nome, valore]) => {
        const punteggio = punteggiList.find(p => p.nome === nome);
        // Restituisci un oggetto solo se il punteggio è stato trovato
        if (punteggio) {
          return { punteggio, valore };
        }
        return null; // Altrimenti restituisci null
      })
      .filter(item => item !== null); // <-- **LA CORREZIONE**: Filtra via i null

    return { stat_primarie: primarie, caratteristiche: chars };

  }, [punteggiList, caratteristiche_base]);
  // --- FINE NUOVA LOGICA ---

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-4xl font-bold text-indigo-400 mb-6 text-center">{nome}</h2>
      
      {/* Blocco Valute */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatRow label="Crediti" value={crediti || 0} icon={<Coins className="text-yellow-400" />} />
        <StatRow label="Punti Car." value={punti_caratteristica || 0} icon={<Star className="text-blue-400" />} />
      </div>

      {/* --- BLOCCO STATISTICHE PRIMARIE --- */}
      {stat_primarie.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Statistiche</h3>
          <div className="grid grid-cols-2 gap-4">
            {stat_primarie.map((punteggio) => {
              if (!punteggio.parametro) return null; 

              const mods = modificatori_calcolati[punteggio.parametro] || {add: 0, mol: 1.0};
              const valore_finale = (punteggio.valore_predefinito + mods.add) * mods.mol;
              
              return (
                <PunteggioDisplay
                  key={punteggio.id}
                  punteggio={punteggio}
                  value={Math.round(valore_finale)} 
                  displayText="name"
                  iconType="inv_circle"
                />
              );
            })}
          </div>
        </div>
      )}
      {/* --- FINE BLOCCO --- */}


      {/* Blocco Caratteristiche (Ora è sicuro) */}
      {caratteristiche.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Caratteristiche</h3>
          <div className="grid grid-cols-2 gap-4">
            {caratteristiche.map(({ punteggio, valore }) => ( // <-- Riga 132
                <PunteggioDisplay
                  key={punteggio.id} // <-- Riga 134 (Ora sicuro)
                  punteggio={punteggio} 
                  value={valore}         
                  displayText="abbr"   
                  iconType="inv_circle"
                />
            ))}
          </div>
        </div>
      )}

      {/* Blocchi Liste */}
      <ItemList title="Abilità" items={abilita_possedute} />
      <ItemList title="Oggetti" items={oggetti} />

      {/* Blocco Log Eventi */}
      {log_eventi && log_eventi.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Log Eventi</h3>
          <div className="bg-gray-800 p-4 rounded-lg shadow-inner space-y-2 max-h-60 overflow-y-auto">
            {log_eventi.slice(0).reverse().map((log, index) => ( // Aggiunto index per key
              <div key={log.data || index} className="text-sm text-gray-400 border-b border-gray-700 pb-1">
                <span className="text-gray-500">[{new Date(log.data).toLocaleString('it-IT')}]</span>
                <p className="text-gray-300">{log.testo_log}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocco Modificatori (Statistiche Secondarie) */}
      {modificatori_calcolati && (
        <details className="mt-4 bg-gray-800 rounded-lg shadow-inner">
          <summary className="text-xl font-semibold text-gray-200 p-3 cursor-pointer">
            Statistiche Secondarie
          </summary>
          <div className="grid grid-cols-2 gap-4 p-4 border-t border-gray-700">
            
            {Object.entries(modificatori_calcolati).map(([parametro, mods]) => {
              
              const punteggio = punteggiList.find(p => p.parametro === parametro);

              // --- CORREZIONE (identica a quella sopra) ---
              // Se il punteggio non esiste O è una statistica primaria,
              // non renderizzare nulla. Questo previene il crash.
              if (!punteggio || punteggio.is_primaria) {
                return null;
              }
              // --- FINE CORREZIONE ---

              const valore_finale = (punteggio.valore_predefinito + mods.add) * mods.mol;
              
              return (
                <PunteggioDisplay
                  key={punteggio.id}
                  punteggio={punteggio}
                  value={Math.round(valore_finale)} 
                  displayText="name"
                  iconType="inv_circle"
                />
              );
            })}
          </div>
        </details>
      )}

      {/* Dati Grezzi per Debug */}
      {/* <details className="mt-10 bg-gray-950 rounded-lg">
          <summary className="text-lg font-semibold text-gray-500 p-3 cursor-pointer">Mostra Dati Grezzi (per Debug)</summary>
          <pre className="p-4 overflow-x-auto text-xs text-yellow-300">
            {JSON.stringify(data, null, 2)}
          </pre>
      </details> */}
    </div>
  );
};


// --- Componente Tab ---
const HomeTab = () => {
  const { 
    selectedCharacterData, 
    isLoadingDetail,
    isLoadingPunteggi, // Aggiungi il loading dei punteggi
    selectedCharacterId, 
    error 
  } = useCharacter();

  // Mostra il caricamento se i dati del PG o i punteggi stanno caricando
  if (isLoadingDetail || isLoadingPunteggi) {
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