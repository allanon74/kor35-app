import React, { useState, useEffect } from 'react';
import { useCharacter } from './CharacterContext';
import { postBroadcastMessage } from '../api'; // Da creare in api.js

const AdminMessageTab = ({ onLogout }) => {
    const { selectedCharacterData, isLoadingDetail, error } = useCharacter();
    const [title, setTitle] = useState('');
    const [text, setText] = useState('');
    const [saveHistory, setSaveHistory] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [history, setHistory] = useState([]); // Cronologia messaggi

    // Funzione fittizia per caricare la cronologia (dovrebbe usare un'altra API List)
    useEffect(() => {
        // TODO: Implementare una vista MessaggioAdminListView in Django e una funzione
        // in api.js per fetchare la cronologia completa (per admin).
        // Per ora, usiamo dati di esempio o una chiamata semplice alla lista completa.
        // getMessaggiAdmin(onLogout).then(setHistory).catch(...)
    }, [onLogout]);

    if (!selectedCharacterData || !selectedCharacterData.proprietario || !selectedCharacterData.proprietario.is_staff) {
        return <div className="p-4 text-red-400">Accesso negato. Solo Staff.</div>;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!title || !text) return;
        
        setIsSending(true);
        try {
            await postBroadcastMessage({ title, text, save_in_cronologia: saveHistory }, onLogout);
            alert('Messaggio Broadcast inviato con successo!');
            setTitle('');
            setText('');
            // TODO: Aggiornare la cronologia
        } catch (err) {
            alert(`Errore nell'invio: ${err.message}`);
        } finally {
            setIsSending(false);
        }
    };

    return (
        <div className="p-4">
            <h2 className="text-xl font-bold mb-4">Pannello Admin Messaggi</h2>
            
            {/* Tab Navigazione (Admin History) */}
            <div className="mb-4">
                {/* Qui useresti Headless UI Tabs, ma per brevità lo faccio semplice */}
                <h3 className="font-semibold border-b border-gray-700 pb-2">Invia Messaggio Broadcast</h3>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Titolo Breve"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                    required
                />
                <textarea
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder="Contenuto del messaggio..."
                    rows="5"
                    className="w-full p-2 bg-gray-700 rounded text-white"
                    required
                />
                <div className="flex items-center">
                    <input
                        type="checkbox"
                        checked={saveHistory}
                        onChange={(e) => setSaveHistory(e.target.checked)}
                        id="saveHistory"
                        className="mr-2"
                    />
                    <label htmlFor="saveHistory" className="text-gray-300 text-sm">Salva il messaggio nella cronologia pubblica</label>
                </div>
                <button
                    type="submit"
                    disabled={isSending}
                    className="w-full py-2 bg-indigo-600 text-white font-semibold rounded hover:bg-indigo-500 disabled:opacity-50"
                >
                    {isSending ? 'Invio...' : 'Invia a Tutti i Giocatori'}
                </button>
            </form>

            {/* Cronologia (Subtab) */}
            <div className="mt-8">
                <h3 className="text-xl font-bold mb-4 border-b border-gray-700 pb-2">Cronologia Broadcast</h3>
                {history.length > 0 ? (
                    history.map(msg => (
                        <div key={msg.id} className="p-3 bg-gray-700 rounded mb-2">
                            <p className="font-bold text-white">{msg.titolo}</p>
                            <p className="text-sm text-gray-400">{msg.testo.substring(0, 50)}...</p>
                            <p className="text-xs text-gray-500">Inviato il: {new Date(msg.data_invio).toLocaleDateString()}</p>
                        </div>
                    ))
                ) : (
                    <p className="text-gray-500">Nessun messaggio inviato.</p>
                )}
                {/* TODO: Implementare il caricamento "on scroll" se necessario */}
            </div>
        </div>
    );
};

export default AdminMessageTab;