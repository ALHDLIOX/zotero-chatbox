/** Render chat message Markdown to sanitized HTML and fragments. */
import { parseMarkdownWithMath } from "../shared/markdown";
import { sanitizeFragment, sanitizeHtml } from "./sanitizer";
import { renderBlocks } from "./blocks";

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
  const { fragment, hasMathError } = renderBlocks(doc, blocks);

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

// inline rendering moved to chat/inline.ts
