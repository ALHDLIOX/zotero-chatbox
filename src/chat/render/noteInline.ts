/** Note inline renderer: tokens → DOM/HTML (no KaTeX). */
import type { InlineToken } from "./markdown";
import {
  appendSanitizedInlineHtml,
  appendTextWithBreaks,
} from "./noteInlineSanitizer";

export function appendInlineTokensTo(
  doc: Document,
  parent: HTMLElement,
  tokens: InlineToken[],
): void {
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        appendSanitizedInlineHtml(doc, parent, token.content || "");
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

