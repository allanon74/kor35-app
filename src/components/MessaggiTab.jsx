import React, { Fragment } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import PlayerMessageTab from './PlayerMessageTab';
import AdminMessageTab from './AdminMessageTab';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MessaggiTab = ({ onLogout }) => {
  // Prendi anche 'viewAll' dal context
  const { selectedCharacterData: char, viewAll } = useCharacter(); 

  if (!char) return <div className="p-4 text-gray-400">Caricamento...</div>;

  // Mostra la tab Admin SOLO SE:
  // 1. Il personaggio è staff (è un admin)
  // 2. E NON siamo in modalità "Vedi Tutti" (quindi stiamo guardando il nostro PG)
  //    (Questo assume che tu usi la checkbox "Tutti i PG" per spiare gli altri)
  const showAdminTab = char.is_staff && !viewAll;

  return (
    <div className="w-full p-4">
      <Tab.Group>
        <Tab.List className="flex space-x-1 rounded-xl bg-gray-800 p-1">
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
          
          {showAdminTab && (
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