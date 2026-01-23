import React, { Fragment, useEffect, memo } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import PlayerMessageTab from './PlayerMessageTab';
import AdminMessageTab from './AdminMessageTab';
import JobRequestsWidget from './JobRequestsWidget'; // <--- 1. Importa il Widget

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
} 

const MessaggiTab = ({ onLogout }) => {
  const { selectedCharacterData: char, viewAll, unreadCount, fetchUserMessages, selectedCharacterId } = useCharacter();

  // Refresh messaggi quando si apre la tab
  useEffect(() => {
    if (selectedCharacterId) fetchUserMessages(selectedCharacterId);
  }, [selectedCharacterId, fetchUserMessages]);

  if (!char) return <div className="p-4 text-gray-400">Caricamento...</div>;

  // Mostra tab Admin solo se staff e non in view-all
  const showAdminTab = char.is_staff && !viewAll;

  return (
    <div className="w-full p-2 sm:p-4 pb-20">
      
      {/* --- 2. INSERISCI QUI IL WIDGET LAVORI --- */}
      {/* Apparirà sopra le tab, visibile subito se ci sono richieste */}
      <JobRequestsWidget characterId={char.id} />

      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1 mb-4">
          <Tab as={Fragment}>
            {({ selected }) => (
              <button className={classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5 relative transition-all',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                  selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
              )}>
                Ricevuti
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-2 inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-red-600 rounded-full shadow-sm animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
              </button>
            )}
          </Tab>
          
          {showAdminTab && (
            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5 transition-all',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-gray-800 ring-white ring-opacity-60',
                    selected ? 'bg-red-700 text-white shadow' : 'text-gray-400 hover:bg-gray-700 hover:text-white'
                )}>
                  Admin Area
                </button>
              )}
            </Tab>
          )}
        </Tab.List>

        <Tab.Panels>
          <Tab.Panel className="focus:outline-none animate-fadeIn">
            {/* Passiamo le props necessarie al componente figlio esistente */}
            <PlayerMessageTab onLogout={onLogout} />
          </Tab.Panel>
          
          {showAdminTab && (
            <Tab.Panel className="focus:outline-none animate-fadeIn">
              <AdminMessageTab onLogout={onLogout} />
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default memo(MessaggiTab);