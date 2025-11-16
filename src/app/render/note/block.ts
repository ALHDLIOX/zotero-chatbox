/**
 * Note renderer built on shared block renderer with note strategy.
 *
 * Produces Zotero note-compatible HTML: data-citation blocks, inline math as
 * text markers, and no KaTeX.
 */
import { parseMarkdownWithMath, type InlineToken } from "../shared/parsing/markdown";
import { renderBlocksShared, type RenderStrategy, isNodeEmpty } from "../shared/renderer";
import type { CitationTarget } from "../shared/parsing/cite";
import { appendInlineTokensTo } from "./inline";

const noteStrategy: RenderStrategy = {
  appendInline(doc, parent, tokens) {
    // Handle inline tokens; render cite tokens as inline citation spans
    // so they appear on the same line as surrounding text.
    for (const t of tokens) {
      if ((t as any).type === "cite") {
        const cites = (t as any).cites as CitationTarget[];
        if (Array.isArray(cites) && cites.length > 0) {
          const span = buildInlineCitationSpan(doc, cites);
          parent.appendChild(span);
        }
        continue;
      }
      appendInlineTokensTo(doc, parent, [t]);
    }
    return false;
  },
  renderParagraph(doc, tokens) {
    const nodes: Node[] = [];
    let p = doc.createElement("p");
    const flush = () => { if (!isNodeEmpty(p)) nodes.push(p); p = doc.createElement("p"); };

    for (const token of tokens) {
      if (token.type === "math" && token.inline === false) {
        flush();
        const pre = doc.createElement("pre");
        pre.className = "math";
        const content = token.content || "";
        pre.textContent = token.delimiter === "block-$$" ? `$$${content}$$` : `\\[${content}\\]`;
        nodes.push(pre);
        continue;
      }
      if (token.type === "cite") {
        const cites = (token as any).cites as CitationTarget[];
        if (Array.isArray(cites) && cites.length > 0) {
          const span = buildInlineCitationSpan(doc, cites);
          p.appendChild(span);
        }
        continue;
      }
      appendInlineTokensTo(doc, p, [token]);
    }
    if (!isNodeEmpty(p)) nodes.push(p);
    return { nodes, hasMathError: false };
  },
  renderMathBlock(doc, token) {
    const pre = doc.createElement("pre");
    pre.className = "math";
    pre.textContent = `$$${token.content}$$`;
    return { node: pre, hasError: false };
  },
};

export function renderNoteHtml(markdown: string, doc: Document): string {
  const { blocks } = parseMarkdownWithMath(markdown || "");
  const { fragment } = renderBlocksShared(doc, blocks, noteStrategy);
  const wrapper = doc.createElement("div");
  wrapper.setAttribute("data-schema-version", "9");
  wrapper.appendChild(fragment);
  return String(wrapper.outerHTML);
}

function buildInlineCitationSpan(doc: Document, cites: CitationTarget[]): HTMLSpanElement {
  const itemsPayload: Array<{ uris: string[]; itemData: any }> = [];
  const citationItems: Array<{ uris: string[]; prefix?: string; suffix?: string; 'suppress-author': boolean; locator?: string; label?: string; }>
    = [];
  for (const c of cites) {
    const resolved = resolveItemForAttachment(c.attachmentID);
    if (!resolved) continue;
    const { uri, itemData } = resolved;
    itemsPayload.push({ uris: [uri], itemData });
    const locatorStr = typeof c.page === "number" && Number.isFinite(c.page) ? String(c.page) : undefined;
    citationItems.push({ uris: [uri], 'suppress-author': true, locator: locatorStr, label: "page", suffix: c.locate && String(c.locate).trim() ? String(c.locate).trim() : undefined });
  }
  const span = doc.createElement("span");
  span.className = "citation";
  try { span.setAttribute("data-citation-items", encodeURIComponent(JSON.stringify(itemsPayload))); } catch { span.setAttribute("data-citation-items", ""); }
  try { span.setAttribute("data-citation", encodeURIComponent(JSON.stringify({ citationItems, properties: {} as Record<string, unknown> }))); } catch { span.setAttribute("data-citation", ""); }
  return span;
}

function buildCitationBlock(doc: Document, cites: CitationTarget[]): HTMLDivElement {
  const itemsPayload: Array<{ uris: string[]; itemData: any }> = [];
  const citationItems: Array<{ uris: string[]; prefix?: string; suffix?: string; 'suppress-author': boolean; locator?: string; label?: string; }>
    = [];
  for (const c of cites) {
    const resolved = resolveItemForAttachment(c.attachmentID);
    if (!resolved) continue;
    const { uri, itemData } = resolved;
    itemsPayload.push({ uris: [uri], itemData });
    const locatorStr = typeof c.page === "number" && Number.isFinite(c.page) ? String(c.page) : undefined;
    citationItems.push({ uris: [uri], 'suppress-author': true, locator: locatorStr, label: "page", suffix: c.locate && String(c.locate).trim() ? String(c.locate).trim() : undefined });
  }
  const div = doc.createElement("div");
  try { div.setAttribute("data-citation-items", encodeURIComponent(JSON.stringify(itemsPayload))); } catch { div.setAttribute("data-citation-items", ""); }
  const p = doc.createElement("p");
  const span = doc.createElement("span");
  span.className = "citation";
  try { span.setAttribute("data-citation", encodeURIComponent(JSON.stringify({ citationItems, properties: {} as Record<string, unknown> }))); } catch { span.setAttribute("data-citation", ""); }
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
    const URI: any = (Zotero as any)?.URI;
    let uri = "";
    try { if (URI && typeof URI.getItemURI === "function") uri = String(URI.getItemURI(parent) || ""); } catch {}
    if (!uri) { try { uri = String((parent as any).getURI?.() || ""); } catch { uri = ""; } }
    if (!uri) {
      try {
        const libId = (parent as any).libraryID;
        const key = (parent as any).key;
        if (libId != null && key) uri = `http://zotero.org/users/local/${String(libId)}/items/${String(key)}`;
      } catch { uri = ""; }
    }
    const itemData = (parent as any).getField ? buildItemData(parent) : undefined;
    if (!uri) return undefined;
    return { uri, itemData };
  } catch {
    return undefined;
  }
}

function buildItemData(item: any): any {
  return { id: String(item?.key || item?.id || ""), title: String(item?.getField?.("title") || ""), issued: undefined, author: undefined, type: undefined };
}

// isNodeEmpty imported from shared renderer
