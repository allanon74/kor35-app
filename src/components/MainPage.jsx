import React from 'react';
import { Tab } from '@headlessui/react';
import { 
    UserIcon, 
    BeakerIcon, 
    SparklesIcon, 
    QrCodeIcon, 
    EnvelopeIcon, 
    BoltIcon,
    DocumentTextIcon, // Per le proposte
} from '@heroicons/react/24/outline';

import { useCharacter } from './CharacterContext';

import HomeTab from './HomeTab';
import AbilitaTab from './AbilitaTab';
import QrTab from './QrTab';
import MessaggiTab from './MessaggiTab';
import InfusioniTab from './InfusioniTab';
import TessitureTab from './TessitureTab';
import ProposalManager from './ProposalManager'; // Assumi che questo componente esista

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MainPage = ({ onLogout }) => {
  const { selectedCharacterData, loading, viewAll, unreadCount } = useCharacter();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <p className="animate-pulse text-lg">Caricamento dati...</p>
      </div>
    );
  }

  // Lista delle tab con configurazione
  const tabs = [
    { name: 'Personaggio', icon: UserIcon, component: <HomeTab onLogout={onLogout} /> },
    { name: 'Abilità', icon: SparklesIcon, component: <AbilitaTab onLogout={onLogout} /> },
    { name: 'Infusioni', icon: BeakerIcon, component: <InfusioniTab onLogout={onLogout} /> },
    { name: 'Tessiture', icon: BoltIcon, component: <TessitureTab onLogout={onLogout} /> },
    { name: 'QR Code', icon: QrCodeIcon, component: <QrTab onLogout={onLogout} /> },
    { 
        name: 'Messaggi', 
        icon: EnvelopeIcon, 
        component: <MessaggiTab onLogout={onLogout} />,
        hasBadge: true // Flag per indicare che questa tab ha un badge
    },
    { name: 'Proposte', icon: DocumentTextIcon, component: <ProposalManager onLogout={onLogout} /> },
  ];

  return (
    <div className="w-full max-w-md mx-auto h-screen flex flex-col bg-gray-900 text-white shadow-2xl overflow-hidden relative">
      
      {/* Header Fisso */}
      <div className="bg-gray-800 p-4 border-b border-gray-700 z-10 shadow-md">
        <div className="flex justify-between items-center">
           <div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-linear-to-r from-indigo-400 to-purple-400">
                KOR-35
              </h1>
              {selectedCharacterData && (
                <p className="text-xs text-gray-400 mt-0.5">
                   PG: <span className="text-white font-medium">{selectedCharacterData.nome}</span> 
                   {viewAll && <span className="ml-2 text-red-400 font-bold">(ADMIN VIEW)</span>}
                </p>
              )}
           </div>
           <button 
             onClick={onLogout}
             className="text-xs bg-gray-700 hover:bg-gray-600 text-gray-300 py-1.5 px-3 rounded transition-colors"
           >
             Logout
           </button>
        </div>
      </div>

      {/* Area Contenuto (Scrollabile) */}
      <Tab.Group>
        <Tab.Panels className="flex-1 overflow-y-auto bg-gray-900 scrollbar-hide pb-20"> 
          {/* pb-20 lascia spazio per la bottom bar */}
          {tabs.map((tab, idx) => (
            <Tab.Panel key={idx} className="focus:outline-none min-h-full">
              {tab.component}
            </Tab.Panel>
          ))}
        </Tab.Panels>

        {/* Bottom Navigation Bar */}
        <Tab.List className="bg-gray-800 border-t border-gray-700 flex justify-around items-center p-2 pb-safe absolute bottom-0 w-full z-20">
          {tabs.map((tab) => (
            <Tab
              key={tab.name}
              className={({ selected }) =>
                classNames(
                  'w-full flex flex-col items-center justify-center py-1 rounded-lg transition-all duration-200 outline-none',
                  selected
                    ? 'text-indigo-400 scale-105'
                    : 'text-gray-500 hover:text-gray-300'
                )
              }
            >
              <div className="relative p-1">
                <tab.icon className="w-6 h-6 mb-0.5" aria-hidden="true" />
                
                {/* LOGICA BADGE */}
                {tab.hasBadge && unreadCount > 0 && (
                     <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[10px] text-white font-bold ring-2 ring-gray-800 animate-pulse">
                        {unreadCount > 9 ? '!' : unreadCount}
                     </span>
                )}
              </div>
              <span className="text-[10px] font-medium">{tab.name}</span>
            </Tab>
          ))}
        </Tab.List>
      </Tab.Group>
    </div>
  );
};

export default MainPage;