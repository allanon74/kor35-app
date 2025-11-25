import React from 'react';
import { useCharacter } from './CharacterContext';
import { Trash2, MailOpen, Mail } from 'lucide-react';

const PlayerMessageTab = ({ onLogout }) => {
    const { 
        userMessages, 
        handleMarkAsRead,
        handleDeleteMessage,
        isLoading 
    } = useCharacter();

    if (isLoading && (!userMessages || userMessages.length === 0)) {
        return <div className="p-4 text-center text-gray-400">Caricamento messaggi...</div>;
    }

    if (!userMessages || userMessages.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <MailOpen size={48} className="mb-4 opacity-20" />
                <p>Nessun messaggio ricevuto.</p>
            </div>
        );
    }

    return (
        <div className="space-y-3 pb-4">
            <div className="flex items-center gap-2 px-1 mb-4">
                <Mail className="text-indigo-400" size={24} />
                <h2 className="text-xl font-bold text-white">I tuoi Messaggi</h2>
            </div>
            
            {userMessages.map((msg) => (
                <div 
                    key={msg.id} 
                    onClick={() => !msg.letto && handleMarkAsRead(msg.id)}
                    className={`
                        relative bg-gray-800 rounded-lg border transition-all duration-200 overflow-hidden
                        ${msg.letto 
                            ? 'border-gray-700 opacity-75 hover:opacity-100' 
                            : 'border-indigo-500/50 shadow-[0_0_15px_rgba(99,102,241,0.15)] cursor-pointer'
                        }
                    `}
                >
                    {/* Indicatore Non Letto */}
                    {!msg.letto && (
                        <div className="absolute top-0 right-0 w-0 h-0 border-t-20px border-l-20px border-t-indigo-500 border-l-transparent z-10 shadow-sm" />
                    )}

                    <div className="p-4">
                        <div className="flex justify-between items-start gap-4 mb-2">
                            <div className="flex-1">
                                <h3 className={`text-lg leading-tight ${msg.letto ? 'text-gray-300 font-medium' : 'text-white font-bold'}`}>
                                    {msg.titolo}
                                </h3>
                                <div className="text-xs text-gray-400 mt-1 flex items-center gap-2 flex-wrap">
                                    <span className="bg-gray-700 px-1.5 py-0.5 rounded text-gray-300">
                                        {msg.mittente || 'Sistema'}
                                    </span>
                                    <span>•</span>
                                    <span>{new Date(msg.data_invio).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                    {msg.tipo_messaggio === 'BROAD' && <span className="text-indigo-400 font-bold uppercase tracking-wider text-[10px] border border-indigo-500/30 px-1 rounded">Broadcast</span>}
                                </div>
                            </div>
                            
                            <button 
                                onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                                className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-900/20 rounded-full transition-colors shrink-0"
                                title="Elimina messaggio"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>

                        <div 
                            className={`text-sm prose prose-invert max-w-none ${msg.letto ? 'text-gray-400' : 'text-gray-200'}`}
                            dangerouslySetInnerHTML={{ __html: msg.testo }}
                        />
                    </div>
                </div>
            ))}
        </div>
    );
};

export default PlayerMessageTab;