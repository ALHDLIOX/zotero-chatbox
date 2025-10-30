import { getString } from "../../utils/locale";
import type { SessionMessage } from "./session";
import {
  getProviderSettings,
  type ProviderSettings,
  validateProviderSettings,
} from "./prefs";

export interface SendChatOptions {
  messages: SessionMessage[];
  signal?: AbortSignal;
  onToken?: (token: string) => void;
}

export interface ChatResponse {
  completion: string;
  usage?: {
    promptTokens?: number;
    completionTokens?: number;
    totalTokens?: number;
  };
  raw?: unknown;
}

export type ProviderErrorCode =
  | "TOKEN_LIMIT"
  | "SETTINGS"
  | "NETWORK"
  | "AUTH"
  | "SERVER"
  | "ABORTED"
  | "UNKNOWN";

const TOKEN_LIMIT = 6000;
const REQUEST_TIMEOUT_MS = 60000;

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

function ensureValidSettings(settings: ProviderSettings) {
  const validation = validateProviderSettings(settings);

  if (!validation.isValid) {
    if (validation.invalidEndpoint) {
      throw new ProviderError(
        "SETTINGS",
        "ai-chat-error-endpoint-invalid",
        getString("ai-chat-error-endpoint-invalid"),
      );
    }

    if (validation.missingKeys.length > 0) {
      throw new ProviderError(
        "SETTINGS",
        "ai-chat-error-settings-missing",
        getString("ai-chat-error-settings-missing"),
        { cause: validation.missingKeys },
      );
    }
  }
}

function createAbortController(parent?: AbortSignal): AbortController {
  const controller = new AbortController();
  if (parent) {
    if (parent.aborted) {
      controller.abort(parent.reason);
    } else {
      parent.addEventListener(
        "abort",
        () => controller.abort(parent.reason),
        { once: true },
      );
    }
  }

  return controller;
}

function startTimeout(controller: AbortController, ms: number) {
  if (ms <= 0) {
    return;
  }
  setTimeout(() => {
    if (!controller.signal.aborted) {
      controller.abort(new DOMException("Request timed out", "TimeoutError"));
    }
  }, ms);
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

export async function sendChat(
  options: SendChatOptions,
): Promise<ChatResponse> {
  const settings = getProviderSettings();
  ensureValidSettings(settings);

  const estimatedTokens = estimatePromptTokens(options.messages);
  if (estimatedTokens > TOKEN_LIMIT) {
    throw new ProviderError(
      "TOKEN_LIMIT",
      "ai-chat-error-token-limit",
      getString("ai-chat-error-token-limit"),
      { cause: { estimatedTokens, limit: TOKEN_LIMIT } },
    );
  }

  try {
    return await performStreamingRequest(options, settings);
  } catch (error) {
    if (error instanceof ProviderError) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    ) {
      throw new ProviderError(
        "ABORTED",
        "ai-chat-error-network",
        getString("ai-chat-error-network"),
        { cause: error },
      );
    }

    if (error instanceof TypeError) {
      throw new ProviderError(
        "NETWORK",
        "ai-chat-error-network",
        getString("ai-chat-error-network"),
        { cause: error },
      );
    }

    throw new ProviderError(
      "UNKNOWN",
      "ai-chat-error-server",
      getString("ai-chat-error-server"),
      { cause: error },
    );
  }
}

async function performStreamingRequest(
  options: SendChatOptions,
  settings: ProviderSettings,
): Promise<ChatResponse> {
  const controller = createAbortController(options.signal);
  startTimeout(controller, REQUEST_TIMEOUT_MS);

  const url = new URL("/v1/chat/completions", settings.endpoint);
  const body = JSON.stringify({
    model: settings.model,
    messages: options.messages.map((message) => ({
      role: message.role,
      content: message.content,
    })),
    stream: true,
  });

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body,
    signal: controller.signal,
  });

  if (!response.ok) {
    throw httpErrorToProviderError(response.status);
  }

  const contentType = response.headers.get("content-type") ?? "";

  if (!contentType.includes("text/event-stream")) {
    const json = (await response.json()) as any;
    const text = json?.choices?.[0]?.message?.content ?? "";
    return {
      completion: text,
      usage: json?.usage,
      raw: json,
    };
  }

  if (!response.body) {
    throw new ProviderError(
      "NETWORK",
      "ai-chat-error-network",
      getString("ai-chat-error-network"),
    );
  }

  const decoder = new TextDecoder("utf-8");
  const reader = response.body.getReader();
  let buffer = "";
  let completion = "";
  let usage: ChatResponse["usage"];
  let finalRaw: unknown;

  while (true) {
    const { value, done } = await reader.read();
    if (done) {
      break;
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

  return {
    completion,
    usage,
    raw: finalRaw,
  };
}

function httpErrorToProviderError(status: number): ProviderError {
  if (status === 401 || status === 403) {
    return new ProviderError(
      "AUTH",
      "ai-chat-error-auth",
      getString("ai-chat-error-auth"),
      { status },
    );
  }

  if (status === 408 || status === 429 || status === 504) {
    return new ProviderError(
      "NETWORK",
      "ai-chat-error-network",
      getString("ai-chat-error-network"),
      { status },
    );
  }

  return new ProviderError(
    "SERVER",
    "ai-chat-error-server",
    getString("ai-chat-error-server"),
    { status },
  );
}
