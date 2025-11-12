/**
 * Network client for chat completions.
 * Provides a single entry point to build requests, stream SSE tokens, and map HTTP/abort errors.
 * Depends on shared abort helpers + provider constants so upper layers can focus on prompts and settings.
 */
import { getString } from "../shared/locale";
import { I18N_KEYS } from "../shared/i18nKeys";
import {
  ProviderError,
  httpStatusToProviderError,
  isAbortLikeError,
  createTimeoutError,
  createAbortError,
} from "../shared/errors";
import { startTimeout, combineSignals, collectSignals, getAbortReason } from "../shared/abort";
import { REQUEST_TIMEOUT_MS } from "../chat/providers/constants";

/** Simplified message payload sent to provider endpoints. */
export interface ChatMessagePayload {
  role: "user" | "assistant" | "system";
  content: string;
}

/** Provider settings required to build chat requests. */
export interface ApiProviderSettings {
  endpoint: string;
  apiKey: string;
  model: string;
}

/** Options influencing how the request is executed. */
export interface ChatRequestOptions {
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

/** Response data returned after the provider completes or streams tokens. */
export interface ChatResponse {
  completion: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
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
  } catch {
    return null;
  }
}

type ChatStreamReader = ReadableStreamDefaultReader<Uint8Array>;

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
  } catch {
    return undefined;
  }
}

function cancelStream(
  reader: ChatStreamReader | undefined,
  error: Error,
  status: string,
  rawReason?: unknown,
): void {
  const cancel = (reader as { cancel?: (reason?: unknown) => Promise<void> })?.cancel;
  if (typeof cancel === "function") {
    void cancel.call(reader, error).catch(() => undefined);
  }
  try {
    const rawInfo =
      rawReason instanceof Error
        ? { rawName: rawReason.name, rawMessage: rawReason.message }
        : { rawReason };
    ztoolkit.log("[zorecto] 已中断流式读取", {
      status,
      reasonName: (error as any)?.name,
      reasonMessage: (error as any)?.message,
      ...rawInfo,
    });
  } catch {}
}

/**
 * Performs the low-level chat completion request against the provider endpoint.
 * @param params Configuration for messages and provider credentials.
 * @param options Optional abort signal and token callback.
 * @returns Provider completion text and usage telemetry.
 * @throws ProviderError for HTTP, network, and stream abort errors.
 */
export async function requestChatCompletion(
  params: { messages: ChatMessagePayload[]; settings: ApiProviderSettings },
  options: ChatRequestOptions = {},
): Promise<ChatResponse> {
  const timeoutSignal = startTimeout(REQUEST_TIMEOUT_MS);
  const fetchSignal = combineSignals([options.signal, timeoutSignal]);
  const url = new URL("/v1/chat/completions", params.settings.endpoint);
  const body = JSON.stringify({
    model: params.settings.model,
    messages: params.messages,
    stream: true,
  });

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${params.settings.apiKey}`,
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
  const reader: ChatStreamReader = response.body.getReader() as unknown as ChatStreamReader;
  const abortSignals = collectSignals(fetchSignal);
  const abortListeners: Array<() => void> = [];
  let abortEventError: Error | undefined;
  let buffer = "";
  let completion = "";
  let usage: ChatResponse["usage"];
  let finalRaw: unknown;

  for (const signal of abortSignals) {
    const status = signal === timeoutSignal ? "timeout" : "signal-abort";
    const handler = () => {
      const rawReason = getAbortReason(signal);
      let resolved: Error;
      if (status === "timeout") {
        resolved = createTimeoutError();
      } else if (rawReason instanceof Error) {
        resolved = isAbortLikeError(rawReason) ? rawReason : createAbortError();
      } else {
        resolved = createAbortError();
      }
      try {
        ztoolkit.log("[zorecto] fetch/stream abort event", {
          status,
          rawReason:
            rawReason instanceof Error
              ? { name: rawReason.name, message: rawReason.message }
              : rawReason,
          resolved: { name: resolved.name, message: resolved.message },
        });
      } catch {}
      if (!abortEventError) {
        abortEventError = resolved;
        cancelStream(reader, resolved, status, rawReason);
      }
    };
    if (signal.aborted) {
      handler();
      continue;
    }
    signal.addEventListener("abort", handler, { once: true });
    abortListeners.push(() => {
      try {
        signal.removeEventListener("abort", handler);
      } catch {
        // older runtimes may throw when removing
      }
    });
  }

  while (true) {
    if (abortEventError) {
      throw abortEventError;
    }
    const { value, done } = await reader.read();
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
