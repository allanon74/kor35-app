import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sanitizeHtml } from '../utils/htmlSanitizer'; // Assicurati che il percorso sia corretto

const RichTextEditor = ({ label, value, onChange }) => {
    
    const handleChange = (content, delta, source, editor) => {
        // Se l'editor è vuoto o contiene solo il tag paragrafo vuoto di default
        if (content === '<p><br></p>' || content.trim() === '') {
            onChange('');
            return;
        }

        // Se l'utente ha incollato del testo (source === 'user'), puliamo.
        // O semplicemente puliamo sempre prima di passare il dato al genitore.
        const cleanContent = sanitizeHtml(content);
        onChange(cleanContent);
    };

    // Configurazione Toolbar semplificata per evitare che i Master facciano danni con font strani
    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link', 'clean'] // 'clean' rimuove formattazione selezionata
        ],
        clipboard: {
            // Opzionale: Configurazione matchVisual per ridurre sporcizia in incolla
            matchVisual: false,
        }
    };

    return (
        <div className="flex flex-col gap-2 mb-4 group">
            {label && <label className="text-[10px] font-bold text-gray-500 uppercase px-1 group-focus-within:text-indigo-400 transition-colors">{label}</label>}
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500 transition-all">
                <ReactQuill 
                    theme="snow"
                    value={value || ''}
                    onChange={handleChange}
                    modules={modules}
                    className="text-gray-300 [&_.ql-editor]:min-h-[100px] [&_.ql-toolbar]:border-b-gray-700 [&_.ql-container]:border-none"
                />
            </div>
        </div>
    );
};

export default RichTextEditor;