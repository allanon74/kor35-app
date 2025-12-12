import React, { useMemo } from 'react';
import { useCharacter } from './CharacterContext';
import { Coins, Star, Bell, Backpack, Zap } from 'lucide-react';
import PunteggioDisplay from './PunteggioDisplay';
import GenericGroupedList from './GenericGroupedList';
import IconaPunteggio from './IconaPunteggio';


// --- NUOVI COMPONENTI ---
import LogViewer from './LogViewer';
import TransazioniViewer from './TransazioniViewer';

// --- Componenti Helper ---

const StatRow = ({ label, value, icon }) => (
  <div className="flex justify-between items-center p-2 bg-gray-800 rounded-md">
    <div className="flex items-center">
      {icon}
      <span className="ml-2 font-semibold text-gray-300 capitalize">{label}</span>
    </div>
    <span className="text-xl font-bold text-white">{value}</span>
  </div>
);

// (ItemList commentato come nel tuo originale)
// const ItemList = ({ title, items, keyField = 'id', nameField = 'nome' }) => (
//   <div className="mb-6">
// ...
//   </div>
// );

const LoadingComponent = () => (
  <div className="p-8 text-center text-lg text-gray-400">
    Caricamento dati personaggio...
  </div>
);


// --- Componente Scheda ---

