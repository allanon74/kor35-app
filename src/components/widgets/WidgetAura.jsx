import React, { useEffect, useState } from 'react';
// CORRETTO: Importiamo la funzione specifica
import { getWikiAura } from '../../api';
import MattoneList from '../wiki/MattoneList';

export default function WidgetAura({ id }) {
  const [aura, setAura] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    getWikiAura(id)
       .then(data => setAura(data))
       .catch(err => {
         console.error(`Errore caricamento Aura #${id}`, err);
         setError(true);
       });
  }, [id]);

  if (error) return <div className="text-red-500 text-xs">[Aura #{id} non trovata]</div>;
  if (!aura) return <div className="text-xs text-gray-400 p-2">Caricamento dati aura...</div>;

  return (
    <div className="my-8 p-6 bg-blue-50 border border-blue-200 rounded-xl shadow-md">
      <div className="flex justify-between items-start border-b border-blue-200 pb-4 mb-4">
          <div>
            <h2 className="text-2xl font-bold text-blue-900">{aura.nome}</h2>
            <div className="text-blue-700 text-sm mt-1 flex gap-4">
                <span>⚡ Costo: <strong>{aura.costo_attivazione || '-'}</strong></span>
                <span>🔄 Mantenimento: <strong>{aura.mantenimento || '-'}</strong></span>
            </div>
          </div>
          <div className="bg-blue-600 text-white px-3 py-1 rounded text-xs uppercase font-bold tracking-wider">
            Aura
          </div>
      </div>

      {aura.descrizione && (
        <div className="mb-6 prose prose-blue max-w-none text-gray-700">
           <div dangerouslySetInnerHTML={{ __html: aura.descrizione }} />
        </div>
      )}

      {/* Verifica se 'mattoni' esiste nella risposta del backend */}
      {aura.mattoni && aura.mattoni.length > 0 && (
        <div className="mt-4">
            <h4 className="font-bold text-blue-900 mb-3 uppercase text-xs tracking-wider border-b border-blue-200 inline-block pb-1">
                Effetti e Mattoni
            </h4>
            <MattoneList mattoni={aura.mattoni} />
        </div>
      )}
    </div>
  );
}