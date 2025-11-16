/**
 * Preferences panel visibility helpers.
 *
 * Purpose: Toggle between basic/model panels and sync navigation button state.
 * Dependencies: None outside DOM; controllers own behavior and persistence.
 * Invariants: Only DOM `hidden` and `aria-selected` attributes are mutated.
 */

/** References to preference panels and their navigation buttons. */
export interface PrefPanelsRefs {
  panelBasic: HTMLElement;
  panelModel: HTMLElement;
  navButtons: HTMLButtonElement[];
}

/**
 * Toggle active panel and sync navigation button aria/active classes.
 * @param refs Panel and navigation handles.
 * @param panel Active panel id ("basic" or "model").
 */
export function setActivePanel(
  refs: PrefPanelsRefs,
  panel: "basic" | "model",
): void {
  const isModel = panel === "model";
  refs.panelModel.hidden = !isModel;
  refs.panelBasic.hidden = isModel;
  for (const btn of refs.navButtons) {
    const active = btn.getAttribute("data-panel") === panel;
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

