/**
 * Preferences controller façade – public entry point for prefs controllers.
 *
 * Purpose: Re-export UI and provider settings controllers from prefs/controllers
 * so callers can import a single module. Keeps file-level wiring stable while
 * allowing internal controller splitting.
 */
export { initPrefController } from "./controllers/uiController";

export {
  getSelectedPresetId,
  setSelectedPresetId,
  getApiKeyForProvider,
  setApiKeyForProvider,
  getProviderSettings,
  setProviderSettings,
  validateProviderSettings,
} from "./controllers/providerSettings";

export type {
  ProviderSettings,
  ProviderValidationResult,
} from "./controllers/providerSettings";
