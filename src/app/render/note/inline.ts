/** Note inline renderer: tokens → DOM/HTML (no KaTeX). */
import type { InlineToken } from "../shared/parsing/markdown";
import { sanitizeHtml, SANITIZER_PRESET } from "../shared/sanitizer";
import { formatInlineHtml } from "../shared/inlineFormat";

export function appendInlineTokensTo(
  doc: Document,
  parent: HTMLElement,
  tokens: InlineToken[],
): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        // Use shared formatter + unified sanitizer to append inline HTML safely
        const html = formatInlineHtml(token.content || "");
        const frag = sanitizeHtml(doc, html, SANITIZER_PRESET, { treatAsInline: true });
        parent.appendChild(frag);
        break;
      }
      case "code": {
        const code = doc.createElement("code");
        code.textContent = token.content || "";
        parent.appendChild(code);
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
