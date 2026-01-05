import React, { useState } from 'react';
import { useCharacter } from './CharacterContext';
// Import degli editor (che creeremo nei prossimi passaggi)
// import InfusioneEditor from './editors/InfusioneEditor';
// import TessituraEditor from './editors/TessituraEditor';
// import CerimonialeEditor from './editors/CerimonialeEditor';

const ToolsTab = () => {
  const [activeTool, setActiveTool] = useState('menu');
  const { setStaffWorkMode } = useCharacter();

  // Funzione per tornare alla dashboard principale dello staff
  const handleBackToDashboard = () => {
    setStaffWorkMode(null);
  };

  // Rendering condizionale dei sotto-strumenti
  if (activeTool === 'edit_infusione') {
    return <div className="p-8"><h2>Editor Infusione (Sviluppo prossimo step)</h2><button onClick={() => setActiveTool('menu')} className="btn-secondary">Torna ai Tool</button></div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header della sezione */}
      <div className="flex justify-between items-center mb-10 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">Strumenti Master</h1>
          <p className="text-gray-400">Amministrazione tecnica e approvazione proposte</p>
        </div>
        <button 
          onClick={handleBackToDashboard}
          className="bg-gray-800 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors border border-gray-700"
        >
          ← Dashboard Staff
        </button>
      </div>

      {/* Grid dei Tool */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <ToolCard 
          title="Revisione Proposte" 
          description="Controlla le proposte inviate dai giocatori e trasformale in tecniche reali."
          icon="📩" 
          color="border-amber-500/30 hover:bg-amber-500/10"
          onClick={() => setActiveTool('proposals')}
        />
        <ToolCard 
          title="Crea Infusione" 
          description="Aggiungi una nuova Infusione (Materia, Mod o Innesto) al database."
          icon="🧪" 
          color="border-indigo-500/30 hover:bg-indigo-500/10"
          onClick={() => setActiveTool('edit_infusione')}
        />
        <ToolCard 
          title="Crea Tessitura" 
          description="Aggiungi una nuova Tessitura (Formule di Aura) al database."
          icon="✨" 
          color="border-purple-500/30 hover:bg-purple-500/10"
          onClick={() => setActiveTool('edit_tessitura')}
        />
        <ToolCard 
          title="Crea Cerimoniale" 
          description="Aggiungi un nuovo Cerimoniale rituale al database."
          icon="🕯️" 
          color="border-red-500/30 hover:bg-red-500/10"
          onClick={() => setActiveTool('edit_cerimoniale')}
        />
        <ToolCard 
          title="Ispezione QR" 
          description="Analizza il contenuto tecnico di un QR-Code senza attivarlo."
          icon="🔍" 
          color="border-emerald-500/30 hover:bg-emerald-500/10"
          onClick={() => setActiveTool('qr_inspector')}
        />
      </div>
    </div>
  );
};

const ToolCard = ({ title, description, icon, onClick, color }) => (
  <button 
    onClick={onClick}
    className={`flex flex-col text-left p-6 rounded-2xl border bg-gray-800/50 transition-all hover:scale-105 group ${color}`}
  >
    <span className="text-4xl mb-4 group-hover:animate-pulse">{icon}</span>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-400 text-sm">{description}</p>
  </button>
);

export default ToolsTab;