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
import type { ProviderPreset } from "../../providers";

/** Element handles used by the preferences controller. */
export interface PrefViewRefs {
  preset: HTMLSelectElement;
  endpoint: HTMLInputElement;
  apiKey: HTMLInputElement;
  testBtn: HTMLButtonElement;
  errorBox: HTMLElement;
  navButtons: HTMLButtonElement[];
  panelProfile: HTMLElement;
  panelModel: HTMLElement;
  modelList: HTMLElement;
  doc: Document;
}

const ELEMENT_IDS = {
  preset: `zotero-prefpane-${config.addonRef}-preset`,
  endpoint: `zotero-prefpane-${config.addonRef}-endpoint`,
  apiKey: `zotero-prefpane-${config.addonRef}-apiKey`,
  testBtn: `zotero-prefpane-${config.addonRef}-test`,
  errorBox: "pref-error-message",
};

/**
 * Query and return preferences view element references.
 * @param window Host window containing the preferences document.
 */
export function buildPrefView(window: Window): PrefViewRefs {
  const doc = window.document;
  const preset = doc.getElementById(ELEMENT_IDS.preset) as HTMLSelectElement | null;
  const endpoint = doc.getElementById(ELEMENT_IDS.endpoint) as HTMLInputElement | null;
  const apiKey = doc.getElementById(ELEMENT_IDS.apiKey) as HTMLInputElement | null;
  const testBtn = doc.getElementById(ELEMENT_IDS.testBtn) as HTMLButtonElement | null;
  const errorBox = doc.getElementById(ELEMENT_IDS.errorBox) as HTMLElement | null;
  const navButtons = Array.from(
    doc.querySelectorAll(".pref-nav-button"),
  ) as HTMLButtonElement[];
  const panelProfile = doc.getElementById("pref-panel-profile") as HTMLElement | null;
  const panelModel = doc.getElementById("pref-panel-model") as HTMLElement | null;
  const modelList = doc.getElementById("pref-model-list") as HTMLElement | null;

  if (!preset || !endpoint || !apiKey || !testBtn || !errorBox || !panelProfile || !panelModel || !modelList) {
    throw new Error("Missing preference UI elements");
  }

  return {
    preset,
    endpoint,
    apiKey,
    testBtn,
    errorBox,
    navButtons,
    panelProfile,
    panelModel,
    modelList,
    doc,
  };
}

/** Populate the preset <select> options from provided presets. */
export function renderPresetOptions(refs: PrefViewRefs, presets: ProviderPreset[]) {
  const l10n = (refs.doc as any).l10n;
  refs.preset.textContent = "";
  for (const p of presets) {
    const opt = ztoolkit.UI.appendElement(
      { tag: "option", properties: { value: p.id, textContent: p.label } as any },
      refs.preset,
    ) as HTMLOptionElement;
    try {
      l10n?.setAttributes?.(opt, p.labelKey);
    } catch {}
  }
}

/** Fill endpoint/apiKey fields given preset and stored key. */
export function fillForm(
  refs: PrefViewRefs,
  preset: ProviderPreset,
  apiKey: string,
) {
  refs.preset.value = preset.id;
  refs.endpoint.value = preset.endpoint;
  refs.apiKey.value = apiKey;
}

/** Render the model list items from presets (no listeners attached). */
export function renderModelList(refs: PrefViewRefs, presets: ProviderPreset[]) {
  const l10n = (refs.doc as any).l10n;
  refs.modelList.textContent = "";
  for (const p of presets) {
    const li = ztoolkit.UI.appendElement(
      {
        tag: "li",
        classList: ["pref-model-item"],
        attributes: { role: "option", "data-id": p.id },
        properties: { textContent: p.label },
      },
      refs.modelList,
    ) as HTMLElement;
    try {
      l10n?.setAttributes?.(li as any, p.labelKey);
    } catch {}
  }
}

/** Toggle active panel and sync navigation button aria/active classes. */
export function setActivePanel(
  refs: PrefViewRefs,
  panel: "profile" | "model",
) {
  const isModel = panel === "model";
  refs.panelModel.hidden = !isModel;
  refs.panelProfile.hidden = isModel;
  for (const btn of refs.navButtons) {
    const active = btn.getAttribute("data-panel") === panel;
    btn.classList.toggle("pref-nav-button--active", active);
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

/** Clear error box including l10n attributes. */
export function clearError(refs: PrefViewRefs) {
  refs.errorBox.removeAttribute("data-l10n-id");
  refs.errorBox.removeAttribute("data-l10n-args");
  refs.errorBox.textContent = "";
  refs.errorBox.hidden = true;
}

/** Show an error/success message with visible fallback and optional l10n id. */
export function showError(
  refs: PrefViewRefs,
  options: { fallback: string; l10nId?: string },
) {
  const l10n = (refs.doc as any).l10n;
  refs.errorBox.textContent = options.fallback;
  if (options.l10nId) {
    try {
      l10n?.setAttributes?.(refs.errorBox, options.l10nId);
    } catch {}
  }
  refs.errorBox.removeAttribute("hidden");
}
