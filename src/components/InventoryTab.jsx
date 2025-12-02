import React, { useState, useEffect } from 'react';
import { equipaggiaOggetto } from '../api'; 
import { useCharacter } from './CharacterContext';
import { ShoppingBag } from 'lucide-react'; // Icona per il negozio
import ShopModal from './ShopModal'; // Import Modale Negozio

const InventoryTab = ({ onLogout }) => {
  const { characterData, isLoading: isContextLoading } = useCharacter();
  
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showShop, setShowShop] = useState(false); // Stato visibilità negozio

  useEffect(() => {
    // Sincronizza lo stato locale con i dati del contesto
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
      // Nota: Idealmente dovremmo usare una funzione di refresh dal context invece di reload
      window.location.reload(); 
    } catch (error) {
      console.error("Errore equipaggiamento:", error);
      alert(error.message || "Errore durante l'azione");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItemCard = (item) => {
    // Determina se è un oggetto fisico gestibile (equipaggiabile)
    const isPhysical = item.tipo_oggetto === 'FIS';
    const isEquipped = item.is_equipaggiato;
    
    return (
      <div 
        key={item.id} 
        className={`relative p-3 mb-3 rounded-lg border flex flex-col sm:flex-row gap-3 items-start justify-between ${
          isEquipped 
            ? 'bg-emerald-900/20 border-emerald-500/50' 
            : 'bg-gray-800 border-gray-700'
        }`}
      >
        <div className="grow">
          <div className="flex items-center gap-2 mb-1">
             <h4 className={`font-bold text-base ${isEquipped ? 'text-emerald-300' : 'text-gray-200'}`}>
               {item.nome}
             </h4>
             {isEquipped && <span className="text-[10px] bg-emerald-600 text-white px-1.5 py-0.5 rounded uppercase font-bold tracking-wider">Equip</span>}
          </div>
          
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

          {/* Testo Formattato / Statistiche */}
          <div className="text-sm text-gray-300 prose prose-invert prose-sm max-w-none leading-snug">
             {item.testo_formattato_personaggio ? (
                <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio }} />
             ) : (
                <p>{item.testo}</p>
             )}
          </div>

          {/* Mod Installate (Se presenti) */}
          {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
            <div className="mt-2 pl-2 border-l-2 border-indigo-500/30">
              <p className="text-[10px] font-bold text-indigo-400 uppercase mb-1">Modifiche:</p>
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

        {/* Azioni */}
        <div className="shrink-0 flex flex-col gap-2 w-full sm:w-auto">
          {isPhysical && (
            <button 
              onClick={() => handleToggleEquip(item.id)}
              disabled={isLoading}
              className={`px-4 py-2 rounded text-sm font-bold shadow-sm transition-all active:scale-95 ${
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

  if (isContextLoading) return <div className="p-4 text-center text-gray-500">Caricamento inventario...</div>;
  if (!characterData) return <div className="p-4 text-center text-red-400">Nessun personaggio selezionato.</div>;

  // Filtri categorie oggetti
  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  return (
    <div className="pb-24 px-1 space-y-6">
      
      {/* HEADER con Tasto Negozio */}
      <div className="flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm mb-4">
         <h2 className="text-xl font-bold text-white">Inventario</h2>
         <button
            onClick={() => setShowShop(true)}
            className="flex items-center gap-2 bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg shadow-yellow-900/20 transition-all active:scale-95 text-sm"
         >
            <ShoppingBag size={18} />
            <span>Negozio</span>
         </button>
      </div>

      {/* Sezione Corpo (Innesti/Mutazioni) */}
      <section>
        <h3 className="text-lg font-bold text-indigo-300 mb-2 flex items-center gap-2 border-b border-indigo-500/30 pb-1">
          <span>🧬</span> Innesti & Mutazioni
        </h3>
        {corpoItems.length > 0 ? (
          corpoItems.map(renderItemCard)
        ) : (
          <p className="text-gray-600 italic text-sm p-2 text-center border border-dashed border-gray-700 rounded">Nessun potenziamento corporeo.</p>
        )}
      </section>

      {/* Sezione Equipaggiati */}
      <section>
        <h3 className="text-lg font-bold text-emerald-300 mb-2 flex items-center gap-2 border-b border-emerald-500/30 pb-1">
          <span>⚔️</span> Equipaggiamento Attivo
        </h3>
        {equipItems.length > 0 ? (
          equipItems.map(renderItemCard)
        ) : (
          <p className="text-gray-600 italic text-sm p-2 text-center border border-dashed border-gray-700 rounded">Mani vuote.</p>
        )}
      </section>

      {/* Sezione Zaino */}
      <section>
        <h3 className="text-lg font-bold text-gray-300 mb-2 flex items-center gap-2 border-b border-gray-600/50 pb-1">
          <span>🎒</span> Zaino
        </h3>
        {zainoItems.length > 0 ? (
          zainoItems.map(renderItemCard)
        ) : (
          <p className="text-gray-600 italic text-sm p-2 text-center border border-dashed border-gray-700 rounded">Zaino vuoto.</p>
        )}
      </section>

      {/* Modale Negozio */}
      {showShop && <ShopModal onClose={() => setShowShop(false)} />}
    </div>
  );
};

export default InventoryTab;