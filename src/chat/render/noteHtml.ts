/** Render Zotero note-compatible HTML (no KaTeX). */
import { parseMarkdownWithMath, type InlineToken } from "./markdown";

interface CiteTarget {
  attachmentID: number;
  page: number; // 1-based index in PDF
  quote?: string;
  locate?: string; // section/equation/figure, written into suffix
}

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
        appendParagraphWithCitations(doc, wrapper, block.tokens);
        break;
      }
      case "list": {
        const list = doc.createElement(block.ordered ? "ol" : "ul");
        for (const itemTokens of block.items) {
          const li = doc.createElement("li");
          appendInlineTokensTo(doc, li, itemTokens);
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
    if (token.type === "math" && token.inline === false) {
      flushP();
      const pre = doc.createElement("pre");
      pre.className = "math";
      const content = token.content || "";
      if (token.delimiter === "block-$$") {
        pre.textContent = `$$${content}$$`;
      } else if (token.delimiter === "block-\\[\\]") {
        pre.textContent = `\\[${content}\\]`;
      } else {
        appendInlineTokensTo(doc, p, [token]);
        continue;
      }
      wrapper.appendChild(pre);
      continue;
    }

    if (token.type !== "text") {
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
        appendSanitizedInlineHtml(
          doc,
          p,
          convertMarkdownLinksToHtml(text.slice(start, start + (m[0]?.length || 0))),
        );
      } else {
        flushP();
        try {
          const citationDiv = buildCitationBlock(doc, parsed);
          wrapper.appendChild(citationDiv);
        } catch (e) {
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
  } catch {}

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
  p.appendChild(span);
  div.appendChild(p);
  return div;
}

function resolveItemForAttachment(attachmentID: number): { uri: string; itemData: any } | undefined {
  try {
    const Items: any = (Zotero as any)?.Items;
    const attachment = Items?.get?.(attachmentID);
    const parent = attachment?.isAttachment?.() ? attachment.parentItem : attachment;
    if (!parent) return undefined;
    const uri = String((parent as any).getLibraryLink?.() || (parent as any).getURI?.() || "");
    const itemData = (parent as any).getField ? buildItemData(parent) : undefined;
    return { uri, itemData };
  } catch (e) {
    void e;
    return undefined;
  }
}

function buildItemData(item: any): any {
  return {
    id: String(item?.key || item?.id || ""),
    title: String(item?.getField?.("title") || ""),
    issued: undefined,
    author: undefined,
    type: undefined,
  };
}

function appendInlineTokensTo(doc: Document, parent: HTMLElement, tokens: InlineToken[]): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        appendSanitizedInlineHtml(doc, parent, convertMarkdownLinksToHtml(token.content || ""));
        break;
      }
      case "code": {
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

function convertMarkdownLinksToHtml(text: string): string {
  if (!text) return "";
  const esc = (s: string) => s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

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

  const placeholders: string[] = [];
  const PLACEHOLDER_RE = /\u0001L(\d+)\u0002/g;
  const withPlaceholders = text.replace(
    /(!?)\[([^\]]+)\]\(([^)]+)\)/g,
    (_m, bang: string, label: string, href: string) => {
      if (bang) return _m;
      const safeHref = (href || "").trim();
      const labelHtml = renderBoldSafe(label || "");
      const anchor = `<a href="${esc(safeHref)}">${labelHtml}</a>`;
      placeholders.push(anchor);
      return `\u0001L${placeholders.length - 1}\u0002`;
    },
  );

  const rendered = renderBoldSafe(withPlaceholders);
  const restored = rendered.replace(PLACEHOLDER_RE, (_m, idx: string) => {
    const i = Number(idx);
    return Number.isFinite(i) && placeholders[i] != null ? placeholders[i] : "";
  });
  return restored;
}

function appendSanitizedInlineHtml(doc: Document, parent: HTMLElement, html: string): void {
  if (!html) return appendTextWithBreaks(doc, parent, html);
  const tpl = doc.createElement("template");
  tpl.innerHTML = html;
  const frag = tpl.content;
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
    return;
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
      appendTextWithBreaks(doc, parent, el.textContent || "");
      return;
    }
    const a = doc.createElement("a");
    a.setAttribute("href", href);
    a.setAttribute("rel", "noopener noreferrer nofollow");
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
  appendTextWithBreaks(doc, parent, el.textContent || "");
}

function isSafeHref(href: string): boolean {
  if (!href) return false;
  try {
    const url = new URL(href, "https://example.com");
    return /^(https?:|mailto:)/i.test(url.protocol) || href.startsWith("mailto:");
  } catch {
    return false;
  }
}

function isNodeEmpty(el: HTMLElement): boolean {
  const text = (el.textContent || "").replace(/\s+/g, "");
  return text.length === 0;
}

function clampHeadingLevel(level: number): number {
  const n = Math.max(1, Math.min(3, Math.floor(level)));
  return n;
}
