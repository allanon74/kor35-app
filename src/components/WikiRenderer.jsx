// src/components/WikiRenderer.jsx
import React from 'react';
import WidgetTabellaAbilita from './wg/WidgetTabellaAbilita';
import WidgetAura from './wg/WidgetAura';

export default function WikiRenderer({ content }) {
  if (!content) return null;

  // Regex migliorata: Cerca {{WIDGET_TIPO:ID}}
  // Es: {{WIDGET_TABELLA:5}} cattura Group1="TABELLA", Group2="5"
  const regex = /{{WIDGET_([A-Z_]+):(\d+)}}/g;
  
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(content)) !== null) {
    // 1. Aggiungi il testo prima del widget
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'html', 
        content: content.substring(lastIndex, match.index) 
      });
    }

    // 2. Aggiungi il widget
    parts.push({
      type: 'widget',
      widgetType: match[1], // Es: TABELLA, AURA
      id: match[2]          // Es: 5, 12
    });

    lastIndex = regex.lastIndex;
  }

  // 3. Aggiungi il resto del testo
  if (lastIndex < content.length) {
    parts.push({ type: 'html', content: content.substring(lastIndex) });
  }

  return (
    <div className="prose prose-red max-w-none text-gray-800">
      {parts.map((part, index) => {
        if (part.type === 'widget') {
            switch (part.widgetType) {
                case 'TIER':
                    return <WidgetTier key={index} id={part.id} />;
                case 'TABELLA':
                    return <WidgetTabellaAbilita key={index} id={part.id} />;
                case 'AURA':
                    return <WidgetAura key={index} id={part.id} />;
                // Caso "Nested" usato da solo:
                case 'SOLO_MATTONI': 
                    // Dovresti fare un WidgetWrapper per MattoneList che fa il fetch
                    return <div key={index}>Widget Mattoni {part.id}</div>;
                default:
                    return <span key={index} className="text-red-500">[Widget sconosciuto: {part.widgetType}]</span>;
            }
        }
        return <span key={index} dangerouslySetInnerHTML={{ __html: part.content }} />;
      })}
    </div>
  );
}