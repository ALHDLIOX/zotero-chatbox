---

description: "Task list for 001-ai-chat-sidebar feature implementation"
---

# Tasks: AI Chat Sidebar

**Input**: Design documents from `/specs/001-ai-chat-sidebar/`
**Prerequisites**: plan.md (required), spec.md (required), research.md, data-model.md, contracts/

**Tests**: Tests are optional. This plan focuses on implementation tasks; acceptance is validated via the Independent Test criteria per story.

**Organization**: Tasks are grouped by user story (P1 → P2 → P3) to keep each increment independently deliverable and testable.

## Format: `[ID] [P?] [Story] Description`

- [P]: Can run in parallel (different files, no dependencies on incomplete tasks)
- [Story]: Which user story this task belongs to (e.g., [US1], [US2], [US3])
- Include exact file paths in descriptions

## Path Conventions

- Single plugin project: `src/` and `test/` at repository root
- Localization: `addon/locale/<lang>/`
- Preferences UI: `addon/content/preferences.xhtml`
- Preferences defaults: `addon/prefs.js`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish feature module, registration, localization, and default preferences.

- [ ] T001 Create feature module folder and `readerPane.ts` skeleton in `src/modules/aiChat/readerPane.ts`
- [ ] T002 [P] Create provider client skeleton in `src/modules/aiChat/provider.ts`
- [ ] T003 [P] Create session state skeleton in `src/modules/aiChat/session.ts`
- [ ] T004 [P] Create preferences helper skeleton in `src/modules/aiChat/prefs.ts`
- [ ] T005 Register AI Chat Reader Item Pane in `src/hooks.ts` (import and call register from `src/modules/aiChat/readerPane.ts`)
- [ ] T006 Add default preference keys for provider settings in `addon/prefs.js` (keys: `provider`, `endpoint`, `model`, `apiKey`)
- [ ] T007 [P] Add Chinese UI strings for AI Chat (panel title, status labels, buttons) in `addon/locale/zh-CN/addon.ftl`
- [ ] T008 [P] Add Chinese preference labels (Provider, Endpoint URL, Model, API Key) in `addon/locale/zh-CN/preferences.ftl`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core building blocks required by all user stories (no user story work before completing this phase).

- [ ] T009 Implement preferences accessors and validation in `src/modules/aiChat/prefs.ts` (read via `config.prefsPrefix`)
- [ ] T010 [P] Define entities and session operations in `src/modules/aiChat/session.ts` (Message, ChatResult, Session; add get/set/clear APIs)
- [ ] T011 [P] Implement OpenAI-compatible client with SSE streaming in `src/modules/aiChat/provider.ts` (sendChat, stream parsing, abort support)
- [ ] T012 Add token-limit preflight check and localized error propagation in `src/modules/aiChat/provider.ts`
- [ ] T013 [P] Add Chinese error messages (token limit, network, auth) in `addon/locale/zh-CN/addon.ftl`

**Checkpoint**: Foundation ready — proceed to user stories.

---

## Phase 3: User Story 1 - View and Interact with AI Chat Sidebar (Priority: P1) 🎯 MVP

**Goal**: Display an AI chat sidebar in the Zotero reader that shows document-context status and supports basic send/receive chat.

**Independent Test**: Open a PDF, open the sidebar, verify context status (“已载入” vs “无文档上下文”), send a message with Shift+Enter, and observe the streamed response.

### Implementation for User Story 1

- [ ] T014 [US1] Register Reader Item Pane section (header/sidenav with l10n) in `src/modules/aiChat/readerPane.ts`
- [ ] T015 [US1] Render chat UI (status, messages area, input, Send button) in `src/modules/aiChat/readerPane.ts`
- [ ] T016 [US1] Detect PDF full-text index + page map via Zotero API and update status in `src/modules/aiChat/readerPane.ts`
- [ ] T017 [US1] Implement Shift+Enter send handler to call `sendChat` and stream to UI in `src/modules/aiChat/readerPane.ts`
- [ ] T018 [US1] Read and validate settings via `src/modules/aiChat/prefs.ts`; show localized errors when missing in `src/modules/aiChat/readerPane.ts`
- [ ] T019 [US1] Scope per-reader-tab in-memory session and lifecycle in `src/modules/aiChat/session.ts` (no persistence across items/windows)

**Checkpoint**: User Story 1 independently testable and demoable (MVP).

---

## Phase 4: User Story 2 - Interrupt and Clear Chat (Priority: P2)

**Goal**: Provide Stop and Clear controls to interrupt streaming and clear chat history while retaining document context.

