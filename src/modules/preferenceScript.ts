import { config } from "../../package.json";
import {
  validateProviderSettings,
  getSelectedPresetId,
  setSelectedPresetId,
  getApiKeyForProvider,
  setApiKeyForProvider,
} from "./aiChat/prefs";
import { getPresetById, PRESETS, type ProviderPreset } from "./aiChat/providersRegistry";

interface PrefsState {
  window: Window;
  preset: HTMLSelectElement;
  endpoint: HTMLInputElement;
  apiKey: HTMLInputElement;
  testBtn: HTMLButtonElement;
  errorBox: HTMLElement;
  handleUnload: () => void;
}

const ELEMENT_IDS = {
  preset: `zotero-prefpane-${config.addonRef}-preset`,
  endpoint: `zotero-prefpane-${config.addonRef}-endpoint`,
  apiKey: `zotero-prefpane-${config.addonRef}-apiKey`,
  testBtn: `zotero-prefpane-${config.addonRef}-test`,
};

const ERROR_BOX_ID = "ai-chat-pref-error-message";

export async function registerPrefsScripts(window: Window) {
  teardownPrefsState();

  const state = createPrefsState(window);
  addon.data.aiChatPrefs = state;

  populatePresetOptions(state);
  populateForm(state);
  bindEvents(state);
  clearMessage(state);
  window.addEventListener("unload", state.handleUnload, { once: true });
}

function createPrefsState(window: Window): PrefsState {
  const doc = window.document;

  const preset = doc.getElementById(ELEMENT_IDS.preset) as HTMLSelectElement | null;
  const endpoint = doc.getElementById(ELEMENT_IDS.endpoint) as HTMLInputElement | null;
  const apiKey = doc.getElementById(ELEMENT_IDS.apiKey) as HTMLInputElement | null;
  const testBtn = doc.getElementById(ELEMENT_IDS.testBtn) as HTMLButtonElement | null;
  const errorBox = doc.getElementById(ERROR_BOX_ID) as HTMLElement | null;

  if (!preset || !endpoint || !apiKey || !testBtn || !errorBox) {
    throw new Error("Missing preference UI elements");
  }

  return {
    window,
    preset,
    endpoint,
    apiKey,
    testBtn,
    errorBox,
    handleUnload: () => teardownPrefsState(),
  };
}

function teardownPrefsState() {
  const current = addon.data.aiChatPrefs as PrefsState | undefined;
  if (!current) return;
  current.window.removeEventListener("unload", current.handleUnload);
  delete addon.data.aiChatPrefs;
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
  state.preset.addEventListener("change", () => {
    const preset = getCurrentPreset(state);
    state.endpoint.value = preset.endpoint;
    state.apiKey.value = getApiKeyForProvider(preset.provider);
    // Save selection immediately
    setSelectedPresetId(preset.id);
    clearMessage(state);
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
    ? "ai-chat-pref-error-endpoint"
    : "ai-chat-pref-error-apikey-required";

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
        l10n?.setAttributes?.(state.errorBox, "ai-chat-pref-test-success");
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
    l10n?.setAttributes?.(state.errorBox, "ai-chat-pref-test-failed");
  } catch (e) {
    // ignore
  }
  state.errorBox.removeAttribute("hidden");
}
