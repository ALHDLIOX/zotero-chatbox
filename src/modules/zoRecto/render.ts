import {
  type InlineToken,
  type MarkdownBlock,
  parseMarkdownWithMath,
} from "./markdown";
import { renderMath } from "./math";
import { sanitizeFragment, sanitizeHtml } from "./sanitize";

export interface RenderResult {
  fragment: DocumentFragment;
  html: string;
  hasMathError: boolean;
}

export function renderMessage(
  content: string,
  doc: Document,
): RenderResult {
  const { blocks } = parseMarkdownWithMath(content);
  const fragment = doc.createDocumentFragment();
  let hasMathError = false;

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        if (block.tokens.length === 0) {
          break;
        }
        const paragraph = doc.createElement("p");
        if (appendInlineTokens(doc, paragraph, block.tokens)) {
          hasMathError = true;
        }
        fragment.appendChild(paragraph);
        break;
      }
      case "heading": {
        const level = Math.min(Math.max(block.level, 1), 6);
        const heading = doc.createElement(`h${level}`) as HTMLElement;
        if (appendInlineTokens(doc, heading, block.tokens)) {
          hasMathError = true;
        }
        fragment.appendChild(heading);
        break;
      }
      case "list": {
        const list = doc.createElement(block.ordered ? "ol" : "ul");
        for (const itemTokens of block.items) {
          const listItem = doc.createElement("li");
          if (appendInlineTokens(doc, listItem, itemTokens)) {
            hasMathError = true;
          }
          list.appendChild(listItem);
        }
        fragment.appendChild(list);
        break;
      }
      case "table": {
        const table = doc.createElement("table");
        table.className = "zorecto-table";
        const thead = doc.createElement("thead");
        const headTr = doc.createElement("tr");
        for (let i = 0; i < block.header.length; i++) {
          const th = doc.createElement("th");
          th.style.textAlign = block.aligns[i] || "left";
          if (appendInlineTokens(doc, th, block.header[i])) {
            hasMathError = true;
          }
          headTr.appendChild(th);
        }
        thead.appendChild(headTr);
        table.appendChild(thead);

        const tbody = doc.createElement("tbody");
        for (const row of block.rows) {
          const tr = doc.createElement("tr");
          for (let i = 0; i < row.length; i++) {
            const td = doc.createElement("td");
            td.style.textAlign = block.aligns[i] || "left";
            if (appendInlineTokens(doc, td, row[i])) {
              hasMathError = true;
            }
            tr.appendChild(td);
          }
          tbody.appendChild(tr);
        }
        table.appendChild(tbody);
        fragment.appendChild(table);
        break;
      }
      case "code": {
        const pre = doc.createElement("pre");
        const code = doc.createElement("code");
        if (block.info) {
          code.setAttribute("data-language", block.info);
        }
        code.textContent = block.content;
        pre.appendChild(code);
        fragment.appendChild(pre);
        break;
      }
      case "math": {
        const container = block.token.inline
          ? doc.createElement("span")
          : doc.createElement("div");
        container.classList.add(
          block.token.inline ? "math-inline" : "math-block",
        );
        const result = renderMath(block.token.content, {
          displayMode: !block.token.inline,
        });
        if (result.error) {
          hasMathError = true;
          container.classList.add("math-error");
          container.textContent = block.token.content;
        } else if (result.html) {
          const mathFragment = sanitizeHtml(doc, result.html);
          container.appendChild(mathFragment);
        }
        fragment.appendChild(container);
        break;
      }
    }
  }

  const cleaned = sanitizeFragment(fragment.cloneNode(true) as DocumentFragment);
  const wrapper = doc.createElement("div");
  wrapper.appendChild(cleaned.cloneNode(true));

  const htmlOutput = String(wrapper.innerHTML);

  return {
    fragment: cleaned,
    html: htmlOutput,
    hasMathError,
  };
}

function appendInlineTokens(
  doc: Document,
  target: HTMLElement,
  tokens: InlineToken[],
): boolean {
  let hasMathError = false;

  for (const token of tokens) {
    switch (token.type) {
      case "text": {
        const html = transformInlineText(token.content);
        if (!html) {
          break;
        }
        const fragment = sanitizeHtml(doc, html, { treatAsInline: true });
        target.appendChild(fragment);
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
        const result = renderMath(token.content, {
          displayMode: !token.inline,
        });
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
  if (!text) {
    return "";
  }

  let html = escapeHtml(text);
  html = html.replace(/\n/g, "<br />");
  html = html.replace(/(\*\*|__)(.+?)\1/g, "<strong>$2</strong>");
  html = html.replace(/(\*|_)(.+?)\1/g, "<em>$2</em>");
  html = html.replace(
    /\[([^\]]+)\]\(([^)]+)\)/g,
    (match, label: string, href: string) => {
      const cleanHref = href.trim();
      if (/^(https?:|mailto:)/i.test(cleanHref)) {
        return `<a href="${escapeAttribute(cleanHref)}" target="_blank" rel="noopener noreferrer">${escapeHtml(
          label,
        )}</a>`;
      }
      return escapeHtml(label);
    },
  );
  return html;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeAttribute(value: string): string {
  return value.replace(/"/g, "&quot;");
}
