import React, { useState } from 'react';
import GenericHeader from './GenericHeader';
import Sidebar from './Sidebar';
import versionData from '../../package.json'; 
import { 
    Map, Scroll, FlaskConical, Gavel, 
    Feather, Shield, MessageSquare, Users, 
    LayoutGrid, LogOut, ClipboardCheck,
    Skull, BookOpen, Menu, ChevronRight, Globe, // Aggiunto Globe
    Layers, Globe2,
} from 'lucide-react';
import { Link } from 'react-router-dom';

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
import TabellaManager from './editors/TabellaManager';

const StaffDashboard = ({ onLogout, onSwitchToPlayer, initialTool = 'home' }) => {
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
        { id: 'oggetti-base', label: 'Oggetti Base', icon: <Shield size={24} />, color: 'bg-stone-800', component: <OggettoBaseManager onLogout={onLogout} /> },
        { id: 'tabelle', label: 'Gestione Tabelle', icon: <Layers size={24} />, color: 'bg-pink-700', component: <TabellaManager onLogout={onLogout} /> },
        { id: 'messaggi', label: 'Messaggi Staff', icon: <MessageSquare size={24} />, color: 'bg-emerald-600', component: <AdminMessageTab onLogout={onLogout} /> },        
    ];

    const handleToolSelect = (id) => {
        setActiveTool(id);
        setIsMenuOpen(false);
    };

    // Configurazione unificata degli elementi della sidebar
    const sidebarItems = [
        { label: 'Master Hub', icon: <LayoutGrid size={18}/>, active: activeTool === 'home', action: () => handleToolSelect('home') },
        ...toolsConfig.map(t => ({
            label: t.label,
            icon: React.cloneElement(t.icon, { size: 18 }),
            active: activeTool === t.id,
            action: () => handleToolSelect(t.id)
        })),
        { label: '----------------', icon: null, action: () => {} },
        // Aggiunto Wiki come elemento della lista, ma con proprietà 'link'
        { label: 'Wiki Pubblica', icon: <Globe size={18}/>, link: '/', active: false },
        { label: 'Vai a Personaggi', icon: <Users size={18}/>, action: onSwitchToPlayer, active: false }
    ];

    // Funzione helper per renderizzare un singolo item della sidebar
    const renderSidebarItem = (item, idx) => {
        if (item.label.includes('---')) return <div key={idx} className="h-px bg-gray-900 my-2 mx-4"></div>;
        
        const baseClasses = `w-full flex items-center justify-between p-3 rounded-xl font-bold transition-all group ${
            item.active 
            ? 'bg-indigo-600 text-white shadow-lg' 
            : 'text-gray-400 hover:bg-gray-900 hover:text-white'
        }`;

        const content = (
            <>
                <div className="flex items-center gap-3">
                    <div className={`transition-transform duration-200 ${item.active ? '' : 'group-hover:scale-110'}`}>
                        {item.icon}
                    </div>
                    <span className="text-xs uppercase tracking-wide truncate">{item.label}</span>
                </div>
                {item.active && <ChevronRight size={14} className="opacity-50"/>}
            </>
        );

        if (item.link) {
            return (
                <Link key={idx} to={item.link} className={baseClasses} title={item.label}>
                    {content}
                </Link>
            );
        }

        return (
            <button key={idx} onClick={item.action} className={baseClasses}>
                {content}
            </button>
        );
    };

    return (
        <div className="flex h-screen bg-gray-950 text-white overflow-hidden font-sans">
            
            {/* === SIDEBAR DESKTOP (Fissa a sinistra, solo desktop) === */}
            <aside className="hidden md:flex flex-col w-72 bg-gray-950 border-r border-gray-800 shadow-2xl z-20">
                <div className="p-6 border-b border-gray-900 flex items-center gap-3">
                     <div className="bg-indigo-600 p-1.5 rounded-lg shadow-lg shadow-indigo-900/50">
                        <LayoutGrid size={20} className="text-white"/>
                     </div>
                     <span className="font-black text-indigo-400 italic tracking-widest uppercase text-sm">MENU MASTER</span>
                </div>
                
                <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {sidebarItems.map((item, idx) => renderSidebarItem(item, idx))}
                </nav>

                <div className="p-4 border-t border-gray-900 bg-gray-950">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-3 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all mb-2">
                        <LogOut size={18} /><span className="text-xs uppercase tracking-wide">Logout</span>
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] text-gray-700 font-mono tracking-widest">v{versionData?.version || '1.0'}</span>
                    </div>
                </div>
            </aside>

            {/* === SIDEBAR MOBILE (Overlay a DESTRA) === */}
            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                title="Menu Master"
                items={sidebarItems} 
                onLogout={onLogout} 
            />

            {/* === CONTENUTO PRINCIPALE === */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative bg-gray-900">
                <GenericHeader 
                    title="KOR 35"
                    subtitle={activeTool === 'home' ? "Dashboard" : toolsConfig.find(t => t.id === activeTool)?.label}
                    rightSlot={
                        <div className="flex items-center gap-2">
                            {/* Tasto Home Rapido */}
                            {activeTool !== 'home' && (
                                <button onClick={() => setActiveTool('home')} className="p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-gray-400 transition-colors" title="Dashboard">
                                    <LayoutGrid size={20}/>
                                </button>
                            )}
                            
                            {/* Hamburger Menu (Visibile SOLO su Mobile, apre sidebar a destra) */}
                            <button 
                                onClick={() => setIsMenuOpen(true)} 
                                className="md:hidden p-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-indigo-400 transition-colors"
                            >
                                <Menu size={24} />
                            </button>
                        </div>
                    }
                />

                <main className="flex-1 overflow-y-auto overflow-x-hidden relative p-0 custom-scrollbar">
                    {activeTool === 'home' && (
                        <div className="min-h-full p-6 animate-in fade-in duration-300">
                            <h2 className="text-2xl font-black text-gray-700 uppercase italic mb-6 tracking-widest text-center md:text-left">Strumenti Staff</h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                                {toolsConfig.map(tool => (
                                    <button 
                                        key={tool.id}
                                        onClick={() => setActiveTool(tool.id)}
                                        className={`${tool.color} p-6 rounded-2xl shadow-xl hover:scale-[1.02] hover:shadow-2xl transition-all flex flex-col items-center justify-center gap-4 aspect-square border-t border-white/10 group relative overflow-hidden`}
                                    >
                                        <div className="absolute inset-0 bg-linear-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"/>
                                        <div className="text-white drop-shadow-md transform group-hover:-translate-y-1 transition-transform duration-300">
                                            {React.cloneElement(tool.icon, { size: 40 })}
                                        </div>
                                        <span className="font-black text-white uppercase tracking-wider text-xs text-center z-10">{tool.label}</span>
                                    </button>
                                ))}
                                
                                <button 
                                    onClick={onSwitchToPlayer}
                                    className="bg-gray-800 border-2 border-dashed border-gray-700 p-6 rounded-2xl hover:bg-gray-750 hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-4 aspect-square group"
                                >
                                    <Users size={40} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                                    <span className="font-bold text-gray-500 group-hover:text-white uppercase tracking-wider text-xs text-center">Vai a Personaggi</span>
                                </button>

                                <Link 
                                    to="/" 
                                    className="bg-gray-800 border-2 border-dashed border-gray-700 p-6 rounded-2xl hover:bg-gray-750 hover:border-gray-500 transition-all flex flex-col items-center justify-center gap-4 aspect-square group"
                                >
                                    <BookOpen size={40} className="text-gray-600 group-hover:text-gray-300 transition-colors" />
                                    <span className="font-bold text-gray-500 group-hover:text-white uppercase tracking-wider text-xs text-center">Vai alla Wiki</span>
                                </Link>
                            </div>
                        </div>
                    )}

                    {activeTool !== 'home' && (
                        <div className="h-full w-full flex flex-col animate-in slide-in-from-right-4 duration-300">
                            {toolsConfig.find(t => t.id === activeTool)?.component}
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
};

export default StaffDashboard;