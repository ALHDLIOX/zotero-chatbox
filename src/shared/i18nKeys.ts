/**
 * i18n (Fluent) message ID constants used across the chat feature.
 * Keep these as single source of truth to avoid magic strings.
 */
export const I18N_KEYS = {
  error: {
    tokenLimit: "zorecto-error-token-limit",
    network: "zorecto-error-network",
    auth: "zorecto-error-auth",
    server: "zorecto-error-server",
    settingsMissing: "zorecto-error-settings-missing",
    endpointInvalid: "zorecto-error-endpoint-invalid",
  },
  prefs: {
    error: {
      apiKeyRequired: "zorecto-pref-error-apikey-required",
      endpointInvalid: "zorecto-pref-error-endpoint",
      generic: "zorecto-pref-error-generic",
    },
  },
} as const;

export type I18nKey = typeof I18N_KEYS[keyof typeof I18N_KEYS];

