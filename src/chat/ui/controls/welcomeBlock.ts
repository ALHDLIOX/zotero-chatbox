/** Build welcome placeholder block with suggestion cards. */
import { getString } from "../../../shared/locale";

/**
 * Create the welcome placeholder that shows preset prompt suggestions.
 * @param doc - Target document used for DOM operations
 * @param onAsk - Callback triggered when a suggestion is clicked
 */
export function buildWelcomeBlock(
  doc: Document,
  onAsk: (question: string) => void,
): HTMLElement {
  const promptIds = [
    "zorecto-suggest-1",
    "zorecto-suggest-2",
    "zorecto-suggest-3",
  ] as const;

  const listChildren = promptIds.map((id) => {
    const label = getString(id as any);
    return {
      tag: "button",
      classList: ["zorecto-suggestion"],
      properties: { type: "button", textContent: label },
      listeners: [
        {
          type: "click",
          listener: () => onAsk(label),
        },
      ],
    } as const;
  });

  const wrap = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-welcome"],
    enableElementRecord: true,
    children: [
      {
        tag: "div",
        classList: ["zorecto-welcome-title"],
        properties: { textContent: getString("zorecto-welcome-title") },
      },
      {
        tag: "div",
        classList: ["zorecto-welcome-subtitle"],
        properties: { textContent: getString("zorecto-welcome-subtitle") },
      },
      {
        tag: "div",
        classList: ["zorecto-suggestions"],
        children: listChildren as any,
      },
    ],
  }) as HTMLDivElement;

  return wrap;
}
