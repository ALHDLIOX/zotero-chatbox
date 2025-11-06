import { getString } from "../../shared/locale";
import {
  appendMessage,
  ensureSession,
  setLastResult,
  updateMessage,
  type SessionMessage,
  type SessionState,
} from "../state/sessionStore";
import { sendChat, ProviderError, type ChatResponse } from "../providers";

export interface StartOptions {
  onAssistant?: (message: SessionMessage) => void;
  onToken?: (token: string) => void;
  signal?: AbortSignal;
}

export class ChatFlow {
  private readonly sessionId: string;
  private controller?: AbortController;

  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  abort(): void {
    try { this.controller?.abort(); } catch {}
  }

  async start(opts: StartOptions = {}): Promise<ChatResponse> {
    const session = ensureSession(this.sessionId);

    const assistantMessage: SessionMessage = {
      id: `${Date.now()}-a`,
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    appendMessage(this.sessionId, assistantMessage);
    try { opts.onAssistant?.(assistantMessage); } catch {}

    // Inner abort controller linked to parent signal
    try {
      this.controller = new AbortController();
      if (opts.signal) {
        if (opts.signal.aborted) this.controller.abort((opts.signal as any).reason);
        else opts.signal.addEventListener("abort", () => this.controller?.abort((opts.signal as any).reason), { once: true });
      }
    } catch {
      this.controller = undefined;
    }

    const onToken = (token: string) => {
      assistantMessage.content += token;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      try { opts.onToken?.(token); } catch {}
    };

    try {
      const response = await sendChat({
        messages: ensureSession(this.sessionId).messages,
        signal: this.controller?.signal,
        onToken,
      });
      assistantMessage.content = response.completion;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      setLastResult(this.sessionId, { text: response.completion, usage: response.usage, raw: response.raw });
      return response;
    } catch (error) {
      const err = error as ProviderError;
      const content = (err && err.message) || String(err || "error");
      assistantMessage.content = content;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      throw err;
    } finally {
      this.controller = undefined;
    }
  }
}

