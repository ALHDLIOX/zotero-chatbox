/**
 * Chat renderer built on shared block renderer with chat strategy.
 *
 * Uses KaTeX for math, inline citations as clickable badges, and the chat
 * sanitizer preset for injected HTML fragments.
 */
import { parseMarkdownWithMath, type InlineToken } from "../shared/parsing/markdown";
import { renderBlocksShared, type RenderStrategy } from "../shared/renderer";
import { renderMathNode } from "../shared/mathKatex";
import { appendInlineTokens, type ChatInlineRenderContext } from "./inline";

export interface RenderResult {
  fragment: DocumentFragment;
  html: string;
  hasMathError: boolean;
}

// Build a chat render strategy that shares a per-message inline context
// so citation numbering increases across the whole message.
function createChatStrategy(ctx: ChatInlineRenderContext): RenderStrategy {
  return {
    appendInline(doc, parent, tokens) {
      return appendInlineTokens(doc, parent, tokens, ctx);
    },
    renderParagraph(doc, tokens) {
      const p = doc.createElement("p");
      const err = this.appendInline(doc, p, tokens);
      return { nodes: [p], hasMathError: !!err };
    },
    renderMathBlock(doc, token) {
      const { node, hasError } = renderMathNode(doc, token.content, !!token.inline);
      return { node, hasError };
    },
  };
}

export function renderMessage(content: string, doc: Document): RenderResult {
  const { blocks } = parseMarkdownWithMath(content || "");
  // Single context per message to ensure citations number 1..N across the message
  const ctx: ChatInlineRenderContext = { citationSerial: 1, logged: new Set<string>() };
  const strategy = createChatStrategy(ctx);
  const { fragment, hasMathError } = renderBlocksShared(doc, blocks, strategy);
  const wrapper = doc.createElement("div");
  wrapper.appendChild(fragment.cloneNode(true));
  const html = String(wrapper.innerHTML);
  return { fragment, html, hasMathError };
}
