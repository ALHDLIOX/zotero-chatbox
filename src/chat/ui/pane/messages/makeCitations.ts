/**
 * Inline citations decorator for message content.
 *
 * Purpose
 * - Scan message content DOM for inline markers like `((cite: ...))` (ASCII or full-width parens)
 * - Replace matched text with a compact sequence of clickable numeric badges
 * - Map each badge element to a CitationTarget for navigation (via WeakMap)
 * - Hide auxiliary code blocks that embed machine-readable citation JSON
 *
 * Safety
 * - Skips code/pre, KaTeX/math nodes, and already-inserted citation wrappers
 * - Tolerates extra whitespace, NBSP/ZWSP, and minor JSON formatting deviations
 */
import { getString } from "../../../../shared/locale";
import { looksLikeCitationsJson, parseInlineCitationsArray } from "../../../render/shared";
import type { CitationTarget } from "../../../render/shared";
import type { MessageDom } from "./types";

// Badge element → navigation target mapping. WeakMap avoids leaks when DOM nodes are GC'ed.
const citationTargets = new WeakMap<HTMLElement, CitationTarget>();

/** Resolve the CitationTarget previously associated with a badge element. */
export function getCitationTarget(refEl: HTMLElement): CitationTarget | undefined {
  return citationTargets.get(refEl);
}

/**
 * Transform inline citation markers to numeric badges within the given message entry.
 *
 * @param doc - Pane document
 * @param entry - MessageDom handles (content root is used as the scan scope)
 * @param content - Latest raw text content (used only for context/logs; scanning is DOM-based)
 */
export function makeCitations(doc: Document, entry: MessageDom, content: string): void {
  const existing = entry.content.querySelectorAll(".zorecto-citations");
  for (let i = 0; i < existing.length; i++) {
    const el = existing[i] as HTMLElement;
    el.remove();
  }

  let serial = 1; // restart numbering per assistant message
  const SHOW_TEXT = (doc.defaultView as any)?.NodeFilter?.SHOW_TEXT ?? 4;
  const walker = doc.createTreeWalker(entry.content, SHOW_TEXT);
  const toReplace: Array<{ node: Text; frag: DocumentFragment }> = [];

  while (true) {
    const node = walker.nextNode() as Text | null;
    if (!node) break;
    if (shouldSkipForCitations(node)) continue;
    const text = node.nodeValue || "";
    // Be lenient: allow spaces (incl. NBSP/ZWSP) and case-insensitive "cite", support ASCII and full-width parens.
    // Allow optional spaces between the closing parentheses as well.
    const re = /(?:\(\(|（（)[\s\u00A0\u200B\u200C\u200D]*cite[\s\u00A0\u200B\u200C\u200D]*[:：][\s\u00A0\u200B\u200C\u200D]*([\s\S]*?)[\s\u00A0\u200B\u200C\u200D]*(?:\)\s*\)|）\s*）)/gi;
    let last = 0;
    let matched = false;
    const frag = doc.createDocumentFragment();
    for (const m of text.matchAll(re)) {
      matched = true;
      const start = m.index ?? 0;
      const before = text.slice(last, start);
      if (before) frag.appendChild(doc.createTextNode(before));
      const payload = m[1] || "";
      const parsed = parseInlineCitationsArray(payload);
      if (!parsed || parsed.cites.length === 0) {
        frag.appendChild(doc.createTextNode(text.slice(start, start + (m[0]?.length || 0))));
      } else {
        try {
          ztoolkit.log("[zorecto] 内联引用解析", {
            payload,
            count: parsed.cites.length,
            rawObjects: parsed.rawObjects ?? parsed.cites,
          });
        } catch {
          // no-op
        }
        const group = ztoolkit.UI.createElement(doc, "span", {
          classList: ["zorecto-citations"],
          attributes: { role: "group" },
        });
        for (const c of parsed.cites) {
          const ref = ztoolkit.UI.createElement(doc, "span", {
            classList: ["zorecto-cite-ref"],
            attributes: {
              role: "button",
              tabindex: "0",
              "aria-label": getString("zorecto-citation-aria", {
                args: { page: Number(c.page) || 1 },
              } as any),
              title:
                c && (typeof c.locate === "string" && c.locate.trim())
                  ? `page ${Number(c.page) || 1} · ${String(c.locate).trim()}`
                  : `page ${Number(c.page) || 1}`,
            },
            properties: { textContent: String(serial++) },
          });
          citationTargets.set(ref, {
            attachmentID: Number(c.attachmentID),
            page: Number(c.page),
            quote: typeof c.quote === "string" ? (c.quote as string) : undefined,
            locate: typeof c.locate === "string" ? (c.locate as string) : undefined,
          });
          group.appendChild(ref);
        }
        frag.appendChild(group);
      }
      last = start + (m[0]?.length || 0);
    }
    if (!matched) continue;
    const tail = text.slice(last);
    if (tail) frag.appendChild(doc.createTextNode(tail));
    toReplace.push({ node, frag });
  }

  for (const { node, frag } of toReplace) {
    node.parentNode?.replaceChild(frag, node);
  }

  try {
    const codes = entry.content.querySelectorAll("pre > code");
    for (let i = 0; i < codes.length; i++) {
      const code = codes[i] as HTMLElement;
      const lang = code.getAttribute("data-language")?.toLowerCase();
      const text = (code.textContent || "").trim();
      if (lang === "zotero-citations" || looksLikeCitationsJson(text)) {
        const pre = code.parentElement as HTMLElement | null;
        if (pre) pre.classList.add("zorecto-hidden");
        else code.classList.add("zorecto-hidden");
      }
    }
  } catch {
    // no-op
  }
}

/** Decide whether a text node is inside a region we must not mutate (code, pre, KaTeX, or existing citations). */
function shouldSkipForCitations(node: Text): boolean {
  let el: Node | null = node.parentNode;
  while (el && (el as any).nodeType === 1) {
    const tag = ((el as HTMLElement).tagName || "").toLowerCase();
    if (tag === "code" || tag === "pre") return true;
    const cls = (el as HTMLElement).className || "";
    if (/\b(katex|math-|zorecto-citations)\b/.test(cls)) return true;
    el = el.parentNode;
  }
  return false;
}
