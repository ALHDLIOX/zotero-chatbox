/** Inline-level sanitizer helpers for note rendering (strict). */

export function appendTextWithBreaks(doc: Document, parent: HTMLElement, text: string): void {
  if (!text) return;
  const parts = text.split(/\n/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) parent.appendChild(doc.createTextNode(parts[i]));
    if (i < parts.length - 1) parent.appendChild(doc.createElement("br"));
  }
}

// Convert simple Markdown links [label](href) to <a> tags before inline sanitizer
export function convertMarkdownLinksToHtml(text: string): string {
  if (!text) return "";

  const esc = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;")
      .replace(/'/g, "&#39;");

  // Render bold markers to <strong>, escaping non-marked text
  const renderBoldSafe = (input: string): string => {
    if (!input) return "";
    const re = /(\*\*|__)([\s\S]+?)\1/g;
    let out = "";
    let last = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(input)) !== null) {
      const start = m.index || 0;
      if (start > last) out += esc(input.slice(last, start));
      out += `<strong>${esc(m[2])}</strong>`;
      last = start + m[0].length;
    }
    if (last < input.length) out += esc(input.slice(last));
    return out;
  };

  // Replace links with placeholders to avoid interfering with bold rendering outside
  const placeholders: string[] = [];
  const PLACEHOLDER_RE = /\u0001L(\d+)\u0002/g;
  const withPlaceholders = text.replace(
    /(!?)\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, bang: string, label: string, href: string) => {
      if (bang) {
        // image syntax -> leave as plain text
        return _m;
      }
      const safeHref = (href || "").trim();
      const labelHtml = renderBoldSafe(label || "");
      // No target; rel later enforced by sanitizer
      const anchor = `<a href="${esc(safeHref)}">${labelHtml}</a>`;
      placeholders.push(anchor);
      return `\u0001L${placeholders.length - 1}\u0002`;
    },
  );

  // Render bold for the rest of the string (outside links), with HTML escaping
  const rendered = renderBoldSafe(withPlaceholders);

  // Restore placeholders
  const restored = rendered.replace(PLACEHOLDER_RE, (_m, idx: string) => {
    const i = Number(idx);
    return Number.isFinite(i) && placeholders[i] != null ? placeholders[i] : "";
  });

  return restored;
}

// Allow only <a>, <span style=color|background-color>, and <br> in inline HTML; others are flattened to text
export function appendSanitizedInlineHtml(doc: Document, parent: HTMLElement, html: string): void {
  if (!html) return appendTextWithBreaks(doc, parent, html);
  const tpl = doc.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;
  // Shallow iterate children and append sanitizing
  for (let child = frag.firstChild; child; child = child.nextSibling) {
    appendSanitizedNode(doc, parent, child);
  }
}

export function appendSanitizedNode(doc: Document, parent: HTMLElement, node: Node): void {
  const ELEMENT = 1;
  const TEXT = 3;
  if (!node) return;
  if ((node as any).nodeType === TEXT) {
    appendTextWithBreaks(doc, parent, (node.textContent || ""));
    return;
  }
  if ((node as any).nodeType !== ELEMENT) {
    return; // drop comments and others
  }
  const el = node as HTMLElement;
  const tag = (el.tagName || "").toLowerCase();
  if (tag === "br") {
    parent.appendChild(doc.createElement("br"));
    return;
  }
  if (tag === "a") {
    const href = (el.getAttribute("href") || "").trim();
    if (!isSafeHref(href)) {
      // degrade to text
      appendTextWithBreaks(doc, parent, el.textContent || "");
      return;
    }
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.setAttribute("rel", "noopener noreferrer nofollow");
    // No target attribute per spec
    // Recurse children
    for (let c = el.firstChild; c; c = c.nextSibling) {
      appendSanitizedNode(doc, a, c);
    }
    parent.appendChild(a);
    return;
  }
  if (tag === "span") {
    const span = doc.createElement("span");
    span.textContent = el.textContent || "";
    const style = (el.getAttribute("style") || "").toLowerCase();
    if (/^\s*color\s*:\s*#[0-9a-f]{3,8}\s*;?\s*$/.test(style)) {
      span.setAttribute("style", style);
    } else if (/^\s*background-color\s*:\s*#[0-9a-f]{3,8}\s*;?\s*$/.test(style)) {
      span.setAttribute("style", style);
    }
    parent.appendChild(span);
    return;
  }

  // fallback: flatten unknown tag to text
  appendTextWithBreaks(doc, parent, el.textContent || "");
}

export function isSafeHref(href: string): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, "https://example.com");
    return /^(https?:|mailto:)/i.test(url.protocol) || href.startsWith("mailto:");
  } catch {
    return false;
  }
}
