import React, { useMemo } from 'react';
import { sanitizeHtml } from '../utils/htmlSanitizer';

const RichTextDisplay = ({ content }) => {
    // Pulisce il contenuto ogni volta che cambia
    const cleanContent = useMemo(() => sanitizeHtml(content), [content]);

    if (!cleanContent) return null;

    return (
        <div 
            className="ql-editor-view w-full"
            style={{
                // Reset CSS locale per garantire leggibilità
                fontSize: '0.875rem',
                lineHeight: '1.6',
                color: '#d1d5db', // gray-300
                
                // Regole di wrapping blindate
                whiteSpace: 'normal',       
                overflowWrap: 'anywhere',   
                wordBreak: 'normal',        
                
                maxWidth: '100%',
                minWidth: '0'
            }}
            dangerouslySetInnerHTML={{ __html: cleanContent }}
        />
    );
};

export default RichTextDisplay;