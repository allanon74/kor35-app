import React from 'react';

// VERSIONE DI TEST SEMPLIFICATA
export default function WidgetTier({ id }) {
  return (
    <div className="p-4 border border-blue-500 bg-blue-50 my-4 rounded">
      <h3 className="font-bold text-blue-900">Tier #{id} (Test Mode)</h3>
      <p>Se vedi questo box senza crash, l'errore è nella tabella o nei dati originali.</p>
    </div>
  );
}