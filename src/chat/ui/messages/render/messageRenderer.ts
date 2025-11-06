import { getString } from "../../../../shared/locale";
import { renderMessage } from "../../../render/chat";
import type { RenderOptions, MessageDom } from "../types";

export function renderMessageContent(
  doc: Document,
  entry: MessageDom,
  content: string,
  options?: RenderOptions,
): void {
  entry.latestContent = content;
  if (!content) {
    entry.content.replaceChildren();
    applyMathErrorState(entry, false, options?.suppressMathError);
    return;
  }

  const result = renderMessage(content, doc);
  entry.content.replaceChildren(result.fragment);
  const hasErrorNode = Boolean(entry.content.querySelector(".math-error, .katex-error"));
  applyMathErrorState(entry, result.hasMathError && hasErrorNode, options?.suppressMathError);
}

export function applyMathErrorState(
  entry: MessageDom,
  hasError: boolean,
  suppress?: boolean,
): void {
  const show = Boolean(hasError && !suppress);
  entry.mathError.hidden = !show;
  entry.mathError.textContent = show ? getString("zorecto-math-render-error") : "";
}

