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
  const wrap = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-welcome"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const title = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-welcome-title"],
    properties: { textContent: getString("zorecto-welcome-title") },
  });

  const sub = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-welcome-subtitle"],
    properties: { textContent: getString("zorecto-welcome-subtitle") },
  });

  const list = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-suggestions"],
  });

  const promptIds = [
    "zorecto-suggest-1",
    "zorecto-suggest-2",
    "zorecto-suggest-3",
  ] as const;
  for (const id of promptIds) {
    const label = getString(id as any);
    const btn = ztoolkit.UI.createElement(doc, "button", {
      classList: ["zorecto-suggestion"],
      properties: { type: "button", textContent: label },
      listeners: [
        {
          type: "click",
          listener: () => onAsk(label),
        },
      ],
    }) as HTMLButtonElement;
    list.appendChild(btn);
  }

  wrap.append(title, sub, list);
  return wrap;
}
