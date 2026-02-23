import React from 'react';
import WidgetTier from './wg/WidgetTier';
import WidgetAura from './wg/WidgetAura';
import WidgetTabellaAbilita from './wg/WidgetTabellaAbilita';
import WidgetImmagine from './wg/WidgetImmagine';
import WidgetChiSiamo from './wg/WidgetChiSiamo';
import WidgetEventi from './wg/WidgetEventi';
import WidgetSocial from './wg/WidgetSocial';
import WidgetButtons from './wg/WidgetButtons';

export default function WikiRenderer({ content }) {
  if (!content) return null;

  // --- FUNZIONE DI PULIZIA PROFONDA ---
  const cleanContent = (html) => {
    let currentHtml = html;
    let hasChanged = true;

    // Regex spiegata:
    // <([a-z][a-z0-9]*)   -> Cattura il tag di apertura (es: p, div, span, strong) nel gruppo 1
    // [^>]*>              -> Ignora attributi (class, style, etc.)
    // [\s\u00A0]* -> Ignora spazi bianchi e Non-Breaking Spaces reali
    // (?:&nbsp;|<br\/?>)* -> Ignora entità &nbsp; e tag <br>
    // ({{WIDGET_[^}]+}})  -> CATTURA IL WIDGET nel gruppo 2
    // ...ripetizione ignore... -> Ignora spazi/br dopo il widget
    // <\/\1>              -> Cerca la chiusura dello STESSO tag catturato all'inizio
    
    const wrapperRegex = /<([a-z][a-z0-9]*)[^>]*>(?:[\s\u00A0]|&nbsp;|<br\/?>)*({{WIDGET_[A-Z_]+:\d+}})(?:[\s\u00A0]|&nbsp;|<br\/?>)*<\/\1>/gi;

    // Continuiamo a eseguire la replace finché troviamo match (per gestire nesting tipo <p><span>{{WIDGET}}</span></p>)
    while (hasChanged) {
      const newHtml = currentHtml.replace(wrapperRegex, '$2');
      if (newHtml !== currentHtml) {
        currentHtml = newHtml;
      } else {
        hasChanged = false;
      }
    }
    
    return currentHtml;
  };

  // 1. Eseguiamo la pulizia
  const processedContent = cleanContent(content);

  // 2. Parsing per dividere HTML e Widget
  const regex = /{{WIDGET_([A-Z_]+):(\d+)}}/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(processedContent)) !== null) {
    // Aggiungi parte HTML precedente
    if (match.index > lastIndex) {
      parts.push({ 
        type: 'html', 
        content: processedContent.substring(lastIndex, match.index) 
      });
    }

    // Aggiungi Widget
    parts.push({
      type: 'widget',
      widgetType: match[1], 
      id: match[2]
    });

    lastIndex = regex.lastIndex;
  }

  // Aggiungi eventuale HTML rimanente
  if (lastIndex < processedContent.length) {
    parts.push({ type: 'html', content: processedContent.substring(lastIndex) });
  }

  // console.log("--- DEBUG WIKI RENDERER ---");
  // parts.forEach((part, i) => {
  //     console.log(`Part ${i} [${part.type}]:`, part.content || part.widgetType);
  //     if (part.type === 'html') {
  //         // Controlla se ci sono tag aperti non chiusi
  //         console.log("HTML Chunk:", part.content); 
  //     }
  // });

  return (
    <>
      <style>{`
        .wiki-content ul {
          list-style-type: disc;
          margin: 0.5em 0;
          padding-left: 2em;
        }
        .wiki-content ol {
          list-style-type: decimal;
          margin: 0.5em 0;
          padding-left: 2em;
        }
        .wiki-content li {
          margin: 0.25em 0;
          display: list-item;
        }
        .wiki-content ul ul {
          list-style-type: circle;
          margin: 0.25em 0;
        }
        .wiki-content ul ul ul {
          list-style-type: square;
        }
        .wiki-content hr {
          border: none;
          border-top: 2px solid #9ca3af;
          margin: 1.5em 0;
        }
        .wiki-content a.wiki-link {
          color: #6366f1;
          text-decoration: underline;
          cursor: pointer;
          transition: color 0.2s;
        }
        .wiki-content a.wiki-link:hover {
          color: #818cf8;
        }
      `}</style>
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
                  case 'IMAGE':
                  case 'IMMAGINE':
                      return <WidgetImmagine key={index} id={part.id} />;
                  case 'CHI_SIAMO':
                      return <WidgetChiSiamo key={index} />;
                  case 'EVENTI':
                      return <WidgetEventi key={index} />;
                  case 'SOCIAL':
                      return <WidgetSocial key={index} />;
                  case 'BUTTONS':
                  case 'PULSANTI':
                      return <WidgetButtons key={index} id={part.id} />;
                  default:
                      return (
                          <div key={index} className="text-red-500 text-xs p-2 border border-red-300 bg-red-50 font-mono">
                              [WIDGET IGNOTO: {part.widgetType}]
                          </div>
                      );
              }
          }
          
          // Renderizza HTML.
          // Importante: se cleanContent ha funzionato, qui dentro NON ci sono pezzi di tag orfani.
          // Se part.content è solo uno spazio o a capo, React lo gestisce bene.
          return <div key={index} dangerouslySetInnerHTML={{ __html: part.content }} />;
        })}
      </div>
    </>
  );
}