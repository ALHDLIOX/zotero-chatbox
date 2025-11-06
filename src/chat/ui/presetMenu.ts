/** Preset menu widget for selecting chat provider/model. */
import { PRESETS, getPresetById } from "../providers";

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

export function buildPresetMenu(
  doc: Document,
  currentId: string,
  onSelect: (id: string) => void,
): PresetMenuWidget {
  const wrapper = doc.createElement("div");
  wrapper.className = "zorecto-preset-wrapper";

  const button = doc.createElement("button");
  button.className = "zorecto-preset-button";
  button.type = "button";
  button.setAttribute("aria-haspopup", "listbox");
  button.setAttribute("aria-expanded", "false");
  const labelSpan = doc.createElement("span");
  labelSpan.className = "zorecto-preset-button__label";
  button.appendChild(labelSpan);

  const menu = doc.createElement("ul");
  menu.className = "zorecto-preset-menu";
  (menu as any).hidden = true;
  menu.setAttribute("role", "listbox");

  for (const p of PRESETS) {
    const li = doc.createElement("li");
    li.className = `zorecto-preset-option${p.id === currentId ? " zorecto-preset-option--selected" : ""}`;
    li.setAttribute("role", "option");
    li.setAttribute("data-id", p.id);
    li.textContent = p.label;
    li.addEventListener("click", () => {
      setSelected(p.id);
      onSelect(p.id);
    });
    menu.appendChild(li);
  }

  function updateLabel(id: string) {
    const preset = getPresetById(id) ?? PRESETS[0];
    labelSpan.textContent = preset.label;
  }

  function setSelected(id: string) {
    const items = Array.from(menu.querySelectorAll<HTMLElement>(".zorecto-preset-option"));
    items.forEach((el: any) => {
      const match = typeof el.getAttribute === "function" && el.getAttribute("data-id") === id;
      el.classList.toggle("zorecto-preset-option--selected", Boolean(match));
    });
    updateLabel(id);
  }

  button.addEventListener("click", () => toggle());

  // keyboard support for menu
  menu.addEventListener("keydown", (e: KeyboardEvent) => {
    const items = Array.from(menu.querySelectorAll<HTMLElement>(".zorecto-preset-option"));
    const active = doc.activeElement as HTMLElement | null;
    const idx = Math.max(0, items.indexOf(active || items[0]!));
    if (e.key === "Escape") {
      close();
      button.focus();
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      const nextIdx = Math.min(items.length - 1, idx + 1);
      const next: any = items[nextIdx];
      if (next && typeof next.focus === "function") next.focus();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      const prevIdx = Math.max(0, idx - 1);
      const prev: any = items[prevIdx];
      if (prev && typeof prev.focus === "function") prev.focus();
    } else if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      const elAny: any = doc.activeElement as any;
      const id = elAny && typeof elAny.getAttribute === "function" ? elAny.getAttribute("data-id") : null;
      if (id) {
        setSelected(id);
        onSelect(id);
      }
    }
  });

  function getValue(): string {
    const sel = menu.querySelector<HTMLElement>(".zorecto-preset-option--selected");
    return sel?.getAttribute("data-id") || currentId;
  }

  function open() {
    (menu as any).hidden = false;
    button.setAttribute("aria-expanded", "true");
  }

  function close() {
    (menu as any).hidden = true;
    button.setAttribute("aria-expanded", "false");
  }

  function toggle() {
    const hidden = (menu as any).hidden === true;
    hidden ? open() : close();
  }

  updateLabel(currentId);
  wrapper.appendChild(button);
  wrapper.appendChild(menu);

  return { wrapper: wrapper as HTMLDivElement, button: button as HTMLButtonElement, menu: menu as HTMLUListElement, getValue, setValue: setSelected, open, close, toggle, updateLabel };
}
