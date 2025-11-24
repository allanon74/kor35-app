import React, { useState, useEffect } from 'react';
import { X, Lock, AlertTriangle } from 'lucide-react';
import { getModelliAura, selezionaModelloAura } from '../api';
import { useCharacter } from './CharacterContext';
import IconaPunteggio from './IconaPunteggio';

const ModelloAuraSelectionModal = ({ onClose, onSelect, modelliAura }) => {

    // Funzione helper per renderizzare la lista di mattoni
    const renderMattoniList = (title, mattoni, colorClass) => {
        if (!mattoni || mattoni.length === 0) return null;
        return (
            <div className="mt-2">
                <span className={`text-sm font-bold ${colorClass}`}>{title}: </span>
                <span className="text-sm text-gray-300">
                    {mattoni.map(m => m.nome).join(", ")}
                </span>
            </div>
        );
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-80 z-50 flex justify-center items-center p-4">
            <div className="bg-gray-800 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6 border border-gray-600 shadow-xl">
                <h2 className="text-2xl font-bold text-kor-main mb-6 border-b border-gray-600 pb-2">
                    Seleziona Modello Aura
                </h2>

                <div className="space-y-4">
                    {modelliAura && modelliAura.length > 0 ? (
                        modelliAura.map((modello) => {
                            const hasProibiti = modello.mattoni_proibiti && modello.mattoni_proibiti.length > 0;
                            const hasObbligatori = modello.mattoni_obbligatori && modello.mattoni_obbligatori.length > 0;
                            const hasLimitations = hasProibiti || hasObbligatori;

                            return (
                                <div 
                                    key={modello.id}
                                    onClick={() => onSelect(modello)}
                                    className="p-4 bg-gray-700 rounded hover:bg-gray-600 cursor-pointer transition-colors border border-gray-600 hover:border-kor-accent group"
                                >
                                    {/* 1. Nome Modello */}
                                    <h3 className="text-xl font-bold text-white group-hover:text-kor-accent">
                                        {modello.nome}
                                    </h3>

                                    {/* 2. Descrizione (Nuovo Campo) */}
                                    {modello.descrizione && (
                                        <p className="text-gray-400 text-sm mt-1 mb-2 italic">
                                            {modello.descrizione}
                                        </p>
                                    )}

                                    {/* 3. Mattoni Proibiti e Obbligatori */}
                                    <div className="pl-2 border-l-2 border-gray-500 mt-2">
                                        {renderMattoniList("Mattoni Obbligatori", modello.mattoni_obbligatori, "text-green-400")}
                                        {renderMattoniList("Mattoni Proibiti", modello.mattoni_proibiti, "text-red-400")}
                                        
                                        {/* 4. Fallback Nessuna Limitazione */}
                                        {!hasLimitations && (
                                            <span className="text-xs text-gray-500 uppercase tracking-wider">
                                                Nessuna limitazione sui mattoni
                                            </span>
                                        )}
                                    </div>
                                </div>
                            );
                        })
                    ) : (
                        <p className="text-gray-400">Nessun modello disponibile per quest'aura.</p>
                    )}
                </div>

                <div className="mt-6 flex justify-end">
                    <button 
                        onClick={onClose}
                        className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500"
                    >
                        Annulla
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ModelloAuraSelectionModal;