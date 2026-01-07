import React, { useState } from 'react';
import { X, LogOut, ChevronDown, ChevronRight } from 'lucide-react';
import versionData from '../../package.json'; 

const Sidebar = ({ isOpen, onClose, title, items, onLogout }) => {
    const [expandedItems, setExpandedItems] = useState({});

    const toggleExpand = (label, e) => {
        e.stopPropagation();
        setExpandedItems(prev => ({ ...prev, [label]: !prev[label] }));
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0  flex font-sans">
            <div className="absolute inset-0 z-100 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
            <div className="relative w-72 bg-gray-950 h-full border-r border-gray-800 flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
                
                {/* Header Sidebar */}
                <div className="p-6 flex justify-between items-center border-b border-gray-900">
                    <span className="font-black text-indigo-400 italic tracking-widest uppercase text-sm">{title}</span>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded-full text-gray-400"><X size={20}/></button>
                </div>

                {/* Lista Voci */}
                <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                    {items.map((item, idx) => {
                        const hasSubItems = item.subItems && item.subItems.length > 0;
                        const isExpanded = expandedItems[item.label];
                        
                        // Separatore
                        if (item.label === '---') return <div key={idx} className="h-px bg-gray-800 my-2 mx-4"></div>;

                        return (
                            <div key={idx} className="flex flex-col">
                                <button 
                                    onClick={() => {
                                        if (hasSubItems) setExpandedItems(prev => ({ ...prev, [item.label]: !prev[item.label] }));
                                        else { item.action(); onClose(); }
                                    }}
                                    className={`w-full flex items-center justify-between p-4 rounded-xl font-bold transition-all ${
                                        item.active ? 'bg-indigo-600 text-white shadow-lg' : 'text-gray-400 hover:bg-gray-900 hover:text-white'
                                    }`}
                                >
                                    <div className="flex items-center gap-3">
                                        {item.icon}
                                        <span className="text-sm uppercase tracking-wide">{item.label}</span>
                                    </div>
                                    {hasSubItems && (
                                        isExpanded ? <ChevronDown size={16}/> : <ChevronRight size={16}/>
                                    )}
                                </button>

                                {/* Sottovoci (Tools) */}
                                {hasSubItems && isExpanded && (
                                    <div className="ml-8 pl-4 border-l-2 border-gray-800 mt-1 space-y-1 animate-in slide-in-from-top-2 duration-200">
                                        {item.subItems.map((sub, sIdx) => (
                                            <button 
                                                key={sIdx}
                                                onClick={() => { sub.action(); onClose(); }}
                                                className={`w-full text-left p-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                                                    sub.active ? 'text-indigo-400 bg-indigo-500/10' : 'text-gray-500 hover:text-gray-300'
                                                }`}
                                            >
                                                {sub.label}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div className="p-4 border-t border-gray-900 bg-gray-950">
                    <button onClick={onLogout} className="w-full flex items-center gap-3 p-4 rounded-xl font-bold text-red-500 hover:bg-red-500/10 transition-all mb-4">
                        <LogOut size={20} /><span className="text-sm uppercase tracking-wide">Logout</span>
                    </button>
                    <div className="text-center">
                        <span className="text-[10px] text-gray-600 font-mono tracking-widest">v{versionData.version}</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
export default Sidebar;