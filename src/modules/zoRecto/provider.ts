import { getString } from "../../utils/locale";
import type { SessionMessage } from "./session";
import {
  getProviderSettings,
  type ProviderSettings,
  validateProviderSettings,
} from "./prefs";

interface AbortControllerLike {
  signal?: AbortSignal;
  abort(reason?: unknown): void;
}

type AbortControllerCtor = new () => AbortController;

function resolveAbortControllerCtor(): AbortControllerCtor | undefined {
  if (typeof AbortController === "function") {
    return AbortController as AbortControllerCtor;
  }

  try {
    if (
      typeof Zotero !== "undefined" &&
      typeof Zotero.getMainWindow === "function"
    ) {
      const win = Zotero.getMainWindow();
      if (win && typeof win.AbortController === "function") {
        return win.AbortController as AbortControllerCtor;
      }
    }
  } catch (error) {
    void error;
  }

  try {
    const globalWin =
      typeof globalThis !== "undefined" ? (globalThis as any) : undefined;
    if (globalWin && typeof globalWin.AbortController === "function") {
      return globalWin.AbortController as AbortControllerCtor;
    }
  } catch (error) {
    void error;
  }

  return undefined;
}

const AbortControllerCtor = resolveAbortControllerCtor();
const supportsAbortController = typeof AbortControllerCtor === "function";

class NoopAbortController implements AbortControllerLike {
  signal = undefined;
  abort(): void {
    // AbortController 兼容缺失时的降级；无法真正中断请求
  }
}

const SYSTEM_PROMPT = [
  "# Response Formatting Rules",
  "",
  "- Output Markdown only; use clear headings, lists, and code blocks when they improve readability.",
  "- Render every mathematical expression with LaTeX delimiters:",
  "  * Inline math: `$...$` or \(\(...\)\).",
  "  * Block math: `$$...$$` or \(\[...\\]\) on its own lines.",
  "- Never place math delimiters inside inline code or fenced code blocks.",
  "- Escape literal dollar signs that are not math with `\\$`.",
  "- Keep explanations structured, concise, and easy to scan.",
  "",
  "# Bold Math",
  "",
  "- Do NOT bold math by wrapping LaTeX with **…**.",
  "- To make symbols or entire expressions bold, use LaTeX control sequences: \\mathbf{...} (roman letters) or \\boldsymbol{...} (greek/symbols).",
  "",
  "# Zotero Citation Buttons (Inline)",
  "",
  "- Immediately after any sentence that uses a document source, insert an inline marker of the form:",
  "  ((cite: { \"attachmentID\": 123, \"page\": 7, \"quote\": \"short snippet\" }))",
  "  or for multiple sources: ((cite: [{...}, {...}]))",
  "- The marker must sit right after the sentence, not in a separate paragraph; do not put it inside code blocks.",
  "- Fields:",
  "  * attachmentID: Zotero item ID of the cited PDF attachment",
  "  * page: 1-based page number",
  "  * quote: optional short text from the target page to improve in-viewer highlighting",
  "- Numbering of citations starts from 1 and increases across the whole answer.",
  "- Do NOT output any trailing citation JSON code block; use only inline markers.",
].join("\n");

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

const TOKEN_LIMIT = 60000;
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
    content: SYSTEM_PROMPT,
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
        "zorecto-error-endpoint-invalid",
        getString("zorecto-error-endpoint-invalid"),
      );
    }

    if (validation.missingKeys.length > 0) {
      throw new ProviderError(
        "SETTINGS",
        "zorecto-error-settings-missing",
        getString("zorecto-error-settings-missing"),
        { cause: validation.missingKeys },
      );
    }
  }
}

function createAbortController(parent?: AbortSignal): AbortControllerLike {
  if (!AbortControllerCtor) {
    return new NoopAbortController();
  }

  const controller = new AbortControllerCtor();
  if (parent) {
    if (parent.aborted) {
      controller.abort(parent.reason);
    } else {
      parent.addEventListener("abort", () => controller.abort(parent.reason), {
        once: true,
      });
    }
  }

  return controller;
}

function getAbortSignal(
  controller: AbortControllerLike,
): AbortSignal | undefined {
  const signal = controller.signal;
  if (signal && typeof signal === "object" && "aborted" in signal) {
    return signal;
  }
  return undefined;
}

function startTimeout(controller: AbortControllerLike, ms: number) {
  if (!supportsAbortController) {
    return;
  }

  if (ms <= 0) {
    return;
  }
  setTimeout(() => {
    const signal = getAbortSignal(controller);
    if (!signal?.aborted) {
      controller.abort(createTimeoutError());
    }
  }, ms);
}

function createTimeoutError(): Error {
  if (typeof DOMException === "function") {
    return new DOMException("Request timed out", "TimeoutError");
  }
  const error = new Error("Request timed out");
  error.name = "TimeoutError";
  return error;
}

function isAbortLikeError(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const name = (error as { name?: unknown }).name;
  if (name === "AbortError" || name === "TimeoutError") {
    return true;
  }

  if (supportsAbortController && typeof DOMException === "function") {
    return (
      error instanceof DOMException &&
      (error.name === "AbortError" || error.name === "TimeoutError")
    );
  }

  return false;
}

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
      "zorecto-error-token-limit",
      getString("zorecto-error-token-limit"),
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
        "zorecto-error-network",
        getString("zorecto-error-network"),
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
        "zorecto-error-network",
        getString("zorecto-error-network"),
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
      "zorecto-error-server",
      getString("zorecto-error-server"),
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

  const requestInit: RequestInit = {
    method: "POST",
    headers: {
      Authorization: `Bearer ${settings.apiKey}`,
      "Content-Type": "application/json",
    },
    body,
  };

  const abortSignal = getAbortSignal(controller);
  if (abortSignal) {
    requestInit.signal = abortSignal;
  }

  const response = await fetch(url.toString(), requestInit);

  if (!response.ok) {
    const bodyPreview = await readErrorBody(response);
    ztoolkit.log("[zorecto] Provider 请求返回错误状态", {
      status: response.status,
      statusText: response.statusText,
      bodyPreview,
    });
    throw httpErrorToProviderError(response.status);
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
      "zorecto-error-network",
      getString("zorecto-error-network"),
    );
  }

  const decoder = new TextDecoder("utf-8");
  const reader = response.body.getReader();
  if (abortSignal) {
    abortSignal.addEventListener(
      "abort",
      () => {
        const cancel = (
          reader as {
            cancel?: (reason?: unknown) => Promise<void>;
          }
        ).cancel;
        const abortReason =
          typeof (abortSignal as { reason?: unknown }).reason !== "undefined"
            ? (abortSignal as { reason?: unknown }).reason
            : "aborted";
        if (typeof cancel === "function") {
          void cancel.call(reader, abortReason).catch(() => undefined);
        }
        ztoolkit.log("[zorecto] 已中断流式读取", {
          status: "signal-abort",
          reason: abortReason,
        });
      },
      { once: true },
    );
  }
  let buffer = "";
  let completion = "";
  let usage: ChatResponse["usage"];
  let finalRaw: unknown;

  while (true) {
    const { value, done } = await (reader as any).read();
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
      "zorecto-error-auth",
      getString("zorecto-error-auth"),
      { status },
    );
  }

  if (status === 408 || status === 429 || status === 504) {
    return new ProviderError(
      "NETWORK",
      "zorecto-error-network",
      getString("zorecto-error-network"),
      { status },
    );
  }

  return new ProviderError(
    "SERVER",
    "zorecto-error-server",
    getString("zorecto-error-server"),
    { status },
  );
}
