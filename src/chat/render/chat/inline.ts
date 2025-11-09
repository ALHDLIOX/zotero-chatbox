/** Chat inline renderer: tokens → DOM nodes (with KaTeX + sanitizer).
 *
 * Adds support for CiteToken produced by markdown parser: renders numeric badges
 * for each citation and records navigation targets for later handlers.
 */
import { renderMathNode } from "../shared/mathKatex";
import { sanitizeHtml, SANITIZER_PRESET } from "../shared/sanitizer";
import type { InlineToken } from "../shared/parsing/markdown";
import { formatInlineHtml } from "../shared/inlineFormat";
import { getString } from "../../../shared/locale";
import { setCitationTarget } from "./citationTargets";

export interface ChatInlineRenderContext { citationSerial: number; logged?: Set<string> }

export function appendInlineTokens(
  doc: Document,
  target: HTMLElement,
  tokens: InlineToken[],
  ctx?: ChatInlineRenderContext,
): boolean {
  let hasMathError = false;
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const html = formatInlineHtml(token.content);
        if (html) {
          const fragment = sanitizeHtml(doc, html, SANITIZER_PRESET, { treatAsInline: true });
          target.appendChild(fragment);
        }
        break;
      }
      case "cite": {
        const group = doc.createElement("span");
        group.className = "zorecto-citations";
        const cites = (token as any).cites as Array<{ attachmentID: number; page: number; quote?: string; locate?: string }>;
        // Removed verbose logging for detected [-[cite]-] markers per request
        for (const c of cites) {
          const ref = doc.createElement("span");
          ref.className = "zorecto-cite-ref";
          ref.setAttribute("role", "button");
          ref.setAttribute("tabindex", "0");
          const pageNum = Number(c.page) || 1;
          try {
            ref.setAttribute("aria-label", getString("zorecto-citation-aria", { args: { page: pageNum } } as any));
          } catch {}
          const title = c && typeof c.locate === "string" && c.locate.trim()
            ? `page ${pageNum} · ${String(c.locate).trim()}`
            : `page ${pageNum}`;
          ref.setAttribute("title", title);
          const serial = ctx ? ctx.citationSerial++ : 0;
          ref.textContent = String(serial || 1);
          setCitationTarget(ref, {
            attachmentID: Number(c.attachmentID),
            page: Number(c.page),
            quote: typeof c.quote === "string" ? c.quote : undefined,
            locate: typeof c.locate === "string" ? c.locate : undefined,
          });
          group.appendChild(ref);
        }
        target.appendChild(group);
        break;
      }
      case "code": {
        const code = doc.createElement("code");
        code.textContent = token.content;
        target.appendChild(code);
        break;
      }
      case "math": {
        const { node, hasError } = renderMathNode(doc, token.content, !!token.inline);
        if (hasError) hasMathError = true;
        target.appendChild(node);
        break;
      }
    }
  }
  return hasMathError;
}
