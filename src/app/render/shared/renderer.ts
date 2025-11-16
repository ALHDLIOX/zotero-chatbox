/**
 * Shared block-level renderer core.
 *
 * Purpose: Provide common rendering for parsed Markdown blocks while deferring
 * chat/note specific details (inline formatting, math rendering) to a pluggable
 * RenderStrategy.
 *
 * Dependencies: Consumes token/AST types from ./parsing/markdown only.
 *
 * Invariants: Rendering should not emit empty elements; math errors bubble up
 * as a boolean flag so callers can surface warnings.
 */
import type { InlineToken, MarkdownBlock, MathBlock } from "./parsing/markdown";

/**
 * Strategy hooks that adapt shared rendering for different surfaces
 * (e.g., Chat vs. Note panes).
 */
export interface RenderStrategy {
  /**
   * Append inline tokens to the given parent element.
   * Return true to indicate a math rendering error was encountered.
   */
  appendInline(doc: Document, parent: HTMLElement, tokens: InlineToken[]): boolean;
  /**
   * Render a paragraph into one or more nodes (e.g., paragraphs and citation blocks).
   */
  renderParagraph(doc: Document, tokens: InlineToken[]): { nodes: Node[]; hasMathError: boolean };
  /**
   * Render a math block token into a single node, reporting whether rendering failed.
   */
  renderMathBlock(doc: Document, token: MathBlock["token"]): { node: HTMLElement; hasError: boolean };
}

/**
 * Render a sequence of Markdown blocks into a document fragment using the
 * provided strategy.
 *
 * @param doc Target document used to create nodes.
 * @param blocks Parsed Markdown blocks to render.
 * @param strategy Strategy implementation for inline/math rendering.
 * @returns A fragment containing rendered nodes and a math-error flag.
 */
export function renderBlocksShared(
  doc: Document,
  blocks: MarkdownBlock[],
  strategy: RenderStrategy,
): { fragment: DocumentFragment; hasMathError: boolean } {
  const fragment = doc.createDocumentFragment();
  let hasMathError = false;
  const appendInline: (doc: Document, el: HTMLElement, tokens: InlineToken[]) => boolean | void =
    (d, el, toks) => strategy.appendInline(d, el, toks);
  for (const block of blocks) {
    switch (block.type) {
      case "heading": {
        const { element, hasMathError: err } = renderHeadingBlock(doc, (block as any).level, (block as any).tokens, appendInline);
        if (err) hasMathError = true;
        if (element) fragment.appendChild(element);
        break;
      }
      case "list": {
        const { element, hasMathError: err } = renderListBlock(doc, (block as any).ordered, (block as any).items, appendInline);
        if (err) hasMathError = true;
        if (element) fragment.appendChild(element);
        break;
      }
      case "code": {
        const pre = renderCodeBlock(doc, (block as any).content || "");
        if (pre) fragment.appendChild(pre);
        break;
      }
      case "math": {
        const { node, hasError } = strategy.renderMathBlock(doc, (block as any).token);
        if (hasError) hasMathError = true;
        fragment.appendChild(node);
        break;
      }
      case "paragraph": {
        const { nodes, hasMathError: err } = strategy.renderParagraph(doc, (block as any).tokens);
        if (err) hasMathError = true;
        for (const n of nodes) {
          if ((n as any).nodeType === 1 && isNodeEmpty(n as HTMLElement)) continue;
          fragment.appendChild(n);
        }
        break;
      }
      case "table": {
        // Table rendering is not currently supported in shared renderer.
        break;
      }
    }
  }
  return { fragment, hasMathError };
}

function renderHeadingBlock(
  doc: Document,
  level: number,
  tokens: InlineToken[],
  appendInline: (doc: Document, el: HTMLElement, tokens: InlineToken[]) => boolean | void,
): { element: HTMLElement | null; hasMathError: boolean } {
  const hlevel = clampHeadingLevel(level, 3);
  const h = doc.createElement(`h${hlevel}`);
  const res = appendInline(doc, h, tokens);
  const hasMathError = res === true;
  if (isNodeEmpty(h)) return { element: null, hasMathError };
  return { element: h, hasMathError };
}

function renderListBlock(
  doc: Document,
  ordered: boolean,
  items: InlineToken[][],
  appendInline: (doc: Document, el: HTMLElement, tokens: InlineToken[]) => boolean | void,
): { element: HTMLElement | null; hasMathError: boolean } {
  const list = doc.createElement(ordered ? "ol" : "ul");
  let hasMathError = false;
  for (const itemTokens of items) {
    const li = doc.createElement("li");
    const res = appendInline(doc, li, itemTokens);
    if (res === true) hasMathError = true;
    if (!isNodeEmpty(li)) list.appendChild(li);
  }
  if (list.children.length === 0) return { element: null, hasMathError };
  return { element: list, hasMathError };
}

function renderCodeBlock(doc: Document, content: string): HTMLElement | null {
  const pre = doc.createElement("pre");
  pre.textContent = content || "";
  if (isNodeEmpty(pre)) return null;
  return pre;
}

export function isNodeEmpty(el: HTMLElement): boolean {
  // Treat citation containers as non-empty even if they have no text content.
  // This preserves note citation blocks which carry data via attributes.
  try {
    if ((el as any).hasAttribute && el.hasAttribute("data-citation-items")) return false;
    if ((el as any).querySelector && el.querySelector('[data-citation-items]')) return false;
  } catch {}
  const text = (el.textContent || "").replace(/\s+/g, "");
  return text.length === 0;
}

function clampHeadingLevel(level: number, max: number = 3): number {
  const n = Math.floor(level);
  return Math.max(1, Math.min(max, n));
}
