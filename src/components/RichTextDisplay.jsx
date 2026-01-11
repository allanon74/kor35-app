import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    return (
        <div 
            className="rich-text-container ql-editor-view"
            style={{
                // 1. FONDAMENTALE per HTML: Ignora gli 'a capo' del codice sorgente, usa solo i tag <br> e <p>
                whiteSpace: 'normal !important',
                
                // 2. Rompe la riga tra le parole (spazi), MAI dentro una parola (a meno che non sia un URL lunghissimo)
                overflowWrap: 'break-word !important', 
                wordWrap: 'break-word !important',
                
                // 3. Impedisce esplicitamente di spezzare le parole a metà (es. "cipol-la")
                wordBreak: 'normal !important',
                
                // 4. Stile testo
                fontSize: '0.875rem', // text-sm
                lineHeight: '1.625',  // leading-relaxed
                color: '#d1d5db',     // text-gray-300
                maxWidth: '100%',
                display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default RichTextDisplay;