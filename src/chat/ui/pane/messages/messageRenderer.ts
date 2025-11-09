/**
 * Message DOM + renderer for chat pane.
 *
 * Purpose
 * - Build the DOM subtree for a single message bubble (assistant/user)
 * - Render sanitized HTML content from Markdown + KaTeX
 * - Surface math rendering errors in-place in the bubble
 * - Wire assistant-only action buttons (Copy / Add to Notes)
 *
 * Non-goals
 * - Manage list or virtualized rendering (handled by MessageView)
 * - Business logic for copying or note creation (handled in controllers)
 */
import { getString } from "../../../../shared/locale";
import type { SessionMessage } from "../../../state/sessionStore";
import type { MessageDom, RenderOptions } from "./types";
import { createCopyIcon, createNoteIcon } from "../../utils/icons";
import { renderMessage } from "../../../render/chat/block";

/**
 * Create the immutable DOM structure for a single chat message entry.
 * The returned handles (MessageDom) are reused across updates for the same message id.
 *
 * @param doc - Target document to create elements for (pane document)
 * @param message - Initial message data used to decide role-specific UI (e.g., actions)
 * @param onCopy - Callback when the Copy button is clicked
 * @param onNote - Optional callback when the Add-to-Notes button is clicked
 * @returns DOM handles for the message entry
 */
export function createMessageDom(
  doc: Document,
  message: SessionMessage,
  onCopy: (messageId: string) => void,
  onNote?: (messageId: string) => void,
): MessageDom {
  const container = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-message"],
    attributes: { "data-message-id": message.id },
  });

  const roleLabel = ztoolkit.UI.createElement(doc, "span", {
    classList: ["zorecto-message-role"],
    properties: { hidden: true },
  });

  const content = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-message-content"] },
    container as unknown as HTMLElement,
  ) as HTMLDivElement;

  const mathError = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-message-math-error"], properties: { hidden: true } },
    container as unknown as HTMLElement,
  ) as HTMLDivElement;

  let actions: HTMLDivElement | undefined;
  let copyButton!: HTMLButtonElement;
  let noteButton!: HTMLButtonElement;

  if (message.role === "assistant") {
    actions = ztoolkit.UI.appendElement(
      { tag: "div", classList: ["zorecto-message-actions"], properties: { hidden: true } },
      container as unknown as HTMLElement,
    ) as HTMLDivElement;

    copyButton = ztoolkit.UI.appendElement(
      {
        tag: "button",
        namespace: "html",
        classList: ["zorecto-copy-button"],
        properties: {
          type: "button",
          title: getString("zorecto-copy-button"),
        } as any,
        listeners: [
          { type: "click", listener: () => onCopy(message.id) },
        ],
      },
      actions,
    ) as HTMLButtonElement;
    {
      const icon = createCopyIcon(doc);
      if (icon) copyButton!.appendChild(icon);
      else copyButton!.textContent = getString("zorecto-copy-button");
    }
    noteButton = ztoolkit.UI.appendElement(
      {
        tag: "button",
        namespace: "html",
        classList: ["zorecto-note-button"],
        properties: {
          type: "button",
          title: getString("zorecto-note-button"),
        } as any,
        listeners: [
          { type: "click", listener: () => onNote && onNote(message.id) },
        ],
      },
      actions,
    ) as HTMLButtonElement;
    {
      const icon = createNoteIcon(doc);
      if (icon) noteButton!.appendChild(icon);
      else noteButton!.textContent = getString("zorecto-note-button");
    }
  }

  // Role label is kept for potential accessibility/localization, but not shown in bubbles.
  // content/mathError/actions 已通过 UITool 挂载

  return {
    container,
    content,
    roleLabel,
    mathError,
    actions,
    copyButton,
    noteButton,
  };
}

export function renderMessageContent(
  doc: Document,
  entry: MessageDom,
  content: string,
  options?: RenderOptions,
): void {
  // Keep a plain-text copy for clipboard/notes if needed by callers.
  entry.latestContent = content;
  if (!content) {
    entry.content.replaceChildren();
    applyMathErrorState(entry, false, options?.suppressMathError);
    return;
  }

  // Convert Markdown (+ math) → sanitized DOM fragment via chat renderer.
  const result = renderMessage(content, doc);
  entry.content.replaceChildren(result.fragment);
  const hasErrorNode = Boolean(entry.content.querySelector(".math-error, .katex-error"));
  applyMathErrorState(entry, result.hasMathError && hasErrorNode, options?.suppressMathError);
}

/**
 * Show/hide the math error banner for a message entry.
 * The banner is suppressed when `suppress` is true (e.g., during streaming if desired).
 */
export function applyMathErrorState(
  entry: MessageDom,
  hasError: boolean,
  suppress?: boolean,
): void {
  const show = Boolean(hasError && !suppress);
  entry.mathError.hidden = !show;
  entry.mathError.textContent = show ? getString("zorecto-math-render-error") : "";
}
