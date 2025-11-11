/**
 * Shared provider error types and helpers.
 * Depends on `shared/locale` for localized UI messages and `shared/i18nKeys` for IDs.
 */
import { getString } from "./locale";
import { I18N_KEYS } from "./i18nKeys";

/**
 * Error code categories for provider requests.
 */
export type ProviderErrorCode =
  | "TOKEN_LIMIT"
  | "SETTINGS"
  | "NETWORK"
  | "AUTH"
  | "SERVER"
  | "ABORTED"
  | "UNKNOWN";

/**
 * Error with a stable `code` and i18n `messageKey` for UI display.
 */
export class ProviderError extends Error {
  code: ProviderErrorCode;
  status?: number;
  messageKey: string;

  constructor(
    code: ProviderErrorCode,
    messageKey: string,
    message: string,
    init?: { status?: number; cause?: unknown },
  ) {
    super(message);
    this.code = code;
    this.messageKey = messageKey;
    this.status = init?.status;
    if (init?.cause) {
      this.cause = init.cause;
    }
  }
}

/** Map HTTP status to a `ProviderError` with localized message. */
export function httpStatusToProviderError(status: number): ProviderError {
  if (status === 401 || status === 403) {
    return new ProviderError(
      "AUTH",
      I18N_KEYS.error.auth,
      getString(I18N_KEYS.error.auth as any),
      { status },
    );
  }

  if (status === 408 || status === 429 || status === 504) {
    return new ProviderError(
      "NETWORK",
      I18N_KEYS.error.network,
      getString(I18N_KEYS.error.network as any),
      { status },
    );
  }

  return new ProviderError(
    "SERVER",
    I18N_KEYS.error.server,
    getString(I18N_KEYS.error.server as any),
    { status },
  );
}

/** Create a DOM-like TimeoutError instance for consistent abort handling. */
export function createTimeoutError(): Error {
  if (typeof DOMException === "function") {
    return new DOMException("Request timed out", "TimeoutError");
  }
  const error = new Error("Request timed out");
  error.name = "TimeoutError";
  return error;
}

/** Create a DOM-like AbortError instance for consistent abort handling. */
export function createAbortError(): Error {
  if (typeof DOMException === "function") {
    return new DOMException("Request aborted", "AbortError");
  }
  const error = new Error("Request aborted");
  error.name = "AbortError";
  return error;
}

/** Detects if an unknown error is Abort/Timeout compatible. */
export function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }
  const name = (error as { name?: unknown }).name;
  if (name === "AbortError" || name === "TimeoutError") {
    return true;
  }
  if (typeof DOMException === "function") {
    return (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    );
  }
  return false;
}

