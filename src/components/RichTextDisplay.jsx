import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    // Rimuoviamo eventuali <p> vuoti che creano spazio extra inutile
    const cleanContent = content.replace(/<p><br><\/p>/g, '<br/>');

    return (
        <div 
            className="rich-text-container ql-editor-view text-sm text-gray-300"
            style={{
                // 1. preserve-3d: hack per forzare il rendering corretto su alcuni engine
                transform: 'translateZ(0)',
                
                // 2. LA CONFIGURAZIONE VINCENTE:
                // 'pre-wrap' preserva gli 'a capo' veri E permette il wrapping
                whiteSpace: 'pre-wrap', 
                
                // 'anywhere' è la chiave: rompe SOLO se la parola sfora la larghezza, 
                // altrimenti va a capo negli spazi. È meglio di 'break-word'.
                overflowWrap: 'anywhere', 
                
                // 'normal' impedisce di spezzare le parole a metà (es. "cipol-la")
                wordBreak: 'normal',
                
                // 3. Layout constraints
                maxWidth: '100%',
                minWidth: '0',     // Fondamentale dentro i flex/grid container per permettere lo shrink
                lineHeight: '1.6', // Migliora la leggibilità
                display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
    );
};

export default RichTextDisplay;