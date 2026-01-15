import React, { useRef, useEffect } from 'react';
import { Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
    const editorRef = useRef(null);

    // Sincronizza il contenuto solo se diverso per evitare loop o reset del cursore
    useEffect(() => {
        if (editorRef.current && editorRef.current.innerHTML !== value) {
            // Se il valore è vuoto o null, pulisci l'editor
            if (!value) {
                editorRef.current.innerHTML = '';
            } else {
                // Attenzione: qui potresti voler gestire la posizione del cursore se necessario,
                // ma per aggiornamenti esterni semplici questo va bene.
                editorRef.current.innerHTML = value;
            }
        }
    }, [value]);

    const handleInput = (e) => {
        const html = e.currentTarget.innerHTML;
        onChange(html); 
    };

    // --- FIX CRASH COPIA/INCOLLA ---
    const handlePaste = (e) => {
        e.preventDefault(); // Impedisce al browser di incollare l'HTML sporco
        
        // Recupera solo il testo semplice dagli appunti
        const text = e.clipboardData.getData('text/plain');
        
        // Inserisce il testo pulito nella posizione del cursore
        // execCommand è deprecato ma è ancora l'unico modo affidabile per contentEditable 
        // per inserire testo mantenendo la history (undo/redo) funzionante.
        document.execCommand("insertText", false, text);
    };
    // -------------------------------

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    const ToolbarButton = ({ icon: Icon, command, arg, title }) => (
        <button
            type="button" // Importante: impedisce il submit del form se dentro un form
            onClick={(e) => { e.preventDefault(); execCommand(command, arg); }}
            className="p-1.5 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title={title}
        >
            <Icon size={14} />
        </button>
    );

    return (
        <>
            <label className="block text-xs text-gray-500 mb-1">{label}</label>
            <div className="flex flex-col h-full bg-gray-900 border border-gray-700 rounded-lg overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/50 transition-all">
                {/* Toolbar */}
                <div className="flex items-center gap-1 bg-gray-800/50 p-1 border-b border-gray-700">
                    <ToolbarButton icon={Bold} command="bold" title="Grassetto" />
                    <ToolbarButton icon={Italic} command="italic" title="Corsivo" />
                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                    <ToolbarButton icon={List} command="insertUnorderedList" title="Elenco Puntato" />
                    <ToolbarButton icon={ListOrdered} command="insertOrderedList" title="Elenco Numerato" />
                    <div className="w-px h-4 bg-gray-700 mx-1"></div>
                    <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Allinea Sinistra" />
                    <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Allinea Centro" />
                    {/* <ToolbarButton icon={AlignRight} command="justifyRight" title="Allinea Destra" /> */}
                </div>

                {/* Editor Area */}
                <div
                    ref={editorRef}
                    contentEditable
                    onInput={handleInput}
                    onPaste={handlePaste} // <--- AGGIUNTO L'HANDLER QUI
                    className="flex-1 p-3 text-[11px] text-gray-200 outline-none overflow-y-auto custom-scrollbar leading-relaxed"
                    style={{ minHeight: '100px' }}
                    data-placeholder={placeholder}
                />
                
                {/* Placeholder visivo simulato con CSS se vuoto */}
                <style jsx>{`
                    [contenteditable]:empty:before {
                        content: attr(data-placeholder);
                        color: #6b7280;
                        font-style: italic;
                        pointer-events: none;
                        display: block; /* For Firefox */
                    }
                `}</style>
            </div>
        </>
    );
};

export default RichTextEditor;