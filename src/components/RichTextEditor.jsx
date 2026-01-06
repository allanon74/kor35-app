import React from 'react';
import ReactQuill from 'react-quill-new'; // Importa il fork per React 19
import 'react-quill-new/dist/quill.snow.css'; 

const RichTextEditor = ({ label, value, onChange, placeholder }) => {
  const modules = {
    toolbar: [
      [{ 'header': [1, 2, false] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['clean']
    ],
  };

  return (
    <div className="flex flex-col mb-4">
      <label className="text-[10px] text-gray-500 uppercase font-black mb-1">{label}</label>
      <div className="bg-gray-900 rounded border border-gray-700 overflow-hidden text-white">
        <ReactQuill 
          theme="snow"
          value={value || ""}
          onChange={(content, delta, source) => {
            // Aggiorniamo lo stato solo se il cambiamento è fatto dall'utente
            if (source === 'user') {
              onChange(content);
            }
          }}
          modules={modules}
          placeholder={placeholder}
        />
      </div>
      <style>{`
        .ql-container { border: none !important; min-height: 120px; font-size: 0.875rem; }
        .ql-editor { color: white !important; }
        .ql-toolbar { background: #1f2937 !important; border: none !important; border-bottom: 1px solid #374151 !important; }
        .ql-stroke { stroke: #9ca3af !important; }
        .ql-picker { color: #9ca3af !important; }
      `}</style>
    </div>
  );
};

export default RichTextEditor;