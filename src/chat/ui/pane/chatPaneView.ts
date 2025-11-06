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

export function buildChatPane(doc: Document): ChatPaneRefs {
  const container = doc.createElement("div") as HTMLDivElement;
  container.className = "zorecto-pane";

  const dialog = doc.createElement("div") as HTMLDivElement;
  dialog.className = "zorecto-dialog";

  const messages = doc.createElement("div") as HTMLDivElement;
  messages.className = "zorecto-messages";

  const placeholder = doc.createElement("div") as HTMLDivElement;
  placeholder.className = "zorecto-empty-placeholder";

  const error = doc.createElement("div") as HTMLDivElement;
  error.className = "zorecto-error";
  (error as any).hidden = true;

  const toolbarRow = doc.createElement("div") as HTMLDivElement;
  toolbarRow.className = "zorecto-toolbar";

  const inputWrapper = doc.createElement("div") as HTMLDivElement;
  inputWrapper.className = "zorecto-input-wrapper";

  const resizeHandle = doc.createElement("div") as HTMLDivElement;
  resizeHandle.className = "zorecto-resize-handle";

  // Compose dialog (status element is inserted by controller before these)
  dialog.appendChild(messages);
  dialog.appendChild(error);
  dialog.appendChild(toolbarRow);
  dialog.appendChild(inputWrapper);

  container.appendChild(resizeHandle);
  container.appendChild(dialog);

  return { container, dialog, messages, placeholder, error, toolbarRow, inputWrapper, resizeHandle };
}

