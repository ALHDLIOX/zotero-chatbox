/**
 * OpenAI-compatible provider client with SSE streaming support
 */

import { getAllPrefs, validatePrefs } from "./prefs";
import type { Message, ChatResult } from "./session";

export interface SendChatOptions {
  messages: Message[];
  signal?: AbortSignal;
  onChunk?: (chunk: string) => void;
}

export interface ChatCompletionResponse {
  id: string;
  model: string;
  choices: Array<{
    index: number;
    message?: Message;
    delta?: {
      content?: string;
      role?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
}

/**
 * Send a chat request to the OpenAI-compatible provider with streaming
 */
export async function sendChat(options: SendChatOptions): Promise<ChatResult> {
  const { messages, signal, onChunk } = options;

  // Validate preferences
  const validation = validatePrefs();
  if (!validation.valid) {
    throw new Error(validation.errors.join("; "));
  }

  const prefs = getAllPrefs();
  const { endpoint, model, apiKey } = prefs;

  // Construct the request URL
  const url = `${endpoint}/v1/chat/completions`;

  // Prepare request body
  const body = {
    model,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
    stream: true,
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal,
    });

    if (!response.ok) {
      const errorText = await response.text();

      // Map HTTP status codes to localized error messages
      if (response.status === 401 || response.status === 403) {
        throw new Error("API Key 无效或已过期");
      } else if (response.status === 413 || response.status === 400) {
        // Token limit or bad request
        if (
          errorText.includes("token") ||
          errorText.includes("limit") ||
          errorText.includes("context_length")
        ) {
          throw new Error("文档过长，无法作为上下文发送（token 超限）");
        }
        throw new Error(`请求错误: ${errorText}`);
      } else if (response.status === 429) {
        throw new Error("请求过于频繁，请稍后再试");
      } else if (response.status >= 500) {
        throw new Error("服务异常，请稍后再试");
      } else {
        throw new Error(
          `HTTP ${response.status}: ${response.statusText} - ${errorText}`,
        );
      }
    }

    // Stream processing
    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("无法获取响应流");
    }

    const decoder = new TextDecoder();
    let buffer = "";
    let fullText = "";
    let usage: ChatResult["usage"] = undefined;
    let rawResponse: unknown;

    try {
      while (true) {
        const result = await (reader.read as any)();
        if (result.done) break;

        buffer += decoder.decode(result.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith("data: ")) continue;

          const data = trimmed.slice(6);
          if (data === "[DONE]") continue;

          try {
            const parsed: ChatCompletionResponse = JSON.parse(data);
            rawResponse = parsed;

            const delta = parsed.choices[0]?.delta;
            if (delta?.content) {
              fullText += delta.content;
              if (onChunk) {
                onChunk(delta.content);
              }
            }

            if (parsed.usage) {
              usage = {
                promptTokens: parsed.usage.prompt_tokens,
                completionTokens: parsed.usage.completion_tokens,
                totalTokens: parsed.usage.total_tokens,
              };
            }
          } catch (parseError) {
            ztoolkit.log("Failed to parse SSE data", { data, parseError });
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return {
      text: fullText,
      usage,
      raw: rawResponse,
    };
  } catch (error: any) {
    if (error.name === "AbortError") {
      throw new Error("请求已中止");
    }
    throw error;
  }
}
