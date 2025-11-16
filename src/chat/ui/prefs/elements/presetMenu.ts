/**
 * Preferences preset menu widget for selecting provider/model presets.
 *
 * Purpose: Build and manage the dropdown menu used on the preferences page.
 * Dependencies: ztoolkit.UI for DOM creation and Ant-like chevron icon helper.
 * Invariants: Stateless beyond DOM mutations; selection is driven by controller.
 */
import { config } from "../../../../../package.json";
import type { ProviderPreset } from "../../../providers";
import { createDownOutlinedIcon } from "../../utils/icons";

/** Element handles used by the preference preset menu. */
export interface PrefPresetMenuWidget {
  wrapper: HTMLDivElement;
  button: HTMLButtonElement;
  label: HTMLSpanElement;
  list: HTMLUListElement;
}

/** DOM element ids used by the preferences preset menu. */
export const ELEMENT_IDS = {
  presetRoot: `zotero-prefpane-${config.addonRef}-preset-root`,
  presetButton: `zotero-prefpane-${config.addonRef}-preset-button`,
} as const;

/**
 * Build the preset dropdown widget for the preferences page.
 * @param doc Host document used for DOM operations.
 * @param root Root element inside which the menu will be rendered.
 */
export function buildPrefPresetMenu(
  doc: Document,
  root: HTMLElement,
): PrefPresetMenuWidget {
  const wrapper = ztoolkit.UI.appendElement(
    {
      tag: "div",
      classList: ["zorecto-menu"],
    },
    root,
  ) as HTMLDivElement;

  const button = ztoolkit.UI.appendElement(
    {
      tag: "button",
      namespace: "html",
      classList: ["zorecto-menu__button"],
      attributes: {
        type: "button",
        id: ELEMENT_IDS.presetButton,
        "aria-haspopup": "listbox",
        "aria-expanded": "false",
      },
    },
    wrapper,
  ) as HTMLButtonElement;

  const label = ztoolkit.UI.appendElement(
    {
      tag: "span",
      classList: ["zorecto-menu__label"],
    },
    button,
  ) as HTMLSpanElement;

  const iconWrap = ztoolkit.UI.appendElement(
    {
      tag: "span",
      classList: ["zorecto-menu__icon"],
    },
    button,
  ) as HTMLSpanElement;
  const chevron = createDownOutlinedIcon(doc);
  if (chevron) {
    iconWrap.appendChild(chevron);
  }

  const list = ztoolkit.UI.appendElement(
    {
      tag: "ul",
      classList: ["zorecto-menu__list"],
      attributes: { role: "listbox" },
      properties: { hidden: true },
    },
    wrapper,
  ) as HTMLUListElement;

  return { wrapper, button, label, list };
}

/**
 * Populate the preset menu options from provided presets and wire selection callback.
 * @param doc Host document containing the preferences view.
 * @param widget Preset menu widget to populate.
 * @param presets Available provider presets.
 * @param onSelect Callback executed when a preset is selected.
 */
export function renderPresetOptions(
  doc: Document,
  widget: PrefPresetMenuWidget,
  presets: ProviderPreset[],
  onSelect: (id: string) => void,
): void {
  const l10n = (doc as any).l10n;
  const { wrapper, button, list } = widget;

  list.textContent = "";

  const outsideClickHandler = (ev: Event) => {
    try {
      const path = (ev as any)?.composedPath?.();
      const targetNode = ev.target as Node | null;
      if (Array.isArray(path)) {
        if (path.includes(wrapper)) return;
      } else if (targetNode && wrapper.contains(targetNode)) {
        return;
      }
    } catch {
      // fall through to close
    }
    list.hidden = true;
    button.setAttribute("aria-expanded", "false");
    doc.removeEventListener("mousedown", outsideClickHandler, true);
    doc.removeEventListener("pointerdown", outsideClickHandler, true);
  };

  const openMenu = () => {
    if (!list.hidden) return;
    list.hidden = false;
    button.setAttribute("aria-expanded", "true");
    doc.addEventListener("mousedown", outsideClickHandler, true);
    doc.addEventListener("pointerdown", outsideClickHandler, true);
  };

  const closeMenu = () => {
    if (list.hidden) return;
    list.hidden = true;
    button.setAttribute("aria-expanded", "false");
    doc.removeEventListener("mousedown", outsideClickHandler, true);
    doc.removeEventListener("pointerdown", outsideClickHandler, true);
  };

  button.addEventListener("click", () => {
    if (list.hidden) {
      openMenu();
    } else {
      closeMenu();
    }
  });

  for (const preset of presets) {
    const opt = ztoolkit.UI.appendElement(
      {
        tag: "li",
        classList: ["zorecto-menu__option"],
        attributes: { role: "option", "data-id": preset.id },
        properties: { textContent: preset.label } as any,
        listeners: [
          {
            type: "click",
            listener: () => {
              onSelect(preset.id);
              closeMenu();
              try {
                button.focus();
              } catch {
                // ignore focus failures
              }
            },
          },
        ],
      },
      list,
    ) as HTMLLIElement;
    try {
      l10n?.setAttributes?.(opt, preset.labelKey);
    } catch {
      // ignore localization failures
    }
  }
}

/**
 * Sync preset menu view with the selected preset.
 * @param doc Host document containing localization helpers.
 * @param widget Preset menu widget to update.
 * @param preset Selected preset object.
 */
export function fillPresetMenu(
  doc: Document,
  widget: PrefPresetMenuWidget,
  preset: ProviderPreset,
): void {
  const l10n = (doc as any).l10n;
  const { label, list } = widget;

  label.textContent = preset.label;
  try {
    l10n?.setAttributes?.(label as any, preset.labelKey);
  } catch {
    // ignore localization failures
  }

  const items = list.querySelectorAll<HTMLElement>(".zorecto-menu__option");
  items.forEach((el: HTMLElement) => {
    const isSelected = el.getAttribute("data-id") === preset.id;
    el.classList.toggle("zorecto-menu__option--selected", isSelected);
    if (isSelected) {
      el.setAttribute("aria-selected", "true");
    } else {
      el.removeAttribute("aria-selected");
    }
  });
}

