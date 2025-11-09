/**
 * Send controller: orchestrates submit/stream/abort for chat messages.
 *
 * Purpose: keep UI orchestration only and delegate all business/state to
 * services/conversation. Cancellation is owned by ChatFlow inside the service;
 * this controller only forwards abort() via the returned handle.
 */
import type { SessionMessage } from "../../../state/sessionStore";
import { sendWithContext } from "../../../services/conversation";
import { MessageListController } from "./messageListController";
import { createAbortError } from "../../../../shared/errors";

/** Handles send/stream lifecycle, updating message list during chat interactions. */
export class SendController {
  private readonly doc: Document;
  private readonly messageList: MessageListController;

  private abortFn?: (reason?: unknown) => void;

  /**
   * @param doc Host document for view updates.
   * @param deps Dependency bag containing message list controller.
   */
  constructor(
    doc: Document,
    deps: {
      messageList: MessageListController;
    },
  ) {
    this.doc = doc;
    this.messageList = deps.messageList;
  }

  /**
   * Submit user content and start streaming assistant reply via ChatFlow.
   * @param sessionId The active chat session ID.
   * @param content User-entered text content.
   */
  async submit(sessionId: string, content: string): Promise<void> {
    if (!sessionId) return;
    const text = (content || "").trim();
    if (!text) return;

    let assistant: SessionMessage | undefined;
    const { promise, abort } = sendWithContext(sessionId, text, {
      onUser: (msg) => {
        this.messageList.ensureAndAppend(msg);
        this.messageList.scrollToBottom();
      },
      onAssistant: (msg) => {
        assistant = { ...msg };
        this.messageList.ensureAndAppend(msg);
        this.messageList.scrollToBottom();
      },
      onToken: (token) => {
        if (!assistant) return;
        assistant.content += token;
        this.messageList.scheduleRender(assistant.id, assistant.content);
        this.messageList.scrollToBottom();
      },
    });
    this.abortFn = abort;
    try {
      await promise;
      if (assistant) this.messageList.updateEntryByMessage(assistant);
    } finally {
      this.abortFn = undefined;
    }
  }

  /** Abort the current chat flow, if any. */
  abort(): void {
    try {
      ztoolkit.log("[zorecto] SendController.abort invoked (UI stop)", {
        hasAbort: Boolean(this.abortFn),
      });
    } catch {}
    try { this.abortFn?.(createAbortError()); } catch {}
  }
}
