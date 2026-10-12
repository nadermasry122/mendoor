import { useMemo, createElement } from 'react';

/*
 * RichText — rendert von Drittquellen geliefertes HTML (iFixit `text_rendered`)
 * sicher in React-Elemente.
 *
 * Warum nicht `dangerouslySetInnerHTML`: Der Inhalt kommt von einer externen
 * API. Statt ihn ungeprüft einzusetzen, parsen wir ihn mit DOMParser und
 * bilden ausschließlich eine feste Whitelist an Tags ab. Skripte, Event-
 * Handler (`onclick` …) und fremde Attribute werden verworfen; unbekannte
 * Tags werden auf ihren Textinhalt reduziert. Links öffnen extern und mit
 * `rel="noopener noreferrer"`.
 */
const TAG_MAP = {
  A: 'a', B: 'strong', STRONG: 'strong', I: 'em', EM: 'em', U: 'u', S: 's', DEL: 's',
  BR: 'br', CODE: 'code', PRE: 'pre', SPAN: 'span', SMALL: 'small', MARK: 'mark',
  P: 'p', UL: 'ul', OL: 'ol', LI: 'li', BLOCKQUOTE: 'blockquote', DIV: 'div',
  H1: 'h3', H2: 'h3', H3: 'h3', H4: 'h4', H5: 'h4', H6: 'h4',
  IMG: 'img', FIGURE: 'figure', FIGCAPTION: 'figcaption',
  TABLE: 'table', THEAD: 'thead', TBODY: 'tbody', TR: 'tr', TD: 'td', TH: 'th',
};

const TEXT_NODE = 3;
const ELEMENT_NODE = 1;

function safeUrl(value) {
  if (!value) return null;
  const v = String(value).trim();
  if (/^(https?:)?\/\//i.test(v) || /^mailto:/i.test(v)) return v;
  return null;
}

function toNodes(nodeList, links, prefix = '') {
  const out = [];
  nodeList.forEach((node, i) => {
    const key = `${prefix}${i}`;

    if (node.nodeType === TEXT_NODE) {
      out.push(node.nodeValue);
      return;
    }
    if (node.nodeType !== ELEMENT_NODE) return;

    const tag = TAG_MAP[node.tagName];
    const children = toNodes(node.childNodes, links, `${key}-`);

    if (!tag) {
      out.push(...children); // unbekanntes Tag → nur Inhalt durchreichen
      return;
    }
    if (tag === 'br') {
      out.push(<br key={key} />);
      return;
    }
    if (tag === 'img') {
      const src = safeUrl(node.getAttribute('src'));
      if (!src) return;
      out.push(
        <img
          key={key}
          className="rich-text__img"
          src={src}
          alt={node.getAttribute('alt') || ''}
          loading="lazy"
        />
      );
      return;
    }

    const props = { key };
    if (tag === 'a') {
      const href = links === false ? null : safeUrl(node.getAttribute('href'));
      if (!href) {
        out.push(...children);
        return;
      }
      props.href = href;
      props.target = '_blank';
      props.rel = 'noopener noreferrer';
    }

    out.push(createElement(tag, props, children));
  });
  return out;
}

export function RichText({ html, block = false, links = true, className = '' }) {
  const nodes = useMemo(() => {
    if (!html) return null;
    const doc = new DOMParser().parseFromString(String(html), 'text/html');
    return toNodes(doc.body.childNodes, links);
  }, [html, links]);

  if (!nodes || nodes.length === 0) return null;

  const cls = `rich-text${className ? ` ${className}` : ''}`;
  return block ? <div className={cls}>{nodes}</div> : <span className={cls}>{nodes}</span>;
}
