/**
 * Preferences view – query element references and perform pure DOM updates.
 *
 * Purpose: Provide a thin, stateless view layer for the preferences page.
 * It only builds element references and updates UI, without event binding,
 * persistence or network access. Controller is responsible for behavior.
 * Dependencies: ztoolkit.UI for dynamic element rendering.
 * Invariants: No side effects beyond DOM mutations on provided document.
 */
import {
  ELEMENT_IDS,
  buildPrefPresetMenu,
  type PrefPresetMenuWidget,
} from "./elements/presetMenu";

/** Element handles used by the preferences controller. */
export interface PrefViewRefs {
  preset: PrefPresetMenuWidget;
  navButtons: HTMLButtonElement[];
  panelBasic: HTMLElement;
  panelModel: HTMLElement;
  modelList: HTMLElement;
  doc: Document;
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
