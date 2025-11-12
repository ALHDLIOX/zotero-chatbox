/** OpenAI-style chat client that enriches sessions, guards tokens, and delegates network work to src/api/chatRequest. */
import { getString } from "../../shared/locale";
import { I18N_KEYS } from "../../shared/i18nKeys";
import { ProviderError, isAbortLikeError } from "../../shared/errors";
import { getSystemPrompt } from "./prompts";
import { TOKEN_LIMIT } from "./constants";
import type { SessionMessage } from "../services/session/sessionStore";
import {
  getProviderSettings,
  type ProviderSettings,
  validateProviderSettings,
} from "../ui/prefs/prefController";
import {
  requestChatCompletion,
  type ChatMessagePayload,
  type ChatResponse,
} from "../../api/chatRequest";

export type { ChatResponse };

/**
 * Options for sending a chat request.
 * @param messages Conversation messages in session order.
 * @param signal Optional abort signal to cancel the request.
 * @param onToken Optional streaming token callback.
 */
export interface SendChatOptions {
  messages: SessionMessage[];
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

/**
 * Returns the current soft token limit used for preflight.
 * @returns The soft limit in tokens that triggers a rejection.
 */
export function getTokenLimit(): number {
  return TOKEN_LIMIT;
}

function estimatePromptTokens(messages: SessionMessage[]): number {
  const totalChars = messages.reduce(
    (sum, { content }) => sum + content.trim().length,
    0,
  );
  return Math.ceil(totalChars / 3);
}

function withSystemPrompt(messages: SessionMessage[]): SessionMessage[] {
  if (messages.length > 0) {
    const first = messages[0];
    if (
      first.role === "system" &&
      first.content.trim().startsWith("# Response Formatting Rules")
    ) {
      return messages;
    }
  }

  const locale = Zotero.locale || "en-US";
  const systemMessage: SessionMessage = {
    id: `system-prompt-${Date.now()}`,
    role: "system",
    content: getSystemPrompt(locale),
    timestamp: Date.now(),
  };

  return [systemMessage, ...messages];
}

function ensureValidSettings(settings: ProviderSettings) {
  const validation = validateProviderSettings(settings);

  if (!validation.isValid) {
    if (validation.invalidEndpoint) {
      throw new ProviderError(
        "SETTINGS",
        I18N_KEYS.error.endpointInvalid,
        getString(I18N_KEYS.error.endpointInvalid as any),
      );
    }

    if (validation.missingKeys.length > 0) {
      throw new ProviderError(
        "SETTINGS",
        I18N_KEYS.error.settingsMissing,
        getString(I18N_KEYS.error.settingsMissing as any),
        { cause: validation.missingKeys },
      );
    }
  }
}

/**
 * Send a chat completion request with SSE streaming support.
 * @param options Conversation payload and optional cancellation hooks.
 * @returns Provider completion text and usage metadata.
 * @throws ProviderError when validation, network, or server errors occur.
 */
export async function sendChat(
  options: SendChatOptions,
): Promise<ChatResponse> {
  const settings = { ...getProviderSettings() };
  ensureValidSettings(settings);

  const effectiveMessages = withSystemPrompt(options.messages);
  const estimatedTokens = estimatePromptTokens(effectiveMessages);
  if (estimatedTokens > TOKEN_LIMIT) {
    throw new ProviderError(
      "TOKEN_LIMIT",
      I18N_KEYS.error.tokenLimit,
      getString(I18N_KEYS.error.tokenLimit as any),
      { cause: { estimatedTokens, limit: TOKEN_LIMIT } },
    );
  }

  const payload: ChatMessagePayload[] = effectiveMessages.map((message) => ({
    role: message.role as ChatMessagePayload["role"],
    content: message.content,
  }));

  try {
    return await requestChatCompletion(
      {
        messages: payload,
        settings: {
          endpoint: settings.endpoint,
          apiKey: settings.apiKey,
          model: settings.model,
        },
      },
      { signal: options.signal, onToken: options.onToken },
    );
  } catch (error) {
    if (error instanceof ProviderError) {
      ztoolkit.log("[zorecto] sendChat 捕获 ProviderError", {
        code: error.code,
        status: error.status,
        message: error.message,
        messageKey: error.messageKey,
        cause: error.cause,
      });
      throw error;
    }

    if (isAbortLikeError(error)) {
      const wrapped = new ProviderError(
        "ABORTED",
        I18N_KEYS.error.network,
        getString(I18N_KEYS.error.network as any),
        { cause: error },
      );
      ztoolkit.log("[zorecto] sendChat 请求被外部中止", {
        cause: {
          name: (error as { name?: unknown }).name,
          message: (error as { message?: unknown }).message,
        },
      });
      throw wrapped;
    }

    if (error instanceof TypeError) {
      const wrapped = new ProviderError(
        "NETWORK",
        I18N_KEYS.error.network,
        getString(I18N_KEYS.error.network as any),
        { cause: error },
      );
      ztoolkit.log("[zorecto] sendChat 捕获网络层错误", {
        message: error.message,
        stack: error.stack,
      });
      throw wrapped;
    }

    const wrapped = new ProviderError(
      "UNKNOWN",
      I18N_KEYS.error.server,
      getString(I18N_KEYS.error.server as any),
      { cause: error },
    );
    ztoolkit.log("[zorecto] sendChat 捕获未知错误", {
      error,
    });
    throw wrapped;
  }
}
