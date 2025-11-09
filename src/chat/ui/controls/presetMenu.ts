/** Preset menu widget for selecting chat provider/model. */
import { PRESETS, getPresetById } from "../../providers";
import { createDownOutlinedIcon } from "../utils/icons";

/** Element handles and helpers for the preset dropdown. */
export interface PresetMenuWidget {
  wrapper: HTMLDivElement;
  button: HTMLButtonElement;
  menu: HTMLUListElement;
  getValue(): string;
  setValue(id: string): void;
  open(): void;
  close(): void;
  toggle(): void;
  updateLabel(id: string): void;
}

/**
 * Build the preset dropdown widget used in the toolbar.
 * @param doc - Pane document used for DOM operations
 * @param currentId - Currently selected preset id
 * @param onSelect - Callback triggered when a preset is chosen
 */
export function buildPresetMenu(
  doc: Document,
  currentId: string,
  onSelect: (id: string) => void,
): PresetMenuWidget {
  const wrapper = ztoolkit.UI.createElement(doc, "div", {
    classList: ["zorecto-preset-wrapper"],
    enableElementRecord: true,
  }) as HTMLDivElement;

  const button = ztoolkit.UI.createElement(doc, "button", {
    classList: ["zorecto-preset-button"],
    properties: { type: "button" },
    attributes: { "aria-haspopup": "listbox", "aria-expanded": "false" },
    listeners: [
      {
        type: "click",
        listener: () => toggle(),
      },
    ],
  }) as HTMLButtonElement;
  const labelSpan = ztoolkit.UI.appendElement(
    { tag: "span", classList: ["zorecto-preset-button__label"] },
    button,
  ) as HTMLSpanElement;
  const iconWrap = ztoolkit.UI.appendElement(
    { tag: "span", classList: ["zorecto-preset-button__icon"] },
    button,
  ) as HTMLSpanElement;
  const chevron = createDownOutlinedIcon(doc);
  if (chevron) iconWrap.appendChild(chevron);

  let menu!: HTMLUListElement;

  const outsideClickHandler = (ev: Event) => {
    try {
      const path = (ev as any)?.composedPath?.();
      const targetNode = ev.target as Node | null;
      if (Array.isArray(path)) {
        if (path.includes(wrapper)) return;
      } else if (targetNode && wrapper.contains(targetNode)) {
        return;
      }
      close();
    } catch {
      close();
    }
  };

  const onMenuKeyDown = (e: KeyboardEvent) => {
    const items = Array.from(
      menu.querySelectorAll(".zorecto-preset-option"),
    ) as HTMLElement[];
    const active = doc.activeElement as HTMLElement | null;
    const idx = Math.max(0, items.indexOf(active || items[0]!));
    if (e.key === "Escape") {
      close();
      button.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const next = items[Math.min(items.length - 1, idx + 1)];
      if (next) next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prev = items[Math.max(0, idx - 1)];
      if (prev) prev.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const targetId = active?.getAttribute?.("data-id");
      if (targetId) {
        setSelected(targetId);
        onSelect(targetId);
        close();
        button.focus();
      }
    }
  };

  menu = ztoolkit.UI.createElement(doc, "ul", {
    classList: ["zorecto-preset-menu"],
    properties: { hidden: true },
    attributes: { role: "listbox" },
    enableElementRecord: true,
    listeners: [
      {
        type: "keydown",
        listener: onMenuKeyDown,
      },
    ],
  }) as HTMLUListElement;

  for (const preset of PRESETS) {
    ztoolkit.UI.appendElement(
      {
        tag: "li",
        classList: [
          "zorecto-preset-option",
          ...(preset.id === currentId ? ["zorecto-preset-option--selected"] : []),
        ],
        properties: { textContent: preset.label },
        attributes: { role: "option", "data-id": preset.id },
        listeners: [
          {
            type: "click",
            listener: () => {
              setSelected(preset.id);
              onSelect(preset.id);
              close();
              try { button.focus(); } catch {}
            },
          },
        ],
      },
      menu,
    );
  }

  function updateLabel(id: string) {
    const preset = getPresetById(id) ?? PRESETS[0];
    labelSpan.textContent = preset.label;
  }

  function setSelected(id: string) {
    const items = Array.from(
      menu.querySelectorAll(".zorecto-preset-option"),
    ) as HTMLElement[];
    items.forEach((el) => {
      const match = el.getAttribute("data-id") === id;
      el.classList.toggle("zorecto-preset-option--selected", match);
    });
    updateLabel(id);
  }

  function getValue(): string {
    const selected = menu.querySelector<HTMLElement>(".zorecto-preset-option--selected");
    return selected?.getAttribute("data-id") || currentId;
  }

  function open() {
    menu.hidden = false;
    button.setAttribute("aria-expanded", "true");
    doc.addEventListener("mousedown", outsideClickHandler, true);
    doc.addEventListener("pointerdown", outsideClickHandler, true);
  }

  function close() {
    menu.hidden = true;
    button.setAttribute("aria-expanded", "false");
    doc.removeEventListener("mousedown", outsideClickHandler, true);
    doc.removeEventListener("pointerdown", outsideClickHandler, true);
  }

  function toggle() {
    if (menu.hidden) open();
    else close();
  }

  updateLabel(currentId);
  wrapper.append(button, menu);

  return {
    wrapper,
    button,
    menu,
    getValue,
    setValue: setSelected,
    open,
    close,
    toggle,
    updateLabel,
  };
}
