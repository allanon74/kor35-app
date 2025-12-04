import React, { useState, useEffect } from 'react';
import { X, Wrench, Send, ShieldAlert, Cpu } from 'lucide-react';
import { useCharacter } from './CharacterContext';
import { assemblaItem } from '../api'; // Assicurati di avere questa API o simile

const ItemAssemblyModal = ({ hostItem, inventory, onClose, onRefresh }) => {
  const { characters, selectedCharacterId } = useCharacter();
  // Trova il personaggio corrente dai dati del context
  const character = characters?.find(c => c.id === selectedCharacterId);
  
  const [selectedModId, setSelectedModId] = useState('');
  const [mode, setMode] = useState('assemble'); // 'assemble' | 'request'
  const [offerCredits, setOfferCredits] = useState(0);
  const [targetArtisan, setTargetArtisan] = useState('');
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Filtra oggetti compatibili (Mod o Materia) dall'inventario
  // NOTA: Qui assumiamo che nel backend 'tipo_oggetto' distingua 'MOD' e 'MATERIA'
  // e che hostItem abbia campi come 'is_tecnologico', 'max_slot', etc.
  const compatibleItems = inventory.filter(item => {
    // Escludi l'oggetto stesso
    if (item.id === hostItem.id) return false;
    
    // Se Tech -> Solo Mod. Se Non-Tech -> Solo Materia.
    const isTech = hostItem.is_tecnologico; 
    const itemIsMod = item.tipo_oggetto === 'MOD';
    const itemIsMateria = item.tipo_oggetto === 'MATERIA';

    if (isTech && !itemIsMod) return false;
    if (!isTech && !itemIsMateria) return false;

    return true; 
  });

  const selectedMod = compatibleItems.find(i => i.id === selectedModId);

  // --- LOGICA DI VALIDAZIONE (Il cuore della richiesta) ---
  const validateAssembly = () => {
    if (!selectedMod) return { valid: false, reason: "Seleziona un componente." };
    
    const isTech = hostItem.is_tecnologico;
    
    // 1. Check Slot Liberi
    const slotOccupati = hostItem.mods_installate ? hostItem.mods_installate.length : 0;
    const maxSlots = hostItem.slot_mod || 0; // O 'slot_materia' se diverso
    
    // Materia: Max 1 per oggetto
    if (!isTech && slotOccupati >= 1) return { valid: false, reason: "L'oggetto ha già una Materia incastonata." };
    // Mod: Max slot classe
    if (isTech && slotOccupati >= maxSlots) return { valid: false, reason: "Slot mod esauriti su questo oggetto." };

    // 2. Check Compatibilità Mattoni (Supporto Classe)
    // Assumiamo che item.mattoni sia un array/oggetto { 'Fisico': 2, 'Mentale': 1 }
    // e hostItem.limiti_mattoni sia { 'Fisico': 5, 'Mentale': 5 }
    // Questa logica va adattata alla struttura esatta del tuo JSON.
    /* Esempio Logica:
       Per ogni caratteristica del Mod, il valore non deve superare il limite della classe dell'oggetto.
       Inoltre, per le Mod multiple, la SOMMA non deve superare il limite.
    */
    
    // 3. Check Skill Personaggio (Assemble vs Request)
    let hasSkills = false;
    const charLevel = 5; // Recuperare livello effettivo pg
    // Esempio recupero skill (devi adattare i nomi esatti delle skill dal DB)
    const auraTecnologica = character?.abilita_possedute?.find(a => a.nome === "Aura Tecnologica")?.livello || 0;
    const auraAssemblatore = character?.abilita_possedute?.find(a => a.nome === "Aura Mondana - Assemblatore")?.livello || 0;

    // Check Punteggi Caratteristica (es. Forza, Intelligenza vs Requisiti Mod)
    // Assumiamo che selectedMod.requisiti_caratteristica sia { 'Forza': 3 }
    const statsOk = true; // Implementare check loop su character.caratteristiche_base

    if (isTech) {
        if (auraTecnologica >= hostItem.livello && statsOk) hasSkills = true;
    } else {
        if (auraAssemblatore >= hostItem.livello && statsOk) hasSkills = true;
    }

    return { valid: true, requiresExternalHelp: !hasSkills };
  };

  const validationResult = validateAssembly();

  const handleAssembla = async () => {
    try {
        await assemblaItem(character.id, hostItem.id, selectedModId);
        setSuccess("Assemblaggio completato!");
        setTimeout(() => { onRefresh(); onClose(); }, 1500);
    } catch (e) {
        setError(e.message || "Errore durante l'assemblaggio");
    }
  };

  const handleSendRequest = async () => {
    // Qui andrebbe la chiamata API per inviare il messaggio di richiesta lavoro
    // sendJobRequest(character.id, targetArtisan, hostItem.id, selectedModId, offerCredits)
    alert(`Richiesta inviata a ${targetArtisan} per ${offerCredits} crediti! (Simulazione)`);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-800 border border-gray-600 rounded-xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-4 bg-gray-900 border-b border-gray-700 flex justify-between items-center">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Wrench className="text-amber-400" />
                Assembla: {hostItem.nome}
            </h3>
            <button onClick={onClose} className="text-gray-400 hover:text-white"><X size={24} /></button>
        </div>

        {/* Body */}
        <div className="p-4 overflow-y-auto grow space-y-4">
            {/* Info Host */}
            <div className="bg-gray-700/50 p-3 rounded border border-gray-600">
                <p className="text-sm text-gray-300">Tipo: <span className="text-white font-mono">{hostItem.is_tecnologico ? 'TECNOLOGICO' : 'MONDANO'}</span></p>
                <p className="text-sm text-gray-300">Slot usati: <span className="text-white">{hostItem.mods_installate?.length || 0} / {hostItem.slot_mod || 1}</span></p>
            </div>

            {/* Selezione Mod */}
            <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Seleziona Componente (Mod/Materia)</label>
                <select 
                    className="w-full bg-gray-900 border border-gray-600 rounded p-2 text-white"
                    onChange={(e) => setSelectedModId(e.target.value)}
                    value={selectedModId}
                >
                    <option value="">-- Seleziona dallo Zaino --</option>
                    {compatibleItems.map(item => (
                        <option key={item.id} value={item.id}>
                            {item.nome} (Liv. {item.livello || 1})
                        </option>
                    ))}
                </select>
            </div>

            {/* Preview Validazione */}
            {selectedMod && (
                <div className={`p-3 rounded border ${validationResult.valid ? 'bg-green-900/20 border-green-800' : 'bg-red-900/20 border-red-800'}`}>
                    {!validationResult.valid ? (
                        <p className="text-red-400 text-sm flex items-center gap-2">
                            <ShieldAlert size={16} /> {validationResult.reason}
                        </p>
                    ) : (
                        <div>
                             <p className="text-green-400 text-sm mb-2">Compatibilità Hardware: OK</p>
                             {validationResult.requiresExternalHelp ? (
                                <p className="text-yellow-400 text-sm flex items-center gap-2">
                                    <ShieldAlert size={16} /> Non hai le competenze per assemblarlo.
                                </p>
                             ) : (
                                <p className="text-blue-400 text-sm flex items-center gap-2">
                                    <Cpu size={16} /> Hai le competenze necessarie.
                                </p>
                             )}
                        </div>
                    )}
                </div>
            )}

            {/* UI Richiesta Esterna (Se necessario) */}
            {selectedMod && validationResult.valid && validationResult.requiresExternalHelp && (
                 <div className="mt-4 border-t border-gray-600 pt-4">
                    <h4 className="text-white font-bold mb-2">Richiedi Assemblaggio</h4>
                    <input 
                        type="text" 
                        placeholder="Nome Artigiano (o ID)" 
                        className="w-full bg-gray-900 border border-gray-600 rounded p-2 mb-2 text-white"
                        value={targetArtisan}
                        onChange={e => setTargetArtisan(e.target.value)}
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm">Offerta Crediti:</span>
                        <input 
                            type="number" 
                            className="w-24 bg-gray-900 border border-gray-600 rounded p-2 text-white"
                            value={offerCredits}
                            onChange={e => setOfferCredits(e.target.value)}
                        />
                    </div>
                 </div>
            )}

            {error && <p className="text-red-400 text-sm">{error}</p>}
            {success && <p className="text-green-400 text-sm font-bold">{success}</p>}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-gray-900 border-t border-gray-700 flex justify-end gap-2">
            {selectedMod && validationResult.valid ? (
                validationResult.requiresExternalHelp ? (
                    <button 
                        onClick={handleSendRequest}
                        className="bg-yellow-600 hover:bg-yellow-500 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Send size={18} /> Invia Richiesta
                    </button>
                ) : (
                    <button 
                        onClick={handleAssembla}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded flex items-center gap-2"
                    >
                        <Wrench size={18} /> Assembla Ora
                    </button>
                )
            ) : (
                <button disabled className="bg-gray-700 text-gray-500 px-4 py-2 rounded cursor-not-allowed">
                    Assembla
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ItemAssemblyModal;