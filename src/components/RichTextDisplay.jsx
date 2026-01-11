import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    // Pulizia preventiva di tag vuoti che creano spazi enormi
    const cleanContent = content.replace(/<p><br><\/p>/g, '');

    return (
        <div className="rich-text-wrapper" style={{ width: '100%', minWidth: 0 }}>
            <style>{`
                .rich-text-content {
                    /* Reset di base */
                    all: revert;
                    font-family: inherit;
                    font-size: 0.875rem; /* text-sm */
                    line-height: 1.6;
                    color: #d1d5db; /* text-gray-300 */
                    
                    /* IL FIX DEL TESTO */
                    white-space: normal !important;       /* Ignora gli 'a capo' del codice, usa solo i <br> visivi */
                    word-break: normal !important;        /* NON spezzare le parole a metà */
                    overflow-wrap: anywhere !important;   /* Spezza SOLO se la parola è più lunga del contenitore (es. URL) */
                    
                    /* Layout */
                    display: block;
                    width: 100%;
                    max-width: 100%;
                }

                /* Gestione paragrafi e liste per non farli uscire */
                .rich-text-content p, 
                .rich-text-content li,
                .rich-text-content h1,
                .rich-text-content h2,
                .rich-text-content h3 {
                    margin-bottom: 0.5em;
                    white-space: normal !important;
                    word-break: normal !important;
                    overflow-wrap: anywhere !important;
                    max-width: 100%;
                }
                
                /* Stile per i link */
                .rich-text-content a {
                    color: #818cf8; /* indigo-400 */
                    text-decoration: underline;
                }
            `}</style>
            
            <div 
                className="rich-text-content"
                dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
        </div>
    );
};

export default RichTextDisplay;