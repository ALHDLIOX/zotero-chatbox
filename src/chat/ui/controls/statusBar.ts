/** Status bar element factory for the chat pane toolbar area. */
export function createStatusBar(doc: Document, text: string): HTMLDivElement {
  const el = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-status"],
    properties: { textContent: text },
    enableElementRecord: true,
  });
  return el as HTMLDivElement;
}
