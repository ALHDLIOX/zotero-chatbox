/** Simple status bar element factory for chat pane. */
export function createStatusBar(doc: Document, text: string): HTMLDivElement {
  const el = doc.createElement("div");
  el.className = "zorecto-status";
  el.textContent = text;
  return el as HTMLDivElement;
}

