/** Render chat message Markdown to sanitized HTML and fragments. */
import { parseMarkdownWithMath } from "./markdown";
import { sanitizeFragment, sanitizeHtml } from "./chatInlineSanitizer";
import { renderBlocks } from "./chatBlocks";

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

// inline rendering moved to chatInline.ts
