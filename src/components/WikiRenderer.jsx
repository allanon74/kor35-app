import React from 'react';
import WidgetTier from './wg/WidgetTier';
import WidgetAura from './wg/WidgetAura';
import WidgetTabellaAbilita from './wg/WidgetTabellaAbilita';

export default function WikiRenderer({ content }) {
  if (!content) return null;

  // 1. PULIZIA ROBUSTA
  // Rimuove qualsiasi tag contenitore (p, div, span, h1-6) che avvolge ESCLUSIVAMENTE un widget.
  // Gestisce attributi (class, style), spazi, <br> e &nbsp; che l'editor potrebbe aggiungere.
  
  // Spiegazione Regex:
  // <(p|div|span|h\d)[^>]*>  -> Trova apertura tag (es. <p>, <p class="x">, <div>)
  // (?:<br\/?>|&nbsp;|\s)* -> Ignora br, spazi e nbsp prima del widget
  // ({{WIDGET_[^}]+}})       -> CATTURA IL WIDGET ($2)
  // (?:<br\/?>|&nbsp;|\s)* -> Ignora br, spazi e nbsp dopo il widget
  // <\/\1>                   -> Trova chiusura tag corrispondente (es. </p>)
  
  const cleanRegex = /<(p|div|span|h\d|li)[^>]*>\s*(?:<br\/?>|&nbsp;|\s)*({{WIDGET_[A-Z_]+:\d+}})(?:<br\/?>|&nbsp;|\s)*<\/\1>/gi;
  
  // Sostituiamo il tutto con SOLO il codice del widget ($2)
  let cleanContent = content.replace(cleanRegex, '$2');

  // 2. PARSING
  const regex = /{{WIDGET_([A-Z_]+):(\d+)}}/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(cleanContent)) !== null) {
    // Aggiungi testo HTML prima del widget
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'html', 
        content: cleanContent.substring(lastIndex, match.index) 
      });
    }

    // Aggiungi Widget
    parts.push({
      type: 'widget',
      widgetType: match[1], // Es: TIER
      id: match[2]          // Es: 32
    });

    lastIndex = regex.lastIndex;
  }

  // Aggiungi testo rimanente
  if (lastIndex < cleanContent.length) {
    parts.push({ type: 'html', content: cleanContent.substring(lastIndex) });
  }

  return (
    <div className="wiki-content prose prose-red max-w-none text-gray-800">
      {parts.map((part, index) => {
        if (part.type === 'widget') {
            switch (part.widgetType) {
                case 'TIER':
                    return <WidgetTier key={index} id={part.id} />;
                case 'AURA':
                    return <WidgetAura key={index} id={part.id} />;
                case 'TABELLA':
                    return <WidgetTabellaAbilita key={index} id={part.id} />;
                default:
                    return (
                        <div key={index} className="text-red-500 text-xs p-2 border border-red-300 bg-red-50">
                            [Widget non supportato: {part.widgetType}]
                        </div>
                    );
            }
        }
        
        // Renderizza HTML puro
        return <div key={index} dangerouslySetInnerHTML={{ __html: part.content }} />;
      })}
    </div>
  );
}