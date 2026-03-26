import React, { Fragment, useEffect, memo, useMemo, useState } from 'react';
import { Tab } from '@headlessui/react';
import { useCharacter } from './CharacterContext';
import PlayerMessageTab from './PlayerMessageTab';
import AdminMessageTab from './AdminMessageTab';
import JobRequestsWidget from './JobRequestsWidget'; // <--- 1. Importa il Widget
import { getMessageUnreadCounts } from '../api';
import { Mail } from 'lucide-react';

function classNames(...classes) {
  return classes.filter(Boolean).join(' ');
}

const MessaggiTab = ({ onLogout, composeTarget, onComposeTargetConsumed }) => {
  const { selectedCharacterData: char, viewAll, unreadCount, fetchUserMessages, selectedCharacterId, selectCharacter } = useCharacter();
  const [unreadByCharacter, setUnreadByCharacter] = useState([]);

  // Refresh messaggi quando si apre la tab
  useEffect(() => {
    if (selectedCharacterId) fetchUserMessages(selectedCharacterId);
  }, [selectedCharacterId, fetchUserMessages]);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const data = await getMessageUnreadCounts(onLogout);
        if (!alive) return;
        setUnreadByCharacter(Array.isArray(data) ? data : []);
      } catch (e) {
        if (!alive) return;
        setUnreadByCharacter([]);
      }
    };
    load();
    const id = window.setInterval(load, 45000);
    return () => {
      alive = false;
      window.clearInterval(id);
    };
  }, [onLogout, selectedCharacterId, unreadCount]);

  const unreadList = useMemo(() => {
    const list = Array.isArray(unreadByCharacter) ? unreadByCharacter : [];
    return list.filter((r) => Number(r.unread_count || 0) > 0);
  }, [unreadByCharacter]);

  if (!char) return <div className="p-4 text-gray-400">Caricamento...</div>;

  // Mostra tab Admin solo se staff e non in view-all
  const showAdminTab = char.is_staff && !viewAll;

  return (
    <div className="w-full p-2 sm:p-4 pb-20">
      
      {/* --- 2. INSERISCI QUI IL WIDGET LAVORI --- */}
      {/* Apparirà sopra le tab, visibile subito se ci sono richieste */}
      <JobRequestsWidget characterId={char.id} />

      {unreadList.length > 0 && (
        <div className="mb-4 rounded-xl border border-amber-400/20 bg-gray-900/70 p-3">
          <div className="flex items-center gap-2 text-sm font-bold text-amber-200 mb-2">
            <Mail size={16} /> Messaggi da leggere
          </div>
          <div className="flex flex-wrap gap-2">
            {unreadList.map((r) => (
              <button
                key={`unread-${r.personaggio_id}`}
                type="button"
                onClick={async () => {
                  const id = r.personaggio_id;
                  selectCharacter(String(id));
                  await fetchUserMessages(String(id));
                }}
                className={`px-3 py-2 rounded-lg border text-sm font-semibold inline-flex items-center gap-2 ${
                  String(r.personaggio_id) === String(selectedCharacterId)
                    ? 'bg-amber-900/30 border-amber-300/40 text-amber-100'
                    : 'bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700'
                }`}
                title="Apri inbox personaggio"
              >
                <span className="truncate max-w-40">{r.personaggio_nome || `PG ${r.personaggio_id}`}</span>
                <span className="min-w-6 h-6 px-2 rounded-full bg-red-600 text-white text-xs leading-6 text-center">
                  {Number(r.unread_count) > 99 ? '99+' : Number(r.unread_count)}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

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
            <PlayerMessageTab
              onLogout={onLogout}
              composeTarget={composeTarget}
              onComposeTargetConsumed={onComposeTargetConsumed}
            />
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