/**
 * Shared inline text formatter (Markdown-lite → minimal HTML).
 * Consolidated here to avoid single-file subdirectories.
 */
// Local minimal escaping helpers to avoid extra imports
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
function escapeAttribute(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Format plain text with lightweight Markdown emphasis and links into minimal HTML.
 * Converts newlines to self-closing <br /> to remain valid in XHTML contexts.
 * @param text Input text containing optional Markdown-lite inline syntax.
 * @returns Safe, minimal HTML string for inline insertion.
 */
export function formatInlineHtml(text: string): string {
  if (!text) return "";
  const placeholders: string[] = [];
  const PLACEHOLDER_RE = /\u0001L(\d+)\u0002/g;
  const withPlaceholders = text.replace(
    /(!?)\[([^\]]+)\]\(([^)]+)\)/g,
    (m: string, bang: string, label: string, href: string) => {
      if (bang) return m; // image syntax -> leave untouched
      const safeHref = (href || "").trim();
      const labelHtml = renderEmphasisSafe(label || "");
      const anchor = `<a href="${escapeAttribute(safeHref)}" target="_blank" rel="noopener noreferrer nofollow">${labelHtml}</a>`;
      placeholders.push(anchor);
      return `\u0001L${placeholders.length - 1}\u0002`;
    },
  );
  let rendered = renderEmphasisSafe(withPlaceholders);
  rendered = rendered.replace(PLACEHOLDER_RE, (_m, idx: string) => {
    const i = Number(idx);
    return Number.isFinite(i) && placeholders[i] != null ? placeholders[i] : "";
  });
  // Use XHTML-compatible self-closing br to avoid XML parsing errors in Zotero UI
  rendered = rendered.replace(/\n/g, "<br />");
  return rendered;
}

function renderEmphasisSafe(input: string): string {
  if (!input) return "";
  const esc = (s: string) => escapeHtml(s);
  const applyBold = (s: string): string => {
    const re = /(\*\*|__)([\s\S]+?)\1/g;
    let out = ""; let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) { const start = m.index || 0; if (start > last) out += esc(s.slice(last, start)); out += `<strong>${esc(m[2])}</strong>`; last = start + m[0].length; }
    if (last < s.length) out += esc(s.slice(last));
    return out;
  };
  const applyItalic = (s: string): string => {
    const re = /(\*|_)([\s\S]+?)\1/g;
    let out = ""; let last = 0; let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) { const start = m.index || 0; if (start > last) out += s.slice(last, start); out += `<em>${m[2]}</em>`; last = start + m[0].length; }
    if (last < s.length) out += s.slice(last);
    return out;
  };
  return applyItalic(applyBold(input));
}

// Link safety and anchor normalization are enforced by shared/sanitizer.ts
