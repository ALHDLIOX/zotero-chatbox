/**
 * Preferences UI controller – wires events and model/prefs with prefView.
 *
 * Purpose: Orchestrate preference UI behavior (navigation, preset selection,
 * API key persistence, connection test) on top of prefView and elements.
 * Dependencies: provider presets, linkCheck, prefView, and providerSettings
 * helpers for persistence.
 * Invariants: Controller owns event listeners and state lifetime; view stays
 * stateless (pure DOM updates).
 */
import {
  PRESETS,
  getPresetById,
  type ProviderId,
} from "../../../providers";
import {
  buildPrefView,
  type PrefViewRefs,
} from "../prefView";
import {
  renderPresetOptions,
  fillPresetMenu,
} from "../elements/presetMenu";
import {
  clearRowStatus,
  renderModelList,
  setModelSelection,
  showRowStatus,
} from "../elements/modelList";
import {
  setActivePanel,
  type PrefPanelsRefs,
} from "../elements/panels";
import { linkCheck } from "../../../../api/linkCheck";
import {
  getApiKeyForProvider,
  setApiKeyForProvider,
  getSelectedPresetId,
  setSelectedPresetId,
} from "./providerSettings";

/** Runtime state for the preferences UI controller. */
interface PrefState {
  window: Window;
  refs: PrefViewRefs;
  handleUnload: () => void;
}

/** Sync all visible API key inputs for a provider to the given value. */
function syncProviderApiKeyInputs(
  refs: PrefViewRefs,
  provider: ProviderId,
  apiKey: string,
): void {
  const inputs = refs.modelList.querySelectorAll<HTMLInputElement>(
    `.pref-model-apikey-input[data-provider="${provider}"]`,
  );
  inputs.forEach((input: HTMLInputElement) => {
    if (input.value !== apiKey) {
      input.value = apiKey;
    }
  });
}

/**
 * Initialize preferences UI controller and attach behavior to the view.
 * @param window Host window containing the preferences document.
 */
export async function initPrefController(window: Window): Promise<void> {
  teardownPrefState();

  const refs = buildPrefView(window);
  const state: PrefState = {
    window,
    refs,
    handleUnload: () => teardownPrefState(),
  };
  addon.data.prefState = state;

  // Populate view
  const onPresetChange = (id: string) => {
    const selected = getPresetById(id) ?? PRESETS[0];
    const apiKey = getApiKeyForProvider(selected.provider);
    fillPresetMenu(refs.doc, refs.preset, selected);
    setSelectedPresetId(selected.id);
    setModelSelection(refs.modelList, selected.id);
    syncProviderApiKeyInputs(refs, selected.provider, apiKey);
  };

  renderPresetOptions(refs.doc, refs.preset, PRESETS, onPresetChange);
  renderModelList(refs.doc, refs.modelList, PRESETS);

  // Initialize API key inputs per provider
  const providers = new Set<ProviderId>(PRESETS.map((p) => p.provider));
  for (const provider of providers) {
    const apiKey = getApiKeyForProvider(provider);
    syncProviderApiKeyInputs(refs, provider, apiKey);
  }

  const selectedId = getSelectedPresetId();
  const initialPreset = getPresetById(selectedId) ?? PRESETS[0];
  fillPresetMenu(refs.doc, refs.preset, initialPreset);
  const panels: PrefPanelsRefs = {
    panelBasic: refs.panelBasic,
    panelModel: refs.panelModel,
    navButtons: refs.navButtons,
  };
  setActivePanel(panels, "basic");
  setModelSelection(refs.modelList, initialPreset.id);

  bindEvents(state, onPresetChange);
  window.addEventListener("unload", state.handleUnload, { once: true });
}

function bindEvents(
  state: PrefState,
  onPresetChange: (id: string) => void,
): void {
  const { refs } = state;

  // Navigation buttons → switch panel
  for (const btn of refs.navButtons) {
    btn.addEventListener("click", () => {
      const panel = btn.getAttribute("data-panel");
      if (panel === "basic" || panel === "model") {
        const panels: PrefPanelsRefs = {
          panelBasic: refs.panelBasic,
          panelModel: refs.panelModel,
          navButtons: refs.navButtons,
        };
        setActivePanel(panels, panel);
      }
    });
  }

  // Inline API key edits in model rows (provider-scoped)
  refs.modelList.addEventListener("input", (ev) => {
    const target = ev.target as HTMLInputElement | null;
    if (!target || !target.classList.contains("pref-model-apikey-input")) return;
    const provider = target.getAttribute("data-provider") as ProviderId | null;
    if (!provider) return;
    const value = target.value.trim();
    setApiKeyForProvider(provider, value);
    syncProviderApiKeyInputs(refs, provider, value);
  });

  // Model list item click + per-row test (delegate)
  refs.modelList.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    if (!target) return;

    const testBtn = target.closest(".pref-model-test-btn") as HTMLButtonElement | null;
    if (testBtn) {
      const row = testBtn.closest(".pref-model-row") as HTMLElement | null;
      if (!row) return;
      void testConnectionForRow(state, row);
      return;
    }

    if (target.closest(".pref-model-apikey-input")) {
      return;
    }

    const row = target.closest(".pref-model-row") as HTMLElement | null;
    if (!row) return;
    const id = row.getAttribute("data-id");
    if (!id) return;
    if (!PRESETS.some((p) => p.id === id)) return;
    onPresetChange(id);
  });
}

async function testConnectionForRow(state: PrefState, row: HTMLElement): Promise<void> {
  const id = row.getAttribute("data-id");
  const provider = row.getAttribute("data-provider") as ProviderId | null;
  if (!id || !provider || !PRESETS.some((p) => p.id === id)) return;

  const preset = getPresetById(id) ?? PRESETS[0];
  const input = row.querySelector<HTMLInputElement>(".pref-model-apikey-input");
  const button = row.querySelector<HTMLButtonElement>(".pref-model-test-btn");
  if (!input || !button) return;

  const apiKey = input.value.trim();
  if (!apiKey) {
    setApiKeyForProvider(provider, "");
    syncProviderApiKeyInputs(state.refs, provider, "");
    clearRowStatus(row);
    showRowStatus(state.refs.doc, row, {
      fallback: "API key is required",
      l10nId: "zorecto-pref-error-apikey-required",
      kind: "error",
    });
    return;
  }

  setApiKeyForProvider(provider, apiKey);
  syncProviderApiKeyInputs(state.refs, provider, apiKey);

  button.disabled = true;
  clearRowStatus(row);

  try {
    await linkCheck({
      endpoint: preset.endpoint,
      apiKey,
      model: preset.model,
    });
    showRowStatus(state.refs.doc, row, {
      fallback: "Connection OK",
      l10nId: "zorecto-pref-test-success",
      kind: "ok",
    });
  } catch (error) {
    void error;
    showRowStatus(state.refs.doc, row, {
      fallback: "Connection failed",
      l10nId: "zorecto-pref-test-failed",
      kind: "error",
    });
  } finally {
    button.disabled = false;
  }
}

function teardownPrefState() {
  const current = addon.data.prefState as PrefState | undefined;
  if (!current) return;
  current.window.removeEventListener("unload", current.handleUnload);
  delete addon.data.prefState;
}
