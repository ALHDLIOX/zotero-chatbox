/**
 * Send controller: orchestrates submit/stream/abort for chat messages.
 *
 * Purpose: drives the UI send flow and delegates network/abort to ChatFlow.
 * Invariants: cancellation is owned by ChatFlow; this controller never creates
 * its own AbortController and only forwards abort() to the flow.
 */
import {
  appendMessage,
  ensureSession,
  type SessionMessage,
} from "../../../state/sessionStore";
import { ChatFlow } from "../../../services/chatFlow";
import { buildContextMessage } from "../../../services/documentContext";
import { MessageListController } from "./messageListController";
import { createAbortError } from "../../../../shared/errors";

/** Handles send/stream lifecycle, updating message list during chat interactions. */
export class SendController {
  private readonly doc: Document;
  private readonly messageList: MessageListController;

  private chatFlow?: ChatFlow;

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

    appendMessage(sessionId, {
      id: `${Date.now()}-u`,
      role: "user",
      content: text,
      timestamp: Date.now(),
    });
    this.messageList.ensureAndAppend(ensureSession(sessionId).messages.at(-1)!);
    this.messageList.scrollToBottom();

    const context = await buildContextMessage(sessionId);
    if (context) {
      // Only add to the session for provider context; do NOT render in UI.
      appendMessage(sessionId, context);
    }

    let assistant: SessionMessage | undefined;
    this.chatFlow = new ChatFlow(sessionId);
    try {
      ztoolkit.log("[zorecto] SendController.submit created ChatFlow", {
        hasChatFlow: Boolean(this.chatFlow),
        sessionId,
      });
    } catch {}

    const onToken = (token: string) => {
      if (!assistant) return;
      assistant.content += token;
      this.messageList.scheduleRender(assistant.id, assistant.content);
      this.messageList.scrollToBottom();
    };

    try {
      try {
        ztoolkit.log("[zorecto] SendController.submit starting flow", {
          hasChatFlow: Boolean(this.chatFlow),
        });
      } catch {}
      await this.chatFlow.start({
        onAssistant: (msg) => {
          assistant = { ...msg };
          this.messageList.ensureAndAppend(msg);
          this.messageList.scrollToBottom();
        },
        onToken,
      });
      // Streaming finished: ensure buttons are enabled now that content exists
      if (assistant) {
        this.messageList.updateEntryByMessage(assistant);
      }
    } finally {
      try {
        ztoolkit.log("[zorecto] SendController.submit finally clearing chatFlow");
      } catch {}
      this.chatFlow = undefined;
    }
  }

  /** Abort the current chat flow, if any. */
  abort(): void {
    try {
      ztoolkit.log("[zorecto] SendController.abort invoked (UI stop)", {
        hasChatFlow: Boolean(this.chatFlow),
      });
    } catch {}
    try { this.chatFlow?.abort(createAbortError()); } catch {}
  }
}
