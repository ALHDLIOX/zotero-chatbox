/**
 * Preferences helpers for AI Chat settings
 */

import { config } from "../../../package.json";

const PREFS_PREFIX = config.prefsPrefix;

/**
 * Get a preference value for AI Chat
 */
export function getPref(key: string): string {
  const fullKey = `${PREFS_PREFIX}.aiChat.${key}`;
  return (Zotero.Prefs.get(fullKey, true) as string) || "";
}

/**
 * Set a preference value for AI Chat
 */
export function setPref(key: string, value: string): void {
  const fullKey = `${PREFS_PREFIX}.aiChat.${key}`;
  Zotero.Prefs.set(fullKey, value, true);
}

/**
 * Validate required preferences
 * @returns validation result with errors if any
 */
export function validatePrefs(): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  const endpoint = getPref("endpoint");
  const model = getPref("model");
  const apiKey = getPref("apiKey");

  if (!endpoint || endpoint.trim() === "") {
    errors.push("端点 URL 不能为空");
  } else {
    try {
      const url = new URL(endpoint);
      if (url.protocol !== "https:") {
        errors.push("端点 URL 必须使用 HTTPS");
      }
    } catch {
      errors.push("端点 URL 格式无效");
    }
  }

  if (!model || model.trim() === "") {
    errors.push("模型不能为空");
  }

  if (!apiKey || apiKey.trim() === "") {
    errors.push("API Key 不能为空");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Get all AI Chat preferences
 */
export function getAllPrefs() {
  return {
    provider: getPref("provider"),
    endpoint: getPref("endpoint"),
    model: getPref("model"),
    apiKey: getPref("apiKey"),
  };
}
