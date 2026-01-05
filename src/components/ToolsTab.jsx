import React, { useState } from 'react';
import { useCharacter } from './CharacterContext';
import InfusioneEditor from './editors/InfusioneEditor';
import InfusioneManager from './editors/InfusioneManager';
// Gli altri verranno creati nei passi successivi
// import TessituraEditor from './editors/TessituraEditor';
// import CerimonialeEditor from './editors/CerimonialeEditor';

const ToolsTab = () => {
  const [activeTool, setActiveTool] = useState('menu'); // menu, infusione, tessitura, cerimoniale, proposte
  const { setStaffWorkMode } = useCharacter();

  const handleBack = () => setActiveTool('menu');

  if (activeTool === 'infusione') return <InfusioneManager onBack={() => setActiveTool('menu')} onLogout={onLogout} />;
  // if (activeTool === 'tessitura') return <TessituraEditor onBack={handleBack} />;
  // if (activeTool === 'cerimoniale') return <CerimonialeEditor onBack={handleBack} />;

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <h1 className="text-3xl font-bold text-amber-500 uppercase tracking-wider">🛠️ Strumenti Master</h1>
        <button 
          onClick={() => setStaffWorkMode(null)}
          className="bg-gray-800 hover:bg-gray-700 px-4 py-2 rounded border border-gray-700 transition-colors text-sm"
        >
          Indietro al Menu Staff
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        <ToolCard 
          title="Gestione Proposte" 
          desc="Revisiona le tecniche create dai giocatori" 
          icon="📩" 
          onClick={() => setActiveTool('proproste')} 
        />
        <ToolCard 
          title="Editor Infusioni" 
          desc="Crea Mod, Materie e Innesti" 
          icon="🧪" 
          onClick={() => setActiveTool('infusione')} 
        />
        <ToolCard 
          title="Editor Tessiture" 
          desc="Gestisci le formule e i parametri dell'Aura" 
          icon="✨" 
          onClick={() => setActiveTool('tessitura')} 
        />
        <ToolCard 
          title="Editor Cerimoniali" 
          desc="Configura riti ed effetti tecnici" 
          icon="🕯️" 
          onClick={() => setActiveTool('cerimoniale')} 
        />
      </div>
    </div>
  );
};

const ToolCard = ({ title, desc, icon, onClick }) => (
  <button 
    onClick={onClick}
    className="bg-gray-800/40 border border-gray-700 p-6 rounded-xl hover:border-amber-500 hover:bg-gray-800/60 transition-all text-left group"
  >
    <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{icon}</div>
    <div className="text-xl font-bold text-gray-100">{title}</div>
    <div className="text-sm text-gray-400 mt-2">{desc}</div>
  </button>
);

export default ToolsTab;