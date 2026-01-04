import React, { useState, useEffect } from 'react';
import { getEventi, updateMostroHp, associaQrAVista } from '../api';
import { useCharacter } from './CharacterContext';
import { 
    ChevronRight, ChevronDown, Swords, Users, 
    Eye, QrCode, Clock, Info, Heart, Shield 
} from 'lucide-react';
import QrTab from './QrTab'; // Riutilizziamo lo scanner esistente

const PlotTab = ({ onLogout }) => {
    const { isMaster } = useCharacter();
    const [eventi, setEventi] = useState([]);
    const [selectedEvento, setSelectedEvento] = useState(null);
    const [loading, setLoading] = useState(true);
    
    // Stato per lo scanner QR dedicato all'associazione
    const [scanningForVista, setScanningForVista] = useState(null); // ID della vista

    useEffect(() => {
        loadEventi();
    }, []);

    const loadEventi = async () => {
        try {
            const data = await getEventi(onLogout);
            setEventi(data);
            if (data.length > 0) setSelectedEvento(data[0]);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    };

    const handleHpChange = async (mostroId, delta) => {
        try {
            await updateMostroHp(mostroId, delta, onLogout);
            loadEventi(); // Refresh per aggiornare i PV a tutti
        } catch (e) { alert("Errore aggiornamento HP"); }
    };

    const handleQrAssocSuccess = async (qrData) => {
        if (!scanningForVista) return;
        try {
            await associaQrAVista(scanningForVista, qrData.id, onLogout);
            alert("QR Associato correttamente!");
            setScanningForVista(null);
            loadEventi();
        } catch (e) { alert("Errore associazione QR"); }
    };

    if (loading) return <div className="p-8 text-center text-gray-500">Caricamento Plot...</div>;

    return (
        <div className="flex flex-col h-full bg-gray-900 pb-20">
            {/* Se siamo in modalità scanner, copriamo la vista */}
            {scanningForVista && (
                <div className="fixed inset-0 z-60 bg-black">
                    <div className="p-4 flex justify-between items-center bg-gray-800">
                        <span className="text-white font-bold">Scansiona QR per Oggetto</span>
                        <button onClick={() => setScanningForVista(null)} className="text-red-400">Annulla</button>
                    </div>
                    <QrTab onScanSuccess={handleQrAssocSuccess} onLogout={onLogout} />
                </div>
            )}

            {/* Header Evento */}
            <div className="p-4 bg-gray-800 border-b border-gray-700">
                <select 
                    className="w-full bg-gray-900 text-white p-2 rounded"
                    onChange={(e) => setSelectedEvento(eventi.find(ev => ev.id == e.target.value))}
                >
                    {eventi.map(ev => <option key={ev.id} value={ev.id}>{ev.titolo}</option>)}
                </select>
                {selectedEvento && (
                    <p className="text-xs text-gray-400 mt-2 italic">{selectedEvento.sinossi}</p>
                )}
            </div>

            {/* Timeline Giorni e Quest */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {selectedEvento?.giorni.map(giorno => (
                    <div key={giorno.id} className="space-y-4">
                        <div className="sticky top-0 bg-gray-900/95 py-2 border-b border-emerald-900/50 flex items-center gap-2">
                            <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">GIORNO</span>
                            <span className="text-emerald-400 font-bold">{new Date(giorno.data_ora_inizio).toLocaleDateString()}</span>
                        </div>
                        
                        {giorno.quests.map(quest => (
                            <div key={quest.id} className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden shadow-lg">
                                {/* Header Quest */}
                                <div className="p-3 bg-gray-700/50 flex justify-between items-center">
                                    <h3 className="font-bold text-indigo-300 flex items-center gap-2">
                                        <Clock size={16} /> {quest.orario_indicativo.slice(0,5)} - {quest.titolo}
                                    </h3>
                                </div>

                                <div className="p-4 space-y-4">
                                    <p className="text-sm text-gray-300 whitespace-pre-wrap">{quest.descrizione_ampia}</p>

                                    {/* Sezione PnG */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <Users size={14}/> PnG Necessari
                                        </h4>
                                        <div className="grid grid-cols-1 gap-2">
                                            {quest.png_richiesti.map(png => (
                                                <div key={png.id} className="flex items-center justify-between bg-gray-900 p-2 rounded border-l-2 border-indigo-500">
                                                    <span className="text-sm font-bold text-white">{png.personaggio_details.nome}</span>
                                                    <span className="text-[10px] text-gray-400">{png.staffer_details?.username || 'Da Assegnare'}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Sezione Mostri (Interattiva) */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <Swords size={14}/> Mostri Generici
                                        </h4>
                                        {quest.mostri_presenti.map(m => (
                                            <div key={m.id} className="bg-gray-900 p-3 rounded-lg border border-gray-700">
                                                <div className="flex justify-between items-start mb-2">
                                                    <div>
                                                        <span className="block font-bold text-red-400">{m.template_details.nome}</span>
                                                        <span className="text-[10px] text-gray-500">Assegnato a: {m.staffer_details?.username || '-'}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        <button onClick={() => handleHpChange(m.id, -1)} className="w-8 h-8 bg-red-900/40 text-red-400 rounded-full font-bold border border-red-900/50">-</button>
                                                        <div className="flex flex-col items-center min-w-10">
                                                            <span className="text-xl font-black text-white">{m.punti_vita}</span>
                                                            <span className="text-[8px] uppercase text-gray-500">HP</span>
                                                        </div>
                                                        <button onClick={() => handleHpChange(m.id, 1)} className="w-8 h-8 bg-emerald-900/40 text-emerald-400 rounded-full font-bold border border-emerald-900/50">+</button>
                                                    </div>
                                                </div>
                                                {/* Statistiche Difensive */}
                                                <div className="flex gap-4 text-[10px] border-t border-gray-800 pt-2">
                                                    <span className="flex items-center gap-1"><Shield size={10} className="text-blue-400"/> ARM: {m.armatura}</span>
                                                    <span className="flex items-center gap-1"><Heart size={10} className="text-purple-400"/> GUS: {m.guscio}</span>
                                                </div>
                                                {/* Lista Attacchi dal Template */}
                                                <div className="mt-2 space-y-1">
                                                    {m.template_details.attacchi.map(att => (
                                                        <div key={att.id} className="text-[10px] text-gray-400 bg-gray-800 px-2 py-1 rounded">
                                                            <b className="text-gray-200">{att.nome_attacco}:</b> {att.descrizione_danno}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Sezione Oggetti Vista e QR Setup */}
                                    <div className="space-y-2">
                                        <h4 className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
                                            <Eye size={14}/> Oggetti da Trovare / Setup
                                        </h4>
                                        {quest.viste_previste.map(vista => (
                                            <div key={vista.id} className="flex items-center justify-between bg-gray-900 p-2 rounded">
                                                <div className="text-sm">
                                                    <span className="text-emerald-400 font-mono text-[10px] block uppercase">{vista.tipo}</span>
                                                    <span className="text-white">{vista.manifesto_details?.titolo || vista.inventario_details?.nome || "Oggetto senza nome"}</span>
                                                </div>
                                                <button 
                                                    onClick={() => setScanningForVista(vista.id)}
                                                    className={`p-2 rounded-lg ${vista.qr_code ? 'bg-emerald-600 text-white' : 'bg-gray-700 text-gray-400'}`}
                                                >
                                                    <QrCode size={18} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default PlotTab;