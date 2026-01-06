import React from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css'; // Importa lo stile "Snow"

const RichTextEditor = ({ label, value, onChange, placeholder }) => {
  // Configurazione della barra degli strumenti (simile a Summernote)
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link', 'clean'] // Link e pulizia formattazione
    ],
  };

  return (
    <div className="flex flex-col mb-4">
      <label className="text-[10px] text-gray-500 uppercase font-black mb-1">{label}</label>
      <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden">
        <ReactQuill 
          theme="snow"
          value={value || ""}
          onChange={onChange}
          modules={modules}
          placeholder={placeholder}
          className="text-white"
        />
      </div>
      {/* CSS Custom per integrare Quill nel tuo tema scuro */}
      <style>{`
        .ql-container { border: none !important; font-family: inherit; min-h-[150px]; }
        .ql-toolbar { background: #1f2937; border: none !important; border-bottom: 1px solid #374151 !important; }
        .ql-stroke { stroke: #9ca3af !important; }
        .ql-fill { fill: #9ca3af !important; }
        .ql-picker { color: #9ca3af !important; }
        .ql-editor.ql-blank::before { color: #4b5563 !important; font-style: italic; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;