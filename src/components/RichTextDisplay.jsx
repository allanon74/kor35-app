import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    return (
        <div 
            // Aggiungo 'ql-editor-view' per ereditare gli stili dei paragrafi (margin-bottom) dal tuo index.css
            className="rich-text-container ql-editor-view text-sm text-gray-300 leading-relaxed"
            style={{
                // FONDAMENTALE: Per contenuto HTML usare 'normal'. 
                // 'pre-wrap' va usato SOLO per testo puro (txt) senza tag HTML.
                whiteSpace: 'normal',
                
                // Rompe la parola SOLO se è un'unica stringa lunghissima (es. URL) che non entra nel container
                overflowWrap: 'anywhere', 
                
                // Impedisce di spezzare le parole normali a metà
                wordBreak: 'normal',
                
                // Sicurezze layout
                maxWidth: '100%',
                display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default RichTextDisplay;