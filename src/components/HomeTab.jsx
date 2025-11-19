import React, { useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { Coins, Star } from 'lucide-react';
import PunteggioDisplay from './PunteggioDisplay'; 

// --- Componenti Helper ---

// Helper per il contrasto colore (per gli header delle abilità)
const getTextColorForBg = (hexColor) => {
  if (!hexColor) return 'white';
  try {
    const hex = hexColor.replace('#', ''); 
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminanza = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminanza > 0.5 ? 'black' : 'white';
  } catch (e) {
    return 'white';
  }
};

const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
    <div className="flex items-center">
      {icon}
      <span className="ml-2 font-semibold text-gray-300 capitalize">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

// Helper per raggruppare le skill (Versione Potenziata con Ordinamento Backend)
const GroupedSkillList = ({ items, punteggiList }) => {
  
  const { sortedSections } = useMemo(() => {
    if (!items) return { sortedSections: [] };

    // 1. Raggruppamento
    const groups = items.reduce((acc, item) => {
      let charName = "Altro";
      let charObj = null;
      let charId = null;

      // Recupera info caratteristica
      if (item.caratteristica) {
        if (typeof item.caratteristica === 'object') {
            charName = item.caratteristica.nome;
            charId = item.caratteristica.id;
            charObj = item.caratteristica; 
        } else if (typeof item.caratteristica === 'number') {
             charId = item.caratteristica;
        } else {
             charName = String(item.caratteristica);
        }
      }

      // Arricchimento dati da punteggiList
      if (punteggiList && punteggiList.length > 0) {
        let found = null;
        if (charId) found = punteggiList.find(p => p.id === charId);
        if (!found && charName !== "Altro") found = punteggiList.find(p => p.nome === charName);
        
        if (found) {
            charObj = found;
            charName = found.nome;
        }
      }

      if (!acc[charName]) acc[charName] = { skills: [], charData: charObj };
      acc[charName].skills.push(item);
      return acc;
    }, {});

    // 2. Ordinamento Alfabetico Skills all'interno dei gruppi
    Object.values(groups).forEach(group => {
        group.skills.sort((a, b) => a.nome.localeCompare(b.nome));
    });

    // 3. Ordinamento Sezioni basato su punteggiList (backend order)
    const sections = [];
    const usedKeys = new Set();

    if (punteggiList) {
        punteggiList.forEach(p => {
            if (groups[p.nome]) {
                sections.push({ name: p.nome, ...groups[p.nome] });
                usedKeys.add(p.nome);
            }
        });
    }

    // Aggiungi sezioni residue (es. "Altro")
    Object.keys(groups).sort().forEach(key => {
        if (!usedKeys.has(key)) {
            sections.push({ name: key, ...groups[key] });
        }
    });

    return { sortedSections: sections };
  }, [items, punteggiList]);

  if (!items || items.length === 0) {
     return <p className="text-gray-500 bg-gray-800 p-4 rounded-lg">Nessuna abilità trovata.</p>;
  }

  return (
    <div className="mb-6 space-y-6">
      <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Abilità</h3>
      
      {sortedSections.map((group) => {
        const charName = group.name;
        const headerBg = group.charData?.colore || '#1f2937'; // Gray-800 default
        const headerText = getTextColorForBg(headerBg);

        return (
            <div 
                key={charName} 
                className="bg-gray-800 rounded-lg shadow-inner overflow-hidden"
                style={{ border: `2px solid ${headerBg}` }}
            >
              {/* Header Colorato */}
              <div 
                  className="flex items-center px-4 py-3 border-b border-black/20"
                  style={{ backgroundColor: headerBg }}
              >
                 {group.charData && (
                     <div className="mr-3">
                        <PunteggioDisplay 
                            punteggio={group.charData} 
                            displayText="none" 
                            iconType="inv_circle" 
                            size="m" 
                        />
                     </div>
                 )}
                 <h4 
                    className="text-xl font-bold uppercase tracking-wider"
                    style={{ color: headerText }}
                 >
                    {charName}
                 </h4>
              </div>
              
              {/* Lista Skills */}
              <ul className="divide-y divide-gray-700/50">
                {group.skills.map((item) => (
                  <li key={item.id} className="p-3 flex flex-col hover:bg-gray-700/30 transition-colors">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* Icona XS davanti all'abilità */}
                            <div className="shrink-0">
                                {group.charData ? (
                                    <PunteggioDisplay 
                                        punteggio={group.charData} 
                                        displayText="none" 
                                        size="xs" 
                                        iconType="raw" 
                                    />
                                ) : (
                                    <div className="w-4 h-4 bg-gray-600 rounded-full" />
                                )}
                            </div>
                            <span className="font-semibold text-white text-lg">{item.nome}</span>
                        </div>
                    </div>
                    
                    {item.descrizione && (
                      <div
                        className="text-sm text-gray-400 pl-8 mt-1 prose prose-invert prose-sm"
                        dangerouslySetInnerHTML={{ __html: item.descrizione }}
                      />
                    )}
                  </li>
                ))}
              </ul>
            </div>
        );
      })}
    </div>
  );
};

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

// --- Componente Principale ---

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

  // Calcola liste ordinate basandosi su punteggiList (che ha l'ordine del backend)
  const { stat_primarie, caratteristiche, aure_possedute } = useMemo(() => {
    if (!punteggiList || punteggiList.length === 0 || !punteggi_base) {
      return { stat_primarie: [], caratteristiche: [], aure_possedute: [] };
    }

    const primarie = [];
    const chars = [];
    const aure = [];

    // Iteriamo su punteggiList per mantenere l'ordine corretto
    punteggiList.forEach(punteggio => {
        
        // 1. Statistiche Primarie
        if (punteggio.tipo === 'ST' && punteggio.is_primaria) {
            primarie.push(punteggio);
        }

        // 2. Caratteristiche & Aure (richiedono valore base dal PG)
        // punteggi_base è un oggetto { "Forza": 10, ... }
        const valore = punteggi_base[punteggio.nome];

        if (valore !== undefined && valore !== null) {
            if (punteggio.tipo === 'CA') {
                chars.push({ punteggio, valore });
            } else if (punteggio.tipo === 'AU') {
                aure.push({ punteggio, valore });
            }
        }
    });

    return { stat_primarie: primarie, caratteristiche: chars, aure_possedute: aure };

  }, [punteggiList, punteggi_base]);

  return (
    <div className="p-4 max-w-lg mx-auto pb-20">
      <h2 className="text-4xl font-bold text-indigo-400 mb-6 text-center">{nome}</h2>
      
      {/* Blocco Valute */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatRow label="Crediti" value={crediti || 0} icon={<Coins className="text-yellow-400" />} />
        <StatRow label="Punti Car." value={punti_caratteristica || 0} icon={<Star className="text-blue-400" />} />
      </div>

      {/* Blocco Statistiche Primarie (TAGLIA L) */}
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
                  size="l" // Taglia L
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Blocco Caratteristiche (TAGLIA M - Default) */}
      {caratteristiche.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Caratteristiche</h3>
          <div className="grid grid-cols-2 gap-4">
            {caratteristiche.map(({ punteggio, valore }) => (
                <PunteggioDisplay
                  key={punteggio.id} 
                  punteggio={punteggio} 
                  value={valore}         
                  displayText="name"   
                  iconType="inv_circle"
                  size="m" // Default M
                />
            ))}
          </div>
        </div>
      )}

      {/* Blocco Abilità Raggruppate */}
      <GroupedSkillList items={abilita_possedute} punteggiList={punteggiList} />

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

      {/* Blocco Aure Possedute (TAGLIA L) */}
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
                size="l" // Taglia L
              />
            ))}
          </div>
        </details>
      )}

      {/* Blocco Statistiche Secondarie (TAGLIA S) */}
      {modificatori_calcolati && (
        <details className="mt-4 bg-gray-800 rounded-lg shadow-inner">
          <summary className="text-xl font-semibold text-gray-200 p-3 cursor-pointer">
            Statistiche Secondarie
          </summary>
          <div className="grid grid-cols-3 gap-2 p-4 border-t border-gray-700">
            
            {/* Iteriamo su punteggiList per mantenere l'ordine del backend anche qui */}
            {punteggiList.map((punteggio) => {
               // Filtra solo quelle secondarie che hanno un calcolo presente
               if (!punteggio.parametro || punteggio.is_primaria) return null;
               const mods = modificatori_calcolati[punteggio.parametro];
               if (!mods) return null;

               const valore_finale = (punteggio.valore_predefinito + mods.add) * mods.mol;
               
               return (
                <PunteggioDisplay
                  key={punteggio.id}
                  punteggio={punteggio}
                  value={Math.round(valore_finale)} 
                  displayText="name"
                  iconType="inv_circle"
                  size="s" // Taglia S
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

const LoadingComponent = () => (
    <div className="p-8 text-center text-lg text-gray-400">
      Caricamento dati personaggio...
    </div>
  );

const HomeTab = () => {
    const { 
      selectedCharacterData, 
      isLoadingDetail,
      isLoadingPunteggi, 
      selectedCharacterId, 
      error 
    } = useCharacter();
  
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
  
    return <CharacterSheet data={selectedCharacterData} />;
};
  
export default HomeTab;