import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    return (
        <div 
            className="rich-text-container text-sm text-gray-300 leading-relaxed"
            style={{
                // 1. Preserva gli 'a capo' inseriti dall'utente e gli spazi
                whiteSpace: 'pre-wrap',
                
                // 2. Questa è la regola chiave: rompe la parola SOLO se è più lunga della riga (es. URL)
                overflowWrap: 'break-word', 
                
                // 3. Assicura che le parole normali NON vengano spezzate a metà
                wordBreak: 'normal',
                
                // 4. Sicurezze per il layout
                maxWidth: '100%',
                display: 'block'
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default RichTextDisplay;