export interface ProviderSettings {
  provider: string;
  endpoint: string;
  model: string;
  apiKey: string;
}

export interface ProviderValidationResult {
  isValid: boolean;
  missingKeys: Array<keyof ProviderSettings>;
}

const defaultSettings: ProviderSettings = {
  provider: "",
  endpoint: "",
  model: "",
  apiKey: "",
};

/**
 * Skeleton preference helpers. Later tasks will wire these to Zotero prefs.
 */
export function getProviderSettings(): ProviderSettings {
  return { ...defaultSettings };
}

export function setProviderSettings(
  _settings: ProviderSettings,
): ProviderSettings {
  return { ...defaultSettings };
}

export function validateProviderSettings(
  settings: ProviderSettings,
): ProviderValidationResult {
  const missingKeys = (Object.keys(settings) as Array<keyof ProviderSettings>)
    .filter((key) => !settings[key]);

  return {
    isValid: missingKeys.length === 0,
    missingKeys,
  };
}
