import React, { useRef, useEffect } from 'react';
import { 
    Bold, Italic, Underline, 
    List, ListOrdered, 
    AlignLeft, AlignCenter,
    Trash2, Paintbrush, Type
} from 'lucide-react';

const ToolbarButton = ({ icon: Icon, onClick, active, title }) => (
    <button
        type="button"
        onClick={onClick}
        title={title}
        className={`p-1.5 rounded hover:bg-gray-600 transition-colors ${
            active ? 'bg-indigo-600 text-white' : 'text-gray-300'
        }`}
    >
        <Icon size={16} />
    </button>
);

const RichTextEditor = ({ value, onChange, placeholder, label }) => {
    const editorRef = useRef(null);
    const colorInputRef = useRef(null);

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

    // Esegue i comandi di formattazione
    const execCommand = (command, value = null) => {
        document.execCommand('styleWithCSS', false, true);
        document.execCommand(command, false, value);
        
        if (editorRef.current) {
            onChange(editorRef.current.innerHTML);
            editorRef.current.focus();
        }
    };

    return (
        <div className="flex flex-col gap-1 w-full">
            {label && <label className="text-sm font-medium text-gray-300 ml-1">{label}</label>}
            
            <div className="border border-gray-600 rounded-md bg-gray-800 overflow-hidden focus-within:ring-2 focus-within:ring-indigo-500 focus-within:border-transparent transition-all">
                
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-1 p-2 bg-gray-700 border-b border-gray-600">
                    
                    {/* Gruppo Base */}
                    <div className="flex gap-0.5 border-r border-gray-500 pr-2 mr-1">
                        <ToolbarButton icon={Bold} onClick={() => execCommand('bold')} title="Grassetto" />
                        <ToolbarButton icon={Italic} onClick={() => execCommand('italic')} title="Corsivo" />
                        <ToolbarButton icon={Underline} onClick={() => execCommand('underline')} title="Sottolineato" />
                    </div>

                    {/* Gruppo Liste & Allineamento */}
                    <div className="flex gap-0.5 border-r border-gray-500 pr-2 mr-1">
                        <ToolbarButton icon={List} onClick={() => execCommand('insertUnorderedList')} title="Lista Puntata" />
                        <ToolbarButton icon={ListOrdered} onClick={() => execCommand('insertOrderedList')} title="Lista Numerata" />
                        <ToolbarButton icon={AlignLeft} onClick={() => execCommand('justifyLeft')} title="Allinea Sinistra" />
                        <ToolbarButton icon={AlignCenter} onClick={() => execCommand('justifyCenter')} title="Allinea Centro" />
                    </div>

                    {/* Gruppo Stile Avanzato */}
                    <div className="flex gap-1 items-center border-r border-gray-500 pr-2 mr-1">
                        {/* Selettore Dimensione Font */}
                        <div className="relative group">
                            <button type="button" title="Dimensione Testo" className="text-gray-300 hover:text-white p-1">
                                <Type size={16} />
                            </button>
                            <select 
                                className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer"
                                onChange={(e) => execCommand('fontSize', e.target.value)}
                                defaultValue="3"
                            >
                                <option value="1">Molto Piccolo</option>
                                <option value="2">Piccolo</option>
                                <option value="3">Normale</option>
                                <option value="4">Medio</option>
                                <option value="5">Grande</option>
                                <option value="6">Molto Grande</option>
                                <option value="7">Enorme</option>
                            </select>
                        </div>

                        {/* Selettore Colore */}
                        <div className="relative">
                            <ToolbarButton 
                                icon={Paintbrush} 
                                onClick={() => colorInputRef.current?.click()} 
                                title="Colore Testo" 
                            />
                            <input 
                                type="color" 
                                ref={colorInputRef}
                                className="absolute opacity-0 w-0 h-0" 
                                onChange={(e) => execCommand('foreColor', e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Gruppo Utility */}
                    <div className="flex gap-0.5 ml-auto">
                        <ToolbarButton 
                            icon={Trash2} 
                            onClick={() => execCommand('removeFormat')} 
                            title="Rimuovi Formattazione" 
                        />
                    </div>
                </div>

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