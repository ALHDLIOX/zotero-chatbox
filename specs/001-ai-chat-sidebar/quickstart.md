# Quickstart: AI Chat Sidebar

Spec: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/001-ai-chat-sidebar/spec.md

## Prerequisites

- Zotero 7 (beta or later) installed
- Node.js LTS and Git installed
- Repository cloned and template configured per root `README.md`

## Setup

1. Install dependencies and build once

```sh
npm install
npm run build
```

2. Start development server (hot reload)

```sh
npm start
```

3. In Zotero, open Preferences → “zotero-chatbox” tab and configure:

- Provider: “OpenAI-compatible” (free text)
- Endpoint URL: e.g. `https://api.openai.com`
- Model: e.g. `gpt-4o-mini`
- API Key: your key

Saving applies immediately; no restart is required.

## Try It

1. Open a PDF in the Zotero reader.
2. In the item pane, click the AI chat icon/tab to open the sidebar.
3. Check the status bar:
   - “文档上下文：已载入” if full‑text + page mapping is available.
   - “无文档上下文” otherwise.
4. Type a message and press Shift+Enter to send.
5. While the response streams, click “停止” to interrupt; the button reverts to “发送”.
6. Click “清除” to clear the chat history; the document context remains active for the next message.

## Expected Behavior

- No conversation persists across items/windows.
- Token limit exceed → error message is shown; no automatic truncation/summarization.
- Network/auth errors show localized messages.

## Notes

- All user-facing strings are implemented through `.ftl` localization and appear in Simplified Chinese.
- The chat session is in-memory per reader tab and is not persisted.
