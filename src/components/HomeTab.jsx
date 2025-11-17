import React, { useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { Coins, Star } from 'lucide-react';
import PunteggioDisplay from './PunteggioDisplay'; 

// --- Componenti Helper per la Scheda ---

const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
    <div className="flex items-center">
      {icon}
      <span className="ml-2 font-semibold text-gray-300 capitalize">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

const ItemList = ({ title, items, keyField = 'id', nameField = 'nome' }) => (
  <div className="mb-6">
    <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">{title}</h3>
    {items && items.length > 0 ? (
      <ul className="list-disc list-inside bg-gray-800 p-4 rounded-lg shadow-inner space-y-2">
        {items.map((item) => (
          <li key={item[keyField]} className="text-gray-300">
            <span className="font-semibold text-white">{item[nameField]}</span>
            
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
    punteggi_base, 
    modificatori_calcolati, 
    abilita_possedute, 
    oggetti, 
    log_eventi 
  } = data;

  // Calcola le liste per Statistiche Primarie, Caratteristiche e Aure
  const { stat_primarie, caratteristiche, aure_possedute } = useMemo(() => {
    // Non eseguire finché entrambe le liste non sono pronte
    if (!punteggiList || punteggiList.length === 0 || !punteggi_base) {
      return { stat_primarie: [], caratteristiche: [], aure_possedute: [] };
    }

    const primarie = punteggiList.filter(p => p.tipo === 'ST' && p.is_primaria);

    const punteggiMappati = Object.entries(punteggi_base)
      .map(([nome, valore]) => {
        const punteggio = punteggiList.find(p => p.nome === nome);
        if (punteggio) {
          return { punteggio, valore };
        }
        return null; // Ritorna null se non trovato
      })
      .filter(item => item !== null); // **LA CORREZIONE CRASH**: Filtra via i null

    const chars = punteggiMappati.filter(
      item => item.punteggio.tipo === 'CA'
    );
    
    const aure = punteggiMappati.filter(
      item => item.punteggio.tipo === 'AU'
    );

    return { stat_primarie: primarie, caratteristiche: chars, aure_possedute: aure };

  }, [punteggiList, punteggi_base]);

  return (
    <div className="p-4 max-w-lg mx-auto">
      <h2 className="text-4xl font-bold text-indigo-400 mb-6 text-center">{nome}</h2>
      
      {/* Blocco Valute */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatRow label="Crediti" value={crediti || 0} icon={<Coins className="text-yellow-400" />} />
        <StatRow label="Punti Car." value={punti_caratteristica || 0} icon={<Star className="text-blue-400" />} />
      </div>

      {/* Blocco Statistiche Primarie */}
      {stat_primarie.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Statistiche</h3>
          <div className="grid grid-cols-2 gap-4">
            {stat_primarie.map((punteggio) => {
              if (!punteggio.parametro) return null; 
              // Cerca per PARAMETRO (es. 'pv')
              const mods = modificatori_calcolati[punteggio.parametro] || {add: 0, mol: 1.0};
              const valore_finale = (punteggio.valore_predefinito + mods.add) * mods.mol;
              
              return (
                <PunteggioDisplay
                  key={punteggio.id}
                  punteggio={punteggio}
                  value={Math.round(valore_finale)} 
                  displayText="name" // Come richiesto
                  iconType="inv_circle"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Blocco Caratteristiche */}
      {caratteristiche.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Caratteristiche</h3>
          <div className="grid grid-cols-2 gap-4">
            {caratteristiche.map(({ punteggio, valore }) => (
                <PunteggioDisplay
                  key={punteggio.id} // Questa riga è ora sicura
                  punteggio={punteggio} 
                  value={valore}         
                  displayText="name"   // Come richiesto
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
            {log_eventi.slice(0).reverse().map((log, index) => (
              <div key={log.data || index} className="text-sm text-gray-400 border-b border-gray-700 pb-1">
                <span className="text-gray-500">[{new Date(log.data).toLocaleString('it-IT')}]</span>
                <p className="text-gray-300">{log.testo_log}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Blocco Aure Possedute */}
      {aure_possedute.length > 0 && (
        <details className="mt-4 bg-gray-800 rounded-lg shadow-inner" open>
          <summary className="text-xl font-semibold text-gray-200 p-3 cursor-pointer">
            Aure Possedute
          </summary>
          <div className="grid grid-cols-2 gap-4 p-4 border-t border-gray-700">
            {aure_possedute.map(({ punteggio, valore }) => (
              <PunteggioDisplay
                key={punteggio.id}
                punteggio={punteggio}
                value={valore}
                displayText="name"
                iconType="inv_circle"
              />
            ))}
          </div>
        </details>
      )}

      {/* Blocco Statistiche Secondarie */}
      {modificatori_calcolati && (
        <details className="mt-4 bg-gray-800 rounded-lg shadow-inner">
          <summary className="text-xl font-semibold text-gray-200 p-3 cursor-pointer">
            Statistiche Secondarie
          </summary>
          <div className="grid grid-cols-2 gap-4 p-4 border-t border-gray-700">
            
            {Object.entries(modificatori_calcolati).map(([parametro, mods]) => {
              
              const punteggio = punteggiList.find(p => p.parametro === parametro);

              // Filtro sicuro
              if (!punteggio || punteggio.is_primaria) {
                return null;
              }

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

      {/* Dati Grezzi (commentati) */}
      {/* <details className="mt-10 bg-gray-950 rounded-lg">
          <summary className="text-lg font-semibold text-gray-500 p-3 cursor-pointer">Mostra Dati Grezzi (per Debug)</summary>
          <pre className="p-4 overflow-x-auto text-xs text-yellow-300">
            {JSON.stringify(data, null, 2)}
          </pre>
      </details> 
      */}
    </div>
  );
};


// --- Componente Tab ---
const HomeTab = () => {
  const { 
    selectedCharacterData, 
    isLoadingDetail,
    isLoadingPunteggi, 
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