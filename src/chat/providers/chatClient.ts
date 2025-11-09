/** OpenAI-style chat client: streaming, token estimate, and error mapping. */
import { getString } from "../../shared/locale";
import { I18N_KEYS } from "../../shared/i18nKeys";
import { ProviderError, type ProviderErrorCode, httpStatusToProviderError, isAbortLikeError, createTimeoutError, createAbortError } from "../../shared/errors";
import { SYSTEM_PROMPT as SYSTEM_PROMPT_TEXT } from "./prompts";
import { REQUEST_TIMEOUT_MS, TOKEN_LIMIT } from "./constants";
import { startTimeout, combineSignals, collectSignals, getAbortReason } from "../../shared/abort";
import type { SessionMessage } from "../state/sessionStore";
import {
  getProviderSettings,
  type ProviderSettings,
  validateProviderSettings,
} from "../ui/prefs/prefs";



// System prompt moved to ./prompts

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

/** Chat response including completion text and optional usage. */
export interface ChatResponse {
  completion: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

// Provider error types moved to shared/errors

/** Returns the current soft token limit used for preflight. */
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

  const systemMessage: SessionMessage = {
    id: `system-prompt-${Date.now()}`,
    role: "system",
    content: SYSTEM_PROMPT_TEXT,
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

// AbortSignal helpers moved to shared/abort and errors

async function readErrorBody(response: Response): Promise<string | undefined> {
  try {
    const clone = response.clone();
    const text = await clone.text();
    const trimmed = text.trim();
    if (!trimmed) {
      return undefined;
    }
    if (trimmed.length > 1024) {
      return `${trimmed.slice(0, 1024)}…`;
    }
    return trimmed;
  } catch (error) {
    void error;
    return undefined;
  }
}

interface ParsedSSEChunk {
  delta: string;
  usage?: ChatResponse["usage"];
  raw?: unknown;
}

function parseSSELine(line: string): ParsedSSEChunk | null {
  if (!line.startsWith("data:")) {
    return null;
  }

  const payload = line.slice(5).trim();
  if (!payload || payload === "[DONE]") {
    return null;
  }

  try {
    const json = JSON.parse(payload);
    const delta =
      json?.choices?.[0]?.delta?.content ??
      json?.choices?.[0]?.message?.content ??
      "";
    return {
      delta,
      usage: json?.usage,
      raw: json,
    };
  } catch (error) {
    void error;
    return null;
  }
}

/**
 * Send a chat completion request with SSE streaming support.
 * @throws ProviderError on validation, network or server errors.
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

  try {
    return await performStreamingRequest(
      { ...options, messages: effectiveMessages },
      settings,
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

async function performStreamingRequest(
  options: SendChatOptions,
  settings: ProviderSettings,
): Promise<ChatResponse> {
  const timeoutSignal = startTimeout(REQUEST_TIMEOUT_MS);
  const fetchSignal = combineSignals([options.signal, timeoutSignal]);

  const url = new URL("/v1/chat/completions", settings.endpoint);
  const body = JSON.stringify({
    model: settings.model,
    messages: options.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  });

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  };

  if (fetchSignal) {
    requestInit.signal = fetchSignal;
  }

  const response = await fetch(url.toString(), requestInit);

  if (!response.ok) {
    const bodyPreview = await readErrorBody(response);
    ztoolkit.log("[zorecto] Provider 请求返回错误状态", {
      status: response.status,
      statusText: response.statusText,
      bodyPreview,
    });
    throw httpStatusToProviderError(response.status);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    const json = (await response.json()) as any;
    ztoolkit.log("[zorecto] Provider 返回非流式响应", {
      contentType,
      hasChoices: Boolean(json?.choices?.length),
      usage: json?.usage,
    });
    const text = json?.choices?.[0]?.message?.content ?? "";
    return {
      completion: text,
      usage: json?.usage,
      raw: json,
    };
  }

  if (!response.body) {
    ztoolkit.log("[zorecto] Provider 响应缺少可读流", {
      status: response.status,
    });
    throw new ProviderError(
      "NETWORK",
      I18N_KEYS.error.network,
      getString(I18N_KEYS.error.network as any),
    );
  }

  const decoder = new TextDecoder("utf-8");
  const reader = response.body.getReader();
  const abortSignals = collectSignals(fetchSignal, options.signal, timeoutSignal);
  const abortListeners: Array<() => void> = [];
  let abortEventError: Error | undefined;

  const cancelStream = (error: Error, status: string) => {
    if (abortEventError) {
      return;
    }
    abortEventError = error;
    const cancel = (
      reader as {
        cancel?: (reason?: unknown) => Promise<void>;
      }
    ).cancel;
    if (typeof cancel === "function") {
      void cancel.call(reader, error).catch(() => undefined);
    }
    ztoolkit.log("[zorecto] 已中断流式读取", {
      status,
      reason: error.message,
    });
  };

  for (const signal of abortSignals) {
    const status = signal === timeoutSignal ? "timeout" : "signal-abort";
    const handler = () => {
      const rawReason = getAbortReason(signal);
      const resolved =
        rawReason instanceof Error
          ? rawReason
          : status === "timeout"
            ? createTimeoutError()
            : createAbortError();
      cancelStream(resolved, status);
    };
    if (signal.aborted) {
      handler();
      continue;
    }
    signal.addEventListener("abort", handler, { once: true });
    abortListeners.push(() => {
      try {
        signal.removeEventListener("abort", handler);
      } catch (error) {
        void error;
      }
    });
  }
  let buffer = "";
  let completion = "";
  let usage: ChatResponse["usage"];
  let finalRaw: unknown;

  while (true) {
    if (abortEventError) {
      throw abortEventError;
    }
    const { value, done } = await (reader as any).read();
    if (done) {
      break;
    }

    if (abortEventError) {
      throw abortEventError;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split(/\r?\n/);
    buffer = lines.pop() ?? "";

    for (const line of lines) {
      const chunk = parseSSELine(line);
      if (!chunk) {
        continue;
      }

      if (chunk.delta) {
        completion += chunk.delta;
        options.onToken?.(chunk.delta);
      }

      if (chunk.usage) {
        usage = chunk.usage;
      }

      finalRaw = chunk.raw;
    }
  }

  abortListeners.forEach((dispose) => dispose());
  if (abortEventError) {
    throw abortEventError;
  }

  return {
    completion,
    usage,
    raw: finalRaw,
  };
}

// httpStatusToProviderError moved to shared/errors
