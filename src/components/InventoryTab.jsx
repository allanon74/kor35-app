import React, { useState, useEffect } from 'react';
import { equipaggiaOggetto } from '../api'; 
import { useCharacter } from './CharacterContext';
// AGGIUNTA: Wrench icona per assemblaggio
import { ShoppingBag, Box, Shield, Zap, Loader2, Wrench } from 'lucide-react';
import ShopModal from './ShopModal';
// AGGIUNTA: Importa la modale
import ItemAssemblyModal from './ItemAssemblyModal';

const InventoryTab = ({ onLogout }) => {
  const { selectedCharacterData: characterData, isLoading: isContextLoading } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false);

  // --- AGGIUNTA: Stati per modale assemblaggio ---
  const [showAssembly, setShowAssembly] = useState(false);
  const [assemblyHost, setAssemblyHost] = useState(null);

  useEffect(() => {
    if (characterData?.oggetti) {
      setItems(characterData.oggetti);
    } else {
      setItems([]);
    }
  }, [characterData]);

  const handleToggleEquip = async (itemId) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      await equipaggiaOggetto(itemId, characterData.id, onLogout);
      window.location.reload(); 
    } catch (error) {
      console.error("Errore equipaggiamento:", error);
      alert(error.message || "Errore durante l'azione");
    } finally {
      setIsLoading(false);
    }
  };

  // --- AGGIUNTA: Handler per apertura modale ---
  const handleOpenAssembly = (item) => {
    setAssemblyHost(item);
    setShowAssembly(true);
  };

  // --- AGGIUNTA: Callback per refresh dopo assemblaggio ---
  const handleAssemblyComplete = () => {
    window.location.reload(); // Refresh brutale ma efficace per ricaricare i dati aggiornati
  };

  const renderItemCard = (item) => {
    const isPhysical = item.tipo_oggetto === 'FIS';
    const isEquipped = item.is_equipaggiato;
    
    // Logica visualizzazione bottone "Modifica":
    // Deve essere un oggetto fisico e avere una classe (quindi supportare mod/materia)
    const canBeModified = isPhysical && item.classe_oggetto_nome;

    return (
      <div 
        key={item.id} 
        className={`relative p-3 mb-3 rounded-lg border flex flex-col sm:flex-row gap-3 items-start justify-between transition-all ${
          isEquipped 
            ? 'bg-emerald-900/20 border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.1)]' 
            : 'bg-gray-800 border-gray-700 hover:border-gray-600'
        }`}
      >
        <div className="grow">
          {/* Intestazione Card */}
          <div className="flex items-center gap-2 mb-1">
             <h4 className={`font-bold text-base ${isEquipped ? 'text-emerald-300' : 'text-gray-200'}`}>
               {item.nome}
             </h4>
             {isEquipped && (
                <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider flex items-center gap-1">
                    <Shield size={10} /> Equip
                </span>
             )}
          </div>
          
          {/* Badge Tipo e Classe */}
          <div className="flex flex-wrap gap-2 text-xs text-gray-400 mb-2">
             <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
               {item.tipo_oggetto_display}
             </span>
             {item.classe_oggetto_nome && (
                <span className="bg-gray-900 px-2 py-0.5 rounded border border-gray-700">
                  {item.classe_oggetto_nome}
                </span>
             )}
          </div>

          {/* Descrizione */}
          <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-snug">
             {item.testo_formattato_personaggio ? (
                <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio }} />
             ) : (
                <p>{item.testo || item.descrizione}</p>
             )}
          </div>

          {/* Sezione Potenziamenti */}
          {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
            <div className="mt-2 pl-2 border-l-2 border-indigo-500/30">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1 flex items-center gap-1">
                <Zap size={10} /> Modifiche:
              </p>
              <div className="flex flex-wrap gap-1">
                {item.potenziamenti_installati.map(mod => (
                  <span key={mod.id} className="text-xs bg-indigo-900/40 px-1.5 py-0.5 rounded border border-indigo-500/30 text-indigo-200">
                    {mod.nome}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Pulsanti Azione */}
        <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
          
          {/* --- AGGIUNTA: Bottone Modifica --- */}
          {canBeModified && (
            <button
                onClick={() => handleOpenAssembly(item)}
                className="px-4 py-2 rounded text-sm font-bold shadow-sm transition-all active:scale-95 w-full sm:w-auto bg-gray-700 hover:bg-gray-600 text-amber-400 border border-gray-600 flex items-center justify-center gap-2"
            >
                <Wrench size={16} /> <span className="sm:hidden lg:inline">Modifica</span>
            </button>
          )}

          {isPhysical && (
            <button 
              onClick={() => handleToggleEquip(item.id)}
              disabled={isLoading}
              className={`px-4 py-2 rounded text-sm font-bold shadow-sm transition-all active:scale-95 w-full sm:w-auto ${
                isEquipped
                  ? 'bg-red-900/80 hover:bg-red-800 text-red-100 border border-red-700'
                  : 'bg-emerald-700 hover:bg-emerald-600 text-white border border-emerald-600'
              }`}
            >
              {isEquipped ? 'Rimuovi' : 'Equipaggia'}
            </button>
          )}
        </div>
      </div>
    );
  };

  // --- Render Principale ---
  
  if (isContextLoading) {
    return (
      <div className="p-8 text-center text-gray-500 flex justify-center">
        <Loader2 className="animate-spin" />
      </div>
    );
  }
  
  if (!characterData) {
    return <div className="p-4 text-center text-red-400">Nessun personaggio selezionato.</div>;
  }

  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  return (
    <div className="pb-24 px-1 space-y-6 animate-fadeIn">
      
      {/* HEADER */}
      <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm mb-4">
         <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Box className="text-indigo-400" />
            Inventario
         </h2>
         <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-sm border border-yellow-500"
         >
            <ShoppingBag size={18} />
            <span>Negozio</span>
         </button>
      </div>

      {/* SEZIONE 1: Innesti & Mutazioni */}
      <section>
        <h3 className="text-sm font-bold text-indigo-300 mb-2 flex items-center gap-2 uppercase tracking-wider pl-1">
          <span>🧬</span> Innesti & Mutazioni
        </h3>
        {corpoItems.length > 0 ? corpoItems.map(renderItemCard) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Nessun potenziamento corporeo installato.
          </p>
        )}
      </section>

      {/* SEZIONE 2: Equipaggiamento Attivo */}
      <section>
        <h3 className="text-sm font-bold text-emerald-300 mb-2 flex items-center gap-2 uppercase tracking-wider pl-1">
          <span>⚔️</span> Equipaggiamento Attivo
        </h3>
        {equipItems.length > 0 ? equipItems.map(renderItemCard) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Mani vuote. Equipaggia qualcosa dallo zaino.
          </p>
        )}
      </section>

      {/* SEZIONE 3: Zaino */}
      <section>
        <h3 className="text-sm font-bold text-gray-400 mb-2 flex items-center gap-2 uppercase tracking-wider pl-1">
          <span>🎒</span> Zaino
        </h3>
        {zainoItems.length > 0 ? zainoItems.map(renderItemCard) : (
          <p className="text-gray-600 italic text-sm p-4 text-center border border-dashed border-gray-700 rounded-lg bg-gray-800/30">
            Zaino vuoto. Visita il negozio!
          </p>
        )}
      </section>

      {/* Modale Shop */}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}

      {/* --- AGGIUNTA: Modale Assemblaggio --- */}
      {showAssembly && assemblyHost && (
        <ItemAssemblyModal 
            hostItem={assemblyHost}
            inventory={items} // Passiamo l'intero inventario, la modale filtrerà mod/materia
            onClose={() => {
                setShowAssembly(false);
                setAssemblyHost(null);
            }}
            onRefresh={handleAssemblyComplete}
        />
      )}
    </div>
  );
};

export default InventoryTab;