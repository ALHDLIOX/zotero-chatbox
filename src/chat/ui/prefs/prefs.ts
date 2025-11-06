import { config } from "../../../../package.json";
import {
  PRESETS,
  getDefaultPresetId,
  getPresetById,
  findPresetIdByProviderModel,
  type ProviderId,
} from "../../providers";

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
  Zotero.Prefs.set(key, value, true);
}

export function getSelectedPresetId(): string {
  return readStringPref(KEY_PRESET) || getDefaultPresetId();
}

export function setSelectedPresetId(id: string): void {
  const preset = getPresetById(id);
  writeStringPref(KEY_PRESET, preset ? preset.id : getDefaultPresetId());
}

export function getApiKeyForProvider(provider: ProviderId): string {
  const keyName = provider === "openai" ? KEY_APIKEY_OPENAI : KEY_APIKEY_DEEPSEEK;
  return readStringPref(keyName);
}

export function setApiKeyForProvider(provider: ProviderId, apiKey: string): void {
  const keyName = provider === "openai" ? KEY_APIKEY_OPENAI : KEY_APIKEY_DEEPSEEK;
  writeStringPref(keyName, apiKey.trim());
}

export function getProviderSettings(): ProviderSettings {
  const preset = getPresetById(getSelectedPresetId()) ?? getPresetById(getDefaultPresetId())!;
  return {
    provider: preset.provider,
    endpoint: preset.endpoint,
    model: preset.model,
    apiKey: getApiKeyForProvider(preset.provider),
  };
}

// Backward-compat: allow setting via provider/model pair (maps to a preset)
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

export function validateProviderSettings(
  settings: ProviderSettings,
): ProviderValidationResult {
  const normalized = {
    provider: settings.provider.trim(),
    endpoint: settings.endpoint.trim(),
    model: settings.model.trim(),
    apiKey: settings.apiKey.trim(),
  };

  // Only API key is required by design; endpoint is derived but still validated for https
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
