/**
 * Preferences view – query element references and perform pure DOM updates.
 *
 * Purpose: Provide a thin, stateless view layer for the preferences page.
 * It only builds element references and updates UI, without event binding,
 * persistence or network access. Controller is responsible for behavior.
 * Dependencies: ztoolkit.UI for dynamic element rendering.
 * Invariants: No side effects beyond DOM mutations on provided document.
 */
import { config } from "../../../../package.json";
import type { ProviderId, ProviderPreset } from "../../providers";
import { createDownOutlinedIcon } from "../utils/icons";
import ApiOutlinedMod from "@ant-design/icons-svg/lib/asn/ApiOutlined";
import CheckCircleFilledMod from "@ant-design/icons-svg/lib/asn/CheckCircleFilled";

const ApiOutlinedIcon = (ApiOutlinedMod as any).default ?? ApiOutlinedMod;
const CheckCircleFilledIcon = (CheckCircleFilledMod as any).default ?? CheckCircleFilledMod;

interface PrefPresetMenuWidget {
  wrapper: HTMLDivElement;
  button: HTMLButtonElement;
  label: HTMLSpanElement;
  list: HTMLUListElement;
}

/** Element handles used by the preferences controller. */
export interface PrefViewRefs {
  preset: PrefPresetMenuWidget;
  navButtons: HTMLButtonElement[];
  panelBasic: HTMLElement;
  panelModel: HTMLElement;
  modelList: HTMLElement;
  doc: Document;
}

const ELEMENT_IDS = {
  presetRoot: `zotero-prefpane-${config.addonRef}-preset-root`,
  presetButton: `zotero-prefpane-${config.addonRef}-preset-button`,
};

function getIconNode(def: any): any {
  if (!def) return null;
  const icon = def.icon ?? def.default?.icon;
  if (!icon) return null;
  return typeof icon === "function" ? icon("#000000", "#000000") : icon;
}

function createSvgElement(doc: Document, node: any): SVGGraphicsElement {
  const el = doc.createElementNS(
    "http://www.w3.org/2000/svg",
    node.tag,
  ) as unknown as SVGGraphicsElement;
  const attrs = node.attrs ?? {};
  for (const [key, value] of Object.entries(attrs)) {
    el.setAttribute(key, String(value));
  }
  if (!("fill" in attrs)) {
    el.setAttribute("fill", "currentColor");
  }
  (node.children ?? []).forEach((child: any) => {
    el.appendChild(createSvgElement(doc, child));
  });
  return el;
}

function createAntIcon(doc: Document, def: any): SVGSVGElement {
  const node = getIconNode(def);
  if (!node) {
    return doc.createElementNS(
      "http://www.w3.org/2000/svg",
      "svg",
    ) as unknown as SVGSVGElement;
  }
  const svg = createSvgElement(doc, node) as unknown as SVGSVGElement;
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("focusable", "false");
  return svg;
}

function getProviderDisplayName(provider: ProviderId | string): string {
  switch (provider) {
    case "openai":
      return "OpenAI";
    case "deepseek":
      return "DeepSeek";
    default:
      return provider;
  }
}

