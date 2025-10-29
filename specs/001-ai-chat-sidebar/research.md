# Research: AI Chat Sidebar

Date: 2025-10-29  
Branch: 001-ai-chat-sidebar  
Spec: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/001-ai-chat-sidebar/spec.md

## Goals

- Resolve all NEEDS CLARIFICATION items from plan.md
- Capture best practices for template-aligned implementation in Zotero 7
- Lock decisions for design and contracts

---

## 1) Document Context: Full‑text index with page mapping

Decision: Use Zotero’s full‑text subsystem to determine if a PDF attachment has an indexed full‑text with page mapping; expose a boolean and summary for the Reader Item Pane.

Rationale:
- Zotero manages full‑text indexes internally; the canonical check should rely on the Zotero API rather than manual file parsing.
- The Reader Item Pane can be updated synchronously (status bar) and asynchronously (details) using the template’s `registerSection` lifecycle.

Implementation Pattern (planned):
- Identify the currently opened reader tab’s parent item and PDF attachment.
- Query full‑text index state via Zotero’s full‑text API (e.g., `Zotero.Fulltext` module) to determine:
  - Whether the attachment is indexed
  - Whether page mapping metadata exists
- Provide a small summary string (Chinese) via `.ftl` for the section header and body.

Alternatives considered:
- Heuristic detection via annotations or by probing the attachment file directly. Rejected due to fragility and deviation from platform capabilities.
- Persisting derived context to disk. Rejected; session is per item/tab by requirement.

---

## 2) Provider Streaming: OpenAI‑compatible integration

Decision: Support OpenAI‑compatible Chat Completions with optional streaming using `fetch` and `AbortController`. Parse `text/event-stream` for incremental tokens until `[DONE]`.

Rationale:
- Matches requirement to allow Stop (abort ongoing request) and show incremental responses.
- OpenAI‑compatible providers commonly implement the SSE `[DONE]` sentinel and `data: {"choices":[{"delta":{"content":"..."}}]}` payloads.

Implementation Pattern (planned):
- Request: `POST {endpoint}/v1/chat/completions` with headers `Authorization: Bearer {apiKey}`, `Content-Type: application/json`.
- Body: `{ model, messages, stream: true }` when streaming; without `stream` for non‑streaming fallback.
- ReadableStream: decode `text/event-stream` line by line; accumulate content into the UI; stop on `[DONE]` or abort signal.
- Errors: surface network/auth errors and token limit errors as localized messages; no auto‑truncate per spec.

Alternatives considered:
- WebSocket-based streaming. Rejected to keep provider compatibility and reduce complexity.
- Non‑streaming only. Rejected because Stop must interrupt mid‑generation.

---

## 3) Preferences: Keys, validation, and UI

Decision: Store Provider, Endpoint URL, Model, and API Key under the template’s `config.prefsPrefix` (from `package.json`). Validate required fields before save and on send.

Rationale:
- Aligns with template conventions and existing preference panel registration via `Zotero.PreferencePanes.register`.
- Keeps configuration centralized and testable.

Implementation Pattern (planned):
- Keys: `${config.prefsPrefix}.provider`, `${config.prefsPrefix}.endpoint`, `${config.prefsPrefix}.model`, `${config.prefsPrefix}.apiKey`.
- UI: Add fields to the plugin’s preferences `.xhtml`, labels/tooltips from `.ftl` strings (Simplified Chinese).
- Validation: block save if required fields empty; error messaging localized. Re‑read values dynamically (no Zotero restart required).

Alternatives considered:
- Custom JSON config file. Rejected; deviates from Zotero preferences ecosystem.
- Storing API key in plaintext elsewhere. Rejected; preferences are standard for template and simplify testing.

---

## 4) Reader Item Pane: UI structure and lifecycle

Decision: Implement via `Zotero.ItemPaneManager.registerSection` limited to `tabType === "reader"`. Use `onRender` for initial state and `onAsyncRender` for deferred work.

Rationale:
- Directly follows the template’s example for reader item pane sections.
- Satisfies requirement to show context status at load and to keep UI responsive.

Implementation Pattern (planned):
- Header l10n with dynamic status (`已载入` / `无文档上下文`).
- Body contains chat area, input, and a Send/Stop toggle button; Clear button resets session messages but retains context flags.
- Event wiring goes through a dedicated module; hooks dispatch only.

Alternatives considered:
- Injecting custom browser content only. Rejected; sections API provides richer lifecycle hooks and consistency.

---

## 5) Testing: Mocha/Chai in template

Decision: Use existing `zotero-plugin test` harness. Add unit tests for preferences validation and session state transitions; add a smoke integration test for section registration.

Rationale:
- Keeps parity with current repository’s tooling and constitution’s testing rule.

Implementation Pattern (planned):
- `test/unit/prefs.validation.test.ts`: required-field enforcement and parsing.
- `test/unit/session.state.test.ts`: Idle → Sending → Streaming → Stopped; Clear resets messages.
- `test/integration/reader.pane.smoke.test.ts`: verifies plugin initializes and section can register in a reader context.

Alternatives considered:
- Introducing a new test runner. Rejected; unnecessary complexity.

---

## Summary of Resolutions

- Full‑text context detection: Use Zotero full‑text APIs; expose presence + page‑map status to UI.
- OpenAI‑compatible streaming: `fetch` with SSE parsing and `AbortController` for Stop.
- Preferences: use `config.prefsPrefix` keys; validate required fields; immediate effect without restart.
- Reader Item Pane: implemented via `registerSection` with localized strings; responsive and non‑blocking.

All previously marked NEEDS CLARIFICATION items are now resolved by the decisions above.

