import React, { useRef, useEffect, useState } from 'react';
import { 
    Bold, Italic, Underline, 
    List, ListOrdered, 
    AlignLeft, AlignCenter,
    Trash2, Paintbrush, Type, Heading, FileText
} from 'lucide-react';

// ============================================
// CONFIGURAZIONE STILI PERSONALIZZATI
// ============================================

// Stile di visualizzazione di default per tutti gli elementi
const DEFAULT_EDITOR_STYLE = {
    fontFamily: 'Inter, system-ui, sans-serif',
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#e5e7eb'
};

// Paragrafi HTML standard
const HTML_BLOCKS = [
    { value: 'p', label: 'Paragrafo', tag: 'p' },
    { value: 'h1', label: 'Titolo H1', tag: 'h1' },
    { value: 'h2', label: 'Titolo H2', tag: 'h2' },
    { value: 'h3', label: 'Titolo H3', tag: 'h3' },
    { value: 'h4', label: 'Titolo H4', tag: 'h4' },
    { value: 'h5', label: 'Titolo H5', tag: 'h5' },
    { value: 'h6', label: 'Titolo H6', tag: 'h6' },
    { value: 'div', label: 'Blocco Div', tag: 'div' },
    { value: 'pre', label: 'Preformattato', tag: 'pre' }
];

// Font disponibili
const FONT_FAMILIES = [
    { value: 'Inter, system-ui, sans-serif', label: 'Inter (Default)' },
    { value: 'Arial, sans-serif', label: 'Arial' },
    { value: 'Georgia, serif', label: 'Georgia' },
    { value: 'Times New Roman, serif', label: 'Times New Roman' },
    { value: 'Courier New, monospace', label: 'Courier New' },
    { value: 'Verdana, sans-serif', label: 'Verdana' },
    { value: 'Trebuchet MS, sans-serif', label: 'Trebuchet MS' },
    { value: 'Comic Sans MS, cursive', label: 'Comic Sans MS' },
    { value: 'Impact, sans-serif', label: 'Impact' }
];

