/** Preferences UI logic for model preset select and API key test. */
import { config } from "../../package.json";
import {
  validateProviderSettings,
  getSelectedPresetId,
  setSelectedPresetId,
  getApiKeyForProvider,
  setApiKeyForProvider,
} from "../chat/prefs";
import { getPresetById, PRESETS, type ProviderPreset } from "../chat/providers";

interface PrefsState {
  window: Window;
  preset: HTMLSelectElement;
  endpoint: HTMLInputElement;
  apiKey: HTMLInputElement;
  testBtn: HTMLButtonElement;
  errorBox: HTMLElement;
  navButtons: HTMLButtonElement[];
  panelProfile: HTMLElement;
  panelModel: HTMLElement;
  modelList: HTMLElement;
  handleUnload: () => void;
}

const ELEMENT_IDS = {
  preset: `zotero-prefpane-${config.addonRef}-preset`,
  endpoint: `zotero-prefpane-${config.addonRef}-endpoint`,
  apiKey: `zotero-prefpane-${config.addonRef}-apiKey`,
  testBtn: `zotero-prefpane-${config.addonRef}-test`,
};

const ERROR_BOX_ID = "pref-error-message";

export async function registerPrefsScripts(window: Window) {
  teardownPrefsState();

  const state = createPrefsState(window);
  addon.data.zoRectoPrefs = state;

  populatePresetOptions(state);
  populateForm(state);
  bindEvents(state);
  clearMessage(state);
  renderModelList(state);
  setActivePanel(state, "model");
  syncModelListSelection(state);
  window.addEventListener("unload", state.handleUnload, { once: true });
}

function createPrefsState(window: Window): PrefsState {
  const doc = window.document;

  const preset = doc.getElementById(ELEMENT_IDS.preset) as HTMLSelectElement | null;
  const endpoint = doc.getElementById(ELEMENT_IDS.endpoint) as HTMLInputElement | null;
  const apiKey = doc.getElementById(ELEMENT_IDS.apiKey) as HTMLInputElement | null;
  const testBtn = doc.getElementById(ELEMENT_IDS.testBtn) as HTMLButtonElement | null;
  const errorBox = doc.getElementById(ERROR_BOX_ID) as HTMLElement | null;
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
    window,
    preset,
    endpoint,
    apiKey,
    testBtn,
    errorBox,
    navButtons,
    panelProfile,
    panelModel,
    modelList,
    handleUnload: () => teardownPrefsState(),
  };
}

function teardownPrefsState() {
  const current = addon.data.zoRectoPrefs as PrefsState | undefined;
  if (!current) return;
  current.window.removeEventListener("unload", current.handleUnload);
  delete addon.data.zoRectoPrefs;
}

function populatePresetOptions(state: PrefsState) {
  const doc = state.window.document as any;
  const l10n = doc.l10n;
  state.preset.textContent = "";
  for (const p of PRESETS) {
    const opt = state.window.document.createElement("option");
    opt.value = p.id;
    // Fallback text first, then try localize
    opt.textContent = p.label;
    try {
      l10n?.setAttributes?.(opt, p.labelKey);
    } catch (e) {
      // ignore
    }
    state.preset.appendChild(opt);
  }
}

function populateForm(state: PrefsState) {
  const selectedId = getSelectedPresetId();
  const preset = getPresetById(selectedId) ?? getPresetById(PRESETS[0].id)!;
  state.preset.value = preset.id;
  state.endpoint.value = preset.endpoint;
  state.apiKey.value = getApiKeyForProvider(preset.provider);
}

function bindEvents(state: PrefsState) {
  // Nav: switch panels
  for (const btn of state.navButtons) {
    btn.addEventListener("click", () => {
      const panel = btn.getAttribute("data-panel");
      if (panel === "profile" || panel === "model") {
        setActivePanel(state, panel);
      }
    });
  }

  state.preset.addEventListener("change", () => {
    const preset = getCurrentPreset(state);
    state.endpoint.value = preset.endpoint;
    state.apiKey.value = getApiKeyForProvider(preset.provider);
    // Save selection immediately
    setSelectedPresetId(preset.id);
    clearMessage(state);
    syncModelListSelection(state);
  });

  state.apiKey.addEventListener("input", () => clearMessage(state));
  state.apiKey.addEventListener("change", () => {
    const preset = getCurrentPreset(state);
    setApiKeyForProvider(preset.provider, state.apiKey.value.trim());
  });
  state.testBtn.addEventListener("click", () => void testConnection(state));
}

