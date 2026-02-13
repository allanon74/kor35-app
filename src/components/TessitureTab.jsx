import React, { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2, ShoppingCart, Info, CheckCircle2, PlusCircle, FileEdit, Star } from 'lucide-react';
import TecnicaDetailModal from './TecnicaDetailModal';
import { acquireTessitura } from '../api.js';
import { useOptimisticToggleTessituraFavorite } from '../hooks/useGameData';
import GenericGroupedList from './GenericGroupedList';
import PunteggioDisplay from './PunteggioDisplay';     
import IconaPunteggio from './IconaPunteggio';
import ProposalManager from './ProposalManager';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const TessitureTab = ({ onLogout }) => {
  const {
    selectedCharacterData: char,
    selectedCharacterId, 
    acquirableTessiture, 
    refreshCharacterData,
    isLoadingAcquirable,
    isLoadingDetail
  } = useCharacter();
  
  const [modalItem, setModalItem] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null);

  // Stato per gestire la visibilità del ProposalManager
  const [showProposals, setShowProposals] = useState(false);

  // Hook per optimistic update del favorite
  const toggleFavoriteMutation = useOptimisticToggleTessituraFavorite();

  const handleOpenModal = (item) => setModalItem(item);
  
  const handleToggleFavorite = (item, e) => {
    e.stopPropagation();
    if (!selectedCharacterId) return;
    toggleFavoriteMutation.mutate({ tessituraId: item.id, charId: selectedCharacterId });
  };

  const handleAcquire = async (item, e) => {
    e.stopPropagation();
    if (isAcquiring || !selectedCharacterId) return;
    
    const costoFinale = item.costo_effettivo ?? (item.costo_crediti || item.livello * 100);
    
    if (!window.confirm(`Acquisire Tessitura "${item.nome}" per ${costoFinale} Crediti?`)) return;
    
    setIsAcquiring(item.id);
    try {
      await acquireTessitura(item.id, selectedCharacterId, onLogout);
      await refreshCharacterData(); 
    } catch (error) {
      alert(`Errore: ${error.message}`);
    } finally {
      setIsAcquiring(null);
    }
  };

  const sortItems = (items) => [...items].sort((a, b) => a.livello - b.livello);
  
  // Separa le tessiture favorite dalle altre
  const allPossessed = char?.tessiture_possedute || [];
  const favorites = sortItems(allPossessed.filter(t => t.is_favorite));
  const possessed = sortItems(allPossessed.filter(t => !t.is_favorite));
  const acquirable = sortItems(acquirableTessiture || []);

  if (isLoadingAcquirable || isLoadingDetail || !char) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  // --- RENDERERS ---

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

  // 1. RENDER ITEM POSSEDUTO (Stile Semplice come Abilità)
  const renderPossessedItem = (item) => {
    const iconUrl = item.aura_richiesta?.icona_url;
    const iconColor = item.aura_richiesta?.colore;
    const isFavorite = item.is_favorite || false;

    return (
      <li className="flex justify-between items-center py-2 px-2 hover:bg-gray-700/50 transition-colors rounded-sm border-b border-gray-700/50 last:border-0">
        <div className="flex items-center gap-3 cursor-pointer grow" onClick={() => handleOpenModal(item)}>
            <div className="shrink-0 mt-0.5 relative">
                <IconaPunteggio url={iconUrl} color={iconColor} mode="cerchio_inv" size="xs" />
                <span className="absolute -top-2 -right-2 bg-gray-900 text-gray-200 text-[9px] font-bold px-1 py-0.5 rounded-full border border-gray-600 leading-none">
                    L{item.livello}
                </span>
            </div>
            <span className="font-bold text-gray-200 text-base">{item.nome}</span>
        </div>
        <div className="flex items-center gap-1">
            <button
                onClick={(e) => handleToggleFavorite(item, e)}
                className={`p-2 rounded-full transition-all ${
                    isFavorite 
                        ? 'text-yellow-400 hover:text-yellow-300 hover:bg-yellow-900/20' 
                        : 'text-gray-500 hover:text-yellow-400 hover:bg-gray-600'
                }`}
                title={isFavorite ? 'Rimuovi dai preferiti' : 'Aggiungi ai preferiti'}
            >
                <Star size={18} fill={isFavorite ? 'currentColor' : 'none'} />
            </button>
            <button
                onClick={(e) => {e.stopPropagation(); handleOpenModal(item)}}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
            >
                <Info size={18} />
            </button>
        </div>
      </li>
    );
  };

  // 2. RENDER ITEM ACQUISTABILE (Stile Ricco e Responsive come Abilità)
  const renderAcquirableItem = (item) => {
    const iconUrl = item.aura_richiesta?.icona_url;
    const iconColor = item.aura_richiesta?.colore;
    
    const costoPieno = item.costo_pieno ?? (item.costo_crediti || item.livello * 100);
    const costoEffettivo = item.costo_effettivo ?? costoPieno;
    const hasDiscount = costoEffettivo < costoPieno;
    const canAfford = char.crediti >= costoEffettivo;

    return (
      <li className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-2 hover:bg-gray-700/50 transition-colors rounded-sm border-b border-gray-700/50 last:border-0 gap-2">
        
        {/* Parte Sinistra: Icona + Nome + Prezzo Mobile */}
        <div className="flex items-center gap-3 cursor-pointer grow" onClick={() => handleOpenModal(item)}>
            <div className="shrink-0 mt-0.5 relative">
                <IconaPunteggio url={iconUrl} color={iconColor} mode="cerchio_inv" size="xs" />
                <span className="absolute -top-2 -right-2 bg-gray-900 text-gray-200 text-[9px] font-bold px-1 py-0.5 rounded-full border border-gray-600 leading-none">
                    L{item.livello}
                </span>
            </div>
            
            <div className="flex flex-col">
                <span className="font-bold text-gray-200 text-base">{item.nome}</span>
                {/* Prezzo Mobile */}
                <div className="text-xs text-gray-400 flex gap-2 mt-0.5 sm:hidden">
                    {hasDiscount ? (
                        <div className="flex items-center gap-1">
                             <span className="text-red-500 line-through decoration-red-500 opacity-70">{costoPieno}</span>
                             <span className={canAfford ? "text-green-400 font-bold" : "text-red-400 font-bold"}>{costoEffettivo} CR</span>
                        </div>
                    ) : (
                        <span className={canAfford ? "text-yellow-300" : "text-red-400"}>{costoEffettivo} CR</span>
                    )}
                </div>
            </div>
        </div>

        {/* Parte Destra: Prezzo Desktop + Bottoni */}
        <div className="flex items-center justify-end gap-3 w-full sm:w-auto">
            {/* Prezzo Desktop */}
            <div className="hidden sm:flex flex-col items-end text-xs font-mono mr-1">
                {hasDiscount ? (
                    <div className="flex flex-col items-end leading-none mt-1">
                        <span className="text-[10px] text-red-500 line-through decoration-red-500 opacity-80">
                            {costoPieno}
                        </span>
                        <span className="text-green-400 font-bold">
                            {costoEffettivo} CR
                        </span>
                    </div>
                ) : (
                    <span className={canAfford ? "text-yellow-300" : "text-red-400 font-bold"}>
                        {costoEffettivo} CR
                    </span>
                )}
            </div>

            <button
                onClick={(e) => handleAcquire(item, e)}
                disabled={!canAfford || isAcquiring === item.id}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all shadow-md ml-auto sm:ml-0 ${
                    canAfford 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white hover:shadow-indigo-500/20' 
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed opacity-50'
                }`}
            >
                {isAcquiring === item.id ? (
                    <Loader2 className="animate-spin" size={16} />
                ) : (
                    <>
                        <ShoppingCart size={16} />
                        <span className="hidden sm:inline">Acquista</span>
                    </>
                )}
            </button>
            
            <button
                onClick={(e) => {e.stopPropagation(); handleOpenModal(item)}}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full transition-colors"
            >
                <Info size={18} />
            </button>
        </div>
      </li>
    );
  };

  const FavoritesList = favorites.length > 0 ? (
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-yellow-700/50">
          <Star className="w-5 h-5 text-yellow-400" fill="currentColor" />
          <h3 className="text-lg font-bold text-yellow-400">
            Tessiture Preferite
            <span className="ml-2 text-sm font-normal text-gray-400">({favorites.length})</span>
          </h3>
        </div>
        <ul className="space-y-0 bg-gray-800/50 rounded-lg border border-yellow-700/30 overflow-hidden shadow-sm">
          {favorites.map(item => (
            <React.Fragment key={item.id}>
              {renderPossessedItem(item)}
            </React.Fragment>
          ))}
        </ul>
      </div>
  ) : null;

  const PossessedList = (
      <GenericGroupedList 
        items={possessed} 
        groupByKey="aura_richiesta"
        orderKey="ordine"
        titleKey="nome"
        colorKey="colore"
        iconKey="icona_url"
        renderItem={renderPossessedItem}
        renderHeader={renderGroupHeader}
        itemSortFn={(a, b) => a.livello - b.livello} 
      />
  );

  const AcquirableList = (
      <GenericGroupedList 
        items={acquirable} 
        groupByKey="aura_richiesta"
        orderKey="ordine"
        titleKey="nome"
        colorKey="colore"
        iconKey="icona_url"
        renderItem={renderAcquirableItem} // Usa il renderer complesso
        renderHeader={renderGroupHeader}
        itemSortFn={(a, b) => a.livello - b.livello}
      />
  );

  return (
    <>
      <div className="w-full p-4 max-w-6xl mx-auto pb-24">
        {/* Riepilogo Valute */}
        <div className="mb-4 flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm max-w-3xl mx-auto">
            <div className="text-sm text-gray-400">Disponibilità:</div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <span>{char.crediti}</span> <span className="text-xs font-normal text-gray-400">CR</span>
                </div>
            </div>
        </div>

        {/* Pulsante Proposte - NUOVA AGGIUNTA */}
        <div className="flex justify-end mb-6 max-w-3xl mx-auto">
            <button 
                onClick={() => setShowProposals(true)}
                className="flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-indigo-300 hover:text-white px-4 py-2 rounded-lg border border-gray-600 transition-all shadow-sm text-sm font-medium"
            >
                <FileEdit size={16} />
                Gestisci Proposte Tessitura
            </button>
        </div>

        {/* --- MOBILE --- */}
        <div className="md:hidden">
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-xl bg-gray-800/80 p-1 mb-6 shadow-inner">
                {['Possedute', 'Nuove'].map((category, idx) => (
                  <Tab as={Fragment} key={category}>
                    {({ selected }) => (
                      <button className={classNames(
                          'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                          selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
                      )}>
                        {category} <span className="ml-1 opacity-60 text-xs">
                            ({idx === 0 ? (possessed.length + favorites.length) : acquirable.length})
                        </span>
                      </button>
                    )}
                  </Tab>
                ))}
              </Tab.List>
              <Tab.Panels>
                <Tab.Panel className="focus:outline-none animate-fadeIn">
                  {FavoritesList}
                  {PossessedList}
                </Tab.Panel>
                <Tab.Panel className="focus:outline-none animate-fadeIn">{AcquirableList}</Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
        </div>

        {/* --- DESKTOP --- */}
        <div className="hidden md:grid grid-cols-2 gap-6">
            <div>
                {FavoritesList}
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-bold text-white">
                        Tessiture Possedute 
                        <span className="ml-2 text-sm font-normal text-gray-400">({possessed.length + favorites.length})</span>
                    </h2>
                </div>
                {PossessedList}
            </div>
            <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <PlusCircle className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-xl font-bold text-white">
                        Nuove Tessiture
                        <span className="ml-2 text-sm font-normal text-gray-400">({acquirable.length})</span>
                    </h2>
                </div>
                {AcquirableList}
            </div>
        </div>
      </div>
      
      {modalItem && (
        <TecnicaDetailModal tecnica={modalItem} type="Tessitura" onClose={() => setModalItem(null)} />
      )}

      {/* Modale Proposal Manager - NUOVA AGGIUNTA */}
      {showProposals && (
        <ProposalManager type="Tessitura" onClose={() => setShowProposals(false)} />
      )}
    </>
  );
};

export default TessitureTab;