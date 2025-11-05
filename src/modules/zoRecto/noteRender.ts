import { parseMarkdownWithMath, type InlineToken } from "./markdown";

interface CiteTarget {
  attachmentID: number;
  page: number; // 1-based index in PDF
  quote?: string;
  locate?: string; // section/equation/figure, written into suffix
}

/**
 * Render note HTML from raw Markdown (no KaTeX), following strict rules:
 * - Wrap with <div data-schema-version="9"> ... </div>
 * - Only h1–h3 for headings
 * - Paragraphs use <p> with inline <br> for line breaks; drop empty paragraphs
 * - Block code uses <pre> (no <code>)
 * - No inline code (<code>)
 * - Math: block -> <pre class="math">$$...$$</pre>; inline -> <span class="math">$...$</span>
 * - Bold: **...** or __...__ -> <strong>...</strong>
 * - Links: only <a href="..." rel="noopener noreferrer nofollow"> ... </a> (no target)
 * - Colors: allow only <span style="color:#hex"> or <span style="background-color:#hex[aa]">
 * - Tables: output standard <table>/<thead>/<tbody>/<tr>/<th>/<td> without extra classes/styles
 * - Any other tags/styles are stripped (treated as plain text)
 */
export function renderNoteHtml(markdown: string, doc: Document): string {
  const { blocks } = parseMarkdownWithMath(markdown || "");

  const wrapper = doc.createElement("div");
  wrapper.setAttribute("data-schema-version", "9");

  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const level = clampHeadingLevel(block.level);
        const h = doc.createElement(`h${level}`);
        appendInlineTokensTo(doc, h, block.tokens);
        if (!isNodeEmpty(h)) wrapper.appendChild(h);
        break;
      }
      case "paragraph": {
        // Render paragraph but extract ((cite: {...})) into standalone citation div blocks
        appendParagraphWithCitations(doc, wrapper, block.tokens);
        break;
      }
      case "list": {
        const list = doc.createElement(block.ordered ? "ol" : "ul");
        for (const itemTokens of block.items) {
          const li = doc.createElement("li");
          appendInlineTokensTo(doc, li, itemTokens);
          // Keep empty <li> if present to match Markdown semantics
          list.appendChild(li);
        }
        wrapper.appendChild(list);
        break;
      }
      case "code": {
        const pre = doc.createElement("pre");
        pre.textContent = block.content || "";
        wrapper.appendChild(pre);
        break;
      }
      case "math": {
        // Block math only
        const pre = doc.createElement("pre");
        pre.className = "math";
        pre.textContent = `$$${block.token.content}$$`;
        wrapper.appendChild(pre);
        break;
      }
      case "table": {
        const table = doc.createElement("table");
        const thead = doc.createElement("thead");
        const headTr = doc.createElement("tr");
        for (let i = 0; i < block.header.length; i++) {
          const th = doc.createElement("th");
          appendInlineTokensTo(doc, th, block.header[i]);
          headTr.appendChild(th);
        }
        thead.appendChild(headTr);
        table.appendChild(thead);

        const tbody = doc.createElement("tbody");
        for (const row of block.rows) {
          const tr = doc.createElement("tr");
          for (let i = 0; i < row.length; i++) {
            const td = doc.createElement("td");
            appendInlineTokensTo(doc, td, row[i]);
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        wrapper.appendChild(table);
        break;
      }
    }
  }

  return String(wrapper.outerHTML);
}

