import React, { useState } from 'react';
import GenericHeader from './GenericHeader';
import Sidebar from './Sidebar'; // Questo lo usiamo per il mobile (Drawer)
import { 
    Map, Scroll, FlaskConical, Gavel, 
    Feather, Shield, MessageSquare, Users, 
    LayoutGrid, LogOut, ClipboardCheck,
    Skull, BookOpen, Menu
} from 'lucide-react';

// Importazione dei Sotto-Componenti (Tools)
import PlotTab from './PlotTab';
import AdminMessageTab from './AdminMessageTab';
import CerimonialeManager from './editors/CerimonialeManager'; 
import InfusioneManager from './editors/InfusioneManager';
import TessituraManager from './editors/TessituraManager';
import OggettoBaseManager from './editors/OggettoBaseManager';
import OggettoManager from './editors/OggettoManager';
import StaffProposalTab from './editors/StaffProposalTab';
import MostroManager from './editors/MostroManager'; 
import AbilitaManager from './editors/AbilitaManager';

const StaffDashboard = ({ onLogout, onSwitchToPlayer, initialTool = 'home' }) => {
    // 'home' è la griglia di icone. Altrimenti è l'id del tool attivo.
    const [activeTool, setActiveTool] = useState(initialTool); 
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    // Configurazione dei Tools disponibili
    const toolsConfig = [
        { id: 'plot', label: 'Gestione Plot', icon: <Map size={24} />, color: 'bg-indigo-600', component: <PlotTab onLogout={onLogout} /> },
        { id: 'mostri', label: 'Database Mostri', icon: <Skull size={24} />, color: 'bg-red-700', component: <MostroManager onLogout={onLogout} /> }, 
        { id: 'abilita', label: 'Database Abilità', icon: <BookOpen size={24} />, color: 'bg-blue-700', component: <AbilitaManager onLogout={onLogout} /> },
        { id: 'cerimoniali', label: 'Cerimoniali', icon: <Scroll size={24} />, color: 'bg-amber-700', component: <CerimonialeManager onLogout={onLogout} /> },
        { id: 'tessiture', label: 'Tessiture', icon: <Feather size={24} />, color: 'bg-cyan-700', component: <TessituraManager onLogout={onLogout} /> },
        { id: 'infusioni', label: 'Infusioni', icon: <FlaskConical size={24} />, color: 'bg-purple-700', component: <InfusioneManager onLogout={onLogout} /> },
        { id: 'proposte', label: 'Valutazione Proposte', icon: <ClipboardCheck size={24} />, color: 'bg-orange-600', component: <StaffProposalTab onLogout={onLogout} /> },
        { id: 'oggetti', label: 'Database Oggetti', icon: <Gavel size={24} />, color: 'bg-stone-600', component: <OggettoManager onLogout={onLogout} /> },
        { id: 'oggetti-base', label: 'Templates Base', icon: <Shield size={24} />, color: 'bg-stone-800', component: <OggettoBaseManager onLogout={onLogout} /> },
        { id: 'messaggi', label: 'Messaggi Staff', icon: <MessageSquare size={24} />, color: 'bg-emerald-600', component: <AdminMessageTab onLogout={onLogout} /> },        
    ];

    // Funzione helper per cambiare tool e chiudere menu (per mobile)
    const handleToolChange = (id) => {
        setActiveTool(id);
        setIsMenuOpen(false);
    };

    // Costruzione voci Sidebar
    const sidebarItems = [
        { label: 'Master Hub', icon: <LayoutGrid size={18}/>, active: activeTool === 'home', action: () => handleToolChange('home') },
        ...toolsConfig.map(t => ({
            label: t.label,
            icon: React.cloneElement(t.icon, { size: 18 }), 
            active: activeTool === t.id,
            action: () => handleToolChange(t.id)
        })),
        { label: '----------------', icon: null, action: () => {} }, 
        { label: 'Vai a Personaggi', icon: <Users size={18}/>, action: onSwitchToPlayer, active: false } 
    ];

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">
            
            {/* === 1. SIDEBAR DESKTOP (Visibile solo su schermi MD o superiori) === */}
            <aside className="hidden md:flex flex-col w-64 bg-gray-900 border-r border-gray-800 flex-shrink-0 z-20 shadow-xl">
                {/* Logo Area */}
                <div className="p-6 border-b border-gray-800 flex items-center gap-3 bg-gray-950/50">
                     <div className="bg-indigo-600 p-2 rounded-lg shadow-lg shadow-indigo-900/50">
                        <LayoutGrid size={24} className="text-white"/>
                     </div>
                     <div>
                        <h2 className="font-black italic uppercase tracking-widest text-lg text-gray-100">KOR 35</h2>
                        <span className="text-[10px] text-indigo-400 font-bold uppercase block tracking-widest">Master Control</span>
                     </div>
                </div>
                
                {/* Navigation List */}
                <div className="flex-1 overflow-y-auto py-4 px-3 custom-scrollbar space-y-1">
                    {sidebarItems.map((item, idx) => (
                         item.label.includes('---') ? 
                            <div key={idx} className="my-2 border-t border-gray-800 mx-2 opacity-50" /> :
                            <button 
                                key={idx}
                                onClick={item.action}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group text-left ${
                                    item.active 
                                    ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-500/20 shadow-md shadow-indigo-900/10' 
                                    : 'text-gray-400 hover:bg-gray-800 hover:text-gray-100'
                                }`}
                            >
                                <div className={`transition-transform duration-300 group-hover:scale-110 ${item.active ? 'text-indigo-400' : 'text-gray-500 group-hover:text-white'}`}>
                                    {item.icon}
                                </div>
                                <span className="font-bold text-xs uppercase tracking-wide truncate">{item.label}</span>
                            </button>
                    ))}
                </div>

                {/* Footer Sidebar */}
                <div className="p-4 border-t border-gray-800 bg-gray-950/30">
                    <button onClick={onLogout} className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-red-900/10 text-red-400 hover:bg-red-900/30 border border-red-900/20 transition-all hover:shadow-lg hover:shadow-red-900/20">
                        <LogOut size={16} />
                        <span className="font-bold uppercase text-xs tracking-wider">Esci</span>
                    </button>
                </div>
            </aside>

            {/* === 2. MAIN CONTENT AREA === */}
            <div className="flex-1 flex flex-col min-w-0 relative bg-gray-950">
                
                {/* Header Unificato */}
                <div className="z-10 shadow-md flex-shrink-0">
                    <GenericHeader 
                        title="KOR 35"
                        subtitle={activeTool === 'home' ? "MASTER DASHBOARD" : toolsConfig.find(t => t.id === activeTool)?.label}
                        onMenuClick={() => setIsMenuOpen(true)} // Apre Drawer su Mobile
                        // Nascondiamo il bottone hamburger su desktop perché c'è la sidebar fissa
                        menuButtonClassName="md:hidden" 
                        rightSlot={
                            activeTool !== 'home' && (
                                <button onClick={() => setActiveTool('home')} className="md:hidden p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors">
                                    <LayoutGrid size={20}/>
                                </button>
                            )
                        }
                    />
                </div>

                {/* Sidebar Drawer per Mobile (Overlay) */}
                <div className="md:hidden">
                    <Sidebar 
                        isOpen={isMenuOpen} 
                        onClose={() => setIsMenuOpen(false)} 
                        title="Menu Master"
                        items={sidebarItems} 
                        onLogout={onLogout} 
                    />
                </div>

                {/* Contenuto Principale Scrollabile */}
                <main className="flex-1 overflow-y-auto overflow-x-hidden relative bg-gray-900 custom-scrollbar">
                    
                    {/* VISTA HOME: Griglia pulsanti */}
                    {activeTool === 'home' && (
                        <div className="min-h-full p-4 md:p-8 animate-in fade-in zoom-in-95 duration-300">
                            <h2 className="text-2xl md:text-3xl font-black text-gray-800 uppercase italic mb-8 tracking-widest text-center md:text-left select-none">
                                Centro di Controllo
                            </h2>
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
                                {toolsConfig.map(tool => (
                                    <button 
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id)}
                                        className={`group relative overflow-hidden ${tool.color} p-4 md:p-6 rounded-2xl shadow-xl hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 flex flex-col items-center justify-center gap-4 aspect-square border-t border-white/10`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        <div className="text-white/90 group-hover:text-white drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-300">
                                            {React.cloneElement(tool.icon, { size: 40 })}
                                        </div>
                                        <span className="font-black text-white uppercase tracking-wider text-[10px] md:text-xs text-center leading-tight">
                                            {tool.label}
                                        </span>
                                    </button>
                                ))}
                                
                                {/* Card speciale per Personaggi */}
                                <button 
                                    onClick={onSwitchToPlayer}
                                    className="group bg-gray-800 border-2 border-dashed border-gray-700 p-6 rounded-2xl hover:bg-gray-700 hover:border-gray-500 hover:shadow-xl transition-all duration-300 flex flex-col items-center justify-center gap-4 aspect-square"
                                >
                                    <Users size={40} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                                    <span className="font-bold text-gray-500 group-hover:text-white uppercase tracking-wider text-[10px] md:text-xs text-center">
                                        Torna a Personaggi
                                    </span>
                                </button>
                            </div>
                        </div>
                    )}

                    {/* VISTA TOOL SPECIFICO */}
                    {activeTool !== 'home' && (
                        <div className="h-full w-full animate-in slide-in-from-right-4 duration-300 flex flex-col">
                            {/* Il wrapper flex-col e min-h-full assicura che il contenuto utilizzi tutto lo spazio */}
                            {toolsConfig.find(t => t.id === activeTool)?.component}
                        </div>
                    )}

                </main>
            </div>
        </div>
    );
};

export default StaffDashboard;