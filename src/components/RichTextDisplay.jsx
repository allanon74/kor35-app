import React from 'react';

const RichTextDisplay = ({ content }) => {
    if (!content) return null;

    // Rimuove paragrafi vuoti che creano spazi enormi
    const cleanContent = content.replace(/<p><br><\/p>/g, '');

    return (
        <div className="rich-text-isolation-wrapper w-full min-w-0">
            {/* Stili iniettati localmente che vincono su TUTTO */}
            <style>{`
                .rich-text-content-root {
                    all: initial; /* Resetta TUTTE le proprietà ereditate (come Tailwind preflight) */
                    display: block;
                    width: 100%;
                    font-family: system-ui, -apple-system, sans-serif; /* Ripristina font base */
                    font-size: 0.875rem; /* 14px */
                    line-height: 1.6;
                    color: #d1d5db; /* gray-300 */
                    background: transparent;
                    
                    /* LE REGOLE D'ORO PER IL TESTO */
                    white-space: normal;       /* Va a capo agli spazi */
                    word-break: normal;        /* NON spezza le parole */
                    overflow-wrap: anywhere;   /* Spezza SOLO se parola > riga */
                    hyphens: auto;             /* Aggiunge trattini se necessario */
                }

                .rich-text-content-root p,
                .rich-text-content-root li {
                    display: block;
                    margin-bottom: 0.5em;
                    max-width: 100%;
                }

                .rich-text-content-root ul, 
                .rich-text-content-root ol {
                    display: block;
                    margin-left: 1.5em;
                    list-style-type: disc;
                }
                
                .rich-text-content-root strong { font-weight: bold; color: #fff; }
                .rich-text-content-root em { font-style: italic; }
                .rich-text-content-root u { text-decoration: underline; }
            `}</style>

            <div 
                className="rich-text-content-root"
                dangerouslySetInnerHTML={{ __html: cleanContent }}
            />
        </div>
    );
};

export default RichTextDisplay;