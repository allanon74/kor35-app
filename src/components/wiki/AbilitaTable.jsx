import React from 'react';

export default function AbilitaTable({ list }) {
  if (!list || list.length === 0) return <p className="text-gray-500 italic">Nessuna abilità elencata.</p>;

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-200 shadow-sm rounded-lg">
        <thead className="bg-red-50 text-red-900 uppercase text-xs font-bold">
          <tr>
            <th className="px-4 py-2 border-b text-left">Nome</th>
            <th className="px-4 py-2 border-b text-left">Costo</th>
            <th className="px-4 py-2 border-b text-left">Descrizione</th>
          </tr>
        </thead>
        <tbody className="text-sm text-gray-700">
          {list.map((item) => (
            <tr key={item.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-2 font-bold">{item.nome}</td>
              <td className="px-4 py-2 text-center text-xs font-mono">{item.costo || "-"}</td>
              <td className="px-4 py-2">
                 <div dangerouslySetInnerHTML={{ __html: item.descrizione }} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}