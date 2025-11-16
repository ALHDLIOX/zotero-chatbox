/** Build welcome placeholder block with suggestion cards. */
import { getString } from "../../../../shared/locale";
import { createPlusOutlinedIcon } from "../../utils/icons";

/**
 * Create the welcome placeholder that shows preset prompt suggestions.
 * @param doc - Target document used for DOM operations
 * @param onAsk - Callback triggered when a suggestion is clicked
 */
export function buildWelcomeBlock(
  doc: Document,
  onAsk: (question: string) => void,
): HTMLElement {
  // Categories: each with a title key and 5 suggestion keys
  const categories: Array<{ titleKey: string; itemKeys: string[] }> = [
    {
      titleKey: "zorecto-suggest-cat1-title",
      itemKeys: [
        "zorecto-suggest-cat1-1",
        "zorecto-suggest-cat1-2",
        "zorecto-suggest-cat1-3",
        "zorecto-suggest-cat1-4",
        "zorecto-suggest-cat1-5",
      ],
    },
    {
      titleKey: "zorecto-suggest-cat2-title",
      itemKeys: [
        "zorecto-suggest-cat2-1",
        "zorecto-suggest-cat2-2",
        "zorecto-suggest-cat2-3",
        "zorecto-suggest-cat2-4",
        "zorecto-suggest-cat2-5",
      ],
    },
    {
      titleKey: "zorecto-suggest-cat3-title",
      itemKeys: [
        "zorecto-suggest-cat3-1",
        "zorecto-suggest-cat3-2",
        "zorecto-suggest-cat3-3",
        "zorecto-suggest-cat3-4",
        "zorecto-suggest-cat3-5",
      ],
    },
  ];

  const pickOne = (keys: string[]): string => {
    if (!keys.length) return "";
    const idx = Math.floor(Math.random() * keys.length);
    return getString(keys[idx] as any);
  };

  // Build wrapper and static headings first
  const wrap = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-welcome"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const titleEl = ztoolkit.UI.appendElement(
    {
      tag: "div",
      classList: ["zorecto-welcome-title"],
      properties: { textContent: getString("zorecto-welcome-title") },
    },
    wrap,
  ) as HTMLDivElement;
  void titleEl; // unused

  const subtitleEl = ztoolkit.UI.appendElement(
    {
      tag: "div",
      classList: ["zorecto-welcome-subtitle"],
      properties: { textContent: getString("zorecto-welcome-subtitle") },
    },
    wrap,
  ) as HTMLDivElement;
  void subtitleEl;

  const listEl = ztoolkit.UI.appendElement(
    { tag: "div", classList: ["zorecto-suggestions"] },
    wrap,
  ) as HTMLDivElement;

  // Build each card explicitly and append
  for (const cat of categories) {
    const cardEl = ztoolkit.UI.createElement(doc, "div", {
      classList: ["zorecto-card", "zorecto-suggestion"],
    }) as HTMLDivElement;

    const headerEl = ztoolkit.UI.appendElement(
      {
        tag: "div",
        classList: ["zorecto-card__header", "zorecto-suggestion__header"],
      },
      cardEl,
    ) as HTMLDivElement;

    ztoolkit.UI.appendElement(
      {
        tag: "div",
        classList: ["zorecto-card__title", "zorecto-suggestion__title"],
        properties: { textContent: getString(cat.titleKey as any) },
      },
      headerEl,
    );

    const text = pickOne(cat.itemKeys);
    const actionButton = ztoolkit.UI.appendElement(
      {
        tag: "button",
        namespace: "html",
        classList: [
          "zorecto-icon-button",
          "zorecto-card__action",
          "zorecto-suggestion__action",
        ],
        properties: { type: "button", title: "Use this prompt" },
        listeners: [
          { type: "click", listener: () => onAsk(text) },
        ],
      },
      headerEl,
    ) as HTMLButtonElement;
    const plusIcon = createPlusOutlinedIcon(doc);
    if (plusIcon) actionButton.replaceChildren(plusIcon);
    else actionButton.textContent = "+";

    ztoolkit.UI.appendElement(
      {
        tag: "div",
        classList: ["zorecto-card__text", "zorecto-suggestion__text"],
        properties: { textContent: text },
      },
      cardEl,
    );

    listEl.appendChild(cardEl);
  }

  return wrap;
}