const CharacterSheet = ({ data }) => {
  const { punteggiList, subscribeToPush, fetchCharacterData } = useCharacter(); // <--- AGGIUNTO fetchCharacterData

  const {
    nome,
    crediti,
    punti_caratteristica,
    punteggi_base, 
    modificatori_calcolati, 
    abilita_possedute, 
    oggetti,
    // log_eventi <-- RIMOSSO: Ora gestito da LogViewer
  } = data;

  // --- LOGICA FILTRO OGGETTI ATTIVI ---
  const activeItems = useMemo(() => {
    if (!oggetti) return [];
    
    return oggetti.filter(obj => {
      // 1. Mostra sempre Innesti (INN) e Mod (MOD), anche se scarichi
      if (['INN', 'MOD'].includes(obj.tipo_oggetto)) return true;
      
      // 2. Mostra oggetti fisici (es. armi/bacchette) SOLO se hanno cariche attive > 0
      if (obj.cariche_attuali > 0) return true;
      
      return false;
    });
  }, [oggetti]);

  // Calcolo Statistiche
  const { stat_primarie, caratteristiche, aure_possedute } = useMemo(() => {
    if (!punteggiList || punteggiList.length === 0 || !punteggi_base) { 
      return { stat_primarie: [], caratteristiche: [], aure_possedute: [] };
    }

    const sortByOrdine = (a, b) => (a.ordine || 0) - (b.ordine || 0);
    const sortByPunteggioOrdine = (a, b) => (a.punteggio.ordine || 0) - (b.punteggio.ordine || 0);

    const primarie = punteggiList
        .filter(p => p.tipo === 'ST' && p.is_primaria)
        .sort(sortByOrdine);

    const punteggiMappati = Object.entries(punteggi_base) 
      .map(([nome, valore]) => {
        const punteggio = punteggiList.find(p => p.nome === nome);
        if (punteggio) return { punteggio, valore };
        return null; 
      })
      .filter(Boolean); 

    const chars = punteggiMappati
        .filter(item => item.punteggio.tipo === 'CA')
        .sort(sortByPunteggioOrdine);
    
    const aure = punteggiMappati
        .filter(item => item.punteggio.tipo === 'AU')
        .sort(sortByPunteggioOrdine);

    return { stat_primarie: primarie, caratteristiche: chars, aure_possedute: aure };

  }, [punteggiList, punteggi_base]);

  // --- RENDER ITEM ABILITÀ ---
  const renderAbilitaItem = (abilita) => {
    const iconUrl = abilita.caratteristica?.icona_url;
    const iconColor = abilita.caratteristica?.colore;

    return (
        <li className="py-2 px-2 hover:bg-gray-700/50 transition-colors rounded-sm cursor-default border-b border-gray-700/50 last:border-0">
            <div className="flex items-center gap-2">
                <div className="mt-1 self-start shrink-0">
                    <IconaPunteggio 
                        url={iconUrl}
                        color={iconColor}
                        mode="cerchio_inv" 
                        size="xs"
                    />
                </div>
                <span className="font-bold text-gray-200 text-base">
                    {abilita.nome}
                </span>
            </div>

            {abilita.descrizione && (
                <div
                    className="text-sm text-gray-400 pl-8 mt-1 prose prose-invert prose-sm max-w-none leading-snug"
                    dangerouslySetInnerHTML={{ __html: abilita.descrizione }}
                />
            )}
        </li>
    );
  };

  // --- RENDER HEADER GRUPPO (PunteggioDisplay) ---
  const renderGroupHeader = (group) => {
    const fakePunteggio = {
        nome: group.name,
        colore: group.color,
        icona_url: group.icon
    };

    return (
        <PunteggioDisplay 
            punteggio={fakePunteggio}
            value={group.items.length} 
            displayText="name"
            iconType="inv_circle" 
            size="s"              
            className="rounded-b-none" 
        />
    );
  };

  return (
    <div className="p-4 max-w-4xl mx-auto">
      
      {/* Banner Notifiche */}
      {'Notification' in window && Notification.permission !== 'granted' && (
         <div className="mb-6 p-4 bg-indigo-900/50 rounded-lg border border-indigo-500 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 p-2 rounded-full">
                    <Bell size={20} className="text-white" />
                </div>
                <div>
                    <p className="font-bold text-white text-sm">Notifiche Push</p>
                    <p className="text-xs text-indigo-200">Ricevi messaggi anche ad app chiusa.</p>
                </div>
            </div>
            <button onClick={() => subscribeToPush()} className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-medium rounded shadow transition-colors w-full sm:w-auto">
                Attiva
            </button>
         </div>
      )}

      <h2 className="text-4xl font-bold text-indigo-400 mb-6 text-center">{nome}</h2>
      
      

      {/* Valute */}
      <div className="grid grid-cols-2 gap-4 mb-6 max-w-lg mx-auto"> 
        <StatRow label="CR" value={crediti || 0} icon={<Coins className="text-yellow-400" />} />
        <StatRow label="PC" value={punti_caratteristica || 0} icon={<Star className="text-blue-400" />} />
      </div>

      {/* Statistiche Primarie */}
      {stat_primarie.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Statistiche</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"> 
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
                  size="m"
                />
              );
            })}
          </div>
        </div>
      )}

      {/* Caratteristiche */}
      {caratteristiche.length > 0 && (
        <div className="mb-6">
          <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Caratteristiche</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {caratteristiche.map(({ punteggio, valore }) => (
                <PunteggioDisplay
                  key={punteggio.id} 
                  punteggio={punteggio} 
                  value={valore}         
                  displayText="name"   
                  iconType="inv_circle"
                  size="m"
                />
            ))}
          </div>
        </div>
      )}

      {/* Aure Possedute */}
      {aure_possedute.length > 0 && (
        <div className="mb-6">
            <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Aure Possedute</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {aure_possedute.map(({ punteggio, valore }) => (
                    <PunteggioDisplay
                        key={punteggio.id}
                        punteggio={punteggio}
                        value={valore}
                        displayText="name"
                        iconType="inv_circle"
                        size="m"
                    />
                ))}
            </div>
        </div>
      )}

      {/* Abilità */}
      {/* <div className="mb-6">
        <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Abilità</h3>
        {abilita_possedute && abilita_possedute.length > 0 ? (
            <GenericGroupedList 
                items={abilita_possedute}
                groupByKey="caratteristica"
                orderKey="ordine"
                titleKey="nome"             
                colorKey="colore"           
                iconKey="icona_url"         
                renderItem={renderAbilitaItem}
                renderHeader={renderGroupHeader}
                compact={false} 
            />
        ) : (
            <p className="text-gray-500 bg-gray-800 p-4 rounded-lg shadow-inner">Nessuna abilità trovata.</p>
        )}
      </div> */}

      {/* Oggetti - Se vuoi riattivare ItemList, scommenta qui sotto. Per ora è commentato come da originale */}
      {/* <ItemList title="Oggetti" items={oggetti} /> */}

      {/* --- SEZIONE LOG EVENTI (PAGINATA) --- */}
      {/* <div className="mb-6">
         <LogViewer />
      </div> */}

      {/* --- SEZIONE TRANSAZIONI (PAGINATA) --- */}
      {/* <div className="mb-6">
         <h3 className="text-2xl font-semibold mb-3 text-gray-200 border-b border-gray-700 pb-2">Transazioni</h3>
         <TransazioniViewer />
      </div> */}

      {/* Modificatori (Accordion) */}
      {modificatori_calcolati && (
        <details className="mt-4 bg-gray-800 rounded-lg shadow-inner">
          <summary className="text-xl font-semibold text-gray-200 p-3 cursor-pointer select-none">
            Statistiche Secondarie (Dettagli)
          </summary>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4 border-t border-gray-700">
            {Object.entries(modificatori_calcolati).map(([parametro, mods]) => {
              const punteggio = punteggiList.find(p => p.parametro === parametro);
              if (!punteggio || punteggio.is_primaria) return null;
              
              const valore_finale = (punteggio.valore_predefinito + mods.add) * mods.mol;
              return (
                <PunteggioDisplay
                  key={punteggio.id}
                  punteggio={punteggio}
                  value={Math.round(valore_finale)} 
                  displayText="name"
                  iconType="inv_circle"
                  size="m"
                />
              );
            })}
          </div>
        </details>
      )}
    </div>
  );
};

const HomeTab = () => {
  const { 
    selectedCharacterData, 
    isLoadingDetail,
    isLoadingPunteggi, 
    selectedCharacterId, 
    error 
  } = useCharacter();

  if (isLoadingDetail || isLoadingPunteggi) return <LoadingComponent />;
  if (error && !selectedCharacterData) return <div className="p-4 text-center text-red-400">Errore nel caricamento. Riprova.</div>;
  if (!selectedCharacterId) return <div className="p-8 text-center text-gray-400"><h2 className="text-2xl font-bold mb-4">Benvenuto!</h2><p>Seleziona un personaggio.</p></div>;
  if (!selectedCharacterData) return <div className="p-8 text-center text-gray-400"><p>Nessun dato trovato.</p></div>;

  return <CharacterSheet data={selectedCharacterData} />;
};

export default HomeTab;