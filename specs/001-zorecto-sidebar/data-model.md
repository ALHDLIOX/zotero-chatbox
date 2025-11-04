# Data Model: zoRecto Sidebar

Spec: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/001-zorecto-sidebar/spec.md  
Design Date: 2025-10-29

## Entities

- Message
  - Fields:
    - `role`: `"system" | "user" | "assistant"`
    - `content`: `string`
    - `timestamp`: `number` (epoch ms)
    - `id`: `string` (client‑generated)
  - Validation:
    - `role` must be one of the allowed literals
    - `content` non‑empty, trimmed

- ChatResult
  - Fields:
    - `text`: `string`
    - `usage`: `{ promptTokens?: number; completionTokens?: number; totalTokens?: number }`
    - `raw`: `unknown` (provider response payload for debugging)
  - Validation:
    - `text` may be empty only for interrupted streams

- Session
  - Fields:
    - `status`: `"idle" | "sending" | "streaming" | "stopped"`
    - `messages`: `Message[]`
    - `context`: `{ hasFulltext: boolean; hasPageMap: boolean }`
    - `lastResult?`: `ChatResult`
  - Validation:
    - `messages.length` reasonable bounds (UI‑driven)
  - Relationships:
    - `Session` contains many `Message`
    - `Session` references document‑level `context` flags (not persisted)

- Settings
  - Fields (stored under `config.prefsPrefix`):
    - `provider`: `string` (e.g., `"openai-compatible"`)
    - `endpoint`: `string` (URL)
    - `model`: `string`
    - `apiKey`: `string`
  - Validation:
    - `endpoint`, `model`, `apiKey` are required
    - `endpoint` must be a valid URL

## State Transitions

- `idle` → `sending`
  - Trigger: user presses Send with valid settings and non‑empty input

- `sending` → `streaming`
  - Trigger: server begins streaming (SSE) and yields first token

- `sending|streaming` → `stopped`
  - Trigger: user presses Stop; cancel request via `AbortController`

- `streaming|stopped` → `idle`
  - Trigger: request completes or is aborted; UI resets button to Send

- Clear
  - Effect: `messages = []`, `lastResult = undefined`, `status = "idle"`; retain `context`

## Validation Rules from Requirements

- Do not send if token limit is exceeded when building the prompt; instead, surface an error (Chinese), no truncation/summarization.
- Preferences validation prevents saving with missing required fields; errors are localized.