import { useMemo } from 'react';
import { RichText } from './RichText.jsx';
import { looksLikeHtml, markdownToHtml, inlineMarkdownHtml } from '../../lib/format.js';

/*
 * FormattedText — einheitliche Darstellung aller API-Inhalte.
 *
 * Erkennt selbst, ob der Wert HTML (z. B. iFixit `text_rendered`), Markdown
 * (z. B. Web-Snippets) oder reiner Text ist, und rendert ihn über den
 * sicheren RichText-Renderer. Damit werden Links, Fett, Kursiv und
 * Überschriften auf jeder Seite gleich behandelt.
 *
 *   block   – Blockkontext (Absätze, Listen, Überschriften) statt inline
 *   links   – Links als anklickbare <a> rendern (in Buttons meist false)
 */
export function FormattedText({ value, block = false, links = true, className = '' }) {
  const html = useMemo(() => {
    if (value == null || value === '') return '';
    const text = String(value);
    if (looksLikeHtml(text)) return text;
    return block ? markdownToHtml(text) : inlineMarkdownHtml(text);
  }, [value, block]);

  if (!html) return null;
  return <RichText html={html} block={block} links={links} className={className} />;
}
