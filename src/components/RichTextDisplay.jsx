import React, { useMemo } from 'react';
import { sanitizeHtml } from '../utils/htmlSanitizer';
import { activateUser } from '../api'; // Importa la chiamata API

const RichTextDisplay = ({ content }) => {
    // 1. Sanitizzazione base dell'HTML
    const cleanContent = useMemo(() => sanitizeHtml(content), [content]);

    if (!cleanContent) return null;

    // 2. Funzione per gestire il click sul pulsante di attivazione
    const handleActivate = async (userId) => {
        if(window.confirm(`Sei sicuro di voler attivare l'utente #${userId}?`)) {
            try {
                await activateUser(userId);
                alert('Utente attivato con successo!');
                // Opzionale: Ricaricare la pagina o aggiornare lo stato locale
            } catch (err) {
                alert('Errore attivazione: ' + err.message);
            }
        }
    };

    // 3. Parser Custom per trovare il tag [ACTIVATE_USER:ID]
    // Dividiamo la stringa in parti basate sulla Regex
    const parts = cleanContent.split(/(\[ACTIVATE_USER:\d+\])/g);

    return (
        <div 
            className="ql-editor-view w-full"
            style={{
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#d1d5db', 
                whiteSpace: 'normal',       
                overflowWrap: 'anywhere',   
                wordBreak: 'normal',        
                maxWidth: '100%',
                minWidth: '0'
            }}
        >
            {parts.map((part, index) => {
                // Controllo se questa parte è il tag speciale
                const match = part.match(/\[ACTIVATE_USER:(\d+)\]/);
                
                if (match) {
                    const userId = match[1];
                    return (
                        <span key={index} className="inline-block my-1 mx-1">
                            <button
                                onClick={() => handleActivate(userId)}
                                className="bg-green-600 hover:bg-green-500 text-white text-xs font-bold py-1 px-3 rounded shadow transition-colors flex items-center gap-1"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Attiva Utente #{userId}
                            </button>
                        </span>
                    );
                }

                // Se non è il tag, renderizziamo l'HTML normale (sicuro perché già sanitizzato)
                // Usiamo un span o div a seconda del contesto, ma dangerouslySetInnerHTML richiede un tag wrapper.
                return (
                    <span 
                        key={index} 
                        dangerouslySetInnerHTML={{ __html: part }} 
                    />
                );
            })}
        </div>
    );
};

export default RichTextDisplay;