// Append a paragraph to wrapper, splitting out inline ((cite:{...})) markers into
// sibling <div data-citation-items> blocks per Zotero's expected schema.
function appendParagraphWithCitations(
  doc: Document,
  wrapper: HTMLElement,
  tokens: InlineToken[],
): void {
  let p = doc.createElement("p");

  const flushP = () => {
    if (!isNodeEmpty(p)) {
      wrapper.appendChild(p);
    }
    p = doc.createElement("p");
  };

  for (const token of tokens) {
    // Treat block math (e.g., $$...$$ or \[...\]) as standalone blocks inside paragraphs
    if (token.type === "math" && token.inline === false) {
      flushP();
      const pre = doc.createElement("pre");
      pre.className = "math";
      // Preserve delimiters per requirement
      const content = token.content || "";
      if (token.delimiter === "block-$$") {
        pre.textContent = `$$${content}$$`;
      } else if (token.delimiter === "block-\\[\\]") {
        pre.textContent = `\\[${content}\\]`;
      } else {
        // Fallback: keep as inline if an unexpected delimiter appears
        appendInlineTokensTo(doc, p, [token]);
        continue;
      }
      wrapper.appendChild(pre);
      continue;
    }

    if (token.type !== "text") {
      // Non-text tokens (including inline math): append as-is into current paragraph
      appendInlineTokensTo(doc, p, [token]);
      continue;
    }

    const text = token.content || "";
    if (!text) continue;

    const re = /(?:\(\(|（（)[\s\u00A0\u200B\u200C\u200D]*cite[\s\u00A0\u200B\u200C\u200D]*[:：][\s\u00A0\u200B\u200C\u200D]*([\s\S]*?)[\s\u00A0\u200B\u200C\u200D]*(?:\)\s*\)|）\s*）)/gi;
    let last = 0;
    let matched = false;
    for (const m of text.matchAll(re)) {
      matched = true;
      const start = m.index ?? 0;
      const before = text.slice(last, start);
      if (before) {
        appendSanitizedInlineHtml(doc, p, convertMarkdownLinksToHtml(before));
      }
      const payload = m[1] || "";
      const parsed = parseInlineCitationsForNotes(payload);
      if (!parsed || parsed.length === 0) {
        // Keep raw text if parse failed
        appendSanitizedInlineHtml(
          doc,
          p,
          convertMarkdownLinksToHtml(text.slice(start, start + (m[0]?.length || 0))),
        );
      } else {
        // Flush current paragraph before inserting block-level citation
        flushP();
        try {
          const citationDiv = buildCitationBlock(doc, parsed);
          wrapper.appendChild(citationDiv);
          // Log built citation for debugging
          try {
            (ztoolkit as any)?.log?.("[zorecto] 笔记引用生成", {
              payload,
              cites: parsed,
            });
          } catch (e) {
            void e;
          }
        } catch (e) {
          // If building fails, degrade to raw text
          appendSanitizedInlineHtml(
            doc,
            p,
            convertMarkdownLinksToHtml(text.slice(start, start + (m[0]?.length || 0))),
          );
        }
      }
      last = start + (m[0]?.length || 0);
    }

    if (!matched) {
      appendSanitizedInlineHtml(doc, p, convertMarkdownLinksToHtml(text));
    } else {
      const tail = text.slice(last);
      if (tail) {
        appendSanitizedInlineHtml(doc, p, convertMarkdownLinksToHtml(tail));
      }
    }
  }

  // Append the final paragraph if it has content
  if (!isNodeEmpty(p)) {
    wrapper.appendChild(p);
  }
}

