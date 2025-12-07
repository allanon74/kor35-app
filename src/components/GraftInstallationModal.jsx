import React, { useState, useEffect } from 'react';
import { X, Activity, User, Coins, Send, Loader2 } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { installaInnesto, richiediOperazioneChirurgica, searchPersonaggi, getBodySlots } from '../api';

const GraftInstallationModal = ({ task, onClose, onSuccess }) => {
    const { selectedCharacterData } = useCharacter();
    const [targetMode, setTargetMode] = useState('SELF'); // 'SELF' o 'OTHER'
    const [selectedSlot, setSelectedSlot] = useState('');
    
    // Per ricerca altro personaggio
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedTargetUser, setSelectedTargetUser] = useState(null);
    
    const [offer, setOffer] = useState(0);
    const [isLoading, setIsLoading] = useState(false);

    // Slot permessi dall'infusione (dal backend arrivano come stringa "HD1,RA")
    // Se non specificato, assumiamo tutti (o nessuno, a seconda delle regole)
    const allowedSlotsCodes = task.infusione_slot_permessi 
        ? task.infusione_slot_permessi.split(',') 
        : [];
        
    const allSlots = getBodySlots();
    const availableSlots = allSlots.filter(s => allowedSlotsCodes.includes(s.code));

    // Ricerca Personaggi
    useEffect(() => {
        if (searchQuery.length < 2) {
            setSearchResults([]); return;
        }
        const delaySearch = setTimeout(async () => {
            try {
                const res = await searchPersonaggi(searchQuery, selectedCharacterData.id, task.infusione_id);
                setSearchResults(res);
            } catch (e) { console.error(e); }
        }, 300);
        return () => clearTimeout(delaySearch);
    }, [searchQuery, task.infusione_id]);

    const handleConfirm = async () => {
        if (!selectedSlot) return alert("Seleziona uno slot!");
        
        setIsLoading(true);
        try {
            if (targetMode === 'SELF') {
                // Installa su se stessi
                await installaInnesto(task.id, selectedSlot, selectedCharacterData.id);
                alert("Innesto installato con successo!");
            } else {
                // Richiesta a un altro
                if (!selectedTargetUser) return alert("Seleziona un paziente!");
                await richiediOperazioneChirurgica(
                    task.id, 
                    selectedSlot, 
                    selectedTargetUser.nome, 
                    offer, 
                    selectedCharacterData.id
                );
                alert(`Proposta di operazione inviata a ${selectedTargetUser.nome}!`);
            }
            onSuccess();
            onClose();
        } catch (error) {
            alert("Errore: " + error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
            <div className="bg-gray-800 rounded-xl w-full max-w-md border border-gray-600 shadow-2xl animate-fadeIn">
                
                <div className="p-4 border-b border-gray-700 flex justify-between items-center bg-gray-900 rounded-t-xl">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Activity className="text-pink-500"/> Installazione Innesto
                    </h3>
                    <button onClick={onClose}><X className="text-gray-400"/></button>
                </div>

                <div className="p-6 space-y-6">
                    <div className="bg-gray-900/50 p-3 rounded text-sm text-gray-300">
                        Oggetto pronto: <strong className="text-white">{task.infusione_nome}</strong>
                    </div>

                    {/* SELEZIONE PAZIENTE */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Chi riceve l'innesto?</label>
                        <div className="flex bg-gray-900 rounded p-1 mb-2">
                            <button 
                                onClick={() => setTargetMode('SELF')}
                                className={`flex-1 py-1 text-sm font-bold rounded ${targetMode === 'SELF' ? 'bg-pink-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Su di Me
                            </button>
                            <button 
                                onClick={() => setTargetMode('OTHER')}
                                className={`flex-1 py-1 text-sm font-bold rounded ${targetMode === 'OTHER' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                Altro Paziente
                            </button>
                        </div>

                        {targetMode === 'OTHER' && (
                            <div className="relative">
                                <input 
                                    type="text" 
                                    placeholder="Cerca nome personaggio..." 
                                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                                    value={searchQuery}
                                    onChange={e => { setSearchQuery(e.target.value); setSelectedTargetUser(null); }}
                                />
                                {searchResults.length > 0 && !selectedTargetUser && (
                                    <div className="absolute top-full left-0 right-0 bg-gray-800 border border-gray-600 mt-1 rounded shadow-xl z-10 max-h-40 overflow-y-auto">
                                        {searchResults.map(u => (
                                            <div 
                                                key={u.id} 
                                                className="p-2 hover:bg-gray-700 cursor-pointer text-white text-sm"
                                                onClick={() => { setSelectedTargetUser(u); setSearchQuery(u.nome); }}
                                            >
                                                {u.nome}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* SELEZIONE SLOT */}
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Slot di Destinazione</label>
                        {availableSlots.length === 0 ? (
                            <div className="text-red-400 text-xs">Nessuno slot compatibile definito per questo oggetto.</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {availableSlots.map(s => (
                                    <button 
                                        key={s.code}
                                        onClick={() => setSelectedSlot(s.code)}
                                        className={`p-2 border rounded text-xs font-bold transition-all ${
                                            selectedSlot === s.code 
                                            ? 'bg-pink-900/50 border-pink-500 text-pink-200' 
                                            : 'bg-gray-800 border-gray-600 text-gray-400 hover:bg-gray-700'
                                        }`}
                                    >
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* OFFERTA (Solo se altro) */}
                    {targetMode === 'OTHER' && (
                        <div>
                             <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Richiesta Compenso (CR)</label>
                             <div className="relative">
                                 <Coins className="absolute left-2 top-2.5 text-yellow-500" size={16}/>
                                 <input 
                                     type="number" 
                                     className="w-full bg-gray-900 border-gray-600 rounded p-2 pl-8 text-white"
                                     value={offer} onChange={e => setOffer(e.target.value)}
                                 />
                             </div>
                        </div>
                    )}

                    {/* BOTTONE */}
                    <button 
                        onClick={handleConfirm}
                        disabled={isLoading || !selectedSlot || (targetMode === 'OTHER' && !selectedTargetUser)}
                        className="w-full bg-green-600 hover:bg-green-500 text-white py-3 rounded-lg font-bold shadow-lg flex justify-center items-center gap-2 disabled:opacity-50"
                    >
                        {isLoading ? <Loader2 className="animate-spin"/> : (targetMode === 'SELF' ? <Activity/> : <Send/>)}
                        {targetMode === 'SELF' ? 'Installa Ora' : 'Invia Proposta Operazione'}
                    </button>

                </div>
            </div>
        </div>
    );
};

export default GraftInstallationModal;