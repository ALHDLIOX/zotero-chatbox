/**
 * Provider settings controller – persistence and validation helpers.
 *
 * Purpose: Read/write provider-related prefs (preset id, API keys) and
 * validate effective settings for network use. Keeps DOM concerns out of
 * preferences UI controllers.
 * Dependencies: plugin config for prefsPrefix, shared prefs helper, and
 * provider presets metadata.
 * Invariants: Always returns normalized strings (trimmed), enforces HTTPS
 * endpoint when present, and keeps default preset fallback stable.
 */
import { config } from "../../../../../package.json";
import {
  PRESETS,
  getDefaultPresetId,
  getPresetById,
  findPresetIdByProviderModel,
  type ProviderId,
} from "../../../providers";
import { setPref } from "../../../../shared/prefs";

/** Effective provider settings derived from prefs and presets. */
export interface ProviderSettings {
  provider: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

/** Result of validating provider settings before network use. */
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

/**
 * Compute effective provider settings based on current preset and stored key.
 * @returns Normalized provider settings ready for validation and network use.
 */
export function getProviderSettings(): ProviderSettings {
  const preset = getPresetById(getSelectedPresetId()) ?? getPresetById(getDefaultPresetId())!;
  return {
    provider: preset.provider,
    endpoint: preset.endpoint,
    model: preset.model,
    apiKey: getApiKeyForProvider(preset.provider),
  };
}

/**
 * Backward compat: map `{provider, model}` pair to a preset id and persist API key.
 * @param settings Settings provided by older callers (before presets were centralized).
 * @returns Effective settings resolved to the nearest preset and stored key.
 */
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

/**
 * Validate provider settings: API key required; endpoint must be HTTPS when present.
 * @param settings Candidate settings to validate.
 * @returns Validation result including missing keys and endpoint issues.
 */
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
