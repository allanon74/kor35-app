import React, { useState } from 'react';
import { Menu, X, Bell } from 'lucide-react';
import Sidebar from './Sidebar';

const GenericHeader = ({ 
    title = "KOR 35", 
    subtitle = "Master Tool", 
    menuItems = [], 
    rightSlot, 
    onLogout 
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    return (
        <>
            <header className="h-16 bg-gray-950 border-b border-gray-800 flex items-center justify-between px-4 z-50 shadow-2xl shrink-0">
                {/* LEFT: Hamburger + Logo */}
                <div className="flex items-center gap-3">
                    <button 
                        onClick={() => setIsMenuOpen(true)}
                        className="p-2 hover:bg-gray-800 rounded-lg text-indigo-400 transition-colors"
                    >
                        <Menu size={24} />
                    </button>
                    
                    <div className="flex items-center gap-2">
                        <img src="/Logo Kor-AD_Trasp.png" alt="Logo" className="h-8 w-8 object-contain" />
                        <div className="flex flex-col leading-tight">
                            <span className="font-black text-lg uppercase italic tracking-tighter">
                                {title.split(' ')[0]} <span className="text-indigo-500">{title.split(' ')[1]}</span>
                            </span>
                            <span className="text-[8px] font-bold text-gray-500 uppercase tracking-[0.2em]">{subtitle}</span>
                        </div>
                    </div>
                </div>

                {/* RIGHT: Slot personalizzato (es. Selettore Eventi) + Notifiche */}
                <div className="flex items-center gap-3">
                    {rightSlot}
                    <button className="p-2 text-gray-500 hover:text-indigo-400 relative">
                        <Bell size={20} />
                        {/* Badge ipotetico per notifiche */}
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-600 rounded-full border border-gray-950"></span>
                    </button>
                </div>
            </header>

            {/* Sidebar Menu */}
            <Sidebar 
                isOpen={isMenuOpen} 
                onClose={() => setIsMenuOpen(false)} 
                items={menuItems} 
                onLogout={onLogout} 
            />
        </>
    );
};

export default GenericHeader;