function getCurrentPreset(state: PrefsState): ProviderPreset {
  return (
    getPresetById(state.preset.value) ?? getPresetById(PRESETS[0].id)!
  );
}

function showValidationError(state: PrefsState, invalidEndpoint: boolean) {
  const doc = state.window.document as any;
  const l10n = doc.l10n;
  const id = invalidEndpoint
    ? "zorecto-pref-error-endpoint"
    : "zorecto-pref-error-apikey-required";

  // Set a visible fallback first to guarantee UX
  state.errorBox.textContent = invalidEndpoint
    ? "Endpoint URL must be a valid HTTPS link"
    : "API key is required";
  try {
    l10n?.setAttributes?.(state.errorBox, id);
  } catch (e) {
    // ignore
  }
  state.errorBox.removeAttribute("hidden");
}

function setActivePanel(state: PrefsState, panel: "profile" | "model") {
  const isModel = panel === "model";
  state.panelModel.hidden = !isModel;
  state.panelProfile.hidden = isModel;
  for (const btn of state.navButtons) {
    const active = btn.getAttribute("data-panel") === panel;
    btn.classList.toggle("pref-nav-button--active", active);
    btn.setAttribute("aria-selected", active ? "true" : "false");
  }
}

function renderModelList(state: PrefsState) {
  const doc = state.window.document as any;
  const l10n = doc.l10n;
  state.modelList.textContent = "";
  for (const p of PRESETS) {
    const li = state.window.document.createElement("li") as any;
    li.className = "pref-model-item";
    li.setAttribute("role", "option");
    li.setAttribute("data-id", p.id);
    li.textContent = p.label;
    try {
      l10n?.setAttributes?.(li, p.labelKey);
    } catch {}
    li.addEventListener("click", () => selectModelById(state, p.id));
    state.modelList.appendChild(li);
  }
}

function selectModelById(state: PrefsState, id: string) {
  const exists = PRESETS.some((p) => p.id === id);
  if (!exists) return;
  state.preset.value = id;
  // Trigger existing change logic
  state.preset.dispatchEvent(new state.window.Event("change", { bubbles: true }));
}

function syncModelListSelection(state: PrefsState) {
  const current = getCurrentPreset(state).id;
  const items = Array.from(
    state.modelList.querySelectorAll(".pref-model-item"),
  ) as HTMLElement[];
  for (const li of items) {
    li.classList.toggle(
      "pref-model-item--selected",
      li.getAttribute("data-id") === current,
    );
  }
}

function clearMessage(state: PrefsState) {
  state.errorBox.removeAttribute("data-l10n-id");
  state.errorBox.removeAttribute("data-l10n-args");
  state.errorBox.textContent = "";
  state.errorBox.hidden = true;
}

async function testConnection(state: PrefsState) {
  const preset = getCurrentPreset(state);
  const apiKey = state.apiKey.value.trim();
  const doc = state.window.document as any;
  const l10n = doc.l10n;

  if (!apiKey) {
    showValidationError(state, false);
    return;
  }

  state.testBtn.disabled = true;
  clearMessage(state);

  try {
    const url = new URL("/v1/chat/completions", preset.endpoint);
    const body = JSON.stringify({
      model: preset.model,
      messages: [
        { role: "system", content: "ping" },
        { role: "user", content: "ping" },
      ],
      stream: false,
      max_tokens: 1,
    });

    const resp = await fetch(url.toString(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (resp.ok) {
      // Show fallback immediately, then try localize
      state.errorBox.textContent = "Connection OK";
      try {
        l10n?.setAttributes?.(state.errorBox, "zorecto-pref-test-success");
      } catch (e) {
        // ignore
      }
      state.errorBox.removeAttribute("hidden");
      return;
    }
  } catch (error) {
    void error;
  } finally {
    state.testBtn.disabled = false;
  }

  // Failure: show fallback then localize
  state.errorBox.textContent = "Connection failed";
  try {
    l10n?.setAttributes?.(state.errorBox, "zorecto-pref-test-failed");
  } catch (e) {
    // ignore
  }
  state.errorBox.removeAttribute("hidden");
}
