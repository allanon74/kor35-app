import React from 'react';
import { X } from 'lucide-react';

// Funzione helper per ottenere il colore del testo (bianco o nero)
// in base alla luminanza del colore di sfondo.
const getTextColorForBg = (hexColor) => {
  try {
    const hex = hexColor.lstrip('#');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const luminanza = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminanza > 0.5 ? 'black' : 'white';
  } catch (e) {
    return 'white'; // Fallback
  }
};


const AbilitaDetailModal = ({ skill, onClose }) => {
  if (!skill) return null;

  const textColor = getTextColorForBg(skill.caratteristica.colore);

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-lg p-6 mx-4 bg-gray-800 rounded-lg shadow-xl"
        onClick={(e) => e.stopPropagation()} // Impedisce la chiusura al click interno
      >
        {/* Bottone Chiudi */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white"
        >
          <X size={24} />
        </button>
        
        {/* --- Box Caratteristica (COME RICHIESTO) --- */}
        <div className="absolute top-4 right-16">
          <div 
            style={{ 
              backgroundColor: skill.caratteristica.colore,
              color: textColor
            }}
            className="px-3 py-1 rounded-md text-lg font-bold"
          >
            {skill.caratteristica.sigla.toUpperCase()}
          </div>
        </div>

        {/* Titolo */}
        <h2 className="text-2xl font-bold text-indigo-400 mb-4 pr-16">
          {skill.nome}
        </h2>
        
        {/* Descrizione */}
        <p className="text-gray-300 mb-4 whitespace-pre-wrap">
          {skill.descrizione || <em>Nessuna descrizione.</em>}
        </p>

        {/* Costi */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-200">Costi</h3>
          <p className="text-gray-400">
            {skill.costo_pc} Punti Caratteristica
          </p>
          <p className="text-gray-400">
            {skill.costo_crediti} Crediti
          </p>
        </div>

        {/* Requisiti */}
        {skill.requisiti && skill.requisiti.length > 0 && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-200">Requisiti</h3>
            <ul className="list-disc list-inside text-gray-400">
              {skill.requisiti.map(req => (
                <li key={req.requisito.nome}>
                  {req.requisito.nome}: {req.valore}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        {/* Prerequisiti */}
        {skill.prerequisiti && skill.prerequisiti.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-200">Prerequisiti</h3>
            <ul className="list-disc list-inside text-gray-400">
              {skill.prerequisiti.map(pre => (
                <li key={pre.prerequisito.id}>
                  {pre.prerequisito.nome}
                </li>
              ))}
            </ul>
          </div>
        )}

      </div>
    </div>
  );
};

export default AbilitaDetailModal;