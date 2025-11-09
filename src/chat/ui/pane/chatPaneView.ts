/** Chat pane view builder – constructs the static DOM skeleton used by controllers. */
/**
 * Element handles for the chat pane skeleton built by {@link buildChatPane}.
 */
export interface ChatPaneRefs {
  container: HTMLDivElement;
  dialog: HTMLDivElement;
  messages: HTMLDivElement;
  placeholder: HTMLDivElement;
  error: HTMLDivElement;
  toolbarRow: HTMLDivElement;
  inputWrapper: HTMLDivElement;
  resizeHandle: HTMLDivElement;
}

/**
 * Build the chat pane container and return the primary element handles.
 *
 * @param doc - Pane document used for DOM operations.
 * @returns References to the constructed DOM nodes.
 */
export function buildChatPane(doc: Document): ChatPaneRefs {
  const container = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-pane"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const dialog = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-dialog"] },
    container,
  ) as HTMLDivElement;

  const messages = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-messages"] },
    dialog,
  ) as HTMLDivElement;

  const placeholder = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-empty-placeholder"],
  }) as HTMLDivElement;

  const error = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-error"], properties: { hidden: true } },
    dialog,
  ) as HTMLDivElement;

  const toolbarRow = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-toolbar"] },
    dialog,
  ) as HTMLDivElement;

  const inputWrapper = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-input-wrapper"] },
    dialog,
  ) as HTMLDivElement;

  const resizeHandle = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-resize-handle"] },
    dialog,
  ) as HTMLDivElement;

  return {
    container,
    dialog,
    messages,
    placeholder,
    error,
    toolbarRow,
    inputWrapper,
    resizeHandle,
  };
}
