/** Chat pane view builder – constructs the static DOM skeleton used by controllers. */
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
 * @param doc - Pane document used for DOM operations
 */
export function buildChatPane(doc: Document): ChatPaneRefs {
  const container = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-pane"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const dialog = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-dialog"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const messages = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-messages"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const placeholder = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-empty-placeholder"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const error = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-error"],
    properties: { hidden: true },
    enableElementRecord: true,
  }) as HTMLDivElement;

  const toolbarRow = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-toolbar"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const inputWrapper = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-input-wrapper"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const resizeHandle = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-resize-handle"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  dialog.append(messages, error, toolbarRow, inputWrapper, resizeHandle);
  container.appendChild(dialog);

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
