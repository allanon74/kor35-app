import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { sanitizeHtml } from '../utils/htmlSanitizer'; // Importa il sanitizer

const RichTextEditor = ({ label, value, onChange }) => {
    
    // Intercettiamo il cambiamento
    const handleChange = (content) => {
        // Puliamo l'HTML prima di inviarlo al form padre
        // Nota: ReactQuill a volte ritorna "<p><br></p>" quando è vuoto
        const isActuallyEmpty = content === '<p><br></p>' || content === '';
        
        if (isActuallyEmpty) {
            onChange('');
        } else {
            // Eseguiamo la pulizia "pesante" solo se stiamo incollando o scrivendo
            // Per evitare lag eccessivo su testi lunghi, si potrebbe fare onBlur, 
            // ma per ora facciamolo diretto per sicurezza.
            const clean = sanitizeHtml(content); 
            onChange(clean);
        }
    };

    const modules = {
        toolbar: [
            ['bold', 'italic', 'underline', 'strike'],
            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
            ['link'],
            ['clean'] // Il pulsante 'Tx' di Quill fa già pulizia parziale
        ],
    };

    return (
        <div className="flex flex-col gap-2 mb-4">
            {label && <label className="text-[10px] font-bold text-gray-500 uppercase px-1">{label}</label>}
            <div className="bg-gray-900 rounded-lg border border-gray-700 overflow-hidden focus-within:border-indigo-500 transition-colors">
                <ReactQuill 
                    theme="snow"
                    value={value || ''}
                    onChange={handleChange}
                    modules={modules}
                    className="text-gray-300"
                />
            </div>
        </div>
    );
};

export default RichTextEditor;