**Independent Test**: Send a message, click Stop during streaming (response aborts within 1s and button reverts). Click Clear to remove messages and retain context for the next message.

### Implementation for User Story 2

- [ ] T020 [US2] Implement Stop toggle UI and wiring with AbortController in `src/modules/aiChat/readerPane.ts`
- [ ] T021 [P] [US2] Handle `AbortController` correctly in streaming client in `src/modules/aiChat/provider.ts` (stop within ≤1s)
- [ ] T022 [US2] Implement Clear action to reset messages but retain context in `src/modules/aiChat/readerPane.ts` and `src/modules/aiChat/session.ts`
- [ ] T023 [US2] Ensure session isolation across items/windows in `src/modules/aiChat/session.ts` (no cross-item/window persistence)

**Checkpoint**: User Stories 1 and 2 both independently functional.

---

## Phase 5: User Story 3 - Configure AI Provider Settings (Priority: P3)

**Goal**: Allow users to configure Provider, Endpoint URL, Model, and API Key in Zotero Preferences; apply immediately.

**Independent Test**: Open Preferences → “zotero-chatbox” tab, modify fields, save; verify new settings are used by subsequent chats without restart; saving blocked if required fields empty.

### Implementation for User Story 3

- [ ] T024 [US3] Add Provider/Endpoint/Model/API Key fields to prefs UI in `addon/content/preferences.xhtml` (with appropriate `data-l10n-id`)
- [ ] T025 [P] [US3] Add Chinese l10n entries for new fields and validation messages in `addon/locale/zh-CN/preferences.ftl`
- [ ] T026 [US3] Bind prefs validation and events in `src/modules/preferenceScript.ts` (block save when required fields missing)
- [ ] T027 [US3] Ensure `src/modules/aiChat/provider.ts` reads current settings on each request (no restart required)

**Checkpoint**: All three user stories independently functional.

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Localization completeness, cleanup, and manual quickstart validation.

- [ ] T028 [P] Add English fallback l10n for new keys in `addon/locale/en-US/addon.ftl` and `addon/locale/en-US/preferences.ftl`
- [ ] T029 Run quickstart validation steps in `/specs/001-ai-chat-sidebar/quickstart.md`
- [ ] T030 [P] Lint and format the codebase (`eslint`/`prettier`) at repository root

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup — blocks all user stories
- User Stories (Phase 3+): Depend on Foundational completion; work in priority order or parallel by team
- Polish: After targeted user stories are complete

### User Story Dependencies

- User Story 1 (P1): No dependency on other stories; requires Foundational
- User Story 2 (P2): No dependency on US1 by design; shares foundation; integrates with US1 UI but should remain independently testable
- User Story 3 (P3): No dependency on US1/US2; requires Foundational; updates preferences UI that US1 reads dynamically

### Within Each User Story

- Models before services; services before UI wiring where applicable
- Core implementation before integration
- Validate against Independent Test criteria before moving on

### Parallel Opportunities

- Setup: T002, T003, T004, T007, T008 can run in parallel (different files)
- Foundational: T010, T011, T013 can run in parallel
- US2: T021 can proceed in parallel with T020 (different files)
- US3: T025 can proceed in parallel with T024/T026/T027 (different files)
- Polish: T028 and T030 can run in parallel

---

## Parallel Examples

### User Story 1

```
Parallel prep (after Phase 2):
- Implement session operations: src/modules/aiChat/session.ts (T010)
- Implement provider streaming: src/modules/aiChat/provider.ts (T011)

Then UI wiring:
- Register + render UI + context detection + send: src/modules/aiChat/readerPane.ts (T014–T018)
```

### User Story 2

```
In parallel:
- Abort handling in provider: src/modules/aiChat/provider.ts (T021)
- Stop/clear UI wiring: src/modules/aiChat/readerPane.ts (T020, T022)
```

### User Story 3

```
In parallel:
- Preferences UI fields: addon/content/preferences.xhtml (T024)
- zh-CN l10n for prefs: addon/locale/zh-CN/preferences.ftl (T025)

Then:
- Bind prefs validation: src/modules/preferenceScript.ts (T026)
- Ensure provider reads fresh settings: src/modules/aiChat/provider.ts (T027)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1) Complete Phase 1: Setup  
2) Complete Phase 2: Foundational (blocks all stories)  
3) Complete Phase 3: User Story 1  
4) STOP and validate against Independent Test criteria  
5) Demo/release if ready

### Incremental Delivery

1) Setup + Foundational → base ready  
2) Add US1 → validate independently → demo  
3) Add US2 → validate independently → demo  
4) Add US3 → validate independently → demo  
5) Polish
