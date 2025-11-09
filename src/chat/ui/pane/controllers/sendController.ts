/** Send controller: orchestrates submit/stream/abort for chat messages. */
import {
  appendMessage,
  ensureSession,
  type SessionMessage,
} from "../../../state/sessionStore";
import { ChatFlow } from "../../../services/chatFlow";
import { buildContextMessage } from "../../../services/documentContext";
import { MessageListController } from "./messageListController";

/** Handles send/stream lifecycle, updating message list during chat interactions. */
export class SendController {
  private readonly doc: Document;
  private readonly messageList: MessageListController;

  private currentAbortController?: AbortController;
  private chatFlow?: ChatFlow;

  constructor(
    doc: Document,
    deps: {
      messageList: MessageListController;
    },
  ) {
    this.doc = doc;
    this.messageList = deps.messageList;
  }

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

    try {
      this.currentAbortController = new AbortController();
    } catch {
      this.currentAbortController = undefined;
    }

    const controller = this.currentAbortController;
    let assistant: SessionMessage | undefined;
    this.chatFlow = new ChatFlow(sessionId);

    const onToken = (token: string) => {
      if (!assistant) return;
      assistant.content += token;
      this.messageList.scheduleRender(assistant.id, assistant.content);
      this.messageList.scrollToBottom();
    };

    try {
      await this.chatFlow.start({
        onAssistant: (msg) => {
          assistant = { ...msg };
          this.messageList.ensureAndAppend(msg);
          this.messageList.scrollToBottom();
        },
        onToken,
        signal: controller?.signal,
      });
      // Streaming finished: ensure buttons are enabled now that content exists
      if (assistant) {
        this.messageList.updateEntryByMessage(assistant);
      }
    } finally {
      this.currentAbortController = undefined;
      this.chatFlow = undefined;
    }
  }

  abort(): void {
    try {
      this.currentAbortController?.abort();
    } catch {}
    try {
      this.chatFlow?.abort();
    } catch {}
  }
}
