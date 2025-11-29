import React, { useState, useEffect } from 'react';
import { equipaggiaOggetto, assemblaOggetto } from '../api'; // Import corretto
import { Shield, Sword, Box, Zap, Activity } from 'lucide-react'; // Icone opzionali

const InventoryTab = ({ characterData, onLogout }) => {
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (characterData?.oggetti) {
      setItems(characterData.oggetti);
    }
  }, [characterData]);

  const handleToggleEquip = async (itemId) => {
    if (isLoading) return;
    setIsLoading(true);
    try {
      // Chiama la tua API fetchAuthenticated
      await equipaggiaOggetto(itemId, onLogout);
      
      // Ricarica la pagina per aggiornare lo stato (semplice)
      // Idealmente, qui chiameresti una prop 'refreshData' passata dal padre
      window.location.reload(); 
    } catch (error) {
      console.error("Errore equipaggiamento:", error);
      alert(error.message || "Errore durante l'azione");
    } finally {
      setIsLoading(false);
    }
  };

  const renderItemCard = (item) => {
    // Determina se è un oggetto fisico gestibile
    const isPhysical = item.tipo_oggetto === 'FIS';
    
    return (
      <div 
        key={item.id} 
        className={`relative p-4 mb-3 rounded-lg border ${
          item.is_equipaggiato 
            ? 'bg-emerald-900/30 border-emerald-500/50' 
            : 'bg-gray-800 border-gray-700'
        }`}
      >
        <div className="flex justify-between items-start">
          <div>
            <h4 className="font-bold text-lg text-gray-100 flex items-center gap-2">
              {item.nome}
              {item.is_equipaggiato && <span className="text-xs bg-emerald-600 px-2 py-0.5 rounded text-white">EQUIP</span>}
            </h4>
            <p className="text-sm text-gray-400 mt-1">
              {item.tipo_oggetto_display} 
              {item.classe_oggetto_nome && <span className="ml-1">({item.classe_oggetto_nome})</span>}
            </p>

            {/* Statistiche / Testo */}
            <div className="mt-2 text-sm text-gray-300">
               {item.testo_formattato_personaggio ? (
                  <div dangerouslySetInnerHTML={{ __html: item.testo_formattato_personaggio }} />
               ) : (
                  <p>{item.testo}</p>
               )}
            </div>

            {/* Mod Installate */}
            {item.potenziamenti_installati && item.potenziamenti_installati.length > 0 && (
              <div className="mt-3 bg-black/20 p-2 rounded">
                <p className="text-xs font-bold text-indigo-300 mb-1">MOD INSTALLATE:</p>
                <div className="flex flex-wrap gap-2">
                  {item.potenziamenti_installati.map(mod => (
                    <span key={mod.id} className="text-xs bg-indigo-900/50 px-2 py-1 rounded border border-indigo-700 text-indigo-200">
                      {mod.nome}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {isPhysical && (
              <button 
                onClick={() => handleToggleEquip(item.id)}
                disabled={isLoading}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  item.is_equipaggiato
                    ? 'bg-red-600 hover:bg-red-500 text-white'
                    : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {item.is_equipaggiato ? 'Rimuovi' : 'Equipaggia'}
              </button>
            )}
            {/* Qui potresti aggiungere il pulsante "Assembla" */}
          </div>
        </div>
      </div>
    );
  };

  // Filtri categorie
  const corpoItems = items.filter(i => ['INN', 'MUT'].includes(i.tipo_oggetto));
  const equipItems = items.filter(i => i.is_equipaggiato && i.tipo_oggetto === 'FIS');
  const zainoItems = items.filter(i => !i.is_equipaggiato && !['INN', 'MUT'].includes(i.tipo_oggetto));

  return (
    <div className="pb-20"> {/* Padding bottom per la navbar mobile */}
      
      {/* Sezione Corpo */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-indigo-400 mb-3 flex items-center gap-2">
          <Activity size={20} /> Innesti & Mutazioni
        </h3>
        {corpoItems.length > 0 ? (
          corpoItems.map(renderItemCard)
        ) : (
          <p className="text-gray-500 italic p-4 bg-gray-800/50 rounded">Nessun potenziamento corporeo.</p>
        )}
      </section>

      {/* Sezione Equipaggiati */}
      <section className="mb-6">
        <h3 className="text-xl font-bold text-emerald-400 mb-3 flex items-center gap-2">
          <Sword size={20} /> Equipaggiamento Attivo
        </h3>
        {equipItems.length > 0 ? (
          equipItems.map(renderItemCard)
        ) : (
          <p className="text-gray-500 italic p-4 bg-gray-800/50 rounded">Non hai oggetti in mano.</p>
        )}
      </section>

      {/* Sezione Zaino */}
      <section>
        <h3 className="text-xl font-bold text-gray-400 mb-3 flex items-center gap-2">
          <Box size={20} /> Zaino
        </h3>
        {zainoItems.length > 0 ? (
          zainoItems.map(renderItemCard)
        ) : (
          <p className="text-gray-500 italic p-4 bg-gray-800/50 rounded">Zaino vuoto.</p>
        )}
      </section>
    </div>
  );
};

export default InventoryTab;