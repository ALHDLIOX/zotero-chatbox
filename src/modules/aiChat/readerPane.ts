/**
 * Reader Item Pane registration and UI management for AI Chat
 */

import { getString } from "../../utils/locale";
import {
  getSession,
  setSession,
  createSession,
  addMessage,
  updateStatus,
  generateMessageId,
  clearMessages,
  type Session,
  type Message,
  type DocumentContext,
} from "./session";
import { sendChat } from "./provider";
import { validatePrefs } from "./prefs";

// AbortController for canceling requests
let currentAbortController: AbortController | null = null;

/**
 * Register the AI Chat Reader Item Pane section
 */
export function registerReaderItemPane() {
  Zotero.ItemPaneManager.registerSection({
    paneID: "ai-chat-pane",
    pluginID: addon.data.config.addonID,
    header: {
      l10nID: "aichat-panel-title",
      icon: "chrome://zotero/skin/16/universal/chat-bubble.svg",
    },
    sidenav: {
      l10nID: "aichat-panel-title",
      icon: "chrome://zotero/skin/20/universal/chat-bubble.svg",
    },
    bodyXHTML: `
      <html:div style="padding: 10px; display: flex; flex-direction: column; height: 100%; font-family: system-ui;">
        <html:div id="ai-chat-status" style="margin-bottom: 10px; padding: 8px; background: #f5f5f5; border-radius: 4px; font-size: 12px;"></html:div>
        <html:div id="ai-chat-messages" style="flex: 1; overflow-y: auto; margin-bottom: 10px; border: 1px solid #ddd; border-radius: 4px; padding: 10px; background: #fff;"></html:div>
        <html:div style="display: flex; flex-direction: column; gap: 8px;">
          <html:textarea
            id="ai-chat-input"
            placeholder=""
            data-l10n-id="aichat-input-placeholder"
            style="width: 100%; min-height: 60px; padding: 8px; border: 1px solid #ddd; border-radius: 4px; resize: vertical; font-family: system-ui; font-size: 13px;"
          ></html:textarea>
          <html:div style="display: flex; gap: 8px;">
            <html:button
              id="ai-chat-send-btn"
              data-l10n-id="aichat-button-send"
              style="flex: 1; padding: 8px 16px; background: #0a84ff; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 13px;"
            >发送</html:button>
            <html:button
              id="ai-chat-clear-btn"
              data-l10n-id="aichat-button-clear"
              style="padding: 8px 16px; background: #f5f5f5; color: #333; border: 1px solid #ddd; border-radius: 4px; cursor: pointer; font-size: 13px;"
            >清除</html:button>
          </html:div>
        </html:div>
      </html:div>
    `,
    onItemChange: ({ item, setEnabled, tabType }) => {
      setEnabled(tabType === "reader");
      return true;
    },
    onRender: async ({ body, item }) => {
      if (!item) return;

      const tabId = getReaderTabId(item);
      let session = getSession(tabId);

      if (!session) {
        // Create new session with context detection
        const context = await detectDocumentContext(item);
        session = createSession(context);
        setSession(tabId, session);
      }

      // Update status display
      updateStatusDisplay(body, session);

      // Setup event handlers
      setupEventHandlers(body, item, tabId);

      // Render existing messages
      renderMessages(body, session);
    },
    onToggle: ({ item }) => {
      ztoolkit.log("AI Chat section toggled", item?.id);
    },
    onDestroy: () => {
      // Cleanup abort controller
      if (currentAbortController) {
        currentAbortController.abort();
        currentAbortController = null;
      }
    },
  });
}

/**
 * Get a unique tab ID for the reader
 */
function getReaderTabId(item: Zotero.Item): string {
  return `reader-${item.id}`;
}

/**
 * Detect document context (fulltext and page mapping)
 */
async function detectDocumentContext(
  item: Zotero.Item,
): Promise<DocumentContext> {
  let hasFulltext = false;
  let hasPageMap = false;

  try {
    // Get the PDF attachment item
    let pdfAttachment: Zotero.Item | null = null;

    if (item.isAttachment() && item.isPDFAttachment()) {
      // Item itself is a PDF attachment
      pdfAttachment = item;
    } else {
      // Item is a regular item, try to get its first PDF attachment
      const attachmentIDs = item.getAttachments();
      if (attachmentIDs.length > 0) {
        for (const attachmentID of attachmentIDs) {
          const attachment = Zotero.Items.get(attachmentID);
          if (attachment && attachment.isPDFAttachment()) {
            pdfAttachment = attachment;
            break;
          }
        }
      }
    }

    if (pdfAttachment) {
      // Check if attachment has fulltext indexed
      const fulltextStatus =
        await Zotero.Fulltext.getIndexedState(pdfAttachment);
      hasFulltext = fulltextStatus === Zotero.Fulltext.INDEX_STATE_INDEXED;
      hasPageMap = true; // PDF attachments generally have page mapping
    }
  } catch (error) {
    ztoolkit.log("Error detecting document context", error);
  }

  return { hasFulltext, hasPageMap };
}

/**
 * Update status display
 */
function updateStatusDisplay(body: HTMLElement, session: Session) {
  const statusDiv = body.querySelector("#ai-chat-status") as HTMLDivElement;
  if (!statusDiv) return;

  const hasContext = session.context.hasFulltext || session.context.hasPageMap;
  statusDiv.textContent = hasContext
    ? getString("aichat-status-context-loaded")
    : getString("aichat-status-no-context");
}

/**
 * Setup event handlers for chat input and buttons
 */
