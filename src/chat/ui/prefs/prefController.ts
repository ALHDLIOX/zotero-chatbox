/**
 * Preferences controller – wires events and model/prefs with prefView.
 *
 * Purpose: Orchestrate preference UI behavior (navigation, preset selection,
 * API key persistence, connection test) and expose provider settings helpers
 * for other modules. View-only DOM operations live in `prefView`.
 * Dependencies: PRESETS and helpers from providers, ztoolkit.UI for dynamic
 * rendering, and shared prefs helpers for persistence.
 * Invariants: Controller owns event listeners and state lifetime; view stays
 * stateless (pure DOM updates).
 */
import { config } from "../../../../package.json";
import {
  PRESETS,
  getDefaultPresetId,
  getPresetById,
  findPresetIdByProviderModel,
  type ProviderId,
  type ProviderPreset,
} from "../../providers";
import {
  buildPrefView,
  clearError,
  fillForm,
  renderModelList,
  renderPresetOptions,
  setActivePanel,
  setModelSelection,
  showError,
  type PrefViewRefs,
} from "./prefView";
import { linkCheck } from "../../../api/linkCheck";
import { setPref } from "../../../shared/prefs";

/** Runtime state for the preferences controller. */
interface PrefState {
  window: Window;
  refs: PrefViewRefs;
  handleUnload: () => void;
}

/** Compute the current selected preset from the UI. */
function getCurrentPresetFromUI(state: PrefState): ProviderPreset {
  return getPresetById(state.refs.preset.value) ?? PRESETS[0];
}

/** Initialize preference controller and attach UI behavior. */
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
  renderPresetOptions(refs, PRESETS);
  const selectedId = getSelectedPresetId();
  const initialPreset = getPresetById(selectedId) ?? PRESETS[0];
  fillForm(refs, initialPreset, getApiKeyForProvider(initialPreset.provider));
  renderModelList(refs, PRESETS);
  setActivePanel(refs, "model");
  setModelSelection(refs, initialPreset.id);
  clearError(refs);

  bindEvents(state);
  window.addEventListener("unload", state.handleUnload, { once: true });
}

function bindEvents(state: PrefState): void {
  const { refs } = state;
  const doc = state.window.document as any;
  const l10n = doc.l10n;

  // Navigation buttons → switch panel
  for (const btn of refs.navButtons) {
    btn.addEventListener("click", () => {
      const panel = btn.getAttribute("data-panel");
      if (panel === "profile" || panel === "model") {
        setActivePanel(refs, panel);
      }
    });
  }

  // Preset dropdown change
  refs.preset.addEventListener("change", () => {
    const selected = getCurrentPresetFromUI(state);
    fillForm(refs, selected, getApiKeyForProvider(selected.provider));
    setSelectedPresetId(selected.id);
    setModelSelection(refs, selected.id);
  });

  // API key change
  refs.apiKey.addEventListener("change", () => {
    const preset = getCurrentPresetFromUI(state);
    setApiKeyForProvider(preset.provider, refs.apiKey.value.trim());
  });

  // Model list item click (delegate)
  refs.modelList.addEventListener("click", (ev) => {
    const target = ev.target as HTMLElement | null;
    const li = target?.closest?.(".pref-model-item") as HTMLElement | null;
    if (!li) return;
    const id = li.getAttribute("data-id");
    if (!id) return;
    if (!PRESETS.some((p) => p.id === id)) return;
    refs.preset.value = id;
    // Trigger change handler to reuse logic
    refs.preset.dispatchEvent(new state.window.Event("change", { bubbles: true }));
  });

  // Test connection
  refs.testBtn.addEventListener("click", async () => {
    const preset = getCurrentPresetFromUI(state);
    const apiKey = refs.apiKey.value.trim();

    if (!apiKey) {
      showError(refs, {
        fallback: "API key is required",
        l10nId: "zorecto-pref-error-apikey-required",
      });
      return;
    }

    refs.testBtn.disabled = true;
    clearError(refs);

    try {
      await linkCheck({
        endpoint: preset.endpoint,
        apiKey,
        model: preset.model,
      });
      showError(refs, {
        fallback: "Connection OK",
        l10nId: "zorecto-pref-test-success",
      });
      return;
    } catch (error) {
      void error;
    } finally {
      refs.testBtn.disabled = false;
    }

    showError(refs, {
      fallback: "Connection failed",
      l10nId: "zorecto-pref-test-failed",
    });
  });
}

