/** Chat inline renderer: tokens → DOM nodes (with KaTeX + sanitizer). */
import { renderMath } from "../shared/mathKatex";
import { sanitizeHtml } from "./sanitizer";
import type { InlineToken } from "../shared/markdown";
import { escapeHtml, escapeAttribute } from "../shared/inlineUtils";

export function appendInlineTokens(
  doc: Document,
  target: HTMLElement,
  tokens: InlineToken[],
): boolean {
  let hasMathError = false;
  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const html = transformInlineText(token.content);
        if (html) {
          const fragment = sanitizeHtml(doc, html, { treatAsInline: true });
          target.appendChild(fragment);
        }
        break;
      }
      case "code": {
        const code = doc.createElement("code");
        code.textContent = token.content;
        target.appendChild(code);
        break;
      }
      case "math": {
        const container = token.inline
          ? doc.createElement("span")
          : doc.createElement("div");
        container.classList.add(token.inline ? "math-inline" : "math-block");
        const result = renderMath(token.content, { displayMode: !token.inline });
        if (result.error) {
          hasMathError = true;
          container.classList.add("math-error");
          container.textContent = token.content;
        } else if (result.html) {
          const mathFragment = sanitizeHtml(doc, result.html);
          container.appendChild(mathFragment);
        }
        target.appendChild(container);
        break;
      }
    }
  }
  return hasMathError;
}

function transformInlineText(text: string): string {
  if (!text) return "";
  let html = escapeHtml(text);
  html = html.replace(/\n/g, "<br />");
  html = html.replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>");
  html = html.replace(/(\*|_)(.+?)\1/g, "<em>$2</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (_match, label: string, href: string) => {
      const cleanHref = href.trim();
      if (/^(https?:|mailto:)/i.test(cleanHref)) {
        return `<a href="${escapeAttribute(cleanHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(label)}</a>`;
      }
      return escapeHtml(label);
    },
  );
  return html;
}
