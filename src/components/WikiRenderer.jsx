import React from 'react';
// Importiamo i componenti che vogliamo usare come Widget
import AbilitaList from './editors/AbilitaList'; 
import OggettoList from './editors/OggettoList';
import TessituraList from './editors/TessituraList';
import WidgetTabellaAbilita from './widgets/WidgetTabellaAbilita';


// Mappa dei Widget disponibili
// Chiave (nel testo DB) -> Componente React
const WIDGET_MAP = {
  '{{WIDGET_ABILITA}}': <AbilitaList readOnly={true} />,
  '{{WIDGET_OGGETTI}}': <OggettoList readOnly={true} />,
  '{{WIDGET_TESSITURE}}': <TessituraList readOnly={true} />,
  '{{WIDGET_TABELLA_ABILITA}}': <WidgetTabellaAbilita key={index} id={part.id} />, // Esempio con ID fisso, potrebbe essere dinamico  
};

export default function WikiRenderer({ content }) {
  if (!content) return null;

  // Regex per trovare qualsiasi placeholder {{WIDGET_...}}
  const regex = /({{WIDGET_[A-Z_]+}})/g;
  
  const parts = content.split(regex);

  return (
    <div className="prose prose-red max-w-none text-gray-800 leading-relaxed">
      {parts.map((part, index) => {
        // Se la parte corrisponde a una chiave nella nostra mappa, renderizza il componente
        if (WIDGET_MAP[part]) {
            return (
                <div key={index} className="my-8 p-4 border border-gray-200 rounded-lg shadow-sm bg-gray-50 not-prose">
                    {/* Clona l'elemento per essere sicuri di passare key univoca se necessario */}
                    {React.cloneElement(WIDGET_MAP[part], { key: index })}
                </div>
            );
        }

        // Altrimenti renderizza HTML
        return <span key={index} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </div>
  );
}