function teardownPrefState() {
  const current = addon.data.prefState as PrefState | undefined;
  if (!current) return;
  current.window.removeEventListener("unload", current.handleUnload);
  delete addon.data.prefState;
}

// ----------------------
// Provider prefs helpers
// ----------------------

export interface ProviderSettings {
  provider: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface ProviderValidationResult {
  isValid: boolean;
  missingKeys: Array<keyof ProviderSettings>;
  invalidEndpoint: boolean;
}

const PREFS_PREFIX = config.prefsPrefix;

const KEY_PRESET = `${PREFS_PREFIX}.preset`;
const KEY_APIKEY_OPENAI = `${PREFS_PREFIX}.apiKey.openai`;
const KEY_APIKEY_DEEPSEEK = `${PREFS_PREFIX}.apiKey.deepseek`;

function readStringPref(key: string): string {
  const value = Zotero.Prefs.get(key, true);
  return typeof value === "string" ? value.trim() : "";
}

function writeStringPref(key: string, value: string): void {
  // Map fully-qualified key to plugin-relative key expected by setPref
  const prefix = `${PREFS_PREFIX}.`;
  const relativeKey = key.startsWith(prefix) ? key.slice(prefix.length) : key;
  // setPref applies the plugin prefix internally
  setPref(relativeKey as any, value as any);
}

/** Get the selected preset id, defaulting to app default. */
export function getSelectedPresetId(): string {
  return readStringPref(KEY_PRESET) || getDefaultPresetId();
}

/** Persist the selected preset id with fallback to default when unknown. */
export function setSelectedPresetId(id: string): void {
  const preset = getPresetById(id);
  writeStringPref(KEY_PRESET, preset ? preset.id : getDefaultPresetId());
}

/** Read API key bound to provider id. */
export function getApiKeyForProvider(provider: ProviderId): string {
  const keyName = provider === "openai" ? KEY_APIKEY_OPENAI : KEY_APIKEY_DEEPSEEK;
  return readStringPref(keyName);
}

/** Persist API key bound to provider id. */
export function setApiKeyForProvider(provider: ProviderId, apiKey: string): void {
  const keyName = provider === "openai" ? KEY_APIKEY_OPENAI : KEY_APIKEY_DEEPSEEK;
  writeStringPref(keyName, apiKey.trim());
}

/** Compute effective provider settings based on current preset and stored key. */
export function getProviderSettings(): ProviderSettings {
  const preset = getPresetById(getSelectedPresetId()) ?? getPresetById(getDefaultPresetId())!;
  return {
    provider: preset.provider,
    endpoint: preset.endpoint,
    model: preset.model,
    apiKey: getApiKeyForProvider(preset.provider),
  };
}

/** Backward compat: map `{provider, model}` pair to a preset id and persist API key. */
export function setProviderSettings(settings: ProviderSettings): ProviderSettings {
  const presetId =
    findPresetIdByProviderModel(settings.provider as ProviderId, settings.model) ??
    getDefaultPresetId();
  setSelectedPresetId(presetId);
  if (settings.apiKey) {
    try {
      setApiKeyForProvider(settings.provider as ProviderId, settings.apiKey);
    } catch (e) {
      // ignore
    }
  }
  return getProviderSettings();
}

function isValidHttpsEndpoint(endpoint: string): boolean {
  if (!endpoint) return false;
  try {
    const url = new URL(endpoint);
    return url.protocol === "https:";
  } catch (error) {
    void error;
    return false;
  }
}

/** Validate provider settings: API key required; endpoint must be HTTPS when present. */
export function validateProviderSettings(
  settings: ProviderSettings,
): ProviderValidationResult {
  const normalized = {
    provider: settings.provider.trim(),
    endpoint: settings.endpoint.trim(),
    model: settings.model.trim(),
    apiKey: settings.apiKey.trim(),
  };

  const missingKeys: Array<keyof ProviderSettings> = [];
  if (!normalized.apiKey) missingKeys.push("apiKey");

  const invalidEndpoint =
    normalized.endpoint.length > 0 && !isValidHttpsEndpoint(normalized.endpoint);

  return {
    isValid: missingKeys.length === 0 && !invalidEndpoint,
    missingKeys,
    invalidEndpoint,
  };
}