function parseInlineCitationsForNotes(text: string): CiteTarget[] | undefined {
  if (!text) return undefined;
  const trimmed = text.trim();
  let jsonSlice = trimmed;
  const l = trimmed.indexOf("{") !== -1 ? trimmed.indexOf("{") : trimmed.indexOf("[");
  const r = Math.max(trimmed.lastIndexOf("}"), trimmed.lastIndexOf("]"));
  if (l !== -1 && r !== -1 && r > l) {
    jsonSlice = trimmed.slice(l, r + 1);
  }

  const normalized = jsonSlice
    .replace(/[\u201C\u201D\u201E\u201F\u2033]/g, '"')
    .replace(/[\u2018\u2019\u201A\u2032]/g, "'")
    .replace(/\s+/g, (m) => (m.indexOf("\n") >= 0 ? "\n" : " "));

  try {
    const data = JSON.parse(normalized);
    const arr = Array.isArray(data) ? data : [data];
    const cites: CiteTarget[] = [];
    for (const c of arr) {
      const a = Number((c as any)?.attachmentID ?? (c as any)?.attachmentId);
      const p = Number((c as any)?.page);
      if (Number.isFinite(a) && Number.isFinite(p)) {
        cites.push({
          attachmentID: a,
          page: p,
          quote:
            typeof (c as any)?.quote === "string" ? (c as any).quote : undefined,
          locate:
            typeof (c as any)?.locate === "string" ? (c as any).locate : undefined,
        });
      }
    }
    return cites.length > 0 ? cites : undefined;
  } catch {
    // lenient parsing: scan object-like chunks
  }

  const candidates: CiteTarget[] = [];
  const objectLike = normalized.match(/{[^{}]*}/g);
  const scanTargets = objectLike && objectLike.length > 0 ? objectLike : [normalized];
  for (const chunk of scanTargets) {
    const idMatch = chunk.match(/attachment\s*id|attachmentID|attachmentId/i)
      ? chunk.match(/(?:attachment\s*id|attachmentID|attachmentId)\s*[:=]\s*(\d+)/i)
      : null;
    const pageMatch = chunk.match(/page\s*[:=]\s*(\d+)/i);
    if (!idMatch || !pageMatch) continue;
    const attachmentID = Number(idMatch[1]);
    const page = Number(pageMatch[1]);
    if (!Number.isFinite(attachmentID) || !Number.isFinite(page)) continue;
    const quoteMatch = chunk.match(/quote\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/);
    const locateMatch = chunk.match(/locate\s*[:=]\s*(["'`\u201C\u201D\u2018\u2019])([\s\S]*?)\1/i);
    candidates.push({
      attachmentID,
      page,
      quote: quoteMatch ? quoteMatch[2] : undefined,
      locate: locateMatch ? locateMatch[2] : undefined,
    });
  }

  return candidates.length > 0 ? candidates : undefined;
}

function buildCitationBlock(doc: Document, cites: CiteTarget[]): HTMLDivElement {
  // Build data-citation-items (with itemData) and data-citation (with per-citation options)
  const itemsPayload: Array<{ uris: string[]; itemData: any }> = [];
  const citationItems: Array<{
    uris: string[];
    prefix?: string;
    suffix?: string;
    'suppress-author': boolean;
    locator?: string;
    label?: string;
  }> = [];

  for (const c of cites) {
    const resolved = resolveItemForAttachment(c.attachmentID);
    if (!resolved) continue;
    const { uri, itemData } = resolved;

    itemsPayload.push({ uris: [uri], itemData });

    // Use page provided by the model directly (no journal start-page conversion)
    const locatorStr = typeof c.page === "number" && Number.isFinite(c.page)
      ? String(c.page)
      : undefined;

    citationItems.push({
      uris: [uri],
      'suppress-author': true,
      locator: locatorStr,
      label: "page",
      suffix: c.locate && String(c.locate).trim() ? String(c.locate).trim() : undefined,
    });
  }

  const div = doc.createElement("div");
  try {
    div.setAttribute(
      "data-citation-items",
      encodeURIComponent(JSON.stringify(itemsPayload)),
    );
  } catch (e) {
    // keep empty attribute on failure
    div.setAttribute("data-citation-items", "");
  }

  const p = doc.createElement("p");
  const span = doc.createElement("span");
  span.className = "citation";

  try {
    span.setAttribute(
      "data-citation",
      encodeURIComponent(
        JSON.stringify({ citationItems, properties: {} as Record<string, unknown> }),
      ),
    );
  } catch (e) {
    span.setAttribute("data-citation", "");
  }

  // Minimal visible text: (page X[, locate]) - from the first citation only
  let visible = "(citation)";
  if (citationItems.length > 0) {
    const first = citationItems[0];
    const parts: string[] = [];
    if (first.locator) parts.push(`page ${first.locator}`);
    if (first.suffix) parts.push(first.suffix);
    visible = `(${parts.join(", ") || "citation"})`;
  }
  span.textContent = visible;
  p.appendChild(span);
  div.appendChild(p);
  return div;
}

function resolveItemForAttachment(
  attachmentID: number,
): { uri: string; itemData: any; startPage?: number } | undefined {
  try {
    const Items: any = (Zotero as any)?.Items;
    const attachment = Items?.get?.(attachmentID);
    if (!attachment) return undefined;
    const parent = attachment.isAttachment?.() ? (attachment as any).parentItem : attachment;
    if (!parent) return undefined;

    // Build users/<userID> uri
    let userID: number | string | undefined;
    try {
      const Users: any = (Zotero as any)?.Users;
      userID = Users?.getCurrentUserID?.();
      if (!userID) {
        // Attempt to derive from library info
        const Libraries: any = (Zotero as any)?.Libraries;
        const lib = Libraries?.get?.(parent.libraryID);
        userID = lib?.accountID ?? lib?.userID ?? "0";
      }
    } catch (e) {
      userID = "0";
    }

    const key = (parent as any).key || (parent as any).getField?.("key") || String(parent.id || "");
    const uri = `http://zotero.org/users/${userID}/items/${key}`;

    // itemData via internal API if available; fallback to minimal fields
    let itemData: any;
    try {
      const Utilities: any = (Zotero as any)?.Utilities;
      itemData = Utilities?.itemToCSLJSON?.(parent);
    } catch (e) {
      itemData = undefined;
    }
    if (!itemData) {
      // Fallback minimal CSL-like data
      itemData = buildMinimalCSLFromItem(parent, uri);
    } else {
      // Ensure id equals uri
      try {
        itemData.id = uri;
      } catch (e) {
        void e;
      }
    }

    // Extract start page for locator computation
    let startPage: number | undefined;
    try {
      const pages: string = parent.getField?.("pages") || "";
      const m = String(pages).match(/\d+/);
      if (m) startPage = Number(m[0]);
    } catch (e) {
      void e;
    }

    return { uri, itemData, startPage };
  } catch (e) {
    try {
      (ztoolkit as any)?.log?.("[zorecto] 解析附件引用失败", {
        attachmentID,
        error: String(e),
      });
    } catch (ee) {
      void ee;
    }
    return undefined;
  }
}

function buildMinimalCSLFromItem(item: any, uri: string): any {
  const safeGet = (f: string) => {
    try {
      return item.getField?.(f) ?? "";
    } catch {
      return "";
    }
  };

  const type = (() => {
    try {
      return item.itemType || item.type || "article-journal";
    } catch {
      return "article-journal";
    }
  })();

  const title = safeGet("title");
  const DOI = safeGet("DOI");
  const ISSN = safeGet("ISSN");
  const URL = safeGet("url") || safeGet("URL");
  const container = safeGet("publicationTitle") || safeGet("journalAbbreviation") || safeGet("journalTitle") || safeGet("container-title");
  const volume = safeGet("volume");
  const issue = safeGet("issue");
  const language = safeGet("language");
  const page = safeGet("pages");
  const authors: Array<{ family: string; given?: string }> = [];
  try {
    const creators = (item as any).getCreators?.() || (item as any).creators || [];
    for (const c of creators) {
      const family = (c.lastName || c.family || c.name || "").toString();
      const given = (c.firstName || c.given || "").toString();
      if (family || given) authors.push({ family, given: given || undefined });
    }
  } catch {
    // ignore
  }

  return {
    id: uri,
    type,
    title,
    DOI,
    ISSN,
    URL,
    volume,
    issue,
    language,
    page,
    'container-title': container,
    author: authors,
  };
}

function clampHeadingLevel(level: number): 1 | 2 | 3 {
  if (level <= 1) return 1;
  if (level === 2) return 2;
  return 3;
}

function appendInlineTokensTo(
  doc: Document,
  parent: HTMLElement,
  tokens: InlineToken[],
): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        appendSanitizedInlineHtml(doc, parent, convertMarkdownLinksToHtml(token.content || ""));
        break;
      }
      case "code": {
        // Inline code not needed per spec: include plain text
        appendTextWithBreaks(doc, parent, token.content || "");
        break;
      }
      case "math": {
        const span = doc.createElement("span");
        span.className = "math";
        span.textContent = `$${token.content}$`;
        parent.appendChild(span);
        break;
      }
    }
  }
}

