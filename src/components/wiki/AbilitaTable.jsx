import React from 'react';

export default function AbilitaTable({ list }) {
  if (!list || list.length === 0) return <p className="text-gray-500 italic text-sm p-2">Nessuna abilità elencata.</p>;

  return (
    <div className="w-full overflow-x-auto bg-white rounded-lg shadow-sm border border-gray-200">
      {/* min-w-[600px] forza la tabella a non schiacciarsi, attivando lo scroll orizzontale se serve */}
      <table className="min-w-[600px] w-full">
        <thead className="bg-red-50 text-red-900 uppercase text-[10px] md:text-xs font-bold tracking-wider">
          <tr>
            <th className="px-3 py-2 md:px-4 border-b text-left w-1/4">Nome</th>
            <th className="px-2 py-2 md:px-4 border-b text-center w-16">Costo</th>
            <th className="px-3 py-2 md:px-4 border-b text-left">Descrizione</th>
          </tr>
        </thead>
        <tbody className="text-xs md:text-sm text-gray-700 divide-y divide-gray-100">
          {list.map((item) => (
            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-3 py-2 md:px-4 font-bold align-top text-red-900">
                {item.nome}
              </td>
              <td className="px-2 py-2 md:px-4 text-center font-mono text-gray-500 align-top bg-gray-50/50">
                {item.costo || "-"}
              </td>
              <td className="px-3 py-2 md:px-4 align-top whitespace-normal leading-relaxed">
                 <div dangerouslySetInnerHTML={{ __html: item.descrizione }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}