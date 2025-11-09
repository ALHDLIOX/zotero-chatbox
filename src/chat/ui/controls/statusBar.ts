import type { TagElementProps } from "zotero-plugin-toolkit";

/** Status bar element factory for the chat pane toolbar area. */
export function createStatusBar(doc: Document, text: string): HTMLDivElement {
  const props = createStatusBarProps(text);
  const el = ztoolkit.UI.createElement(doc, "div", {
    classList: props.classList,
    properties: props.properties,
    enableElementRecord: props.enableElementRecord,
  });
  return el as HTMLDivElement;
}

/**
 * Build the ztoolkit element descriptor for a status bar node.
 * @param text - Status text to display
 */
export function createStatusBarProps(text: string): TagElementProps {
  return {
    tag: "div",
    classList: ["zorecto-status"],
    properties: { textContent: text },
    enableElementRecord: true,
  };
}
