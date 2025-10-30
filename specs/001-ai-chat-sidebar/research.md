# Research: AI Chat Sidebar

Date: 2025-10-29  
Branch: 001-ai-chat-sidebar  
Spec: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/001-ai-chat-sidebar/spec.md

## Goals

- Resolve all NEEDS CLARIFICATION items from plan.md
- Align API usage with Zotero 7 for Developers guidance (Firefox ESR 115 platform)
- Lock decisions for design and contracts with unambiguous behaviors

---

## Runtime Alignment (Zotero 7)

Decision: Target the Zotero 7 runtime (Firefox ESR 115). Use modern platform features and official plugin APIs:

- Preference pane registration via `Zotero.PreferencePanes.register(...)` (plugin-managed prefs UI)
- Custom Item Pane sections via `Zotero.ItemPaneManager.registerSection(...)`
- Optional custom Info rows via `Zotero.ItemPaneManager.registerInfoRow(...)`
- Reader UI hooks via `Zotero.Reader.registerEventListener(...)` (not required for this feature)
- Default prefs loaded from `prefs.js` at plugin root; runtime strings managed via Fluent `.ftl`
- ESM imports via `ChromeUtils.importESModule(...)`; IO via `IOUtils`/`PathUtils` if needed

Rationale:

- These are the officially documented APIs for preferences, item pane extension points, and reader integrations in Zotero 7.
- Aligns with Firefox 115 capabilities (AbortController, Streams) and avoids deprecated XUL overlay patterns.

Alternatives considered:

- Manual DOM injection into the item pane. Rejected in favor of `ItemPaneManager` official API and lifecycle.
- Legacy `.properties`/`.dtd` localization. Rejected in favor of Fluent.

---

## API Calls: HTTP, Streaming, Cancellation, Errors

Decision: Use built-in `fetch` with `AbortController` and Streams to call OpenAI-compatible Chat Completions endpoints. Parse `text/event-stream` for incremental output when `stream: true` is requested.

Request model (OpenAI‑compatible):

- URL: `{endpoint}/v1/chat/completions`
- Method: `POST`
- Headers: `Authorization: Bearer {apiKey}`, `Content-Type: application/json`
- Body (streaming): `{ model, messages, stream: true }`
- Body (non‑streaming fallback): `{ model, messages }`

Streaming parsing:

- Read `response.body` via `getReader()` and decode using `TextDecoder`.
- Split on lines and process lines prefixed with `data:`; ignore other SSE fields.
- For each `data:` payload, parse JSON and append `choices[].delta.content` to the UI.
- Stop on a `data: [DONE]` message or when `AbortController` aborts.

Cancellation & timeout:

- Create an `AbortController` per request. Bind the UI “Stop” to `controller.abort()`.
- Apply a configurable timeout (default 60s) implemented via `AbortController`.
- Do not auto‑retry failed generations; user can resend.

Error mapping (user‑visible, Simplified Chinese):

- Network error/timeout → “模型响应超时或网络异常，请重试”
- 401/403 (auth) → “API Key 无效或已过期”
- 413/400 token limit (provider‑specific) → “文档过长，无法作为上下文发送（token 超限）”
- Unknown server error → “服务异常，请稍后再试”

Security & transport:

- Enforce HTTPS endpoints; HTTP is not supported.
- Never log API keys; mask any sensitive values in diagnostics.

Notes on platform behavior:

- In Zotero 7’s privileged runtime, `fetch` and Streams APIs are available. CORS/credential semantics follow the platform; no special Zotero‑specific HTTP API is required for third‑party calls.

Alternatives considered:

- WebSockets for streaming. Rejected to maximize compatibility with OpenAI‑style providers and minimize complexity.
- Custom XHR/SAX‑style parser. Rejected; Streams + SSE line parsing is simpler and standard.

---

## Document Context: Full‑text index with page mapping

Decision: Query Zotero’s full‑text subsystem to determine whether the current PDF attachment has an indexed full‑text with page mapping and expose a boolean and summary to the UI.

Rationale:

- Full‑text index/state is managed by Zotero; querying internal APIs is authoritative versus heuristic file checks.

Implementation pattern:

- Identify the current reader tab’s item and PDF attachment.
- Query full‑text index availability and page mapping metadata from Zotero’s full‑text API.
- Reflect state in localized UI strings in the section header/body.

Alternatives considered:

- Heuristic detection via local file probing or annotations. Rejected due to fragility.
- Persisting derived context to disk. Rejected; session state is per item/tab only.

---

## Preferences: Keys, validation, and UI

Decision: Store provider settings in Zotero preferences under the plugin’s `prefsPrefix` and register a preference pane via `Zotero.PreferencePanes.register(...)`.

Keys:

- `${prefsPrefix}.provider`
- `${prefsPrefix}.endpoint`
- `${prefsPrefix}.model`
- `${prefsPrefix}.apiKey`

UI & validation:

- Preference pane defined in `.xhtml` with strings in `.ftl` (Simplified Chinese).
- Validate required fields (endpoint, model, apiKey) before save and at send time.
- Changes take effect immediately; no Zotero restart required.

Security:

- Store API key in preferences for this feature scope. Do not print in logs; redact in error reports.

Alternatives considered:

- External JSON config. Rejected; Zotero preferences are the canonical store and simplify testing.
- OS login manager. Not required for this feature scope.

---

## Reader Item Pane: Structure and lifecycle

Decision: Register a custom section with `Zotero.ItemPaneManager.registerSection(...)` and render only when `tabType === "reader"`.

Behavior:

- Header: localized label and icon; dynamic status text (“文档上下文：已载入” / “无文档上下文”).
- Body: chat transcript, input area, Send/Stop toggle, Clear button; Clear preserves only the document‑level context flags.
- Lifecycle: use `onRender` for initial layout; defer any long work to async tasks to keep UI responsive.

Optional reader hooks:

- If needed later, use `Zotero.Reader.registerEventListener(...)` to augment reader UI (not required for the sidebar section itself).

Alternatives considered:

- Manual DOM injection. Rejected; official API provides lifecycle management and automatic cleanup on uninstall/disable.

---

## Testing

Decision: Use the repository’s test harness to cover preferences validation, session state transitions, and section registration.

- Unit: preferences validation; session state transitions (Idle → Sending → Streaming → Stopped; Clear resilience)
- Integration (smoke): plugin initializes and the custom section registers under a reader context

---

## Summary of Resolutions

- HTTP/streaming: `fetch` + AbortController + SSE line parsing; HTTPS only; clear error mapping
- Full‑text detection: query Zotero’s full‑text subsystem; expose presence + page‑map status
- Preferences: store under `prefsPrefix`; immediate effect; validation and masking rules
- Item Pane: implement via `Zotero.ItemPaneManager.registerSection`; localized strings; responsive rendering

All decisions are aligned with Zotero 7’s documented APIs and Firefox ESR 115 capabilities.
