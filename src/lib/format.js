/* ══════════════════════════════════════════════════════════════
   Formatierung von Fremdinhalten (API-Daten).
   Erkennt und behandelt drei Fälle einheitlich:
     1. HTML   (z. B. iFixit `text_rendered`)  → unverändert an RichText
     2. Markdown (z. B. Web-Snippet-Texte)     → HTML-Teilmenge
     3. Plain   → nur Entity-Dekodierung
   Sicherheit: Es wird ausschließlich eine kleine HTML-Teilmenge
   erzeugt; das eigentliche Whitelisting übernimmt RichText.
   ══════════════════════════════════════════════════════════════ */

const HTML_HINT =
  /<\/?(a|p|strong|b|em|i|u|ul|ol|li|br|h[1-6]|code|pre|span|img|blockquote|table|thead|tbody|tr|td|th|figure|figcaption)\b/i;

export function looksLikeHtml(value) {
  return HTML_HINT.test(String(value || ''));
}

export function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/* HTML-Entities dekodieren, ohne Tags zu interpretieren (`<` bleibt Text).
   Die Textarea-Methode nutzt das Raw-Text-Parsing-Modell des Browsers. */
export function decodeEntities(value) {
  const s = value == null ? '' : String(value);
  if (!/&(?:#\d+|#x[0-9a-f]+|[a-z][a-z0-9]+);/i.test(s)) return s;
  if (typeof document !== 'undefined') {
    const el = document.createElement('textarea');
    el.innerHTML = s;
    return el.value;
  }
  return s;
}

/* Inline-Markdown: `code`, [Text](URL), **bold**, *kursiv*, __bold__, _kursiv_ */
export function inlineMarkdown(value) {
  let t = escapeHtml(value);
  const codes = [];
  t = t.replace(/`([^`]+)`/g, (_, code) => {
    codes.push(code);
    return `\u0000${codes.length - 1}\u0000`;
  });
  t = t.replace(
    /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/gi,
    (_, text, url) => `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`
  );
  t = t.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  t = t.replace(/__([^_]+)__/g, '<strong>$1</strong>');
  t = t.replace(/(^|[^*])\*([^*\s][^*]*?)\*(?!\*)/g, '$1<em>$2</em>');
  t = t.replace(/(^|[^_\w])_([^_\s][^_]*?)_(?!_)/g, '$1<em>$2</em>');
  t = t.replace(/\u0000(\d+)\u0000/g, (_, i) => `<code>${codes[+i]}</code>`);
  return t;
}

/* Nur Inline-Formatierung (für Titel/Zitate/Snippets); Zeilenumbrüche → <br>. */
export function inlineMarkdownHtml(value) {
  return inlineMarkdown(decodeEntities(value)).replace(/\n+/g, '<br>');
}

/* Block-Markdown: Überschriften, Listen, Absätze (+ Inline). */
export function markdownToHtml(value) {
  const text = decodeEntities(value).replace(/\r\n?/g, '\n');
  const out = [];
  let list = null;
  const closeList = () => {
    if (list) {
      out.push(`</${list}>`);
      list = null;
    }
  };

  for (const rawLine of text.split('\n')) {
    const line = rawLine.trim();
    if (!line) {
      closeList();
      continue;
    }

    const heading = line.match(/^(#{1,6})\s+(.*)$/);
    if (heading) {
      closeList();
      const level = Math.min(heading[1].length + 1, 4); // h1 → h2 (Sektionsebene)
      out.push(`<h${level}>${inlineMarkdown(heading[2])}</h${level}>`);
      continue;
    }

    const ul = line.match(/^[-*+]\s+(.*)$/);
    if (ul) {
      if (list !== 'ul') {
        closeList();
        out.push('<ul>');
        list = 'ul';
      }
      out.push(`<li>${inlineMarkdown(ul[1])}</li>`);
      continue;
    }

    const ol = line.match(/^\d+[.)]\s+(.*)$/);
    if (ol) {
      if (list !== 'ol') {
        closeList();
        out.push('<ol>');
        list = 'ol';
      }
      out.push(`<li>${inlineMarkdown(ol[1])}</li>`);
      continue;
    }

    closeList();
    out.push(`<p>${inlineMarkdown(line)}</p>`);
  }

  closeList();
  return out.join('');
}
