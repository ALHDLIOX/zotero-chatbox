import { config } from "../../package.json";
import {
  getProviderSettings,
  setProviderSettings,
  type ProviderSettings,
  validateProviderSettings,
} from "./aiChat/prefs";

type ProviderFieldKey = keyof ProviderSettings;

interface PrefsState {
  window: Window;
  inputs: Record<ProviderFieldKey, HTMLInputElement>;
  errorBox: HTMLElement;
  handleAccept: (event: Event) => void;
  handleUnload: () => void;
}

const FIELD_IDS: Record<ProviderFieldKey, string> = {
  provider: `zotero-prefpane-${config.addonRef}-provider`,
  endpoint: `zotero-prefpane-${config.addonRef}-endpoint`,
  model: `zotero-prefpane-${config.addonRef}-model`,
  apiKey: `zotero-prefpane-${config.addonRef}-apiKey`,
};

const ERROR_BOX_ID = "ai-chat-pref-error-message";

export async function registerPrefsScripts(window: Window) {
  teardownPrefsState();

  const inputs = mapInputs(window.document);
  const errorBox = resolveErrorBox(window.document);

  const state: PrefsState = {
    window,
    inputs,
    errorBox,
    handleAccept: (event) => onDialogAccept(event),
    handleUnload: () => teardownPrefsState(),
  };

  addon.data.aiChatPrefs = state;

  populateForm(state);
  bindInputEvents(state);
  clearValidationError(state);

  window.addEventListener("dialogaccept", state.handleAccept);
  window.addEventListener("unload", state.handleUnload, { once: true });
}

function teardownPrefsState() {
  const current = addon.data.aiChatPrefs as PrefsState | undefined;
  if (!current) {
    return;
  }

  current.window.removeEventListener("dialogaccept", current.handleAccept);
  current.window.removeEventListener("unload", current.handleUnload);
  delete addon.data.aiChatPrefs;
}

function mapInputs(doc: Document): Record<ProviderFieldKey, HTMLInputElement> {
  const resolve = (key: ProviderFieldKey) => {
    const input = doc.getElementById(FIELD_IDS[key]) as HTMLInputElement | null;
    if (!input) {
      throw new Error(`Missing preference input for key: ${key}`);
    }
    return input;
  };

  return {
    provider: resolve("provider"),
    endpoint: resolve("endpoint"),
    model: resolve("model"),
    apiKey: resolve("apiKey"),
  };
}

function resolveErrorBox(doc: Document): HTMLElement {
  const el = doc.getElementById(ERROR_BOX_ID) as HTMLElement | null;
  if (!el) {
    throw new Error("Missing preference error message container");
  }
  return el;
}

function populateForm(state: PrefsState) {
  const settings = getProviderSettings();
  for (const key of Object.keys(state.inputs) as ProviderFieldKey[]) {
    state.inputs[key].value = settings[key] ?? "";
  }
}

function bindInputEvents(state: PrefsState) {
  for (const input of Object.values(state.inputs)) {
    input.addEventListener("input", () => {
      clearValidationError(state);
    });
  }
}

function readFormValues(state: PrefsState): ProviderSettings {
  return {
    provider: state.inputs.provider.value.trim(),
    endpoint: state.inputs.endpoint.value.trim(),
    model: state.inputs.model.value.trim(),
    apiKey: state.inputs.apiKey.value.trim(),
  };
}

function onDialogAccept(event: Event) {
  const state = addon.data.aiChatPrefs as PrefsState | undefined;
  if (!state) {
    return;
  }

  const values = readFormValues(state);
  const validation = validateProviderSettings(values);

  if (!validation.isValid) {
    event.preventDefault();
    event.stopPropagation();
    showValidationError(
      state,
      values,
      validation.missingKeys,
      validation.invalidEndpoint,
    );
    return;
  }

  setProviderSettings(values);
  clearValidationError(state);
}

function showValidationError(
  state: PrefsState,
  values: ProviderSettings,
  missingKeys: Array<ProviderFieldKey>,
  invalidEndpoint: boolean,
) {
  const doc = state.window.document;
  const l10n = (doc as any).l10n;

  if (invalidEndpoint) {
    l10n?.setAttributes?.(
      state.errorBox,
      `${config.addonRef}-ai-chat-pref-error-endpoint`,
    );
  } else if (missingKeys.length > 0) {
    const labels = missingKeys
      .map((key) => getLabelForField(doc, key))
      .filter(Boolean);
    const fieldsArg = labels.join("、") || missingKeys.join("、");
    l10n?.setAttributes?.(
      state.errorBox,
      `${config.addonRef}-ai-chat-pref-error-missing`,
      { fields: fieldsArg },
    );
  } else {
    l10n?.setAttributes?.(
      state.errorBox,
      `${config.addonRef}-ai-chat-pref-error-generic`,
    );
  }

  state.errorBox.hidden = false;
  ztoolkit.log("[ai-chat] Preference validation failed", {
    missingKeys,
    invalidEndpoint,
    values: { ...values, apiKey: values.apiKey ? "***" : "" },
  });
}

function getLabelForField(doc: Document, key: ProviderFieldKey): string {
  const label = doc.querySelector(`label[for='${FIELD_IDS[key]}']`);
  return label?.textContent?.trim() ?? key;
}

function clearValidationError(state: PrefsState) {
  state.errorBox.removeAttribute("data-l10n-id");
  state.errorBox.removeAttribute("data-l10n-args");
  state.errorBox.textContent = "";
  state.errorBox.hidden = true;
}