// Stili personalizzati con definizione CSS completa
const CUSTOM_STYLES = [
    {
        id: 'title-general',
        label: '📋 Titolo Generale',
        css: {
            fontSize: '1.75em',
            fontWeight: '700',
            color: '#818cf8',
            borderBottom: '3px solid #6366f1',
            paddingBottom: '8px',
            marginTop: '12px',
            marginBottom: '12px',
            display: 'block',
            letterSpacing: '0.5px'
        }
    },
    {
        id: 'title-section',
        label: '📑 Titolo Sezione',
        css: {
            fontSize: '1.25em',
            fontWeight: '600',
            color: '#a5b4fc',
            borderLeft: '4px solid #6366f1',
            paddingLeft: '12px',
            marginTop: '10px',
            marginBottom: '8px',
            display: 'block',
            textTransform: 'uppercase',
            letterSpacing: '1px',
            fontSize: '0.95em'
        }
    },
    {
        id: 'highlight-yellow',
        label: '📌 Evidenziato Giallo',
        css: {
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: '500'
        }
    },
    {
        id: 'highlight-blue',
        label: '💙 Evidenziato Blu',
        css: {
            backgroundColor: '#dbeafe',
            color: '#1e40af',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: '500'
        }
    },
    {
        id: 'highlight-green',
        label: '✅ Evidenziato Verde',
        css: {
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: '500'
        }
    },
    {
        id: 'highlight-red',
        label: '🔴 Evidenziato Rosso',
        css: {
            backgroundColor: '#fee2e2',
            color: '#991b1b',
            padding: '2px 6px',
            borderRadius: '3px',
            fontWeight: '500'
        }
    },
    {
        id: 'code-inline',
        label: '💻 Codice Inline',
        css: {
            backgroundColor: '#1f2937',
            color: '#10b981',
            padding: '2px 6px',
            borderRadius: '4px',
            fontFamily: 'Courier New, monospace',
            fontSize: '0.9em',
            border: '1px solid #374151'
        }
    },
    {
        id: 'quote',
        label: '💬 Citazione',
        css: {
            borderLeft: '4px solid #6366f1',
            paddingLeft: '12px',
            fontStyle: 'italic',
            color: '#d1d5db',
            marginLeft: '8px'
        }
    },
    {
        id: 'warning',
        label: '⚠️ Avviso',
        css: {
            backgroundColor: '#fef3c7',
            color: '#92400e',
            padding: '8px 12px',
            borderRadius: '6px',
            borderLeft: '4px solid #f59e0b',
            fontWeight: '500'
        }
    },
    {
        id: 'success',
        label: '✨ Successo',
        css: {
            backgroundColor: '#d1fae5',
            color: '#065f46',
            padding: '8px 12px',
            borderRadius: '6px',
            borderLeft: '4px solid #10b981',
            fontWeight: '500'
        }
    }
];

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
    const [currentBlockType, setCurrentBlockType] = useState('p');
    const [currentFont, setCurrentFont] = useState(DEFAULT_EDITOR_STYLE.fontFamily);

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

    // Applica lo stile di default all'editor
    useEffect(() => {
        if (editorRef.current) {
            Object.assign(editorRef.current.style, DEFAULT_EDITOR_STYLE);
        }
    }, []);

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

    // Cambia il tipo di blocco HTML (H1, H2, P, etc.)
    const changeBlockType = (tagName) => {
        execCommand('formatBlock', tagName);
        setCurrentBlockType(tagName);
    };

    // Cambia il font family
    const changeFontFamily = (fontFamily) => {
        execCommand('fontName', fontFamily);
        setCurrentFont(fontFamily);
    };

    // Applica uno stile personalizzato
    const applyCustomStyle = (style) => {
        const selection = window.getSelection();
        if (!selection.rangeCount) return;

        const range = selection.getRangeAt(0);
        const selectedText = range.toString();

        if (!selectedText) {
            alert('Seleziona del testo prima di applicare lo stile personalizzato');
            return;
        }

        // Crea un elemento span con lo stile personalizzato
        const span = document.createElement('span');
        span.textContent = selectedText;
        span.setAttribute('data-custom-style', style.id);
        
        // Applica gli stili CSS
        Object.assign(span.style, style.css);

        // Sostituisci il testo selezionato con lo span stilizzato
        range.deleteContents();
        range.insertNode(span);

        // Aggiorna il contenuto
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
                    
                    {/* Gruppo Paragrafi HTML */}
                    <div className="flex gap-1 items-center border-r border-gray-500 pr-2 mr-1">
                        <Heading size={16} className="text-gray-400" />
                        <select 
                            value={currentBlockType}
                            onChange={(e) => changeBlockType(e.target.value)}
                            className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            title="Tipo di Paragrafo"
                        >
                            {HTML_BLOCKS.map(block => (
                                <option key={block.value} value={block.tag}>
                                    {block.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Gruppo Font Family */}
                    <div className="flex gap-1 items-center border-r border-gray-500 pr-2 mr-1">
                        <FileText size={16} className="text-gray-400" />
                        <select 
                            value={currentFont}
                            onChange={(e) => changeFontFamily(e.target.value)}
                            className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer max-w-[140px]"
                            title="Tipo di Font"
                        >
                            {FONT_FAMILIES.map(font => (
                                <option key={font.value} value={font.value}>
                                    {font.label}
                                </option>
                            ))}
                        </select>
                    </div>
                    
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

                    {/* Gruppo Stili Personalizzati */}
                    <div className="flex gap-1 items-center border-r border-gray-500 pr-2 mr-1">
                        <select 
                            onChange={(e) => {
                                if (e.target.value) {
                                    const style = CUSTOM_STYLES.find(s => s.id === e.target.value);
                                    if (style) applyCustomStyle(style);
                                    e.target.value = ''; // Reset
                                }
                            }}
                            className="bg-gray-800 text-gray-200 text-xs px-2 py-1 rounded border border-gray-600 hover:border-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                            title="Stili Personalizzati"
                            defaultValue=""
                        >
                            <option value="">🎨 Stili Custom</option>
                            {CUSTOM_STYLES.map(style => (
                                <option key={style.id} value={style.id}>
                                    {style.label}
                                </option>
                            ))}
                        </select>
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
                    
                    /* Stili per i vari heading HTML */
                    [contenteditable] h1 { font-size: 2em; font-weight: bold; margin: 0.67em 0; }
                    [contenteditable] h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0; }
                    [contenteditable] h3 { font-size: 1.17em; font-weight: bold; margin: 0.83em 0; }
                    [contenteditable] h4 { font-size: 1em; font-weight: bold; margin: 1em 0; }
                    [contenteditable] h5 { font-size: 0.83em; font-weight: bold; margin: 1.5em 0; }
                    [contenteditable] h6 { font-size: 0.67em; font-weight: bold; margin: 2em 0; }
                    [contenteditable] p { margin: 0.5em 0; }
                    [contenteditable] pre { 
                        background-color: #1f2937; 
                        padding: 8px; 
                        border-radius: 4px; 
                        overflow-x: auto;
                        font-family: monospace;
                    }
                `}</style>
            </div>
        </div>
    );
};

export default RichTextEditor;