function buildPrefPresetMenu(doc: Document, root: HTMLElement): PrefPresetMenuWidget {
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
 * Query and return preferences view element references.
 * @param window Host window containing the preferences document.
 */
export function buildPrefView(window: Window): PrefViewRefs {
  const doc = window.document;
  const presetRoot = doc.getElementById(ELEMENT_IDS.presetRoot) as HTMLElement | null;
  const navButtons = Array.from(
    doc.querySelectorAll(".pref-nav-button"),
  ) as HTMLButtonElement[];
  const panelBasic = doc.getElementById("pref-panel-basic") as HTMLElement | null;
  const panelModel = doc.getElementById("pref-panel-model") as HTMLElement | null;
  const modelList = doc.getElementById("pref-model-list") as HTMLElement | null;

  if (!presetRoot || !panelBasic || !panelModel || !modelList) {
    throw new Error("Missing preference UI elements");
  }

  const preset = buildPrefPresetMenu(doc, presetRoot);

  return {
    preset,
    navButtons,
    panelBasic,
    panelModel,
    modelList,
    doc,
  };
}

/** Populate the preset menu options from provided presets and wire selection callback. */
export function renderPresetOptions(
  refs: PrefViewRefs,
  presets: ProviderPreset[],
  onSelect: (id: string) => void,
): void {
  const l10n = (refs.doc as any).l10n;
  const { doc } = refs;
  const { wrapper, button, list } = refs.preset;

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

  for (const p of presets) {
    const opt = ztoolkit.UI.appendElement(
      {
        tag: "li",
        classList: ["zorecto-menu__option"],
        attributes: { role: "option", "data-id": p.id },
        properties: { textContent: p.label } as any,
        listeners: [
          {
            type: "click",
            listener: () => {
              onSelect(p.id);
              closeMenu();
              try {
                button.focus();
              } catch {
                // ignore
              }
            },
          },
        ],
      },
      list,
    ) as HTMLLIElement;
    try {
      l10n?.setAttributes?.(opt, p.labelKey);
    } catch {}
  }
}

/** Sync preset menu with the selected preset. */
export function fillForm(
  refs: PrefViewRefs,
  preset: ProviderPreset,
) {
  const l10n = (refs.doc as any).l10n;
  const { label, list } = refs.preset;
  label.textContent = preset.label;
  try {
    l10n?.setAttributes?.(label as any, preset.labelKey);
  } catch {}

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

/** Render the model table rows for each preset (no listeners attached). */
export function renderModelList(refs: PrefViewRefs, presets: ProviderPreset[]) {
  const l10n = (refs.doc as any).l10n;
  refs.modelList.textContent = "";
  for (const p of presets) {
    const row = ztoolkit.UI.appendElement(
      {
        tag: "div",
        classList: ["pref-model-row", "pref-model-item"],
        attributes: { role: "listitem", "data-id": p.id, "data-provider": p.provider },
      },
      refs.modelList,
    ) as HTMLElement;

    const modelCell = ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--model"],
        properties: { textContent: p.label },
      },
      row,
    ) as HTMLElement;
    try {
      l10n?.setAttributes?.(modelCell as any, p.labelKey);
    } catch {}

    ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--provider"],
        properties: { textContent: getProviderDisplayName(p.provider) } as any,
      },
      row,
    );

    const apiCell = ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-cell", "pref-model-cell--apikey"],
      },
      row,
    ) as HTMLElement;

    ztoolkit.UI.appendElement(
      {
        tag: "input",
        classList: ["pref-model-apikey-input"],
        attributes: { type: "password", "data-provider": p.provider },
      },
      apiCell,
    );

    const testBtn = ztoolkit.UI.appendElement(
      {
        tag: "button",
        classList: ["zorecto-icon-button", "pref-model-test-btn"],
      },
      apiCell,
    ) as HTMLButtonElement;
    testBtn.type = "button";
    testBtn.appendChild(createAntIcon(refs.doc, ApiOutlinedIcon));
    try {
      l10n?.setAttributes?.(testBtn as any, "zorecto-pref-test");
    } catch {}

    ztoolkit.UI.appendElement(
      {
        tag: "span",
        classList: ["pref-model-status"],
      },
      apiCell,
    );
  }
}

/** Toggle active panel and sync navigation button aria/active classes. */
export function setActivePanel(
  refs: PrefViewRefs,
  panel: "basic" | "model",
) {
  const isModel = panel === "model";
  refs.panelModel.hidden = !isModel;
  refs.panelBasic.hidden = isModel;
  for (const btn of refs.navButtons) {
    const active = btn.getAttribute("data-panel") === panel;
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

/** Mark the currently selected model id in the list. */
export function setModelSelection(refs: PrefViewRefs, id: string) {
  const items = Array.from(
    refs.modelList.querySelectorAll(".pref-model-item"),
  ) as HTMLElement[];
  for (const li of items) {
    li.classList.toggle(
      "pref-model-item--selected",
      li.getAttribute("data-id") === id,
    );
  }
}

/** Clear inline status label for a given model row. */
export function clearRowStatus(row: HTMLElement): void {
  const status = row.querySelector<HTMLElement>(".pref-model-status");
  if (!status) return;
  status.textContent = "";
  status.classList.remove("pref-model-status--ok", "pref-model-status--error");
  status.removeAttribute("data-l10n-id");
  status.removeAttribute("data-l10n-args");
  const icons = status.getElementsByClassName("pref-model-status-icon");
  for (const child of Array.from(icons)) {
    (child as HTMLElement).remove();
  }
}

/** Show inline status for a given model row with optional localization. */
export function showRowStatus(
  refs: PrefViewRefs,
  row: HTMLElement,
  options: { fallback: string; l10nId?: string; kind: "ok" | "error" },
): void {
  const status = row.querySelector<HTMLElement>(".pref-model-status");
  if (!status) return;
  const l10n = (refs.doc as any).l10n;
  status.classList.toggle("pref-model-status--ok", options.kind === "ok");
  status.classList.toggle("pref-model-status--error", options.kind === "error");
  status.removeAttribute("data-l10n-id");
  status.removeAttribute("data-l10n-args");
  status.textContent = "";
  if (options.kind === "ok") {
    const icon = createAntIcon(refs.doc, CheckCircleFilledIcon);
    icon.classList.add("pref-model-status-icon");
    status.appendChild(icon);
  } else {
    status.textContent = options.fallback;
    if (options.l10nId) {
      try {
        l10n?.setAttributes?.(status, options.l10nId);
      } catch {}
    }
  }
}
