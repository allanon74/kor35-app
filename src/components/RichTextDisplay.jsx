import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    return (
        <div 
            className="w-full min-w-0 text-sm text-gray-300 leading-relaxed ql-editor-view"
            style={{
                // QUESTA è la combinazione magica:
                overflowWrap: 'break-word', // Standard moderno: rompe le parole lunghe (URL) ma tiene intere quelle normali
                wordWrap: 'break-word',     // Fallback per compatibilità
                wordBreak: 'break-word',    // Forza il break solo se necessario
                whiteSpace: 'pre-wrap',     // Preserva gli 'a capo' dell'editor
                maxWidth: '100%'            // Assicura che non sborodi dal genitore
            }}
            dangerouslySetInnerHTML={{ __html: content }}
        />
    );
};

export default RichTextDisplay;