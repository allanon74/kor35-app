import React, { useEffect, useState } from 'react';
// CORRETTO: Importiamo la funzione specifica che abbiamo appena creato
import { getWikiTable } from '../../api'; 
import AbilitaTable from '../wiki/AbilitaTable'; 

export default function WidgetTabellaAbilita({ id }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Chiamata diretta alla funzione importata
    getWikiTable(id)
       .then(responseData => setData(responseData))
       .catch(err => {
         console.error(`Errore caricamento tabella Wiki #${id}:`, err);
         setError(true);
       });
  }, [id]);

  if (error) return (
    <div className="p-4 border-l-4 border-red-500 bg-red-50 text-red-700 my-4 rounded">
      <strong>Errore:</strong> Impossibile caricare la tabella #{id}.
    </div>
  );

  if (!data) return (
    <div className="animate-pulse flex space-x-4 my-4 p-4 border rounded">
       <div className="h-4 bg-gray-200 rounded w-3/4"></div>
    </div>
  );

  // Adattamento dati: il backend potrebbe restituire 'abilita' o 'abilita_selezionate'
  const listaAbilita = data.abilita_selezionate || data.abilita || [];

  return (
    <div className="my-8 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-4 border-b border-gray-100 bg-gray-50">
          <h3 className="text-xl font-bold text-red-900">
            {data.titolo}
          </h3>
          {data.descrizione && (
            <div className="mt-2 text-sm text-gray-600 italic" dangerouslySetInnerHTML={{__html: data.descrizione}} />
          )}
      </div>

      <AbilitaTable list={listaAbilita} />
    </div>
  );
}