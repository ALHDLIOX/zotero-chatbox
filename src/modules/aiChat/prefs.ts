import { config } from "../../../package.json";

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

type ProviderSettingKey = keyof ProviderSettings;

const PREFS_PREFIX = config.prefsPrefix;

const PREF_KEYS: Record<ProviderSettingKey, string> = {
  provider: `${PREFS_PREFIX}.provider`,
  endpoint: `${PREFS_PREFIX}.endpoint`,
  model: `${PREFS_PREFIX}.model`,
  apiKey: `${PREFS_PREFIX}.apiKey`,
};

const defaultSettings: ProviderSettings = {
  provider: "openai-compatible",
  endpoint: "",
  model: "",
  apiKey: "",
};

function readPref(key: ProviderSettingKey): string {
  const value = Zotero.Prefs.get(PREF_KEYS[key], true);
  if (typeof value === "string") {
    return value.trim();
  }
  return "";
}

function writePref(key: ProviderSettingKey, value: string): void {
  Zotero.Prefs.set(PREF_KEYS[key], value, true);
}

export function getProviderSettings(): ProviderSettings {
  return {
    provider: readPref("provider") || defaultSettings.provider,
    endpoint: readPref("endpoint"),
    model: readPref("model"),
    apiKey: readPref("apiKey"),
  };
}

export function setProviderSettings(
  settings: ProviderSettings,
): ProviderSettings {
  (Object.keys(settings) as ProviderSettingKey[]).forEach((key) => {
    writePref(key, settings[key].trim());
  });

  return getProviderSettings();
}

function isValidHttpsEndpoint(endpoint: string): boolean {
  if (!endpoint) {
    return false;
  }

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

  const missingKeys = (["endpoint", "model", "apiKey"] as ProviderSettingKey[])
    .filter((key) => !normalized[key]);

  const invalidEndpoint =
    normalized.endpoint.length > 0 && !isValidHttpsEndpoint(normalized.endpoint);

  return {
    isValid: missingKeys.length === 0 && !invalidEndpoint,
    missingKeys,
    invalidEndpoint,
  };
}
