# Feature Specification: AI Chat Sidebar

**Feature Branch**: `001-ai-chat-sidebar`
**Created**: 2025-10-28
**Status**: Draft
**Input**: User description: "现在这个项目是一个插件模版，我要基于这个模版构建一个自己的插件..."

## User Scenarios & Testing _(mandatory)_

### User Story 1 - View and Interact with AI Chat Sidebar (Priority: P1)

As a user, I want to open a PDF in the Zotero reader and see a new AI chat sidebar in the item pane. The sidebar should indicate whether a document context is loaded, and I want to be able to send messages and receive responses.

**Why this priority**: This is the core functionality of the plugin, enabling the main user interaction with the AI model.

**Independent Test**: Can be tested by opening a PDF and verifying that the sidebar appears, displays the correct context status, and that basic chat functionality (sending/receiving messages) works.

**Acceptance Scenarios**:

1.  **Given** a PDF is open in the Zotero reader, **When** I navigate to the item pane, **Then** a new icon/tab for the AI chat sidebar is visible alongside existing panels.
2.  **Given** the AI chat sidebar is open and the PDF has a full-text index with page mapping, **When** the panel loads, **Then** a status bar at the top displays "文档上下文：已载入".
3.  **Given** the AI chat sidebar is open and the PDF does not have a full-text index or page mapping, **When** the panel loads, **Then** a status bar at the top displays "无文档上下文".
4.  **Given** I am in the chat sidebar, **When** I type a message and press Shift+Enter, **Then** the message is sent to the AI model and the response is displayed in the chat area.

---

### User Story 2 - Interrupt and Clear Chat (Priority: P2)

As a user, I want to be able to stop a streaming response from the AI and clear the conversation history without losing the document context.

**Why this priority**: Provides essential control over the chat interaction, improving user experience and allowing users to manage the conversation flow.

**Independent Test**: Can be tested by sending a message, clicking the "Stop" button during the response, and then clicking the "Clear" button to verify the chat history is cleared while only the document's index context is retained for the next message.

**Acceptance Scenarios**:

1.  **Given** a response is streaming from the AI, **When** I click the "Stop" button, **Then** the response generation is immediately aborted, and the button reverts to "Send".
2.  **Given** there are messages in the chat history, **When** I click the "Clear" button, **Then** all messages are removed from the chat window, and only the PDF full-text index context (if loaded) is retained for the next interaction.
3.  **Given** the chat is cleared, **When** I send a new message, **Then** the new message is sent along with the retained PDF index context.
4.  **Given** I switch to another item or open a new Zotero window, **When** I view the AI chat sidebar there, **Then** the previous conversation does not persist across items or windows.

---

### User Story 3 - Configure AI Provider Settings (Priority: P3)

As a user, I want to configure the AI provider settings, such as the API endpoint, model, and API key, through the Zotero preferences panel.

**Why this priority**: Allows users to customize the plugin to work with their preferred AI provider and models, making the plugin flexible and adaptable.

**Independent Test**: Can be tested by opening the Zotero preferences, navigating to the "zotero-chatbox" tab, modifying the settings, and verifying that the new settings are used for subsequent chat interactions without requiring a Zotero restart.

**Acceptance Scenarios**:

1.  **Given** I navigate to Zotero Preferences, **When** I select the "zotero-chatbox" tab, **Then** I see fields for Provider, Endpoint URL, Model, and API Key (supporting OpenAI-compatible providers).
2.  **Given** I have modified the settings, **When** I save them, **Then** the new settings are applied immediately without restarting Zotero.
3.  **Given** required fields (Endpoint URL, Model, API Key) are empty, **When** I try to save, **Then** an error message is displayed, and the settings are not saved.

### Edge Cases

- **Token Limit Exceeded**: If the document context is too large and exceeds the model's token limit, the system should display an error message ("文档过长，无法作为上下文发送（token 超限）") and not send the request. No automatic truncation or summarization fallback is performed.
- **Network Errors**: If there is a network error or the request times out, the system should display an error message ("模型响应超时或网络异常，请重试").
- **Authentication Failure**: If the API key is invalid, the system should display an error message ("API Key 无效或已过期").
- **Conversation Persistence**: When switching items or windows, conversation history does not persist across items/windows.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST add a new panel to the Zotero reader's item pane section.
- **FR-002**: The system MUST detect if the current PDF has a full-text index with page mapping.
- **FR-003**: The system MUST load the full-text index as a document-level context for the AI chat when available.
- **FR-004**: The system MUST provide a chat interface with a message input area, send/stop button, and clear button.
- **FR-005**: Users MUST be able to send messages by pressing Shift+Enter.
- **FR-006**: The system MUST allow users to interrupt streaming responses.
- **FR-007**: The system MUST allow users to clear the chat history without losing the document context.
- **FR-008**: The system MUST provide a preferences panel in Zotero to configure the AI provider (Endpoint URL, Model, API Key).
- **FR-009**: The system MUST support OpenAI-compatible AI providers configured via preferences.
- **FR-010**: The system MUST handle errors such as token limits, network issues, and authentication failures gracefully by displaying informative messages.
- **FR-011**: The system MUST NOT persist conversations across items or windows; conversation state is per-item session only. "Clear" retains only the PDF full-text index context.
- **FR-012**: All user-facing text for this feature MUST be presented in Simplified Chinese.

### Key Entities

- **Message**: Represents a single message in the chat, with a `role` (`system`, `user`, or `assistant`) and `content` (string).
- **ChatResult**: Represents the result of a chat interaction, including the response `text`, token `usage` information, and the `raw` provider response.
- **AI Provider (OpenAI-compatible)**: The configured provider used for chat requests, selected via preferences using endpoint, model, and API key.
- **Settings**: User-configurable settings stored in Zotero's preferences, including `provider`, `endpoint`, `model`, and `apiKey`.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: The AI chat sidebar is successfully added to the reader's item pane and is visible to 100% of users who install the plugin.
- **SC-002**: For documents with a valid full-text index, the document context is successfully loaded in over 99% of cases.
- **SC-003**: Users can successfully send and receive messages in the chat interface with a success rate of 99% (excluding network/provider errors).
- **SC-004**: The "Stop" button successfully interrupts a streaming response within 1 second of being clicked.
- **SC-005**: The "Clear" button clears the chat history within 500ms, while successfully retaining the document context for the session.
- **SC-006**: Changes to settings in the preferences panel are applied to new chat sessions with 100% reliability.
- **SC-007**: When token limits are exceeded, requests are not sent and a clear error is shown in 100% of cases; no truncation or summarization occurs.
- **SC-008**: Conversation history does not persist across items/windows in 100% of cases; after "Clear", only the PDF index context is retained.
- **SC-009**: 100% of user-facing text for this feature appears in Simplified Chinese.
