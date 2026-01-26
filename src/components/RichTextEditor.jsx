import React, { useRef, useEffect } from 'react';

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
    const editorRef = useRef(null);

    // Sincronizza il contenuto iniziale o esterno
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            if (!value) {
                editorRef.current.innerHTML = '';
            } else {
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    // Gestione input utente
    const handleInput = (e) => {
        const html = e.currentTarget.innerHTML;
        onChange(html); 
    };

    // Sanificazione incolla (Paste) per evitare HTML sporco
    const handlePaste = (e) => {
        e.preventDefault();
        const text = e.clipboardData.getData('text/plain');
        document.execCommand('insertText', false, text);
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>}
            
            <div className="border border-gray-600 rounded-md bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                
                {/* Area di Editazione */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onPaste={handlePaste}
                    className="p-3 text-sm text-gray-200 outline-none overflow-y-auto min-h-[120px] max-h-[300px] leading-relaxed custom-scrollbar"
                    style={{ whiteSpace: 'pre-wrap' }}
                    data-placeholder={placeholder}
                />
                
                <style>{`
                    [contenteditable]:empty:before {
                        content: attr(data-placeholder);
                        color: #9ca3af;
                        font-style: italic;
                        pointer-events: none;
                        display: block;
                    }
                    /* Scrollbar personalizzata per l'editor */
                    .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                    .custom-scrollbar::-webkit-scrollbar-track { background: #1f2937; }
                    .custom-scrollbar::-webkit-scrollbar-thumb { background: #4b5563; border-radius: 3px; }
                    .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #6b7280; }
                `}</style>
            </div>
        </div>
    );
};

export default RichTextEditor;