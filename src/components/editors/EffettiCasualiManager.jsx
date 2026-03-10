import React, { useState, useEffect, useCallback } from 'react';
import { Tab } from '@headlessui/react';
import { fetchAuthenticated, getPersonaggiList } from '../api';
import { Loader2 } from 'lucide-react';

const API_BASE = '/api/personaggi/api/staff';

const EffettiCasualiManager = ({ onBack, onLogout }) => {
  const [tipologie, setTipologie] = useState([]);
  const [effetti, setEffetti] = useState([]);
  const [personaggi, setPersonaggi] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSubTab, setActiveSubTab] = useState('tipologie');
  const [selezionaTipologia, setSelezionaTipologia] = useState(null);
  const [selezionaPersonaggio, setSelezionaPersonaggio] = useState('');
  const [risultato, setRisultato] = useState(null);

  const loadTipologie = useCallback(async () => {
    try {
      const data = await fetchAuthenticated(`${API_BASE}/tipologie-effetto/`, { method: 'GET' }, onLogout);
      setTipologie(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
      setTipologie([]);
    }
  }, [onLogout]);

  const loadEffetti = useCallback(async () => {
    try {
      const data = await fetchAuthenticated(`${API_BASE}/effetti-casuali/`, { method: 'GET' }, onLogout);
      setEffetti(Array.isArray(data) ? data : data.results || []);
    } catch (e) {
      console.error(e);
      setEffetti([]);
    }
  }, [onLogout]);

  const loadPersonaggi = useCallback(async () => {
    try {
      const data = await getPersonaggiList(onLogout, true);
      setPersonaggi(Array.isArray(data) ? data : []);
    } catch (e) {
      setPersonaggi([]);
    }
  }, [onLogout]);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([loadTipologie(), loadEffetti(), loadPersonaggi()]);
      setLoading(false);
    };
    load();
  }, [loadTipologie, loadEffetti, loadPersonaggi]);

  const handleSelezionaEffetto = async () => {
    if (!selezionaTipologia) {
      alert('Seleziona una tipologia');
      return;
    }
    try {
      const res = await fetchAuthenticated(
        '/api/personaggi/api/staff/seleziona-effetto-casuale/',
        {
          method: 'POST',
          body: JSON.stringify({
            tipologia_id: selezionaTipologia,
            personaggio_id: selezionaPersonaggio || null,
          }),
        },
        onLogout
      );
      setRisultato(res);
    } catch (e) {
      alert('Errore: ' + e.message);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-indigo-500" size={48} />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <button
        onClick={onBack}
        className="text-gray-400 hover:text-white flex items-center gap-2 mb-4 transition-colors"
      >
        ← Torna agli Strumenti Master
      </button>

      <h2 className="text-xl font-bold text-white">Effetti Casuali</h2>

      <Tab.Group>
        <Tab.List className="flex gap-2 p-1 bg-gray-800 rounded-lg">
          <Tab className={({ selected }) =>
            `px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selected ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`
          }>
            Tipologie
          </Tab>
          <Tab className={({ selected }) =>
            `px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selected ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`
          }>
            Effetti
          </Tab>
          <Tab className={({ selected }) =>
            `px-4 py-2 rounded-lg font-bold text-sm transition-colors ${selected ? 'bg-cyan-600 text-white' : 'text-gray-400 hover:text-white'}`
          }>
            Seleziona Casuale
          </Tab>
        </Tab.List>

        <Tab.Panels className="mt-4">
          <Tab.Panel>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
              <p className="text-gray-400 text-sm mb-4">
                Le tipologie si gestiscono dall&apos;admin Django. Qui puoi vedere l&apos;elenco.
              </p>
              <ul className="space-y-2">
                {tipologie.map((t) => (
                  <li key={t.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="font-bold text-gray-200">{t.nome}</span>
                    <span className="text-xs px-2 py-0.5 rounded bg-gray-700 text-gray-400">
                      {t.tipo === 'OGG' ? 'Oggetto' : 'Tessitura'}
                    </span>
                  </li>
                ))}
                {tipologie.length === 0 && <li className="text-gray-500">Nessuna tipologia.</li>}
              </ul>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4">
              <p className="text-gray-400 text-sm mb-4">
                Gli effetti si gestiscono dall&apos;admin Django. Qui puoi vedere l&apos;elenco.
              </p>
              <ul className="space-y-2">
                {effetti.map((e) => (
                  <li key={e.id} className="flex items-center justify-between py-2 border-b border-gray-700 last:border-0">
                    <span className="font-bold text-gray-200">{e.nome}</span>
                    <span className="text-xs text-gray-500">{e.tipologia?.nome}</span>
                  </li>
                ))}
                {effetti.length === 0 && <li className="text-gray-500">Nessun effetto.</li>}
              </ul>
            </div>
          </Tab.Panel>

          <Tab.Panel>
            <div className="bg-gray-800/50 rounded-lg border border-gray-700 p-4 space-y-4">
              <p className="text-gray-400 text-sm">
                Seleziona una tipologia e opzionalmente un personaggio. Se scegli un personaggio, l&apos;effetto verrà applicato (oggetto in inventario o consumabile).
              </p>
              <div className="flex flex-wrap gap-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tipologia</label>
                  <select
                    value={selezionaTipologia || ''}
                    onChange={(e) => setSelezionaTipologia(e.target.value ? parseInt(e.target.value) : null)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">-- Seleziona --</option>
                    {tipologie.map((t) => (
                      <option key={t.id} value={t.id}>{t.nome} ({t.tipo === 'OGG' ? 'Oggetto' : 'Tessitura'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Personaggio (opzionale)</label>
                  <select
                    value={selezionaPersonaggio}
                    onChange={(e) => setSelezionaPersonaggio(e.target.value)}
                    className="bg-gray-900 border border-gray-600 rounded px-3 py-2 text-white"
                  >
                    <option value="">-- Nessuno (solo anteprima) --</option>
                    {personaggi.map((p) => (
                      <option key={p.id} value={p.id}>{p.nome}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end">
                  <button
                    onClick={handleSelezionaEffetto}
                    className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded font-bold text-white"
                  >
                    Estrai Casuale
                  </button>
                </div>
              </div>
              {risultato && (
                <div className="mt-6 p-4 bg-gray-900 rounded border border-gray-600">
                  <h4 className="font-bold text-amber-400 mb-2">{risultato.nome}</h4>
                  <div className="text-sm text-gray-300 prose prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: risultato.descrizione }} />
                  {risultato.formula && (
                    <div className="mt-2 pt-2 border-t border-gray-700">
                      <span className="text-xs text-gray-500">Formula: </span>
                      <span dangerouslySetInnerHTML={{ __html: risultato.formula }} />
                    </div>
                  )}
                  {(risultato.oggetto_creato_id || risultato.consumabile_creato_id) && (
                    <p className="mt-2 text-green-400 text-sm">
                      ✓ Applicato al personaggio
                      {risultato.oggetto_creato_id && ' (oggetto in inventario)'}
                      {risultato.consumabile_creato_id && ' (consumabile aggiunto)'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </Tab.Panel>
        </Tab.Panels>
      </Tab.Group>
    </div>
  );
};

export default EffettiCasualiManager;
