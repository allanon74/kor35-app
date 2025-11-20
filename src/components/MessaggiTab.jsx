import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import PlayerMessageTab from './PlayerMessageTab';
import AdminMessageTab from './AdminMessageTab';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MessaggiTab = ({ onLogout }) => {
  const { selectedCharacterData: char } = useCharacter();

  if (!char) return <div className="p-4 text-gray-400">Caricamento...</div>;

  // Usa il nuovo campo che abbiamo aggiunto al serializer
  const isAdmin = char.is_staff; 

  return (
    <div className="w-full p-4">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1">
          {/* Tab 1: Messaggi Ricevuti (Per tutti) */}
          <Tab as={Fragment}>
            {({ selected }) => (
              <button className={classNames(
                  'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                  'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                  selected ? 'bg-indigo-600 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
              )}>
                Ricevuti
              </button>
            )}
          </Tab>
          
          {/* Tab 2: Amministrazione (Solo per Admin) */}
          {isAdmin && (
            <Tab as={Fragment}>
              {({ selected }) => (
                <button className={classNames(
                    'w-full rounded-lg py-2.5 text-sm font-medium leading-5',
                    'focus:outline-none focus:ring-2 ring-offset-2 ring-offset-indigo-400 ring-white ring-opacity-60',
                    selected ? 'bg-red-700 text-white shadow' : 'text-gray-300 hover:bg-gray-700'
                )}>
                  Admin Area
                </button>
              )}
            </Tab>
          )}
        </Tab.List>

        <Tab.Panels className="mt-2">
          {/* Pannello 1 */}
          <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
            <PlayerMessageTab onLogout={onLogout} />
          </Tab.Panel>
          
          {/* Pannello 2 */}
          {isAdmin && (
            <Tab.Panel className="rounded-xl bg-gray-800 p-3 focus:outline-none">
              <AdminMessageTab onLogout={onLogout} />
            </Tab.Panel>
          )}
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default MessaggiTab;