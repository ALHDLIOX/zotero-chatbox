/**
 * Chat flow coordinator.
 *
 * Purpose: orchestrates a single chat run for a session: appends a placeholder
 * assistant message, streams tokens into it, and persists the final result.
 *
 * Dependencies: sessionStore for state updates; providers/sendChat for model
 * request; shared/abort for consistent cancellation semantics across hosts.
 *
 * Invariants: a single internal AbortController exists per run; upstream
 * signals are combined with the internal signal so either source cancels the
 * request. Errors are reflected into the assistant placeholder.
 */
import { getString } from "../../shared/locale";
import {
  appendMessage,
  ensureSession,
  setLastResult,
  updateMessage,
  type SessionMessage,
  type SessionState,
} from "./session/sessionStore";
import { sendChat, ProviderError, type ChatResponse } from "../providers";
import { combineSignals, getAbortReason, createAbortController } from "../../shared/abort";

/** Options for starting a chat run. */
export interface StartOptions {
  /** Called once when the assistant placeholder message is created and appended. */
  onAssistant?: (message: SessionMessage) => void;
  /** Called for each streamed token, in order. */
  onToken?: (token: string) => void;
  /** Optional upstream signal to be combined with the internal controller. */
  signal?: AbortSignal;
}

/** Coordinates a single chat interaction lifecycle for a session. */
export class ChatFlow {
  private readonly sessionId: string;
  private controller?: AbortController;

  /**
   * @param sessionId Target session ID to append and update messages.
   */
  constructor(sessionId: string) {
    this.sessionId = sessionId;
  }

  /**
   * Abort the in-flight request if any.
   * @param reason Optional cancellation reason (forwarded when supported).
   */
  abort(reason?: unknown): void {
    try {
      // Older implementations may not support reason
      (this.controller as any)?.abort?.(reason as any);
    } catch {
      try { this.controller?.abort(); } catch {}
    }
    try {
      const info =
        reason instanceof Error
          ? { name: reason.name, message: reason.message }
          : { reason };
      ztoolkit.log("[zorecto] ChatFlow.abort invoked", {
        sessionId: this.sessionId,
        hasController: Boolean(this.controller),
        ...info,
      });
    } catch {}
  }

  /**
   * Start a chat run for the current session.
   * @param opts Callbacks and optional upstream AbortSignal to combine.
   * @returns Provider response with final completion and usage stats.
   * @throws ProviderError when the request fails or is aborted.
   */
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

    // Single internal controller; upstream cancellation is merged via combineSignals
    try {
      try {
        ztoolkit.log("[zorecto] ChatFlow.start env", {
          abortControllerType: typeof AbortController,
        });
      } catch {}
      this.controller = createAbortController();
      if (!this.controller) throw new Error("AbortControllerUnavailable");
    } catch {
      this.controller = undefined;
      try {
        ztoolkit.log("[zorecto] ChatFlow.start failed to create AbortController");
      } catch {}
    }

    // If upstream signal is already aborted, log its reason for diagnostics
    try {
      if (opts.signal?.aborted) {
        const r = getAbortReason(opts.signal);
        const info =
          r instanceof Error
            ? { name: r.name, message: r.message }
            : { reason: r };
        ztoolkit.log("[zorecto] ChatFlow.start with already-aborted upstream signal", {
          sessionId: this.sessionId,
          ...info,
        });
      }
    } catch {}

    const onToken = (token: string) => {
      assistantMessage.content += token;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      try { opts.onToken?.(token); } catch {}
    };

    try {
      const effectiveSignal = combineSignals([this.controller?.signal, opts.signal]);
      try {
        ztoolkit.log("[zorecto] ChatFlow.effective signal", {
          hasInternalSignal: Boolean(this.controller?.signal),
          hasUpstreamSignal: Boolean(opts.signal),
          hasEffectiveSignal: Boolean(effectiveSignal),
          upstreamAlreadyAborted: Boolean(opts.signal?.aborted),
        });
      } catch {}

      const response = await sendChat({
        messages: ensureSession(this.sessionId).messages,
        signal: effectiveSignal,
        onToken,
      });
      assistantMessage.content = response.completion;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      setLastResult(this.sessionId, { text: response.completion, usage: response.usage, raw: response.raw });
      return response;
    } catch (error) {
      const err = error as ProviderError;
      if (err && err.code === "ABORTED") {
        try {
          ztoolkit.log("[zorecto] ChatFlow caught ABORTED; keeping partial content", {
            sessionId: this.sessionId,
            length: assistantMessage.content.length,
          });
        } catch {}
        return {
          completion: assistantMessage.content,
          usage: undefined,
          raw: undefined,
        };
      }
      const content = (err && err.message) || String(err || "error");
      assistantMessage.content = content;
      updateMessage(this.sessionId, assistantMessage.id, () => ({ ...assistantMessage }));
      throw err;
    } finally {
      this.controller = undefined;
    }
  }
}
