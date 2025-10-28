# Task Plan: AI Chat Sidebar

**Branch**: `001-ai-chat-sidebar` | **Spec**: [spec.md](./spec.md)

This document breaks down the implementation of the AI Chat Sidebar feature into actionable tasks.

## Phase 1: Setup

- [ ] T001 Create the directory structure outlined in `plan.md` (`src/modules/chatbox/`, `addon/content/chatbox.xhtml`, `test/chatbox.test.ts`).

## Phase 2: Foundational

- [ ] T002 [P] Define the `Message`, `ChatResult`, and `Settings` types in `typings/chatbox.d.ts` based on `data-model.md`.
- [ ] T003 [P] Define the `LLMProvider` interface in `src/modules/chatbox/provider.ts`.
- [ ] T004 Implement a mock `LLMProvider` for testing purposes in `test/mocks/provider.ts`.

## Phase 3: User Story 1 - View and Interact with AI Chat Sidebar

**Goal**: Users can see and interact with the basic chat sidebar.
**Independent Test**: A user can open a PDF, see the sidebar, send a message, and receive a mock response.

- [ ] T005 [US1] Create the basic UI layout for the chat sidebar in `addon/content/chatbox.xhtml`.
- [ ] T006 [US1] Add CSS for the chat sidebar in `addon/content/zoteroPane.css` to match the Zotero 7 UI.
- [ ] T007 [US1] In `src/addon.ts`, add the logic to inject the `chatbox.xhtml` panel into the Zotero reader's sidebar.
- [ ] T008 [US1] Implement the UI logic in `src/modules/chatbox/ui.ts` to handle message input and display.
- [ ] T009 [US1] Implement the state management logic in `src/modules/chatbox/state.ts` to manage the conversation history.
- [ ] T010 [US1] Implement the logic to detect the presence of a full-text index and display the context status in the sidebar.
- [ ] T011 [US1] Integrate the mock provider to simulate sending and receiving messages.

## Phase 4: User Story 2 - Interrupt and Clear Chat

**Goal**: Users can stop streaming responses and clear the chat history.
**Independent Test**: A user can interrupt a (mock) streaming response and clear the chat history without losing the document context.

- [ ] T012 [US2] Add a "Stop" button to the UI in `addon/content/chatbox.xhtml`.
- [ ] T013 [US2] Implement the `AbortSignal` logic in the `LLMProvider` interface and the chat-sending logic.
- [ ] T014 [US2] Implement the UI logic in `src/modules/chatbox/ui.ts` to handle the "Stop" button click.
- [ ] T015 [US2] Add a "Clear" button to the UI in `addon/content/chatbox.xhtml`.
- [ ] T016 [US2] Implement the UI logic in `src/modules/chatbox/ui.ts` to handle the "Clear" button click, clearing the chat history from the state.

## Phase 5: User Story 3 - Configure AI Provider Settings

**Goal**: Users can configure the AI provider settings in the Zotero preferences.
**Independent Test**: A user can open the preferences, change the AI provider settings, and the new settings are reflected in the chat sidebar.

- [ ] T017 [US3] Add the new settings fields to the preferences UI in `addon/content/preferences.xhtml`.
- [ ] T018 [US3] Add the logic to `src/modules/preferenceScript.ts` to save and load the new settings.
- [ ] T019 [US3] Update `src/utils/prefs.ts` to include the new preference keys.
- [ ] T020 [US3] Implement the DeepSeek provider as the first real `LLMProvider` implementation in `src/modules/chatbox/provider.ts`.
- [ ] T021 [US3] Update the chat logic to use the configured provider and settings from the preferences.

## Phase 6: Polish & Cross-Cutting Concerns

- [ ] T022 Add localization strings for all new UI elements to `addon/locale/en-US/mainWindow.ftl`.
- [ ] T023 Implement error handling for token limits, network errors, and authentication failures, displaying appropriate messages in the UI.
- [ ] T024 Write unit tests for the `DeepSeek` provider and the state management logic in `test/chatbox.test.ts`.
- [ ] T025 Manually test the entire feature according to the scenarios in `quickstart.md`.

## Dependencies

-   **User Story 1** is the foundation for all other user stories.
-   **User Story 2** depends on User Story 1.
-   **User Story 3** depends on User Story 1.

## Parallel Execution

-   Within each user story phase, UI and logic tasks can often be parallelized (e.g., `T005` and `T008`).
-   The foundational tasks in Phase 2 can be done in parallel.

## Implementation Strategy

The implementation will follow the phases outlined above, starting with the foundational setup and then implementing each user story in priority order. This allows for an incremental build, with the core MVP (User Story 1) being delivered first.