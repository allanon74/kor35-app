import React, { useState, Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import { Loader2, ShoppingCart, Info, CheckCircle2, PlusCircle } from 'lucide-react'; 
import TecnicaDetailModal from './TecnicaDetailModal';
import { acquireInfusione } from '../api.js';
import GenericGroupedList from './GenericGroupedList';
import PunteggioDisplay from './PunteggioDisplay';     
import IconaPunteggio from './IconaPunteggio';         

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const InfusioniTab = ({ onLogout }) => {
  const {
    selectedCharacterData: char,
    selectedCharacterId, 
    acquirableInfusioni, 
    refreshCharacterData,
    isLoadingAcquirable,
    isLoadingDetail
  } = useCharacter();
  
  const [modalItem, setModalItem] = useState(null);
  const [isAcquiring, setIsAcquiring] = useState(null);

  const handleOpenModal = (item) => setModalItem(item);

  const handleAcquire = async (item, e) => {
    e.stopPropagation();
    if (isAcquiring || !selectedCharacterId) return;
    
    const costoFinale = item.costo_effettivo ?? (item.costo_crediti || item.livello * 100);
    
    if (!window.confirm(`Acquisire Infusione "${item.nome}" per ${costoFinale} Crediti?`)) return;
    
    setIsAcquiring(item.id);
    try {
      await acquireInfusione(item.id, selectedCharacterId, onLogout);
      await refreshCharacterData(); 
    } catch (error) {
      alert(`Errore: ${error.message}`);
    } finally {
      setIsAcquiring(null);
    }
  };

  const sortItems = (items) => [...items].sort((a, b) => a.livello - b.livello);
  
  const possessed = sortItems(char?.infusioni_possedute || []);
  const acquirable = sortItems(acquirableInfusioni || []);

  if (isLoadingAcquirable || isLoadingDetail || !char) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

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

  const renderItem = (item, isAcquirable = false) => {
    const iconUrl = item.aura_richiesta?.icona_url;
    const iconColor = item.aura_richiesta?.colore;
    
    const costoPieno = item.costo_pieno ?? (item.costo_crediti || item.livello * 100);
    const costoEffettivo = item.costo_effettivo ?? costoPieno;
    const hasDiscount = costoEffettivo < costoPieno;
    const canAfford = char.crediti >= costoEffettivo;

    return (
      <li className="flex justify-between items-center py-3 px-3 hover:bg-gray-700/50 transition-colors rounded-sm border-b border-gray-700/50 last:border-0 group">
        <div className="flex items-center gap-3 cursor-pointer grow" onClick={() => handleOpenModal(item)}>
            <div className="shrink-0 relative">
                <IconaPunteggio url={iconUrl} color={iconColor} mode="cerchio_inv" size="xs" />
                <span className="absolute -top-2 -right-2 bg-gray-900 text-gray-200 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-gray-600">
                    L{item.livello}
                </span>
            </div>
            
            <div className="flex flex-col">
                <span className="font-bold text-gray-200 text-sm group-hover:text-indigo-300 transition-colors">
                    {item.nome}
                </span>
                {isAcquirable && (
                    <div className="flex flex-col items-start leading-tight mt-1">
                        {hasDiscount && (
                            <span className="text-[10px] text-red-400 line-through decoration-red-500 opacity-70">
                                {costoPieno} CR
                            </span>
                        )}
                        <span className={`text-[10px] font-medium ${canAfford ? (hasDiscount ? 'text-green-400' : 'text-gray-500') : 'text-red-500'}`}>
                            {hasDiscount ? 'Offerta: ' : 'Costo: '} {costoEffettivo} CR
                        </span>
                    </div>
                )}
            </div>
        </div>

        <div className="flex items-center gap-2">
            {isAcquirable && (
                <button
                    onClick={(e) => handleAcquire(item, e)}
                    disabled={!canAfford || isAcquiring === item.id}
                    className={`p-2 rounded-lg transition-colors ${
                        canAfford 
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg' 
                        : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                    }`}
                >
                    {isAcquiring === item.id ? <Loader2 className="animate-spin" size={16} /> : <ShoppingCart size={16} />}
                </button>
            )}
            <button
                onClick={(e) => {e.stopPropagation(); handleOpenModal(item)}}
                className="p-2 text-gray-400 hover:text-white hover:bg-gray-600 rounded-full"
            >
                <Info size={18} />
            </button>
        </div>
      </li>
    );
  };

  const PossessedList = (
      <GenericGroupedList 
        items={possessed} 
        groupByKey="aura_richiesta"
        orderKey="ordine"
        titleKey="nome"
        colorKey="colore"
        iconKey="icona_url"
        renderItem={(item) => renderItem(item, false)}
        renderHeader={renderGroupHeader}
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
        renderItem={(item) => renderItem(item, true)}
        renderHeader={renderGroupHeader}
      />
  );

  return (
    <>
      <div className="w-full p-4 max-w-6xl mx-auto pb-24">
        
        {/* Riepilogo Valute */}
        <div className="mb-6 flex justify-between items-center bg-gray-800 p-3 rounded-lg border border-gray-700 shadow-sm max-w-3xl mx-auto">
            <div className="text-sm text-gray-400">Disponibilità:</div>
            <div className="flex gap-4">
                <div className="flex items-center gap-1 text-yellow-400 font-bold">
                    <span>{char.crediti}</span> <span className="text-xs font-normal text-gray-400">CR</span>
                </div>
            </div>
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
                            ({idx === 0 ? possessed.length : acquirable.length})
                        </span>
                      </button>
                    )}
                  </Tab>
                ))}
              </Tab.List>
              
              <Tab.Panels>
                <Tab.Panel className="focus:outline-none animate-fadeIn">
                  {PossessedList}
                </Tab.Panel>
                <Tab.Panel className="focus:outline-none animate-fadeIn">
                  {AcquirableList}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
        </div>

        {/* --- DESKTOP --- */}
        <div className="hidden md:grid grid-cols-2 gap-6">
            <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    <h2 className="text-xl font-bold text-white">
                        Infusioni Possedute 
                        <span className="ml-2 text-sm font-normal text-gray-400">({possessed.length})</span>
                    </h2>
                </div>
                {PossessedList}
            </div>

            <div>
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-700">
                    <PlusCircle className="w-6 h-6 text-indigo-500" />
                    <h2 className="text-xl font-bold text-white">
                        Nuove Infusioni
                        <span className="ml-2 text-sm font-normal text-gray-400">({acquirable.length})</span>
                    </h2>
                </div>
                {AcquirableList}
            </div>
        </div>

      </div>
      
      {modalItem && (
        <TecnicaDetailModal
          tecnica={modalItem}
          type="Infusione"
          onClose={() => setModalItem(null)}
        />
      )}
    </>
  );
};

export default InfusioniTab;