function appendTextWithBreaks(doc: Document, parent: HTMLElement, text: string): void {
  if (!text) return;
  const parts = text.split(/\n/g);
  for (let i = 0; i < parts.length; i++) {
    if (parts[i]) parent.appendChild(doc.createTextNode(parts[i]));
    if (i < parts.length - 1) parent.appendChild(doc.createElement("br"));
  }
}

// Convert simple Markdown links [label](href) to <a> tags before inline sanitizer
function convertMarkdownLinksToHtml(text: string): string {
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
function appendSanitizedInlineHtml(doc: Document, parent: HTMLElement, html: string): void {
  if (!html) return appendTextWithBreaks(doc, parent, html);
  const tpl = doc.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;
  // Shallow iterate children and append sanitizing
  for (let child = frag.firstChild; child; child = child.nextSibling) {
    appendSanitizedNode(doc, parent, child);
  }
}

function appendSanitizedNode(doc: Document, parent: HTMLElement, node: Node): void {
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
  if (tag === "strong") {
    const strong = doc.createElement("strong");
    for (let c = el.firstChild; c; c = c.nextSibling) {
      appendSanitizedNode(doc, strong, c);
    }
    parent.appendChild(strong);
    return;
  }
  if (tag === "span") {
    const span = doc.createElement("span");
    const style = (el.getAttribute("style") || "").trim();
    const nextStyle = sanitizeSpanStyle(style);
    if (nextStyle) span.setAttribute("style", nextStyle);
    for (let c = el.firstChild; c; c = c.nextSibling) {
      appendSanitizedNode(doc, span, c);
    }
    parent.appendChild(span);
    return;
  }
  // Unknown inline tag: flatten to text
  appendTextWithBreaks(doc, parent, el.textContent || "");
}

function isSafeHref(href: string): boolean {
  if (!href) return false;
  const SAFE = /^(https?:|mailto:)/i;
  return SAFE.test(href);
}

function sanitizeSpanStyle(style: string): string | undefined {
  if (!style) return undefined;
  const entries = style.split(";").map((s) => s.trim()).filter(Boolean);
  const result: string[] = [];
  for (const e of entries) {
    const [rawKey, rawVal] = e.split(":");
    if (!rawKey || !rawVal) continue;
    const key = rawKey.trim().toLowerCase();
    const val = rawVal.trim();
    if (key === "color" && isHexColor(val)) {
      result.push(`color: ${normalizeHex(val)}`);
      continue;
    }
    if (key === "background-color" && isHexColor(val)) {
      result.push(`background-color: ${normalizeHex(val)}`);
      continue;
    }
  }
  return result.length > 0 ? result.join("; ") : undefined;
}

function isHexColor(value: string): boolean {
  const v = value.trim();
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v);
}

function normalizeHex(value: string): string {
  return value.trim().toLowerCase();
}

function isNodeEmpty(el: HTMLElement): boolean {
  // Consider empty if no meaningful text and no inline math or links/spans with text
  const text = (el.textContent || "").replace(/\u00A0/g, " ").trim();
  if (text.length > 0) return false;
  // Allow that math wrappers contain text (the LaTeX), so if present, not empty
  if (el.querySelector("span.math, pre.math, a, span[style]")) return false;
  return true;
}
