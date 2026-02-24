import React, { useEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { ensureDetailsClosed } from '../utils/htmlSanitizer';
import { RICH_TEXT_SHARED_STYLES } from '../styles/richTextSharedStyles';
import WidgetTier from './wg/WidgetTier';
import WidgetAura from './wg/WidgetAura';
import WidgetTabellaAbilita from './wg/WidgetTabellaAbilita';
import WidgetImmagine from './wg/WidgetImmagine';
import WidgetChiSiamo from './wg/WidgetChiSiamo';
import WidgetEventi from './wg/WidgetEventi';
import WidgetSocial from './wg/WidgetSocial';
import WidgetButtons from './wg/WidgetButtons';

const WIDGET_REGEX = /{{WIDGET_([A-Z_]+):(\d+)}}/g;

function renderWidgetByType(type, id) {
  switch (type) {
    case 'TIER': return <WidgetTier id={id} />;
    case 'AURA': return <WidgetAura id={id} />;
    case 'TABELLA': return <WidgetTabellaAbilita id={id} />;
    case 'IMAGE':
    case 'IMMAGINE': return <WidgetImmagine id={id} />;
    case 'CHI_SIAMO': return <WidgetChiSiamo />;
    case 'EVENTI': return <WidgetEventi />;
    case 'SOCIAL': return <WidgetSocial />;
    case 'BUTTONS':
    case 'PULSANTI': return <WidgetButtons id={id} />;
    default: return <div className="text-red-500 text-xs p-2 border border-red-300 bg-red-50 font-mono">[WIDGET IGNOTO: {type}]</div>;
  }
}

function cleanContent(html) {
  let currentHtml = html;
  let hasChanged = true;
  const wrapperRegex = /<([a-z][a-z0-9]*)[^>]*>(?:[\s\u00A0]|&nbsp;|<br\/?>)*({{WIDGET_[A-Z_]+:\d+}})(?:[\s\u00A0]|&nbsp;|<br\/?>)*<\/\1>/gi;
  while (hasChanged) {
    const newHtml = currentHtml.replace(wrapperRegex, '$2');
    if (newHtml !== currentHtml) currentHtml = newHtml;
    else hasChanged = false;
  }
  return currentHtml;
}

function getFinalHtml(content) {
  const processedContent = cleanContent(content);
  let slotIndex = 0;
  const htmlWithSlots = processedContent.replace(WIDGET_REGEX, (_, type, id) => {
    const key = slotIndex++;
    return `<div class="wiki-widget-slot" data-widget-type="${type}" data-widget-id="${id}" data-widget-key="${key}"></div>`;
  });
  return ensureDetailsClosed(htmlWithSlots);
}

export default function WikiRenderer({ content }) {
  const containerRef = useRef(null);
  const rootsRef = useRef([]);

  if (!content) return null;

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Unmount previous widgets before replacing HTML
    rootsRef.current.forEach((r) => r.unmount());
    rootsRef.current = [];

    // Set HTML imperatively so React never overwrites it on re-render (fix: widgets no longer disappear)
    const finalHtml = getFinalHtml(content);
    container.innerHTML = finalHtml;

    const slots = container.querySelectorAll('.wiki-widget-slot');
    slots.forEach((slot) => {
      const type = slot.getAttribute('data-widget-type');
      const id = slot.getAttribute('data-widget-id');
      const root = createRoot(slot);
      root.render(renderWidgetByType(type, id));
      rootsRef.current.push(root);
    });

    return () => {
      rootsRef.current.forEach((r) => r.unmount());
      rootsRef.current = [];
    };
  }, [content]);

  return (
    <>
      <style>{RICH_TEXT_SHARED_STYLES}</style>
      <div
        ref={containerRef}
        className="wiki-content prose prose-red max-w-none text-gray-800"
      />
    </>
  );
}