/** Chat block renderer: blocks → DOM fragment (uses chatInline). */
import type { MarkdownBlock } from "../shared/markdown";
import { appendInlineTokens } from "./inline";
import { renderMath } from "../shared/mathKatex";
import { sanitizeHtml } from "./sanitizer";

export function renderBlocks(
  doc: Document,
  blocks: MarkdownBlock[],
): { fragment: DocumentFragment; hasMathError: boolean } {
  const fragment = doc.createDocumentFragment();
  let hasMathError = false;

  for (const block of blocks) {
    switch (block.type) {
      case "paragraph": {
        if (block.tokens.length === 0) break;
        const p = doc.createElement("p");
        if (appendInlineTokens(doc, p, block.tokens)) hasMathError = true;
        fragment.appendChild(p);
        break;
      }
      case "heading": {
        const level = Math.min(Math.max(block.level, 1), 6);
        const h = doc.createElement(`h${level}`);
        if (appendInlineTokens(doc, h as HTMLElement, block.tokens)) hasMathError = true;
        fragment.appendChild(h);
        break;
      }
      case "list": {
        const list = doc.createElement(block.ordered ? "ol" : "ul");
        for (const itemTokens of block.items) {
          const li = doc.createElement("li");
          if (appendInlineTokens(doc, li, itemTokens)) hasMathError = true;
          list.appendChild(li);
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
          if (appendInlineTokens(doc, th as HTMLElement, block.header[i])) hasMathError = true;
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
            if (appendInlineTokens(doc, td as HTMLElement, row[i])) hasMathError = true;
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
        if (block.info) code.setAttribute("data-language", block.info);
        code.textContent = block.content;
        pre.appendChild(code);
        fragment.appendChild(pre);
        break;
      }
      case "math": {
        const container = block.token.inline ? doc.createElement("span") : doc.createElement("div");
        container.classList.add(block.token.inline ? "math-inline" : "math-block");
        const result = renderMath(block.token.content, { displayMode: !block.token.inline });
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

  return { fragment, hasMathError };
}
