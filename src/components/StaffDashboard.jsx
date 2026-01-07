import React, { useState } from 'react';
import GenericHeader from './GenericHeader';
import Sidebar from './Sidebar';
import { 
    Map, Scroll, FlaskConical, Gavel, 
    Feather, Shield, MessageSquare, Users, 
    LayoutGrid, LogOut 
} from 'lucide-react';

// Importazione dei Sotto-Componenti (Tools)
import PlotTab from './PlotTab';
import AdminMessageTab from './AdminMessageTab';
// Assumi che questi esistano o usino i placeholder/manager che abbiamo visto
import CerimonialeManager from './editors/CerimonialeManager'; 
import InfusioneManager from './editors/InfusioneManager';
import TessituraManager from './editors/TessituraManager';
import OggettoBaseManager from './editors/OggettoBaseManager';
import OggettoManager from './editors/OggettoManager';

const StaffDashboard = ({ onLogout, onSwitchToPlayer }) => {
    // 'home' è la griglia di icone. Altrimenti è l'id del tool attivo.
    const [activeTool, setActiveTool] = useState('home'); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Configurazione dei Tools disponibili
    const toolsConfig = [
        { id: 'plot', label: 'Gestione Plot', icon: <Map size={48} />, color: 'bg-indigo-600', component: <PlotTab onLogout={onLogout} /> },
        { id: 'messaggi', label: 'Messaggi Staff', icon: <MessageSquare size={48} />, color: 'bg-emerald-600', component: <AdminMessageTab onLogout={onLogout} /> },
        { id: 'cerimoniali', label: 'Cerimoniali', icon: <Scroll size={48} />, color: 'bg-amber-700', component: <CerimonialeManager onLogout={onLogout} /> },
        { id: 'infusioni', label: 'Infusioni', icon: <FlaskConical size={48} />, color: 'bg-purple-700', component: <InfusioneManager onLogout={onLogout} /> },
        { id: 'oggetti', label: 'Database Oggetti', icon: <Gavel size={48} />, color: 'bg-stone-600', component: <OggettoManager onLogout={onLogout} /> },
        { id: 'oggetti-base', label: 'Templates Oggetti Base', icon: <Gavel size={48} />, color: 'bg-stone-600', component: <OggettoBaseManager onLogout={onLogout} /> },
        { id: 'tessiture', label: 'Tessiture', icon: <Feather size={48} />, color: 'bg-cyan-700', component: <TessituraManager onLogout={onLogout} /> },
    ];

    // Costruzione voci Sidebar
    const sidebarItems = [
        { label: 'Master Hub', icon: <LayoutGrid size={18}/>, active: activeTool === 'home', action: () => setActiveTool('home') },
        ...toolsConfig.map(t => ({
            label: t.label,
            icon: React.cloneElement(t.icon, { size: 18 }), // Riduco icona per sidebar
            active: activeTool === t.id,
            action: () => setActiveTool(t.id)
        })),
        { label: '----------------', icon: null, action: () => {} }, // Separatore visivo
        { label: 'Vai a Personaggi', icon: <Users size={18}/>, action: onSwitchToPlayer, active: false } // Link esterno
    ];

    return (
        <div className="flex flex-col h-screen bg-gray-950 text-white overflow-hidden font-sans">
            {/* Header Unificato */}
            <GenericHeader 
                title="KOR 35"
                subtitle={activeTool === 'home' ? "Master Control" : toolsConfig.find(t => t.id === activeTool)?.label}
                onMenuClick={() => setIsMenuOpen(true)}
                rightSlot={
                    // Se siamo dentro un tool, pulsante rapido per tornare alla Home Dashboard
                    activeTool !== 'home' && (
                        <button onClick={() => setActiveTool('home')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors">
                            <LayoutGrid size={20}/>
                        </button>
                    )
                }
            />

            {/* Sidebar di Navigazione */}
            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                title="Menu Master"
                items={sidebarItems} 
                onLogout={onLogout} 
            />

            {/* Contenuto Principale */}
            <main className="flex-1 overflow-hidden relative bg-gray-900">
                
                {/* VISTA HOME: Griglia pulsanti */}
                {activeTool === 'home' && (
                    <div className="h-full overflow-y-auto p-6">
                        <h2 className="text-2xl font-black text-gray-700 uppercase italic mb-6 tracking-widest text-center md:text-left">Strumenti Disponibili</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-w-5xl mx-auto md:mx-0">
                            {toolsConfig.map(tool => (
                                <button 
                                    key={tool.id}
                                    onClick={() => setActiveTool(tool.id)}
                                    className={`${tool.color} p-6 rounded-2xl shadow-xl hover:scale-105 transition-transform flex flex-col items-center justify-center gap-4 aspect-square border-t border-white/10`}
                                >
                                    <div className="text-white drop-shadow-md">{tool.icon}</div>
                                    <span className="font-bold text-white uppercase tracking-wider text-sm md:text-base text-center">{tool.label}</span>
                                </button>
                            ))}
                            
                            {/* Card speciale per Personaggi */}
                            <button 
                                onClick={onSwitchToPlayer}
                                className="bg-gray-800 border-2 border-dashed border-gray-700 p-6 rounded-2xl hover:bg-gray-700 hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-4 aspect-square"
                            >
                                <Users size={48} className="text-gray-500" />
                                <span className="font-bold text-gray-400 uppercase tracking-wider text-sm text-center">Vai a Personaggi</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* VISTA TOOL SPECIFICO */}
                {activeTool !== 'home' && (
                    <div className="h-full w-full animate-in fade-in zoom-in-95 duration-200">
                        {toolsConfig.find(t => t.id === activeTool)?.component}
                    </div>
                )}

            </main>
        </div>
    );
};

export default StaffDashboard;