function setupEventHandlers(
  body: HTMLElement,
  item: Zotero.Item,
  tabId: string,
) {
  const input = body.querySelector("#ai-chat-input") as HTMLTextAreaElement;
  const sendBtn = body.querySelector("#ai-chat-send-btn") as HTMLButtonElement;
  const clearBtn = body.querySelector(
    "#ai-chat-clear-btn",
  ) as HTMLButtonElement;

  if (!input || !sendBtn || !clearBtn) return;

  // Shift+Enter to send
  input.addEventListener("keydown", (e: KeyboardEvent) => {
    if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      handleSend(body, item, tabId);
    }
  });

  // Send button click
  sendBtn.addEventListener("click", () => {
    handleSend(body, item, tabId);
  });

  // Clear button click
  clearBtn.addEventListener("click", () => {
    handleClear(body, tabId);
  });
}

/**
 * Handle send button/Shift+Enter
 */
async function handleSend(
  body: HTMLElement,
  item: Zotero.Item,
  tabId: string,
) {
  const input = body.querySelector("#ai-chat-input") as HTMLTextAreaElement;
  const sendBtn = body.querySelector("#ai-chat-send-btn") as HTMLButtonElement;
  const session = getSession(tabId);

  if (!session || !input || !sendBtn) return;

  const userMessage = input.value.trim();
  if (!userMessage) return;

  // Validate settings first
  const validation = validatePrefs();
  if (!validation.valid) {
    showError(body, validation.errors.join("; "));
    return;
  }

  // Add user message to session
  const userMsg: Message = {
    id: generateMessageId(),
    role: "user",
    content: userMessage,
    timestamp: Date.now(),
  };
  addMessage(tabId, userMsg);
  renderMessages(body, getSession(tabId)!);

  // Clear input
  input.value = "";

  // Update UI state
  updateStatus(tabId, "sending");
  sendBtn.textContent = getString("aichat-button-stop");
  sendBtn.style.background = "#ff3b30";

  // Create abort controller
  currentAbortController = new AbortController();

  try {
    // Prepare assistant message for streaming
    const assistantMsg: Message = {
      id: generateMessageId(),
      role: "assistant",
      content: "",
      timestamp: Date.now(),
    };
    addMessage(tabId, assistantMsg);

    updateStatus(tabId, "streaming");

    // Send chat with streaming
    const result = await sendChat({
      messages: getSession(tabId)!.messages,
      signal: currentAbortController.signal,
      onChunk: (chunk: string) => {
        const currentSession = getSession(tabId);
        if (currentSession) {
          const lastMsg =
            currentSession.messages[currentSession.messages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            lastMsg.content += chunk;
            renderMessages(body, currentSession);
          }
        }
      },
    });

    // Update final result
    const currentSession = getSession(tabId);
    if (currentSession) {
      currentSession.lastResult = result;
      setSession(tabId, currentSession);
    }

    updateStatus(tabId, "idle");
  } catch (error: any) {
    ztoolkit.log("Send chat error", error);

    if (error.message !== "请求已中止") {
      showError(body, error.message || "发送失败");
    }

    updateStatus(tabId, "idle");
  } finally {
    // Reset button
    sendBtn.textContent = getString("aichat-button-send");
    sendBtn.style.background = "#0a84ff";
    currentAbortController = null;
  }
}

/**
 * Handle clear button
 */
function handleClear(body: HTMLElement, tabId: string) {
  clearMessages(tabId);
  renderMessages(body, getSession(tabId)!);
}

/**
 * Render chat messages
 */
function renderMessages(body: HTMLElement, session: Session) {
  const messagesDiv = body.querySelector("#ai-chat-messages") as HTMLDivElement;
  if (!messagesDiv) return;

  messagesDiv.innerHTML = "";

  if (session.messages.length === 0) {
    messagesDiv.innerHTML = `
      <html:div style="text-align: center; color: #999; padding: 20px; font-size: 13px;">
        开始对话...
      </html:div>
    `;
    return;
  }

  const doc = body.ownerDocument;
  if (!doc) return;

  for (const message of session.messages) {
    const messageEl = doc.createElementNS(
      "http://www.w3.org/1999/xhtml",
      "div",
    ) as HTMLElement;
    messageEl.style.cssText = `
      margin-bottom: 12px;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      line-height: 1.5;
      ${
        message.role === "user"
          ? "background: #e3f2fd; text-align: right;"
          : "background: #f5f5f5; text-align: left;"
      }
    `;

    const roleLabel = message.role === "user" ? "你" : "AI";
    const content = message.content || "...";

    messageEl.innerHTML = `
      <html:div style="font-weight: bold; margin-bottom: 4px; color: #666; font-size: 11px;">
        ${roleLabel}
      </html:div>
      <html:div style="white-space: pre-wrap; word-wrap: break-word;">
        ${escapeHtml(content, doc)}
      </html:div>
    `;

    messagesDiv.appendChild(messageEl);
  }

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Show error message
 */
function showError(body: HTMLElement, errorMessage: string) {
  const messagesDiv = body.querySelector("#ai-chat-messages") as HTMLDivElement;
  if (!messagesDiv) return;

  const doc = body.ownerDocument;
  if (!doc) return;

  const errorEl = doc.createElementNS(
    "http://www.w3.org/1999/xhtml",
    "div",
  ) as HTMLElement;
  errorEl.style.cssText = `
    margin-bottom: 12px;
    padding: 10px;
    border-radius: 6px;
    background: #ffebee;
    color: #c62828;
    font-size: 13px;
    border-left: 4px solid #ef5350;
  `;
  errorEl.textContent = `错误: ${errorMessage}`;

  messagesDiv.appendChild(errorEl);
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string, doc: Document): string {
  const div = doc.createElementNS("http://www.w3.org/1999/xhtml", "div");
  div.textContent = text;
  return div.innerHTML as string;
}
