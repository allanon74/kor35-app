import React, { useRef, useLayoutEffect, useMemo } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { CharacterContext, WIKI_FALLBACK_CONTEXT } from './CharacterContext';
import WidgetTier from './wg/WidgetTier';
import WidgetAura from './wg/WidgetAura';
import WidgetTabellaAbilita from './wg/WidgetTabellaAbilita';
import WidgetImmagine from './wg/WidgetImmagine';
import WidgetChiSiamo from './wg/WidgetChiSiamo';
import WidgetEventi from './wg/WidgetEventi';
import WidgetSocial from './wg/WidgetSocial';
import WidgetButtons from './wg/WidgetButtons';

// I widget montati con createRoot non ereditano il contesto Router.
// WidgetButtons usa useNavigate e Link, quindi va avvolto in BrowserRouter.
const RouterWrapper = ({ children }) => <BrowserRouter>{children}</BrowserRouter>;

// I widget montati con createRoot non ereditano i context (Router, CharacterProvider).
// Li avvolgiamo con Provider di fallback.
const WikiContextWrapper = ({ children }) => (
  <CharacterContext.Provider value={WIKI_FALLBACK_CONTEXT}>
    {children}
  </CharacterContext.Provider>
);

const getWidgetComponent = (widgetType, id) => {
  const widgetWrapper = (children) => (
    <WikiContextWrapper>
      <div className="not-prose">{children}</div>
    </WikiContextWrapper>
  );
  const needsRouter = (children) => (
    <WikiContextWrapper>
      <RouterWrapper>
        <div className="not-prose">{children}</div>
      </RouterWrapper>
    </WikiContextWrapper>
  );
  switch (widgetType) {
    case 'TIER': return widgetWrapper(<WidgetTier id={id} />);
    case 'AURA': return widgetWrapper(<WidgetAura id={id} />);
    case 'TABELLA': return widgetWrapper(<WidgetTabellaAbilita id={id} />);
    case 'IMAGE':
    case 'IMMAGINE': return widgetWrapper(<WidgetImmagine id={id} />);
    case 'CHI_SIAMO': return widgetWrapper(<WidgetChiSiamo />);
    case 'EVENTI': return widgetWrapper(<WidgetEventi />);
    case 'SOCIAL': return widgetWrapper(<WidgetSocial />);
    case 'BUTTONS':
    case 'PULSANTI': return needsRouter(<WidgetButtons id={id} />);
    default: return widgetWrapper(<span className="text-red-500 text-xs">[WIDGET IGNOTO: {widgetType}]</span>);
  }
};

function processWikiContent(content) {
  const cleanContent = (html) => {
    let currentHtml = html;
    let hasChanged = true;
    const wrapperRegex = /<([a-z][a-z0-9]*)[^>]*>(?:[\s\u00A0]|&nbsp;|<br\/?>)*({{WIDGET_[A-Z_]+:\d+}})(?:[\s\u00A0]|&nbsp;|<br\/?>)*<\/\1>/gi;
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
  let out = cleanContent(content);
  out = out.replace(
    /<details\s+class=["']wiki-collapse["'][^>]*>/gi,
    '<details class="wiki-collapse">'
  );
  out = out.replace(
    /{{WIDGET_([A-Z_]+):(\d+)}}/g,
    (_, type, id) => `<span data-widget-mount data-type="${type}" data-id="${id}" class="wiki-widget-placeholder"></span>`
  );
  return out;
}

export default function WikiRenderer({ content }) {
  const containerRef = useRef(null);

  if (!content) return null;

  const processedContent = useMemo(
    () => (content ? processWikiContent(content) : ''),
    [content]
  );

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container || !processedContent) return;

    // Impostiamo l'HTML solo qui, così React non lo sovrascrive al re-render
    // (dangerouslySetInnerHTML a ogni render cancellava i widget montati con createRoot)
    container.innerHTML = processedContent;

    const placeholders = container.querySelectorAll('[data-widget-mount]');
    const roots = [];
    placeholders.forEach((ph) => {
      const type = ph.dataset.type;
      const id = ph.dataset.id;
      const root = createRoot(ph);
      root.render(getWidgetComponent(type, id));
      roots.push(root);
    });

    return () => roots.forEach((r) => r.unmount());
  }, [content, processedContent]);

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
        /* Sezioni collassabili */
        .wiki-content details.wiki-collapse {
          margin: 1em 0;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          overflow: hidden;
          background: #f9fafb;
        }
        .wiki-content details.wiki-collapse summary {
          padding: 12px 16px;
          background: linear-gradient(to bottom, #f3f4f6, #e5e7eb);
          cursor: pointer;
          font-weight: 600;
          color: #374151;
          user-select: none;
          list-style: none;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .wiki-content details.wiki-collapse summary::-webkit-details-marker {
          display: none;
        }
        .wiki-content details.wiki-collapse summary::before {
          content: '▶';
          font-size: 0.75em;
          transition: transform 0.2s;
        }
        .wiki-content details.wiki-collapse[open] summary::before {
          transform: rotate(90deg);
        }
        .wiki-content details.wiki-collapse summary:hover {
          background: linear-gradient(to bottom, #e5e7eb, #d1d5db);
        }
        .wiki-content details.wiki-collapse[open] summary {
          border-bottom: 1px solid #e5e7eb;
        }
        .wiki-content details.wiki-collapse > *:not(summary) {
          padding: 16px;
          background: #fff;
        }
        .wiki-content .wiki-widget-placeholder {
          display: block;
        }
      `}</style>
      <div
        ref={containerRef}
        className="wiki-content prose prose-red max-w-none text-gray-800"
      />
    </>
  );
}