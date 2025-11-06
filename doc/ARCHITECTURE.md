# Architecture

This document describes the project layout and the responsibilities and
interactions of the main modules after the refactor to a feature domain named
"chat" under `src/chat`.

## Directory Layout

- `src/`
  - `index.ts` – bootstrap of the Addon instance in the Zotero runtime
  - `addon.ts` – Addon class; data bag and lifecycle dispatcher
  - `hooks.ts` – lifecycle entry points (startup/shutdown, window load/unload,
    preferences UI events)
  - `chat/` – Chat feature domain (high cohesion)
    - `ui/` – DOM, panel wiring, and user interactions
      - `pane/` – Reader pane registration and styles
        - `readerPane.ts` – registers the Reader side pane and controls the view
        - `paneStyles.ts` – stylesheet injection (`zorecto.css`, KaTeX CSS)
      - `messages/` – message DOM and interactions
        - `messageView.ts` – message DOM nodes and incremental rendering
        - `messageActions.ts` – copy/note actions for assistant messages
      - `controls/` – reusable UI parts (buttons, menus, status, welcome)
        - `actionButtons.ts`, `presetMenu.ts`, `statusBar.ts`, `welcomeBlock.ts`
      - `utils/` – small UI helpers
        - `inputAutoResize.ts`, `icons.ts`
      - `prefs/` – Preferences pane UI
        - `preferencesPane.ts`, `preferencesUi.ts`, `prefs.ts`
    - `state/`
      - `sessionStore.ts` – in‑memory session state (messages/context/status)
    - `services/`
      - `clipboard.ts` – copy text with progressive fallbacks
      - `documentContext.ts` – collect/rehydrate document context from Zotero items
      - `readerNavigation.ts` – open Reader and navigate to page / highlight quote
      - `sessionScope.ts` – derive session id + scope based on UI context
    - `render/`
      - `shared/`
        - `markdown.ts` – Markdown + math tokenization (no DOM side effects)
        - `mathKatex.ts` – KaTeX rendering (bundled module or global fallback)
        - `inlineUtils.ts` – shared inline helpers (escape, attributes)
        - `index.ts` – re‑exports shared utilities
      - `chat/`
        - `blocks.ts` – block renderer for chat (blocks → DOM fragment)
        - `inline.ts` – inline renderer for chat (KaTeX + sanitizer)
        - `sanitizer.ts` – sanitizer for chat inline HTML fragments
        - `html.ts` – orchestrates chat render (parse → blocks → sanitize)
        - `index.ts` – facade for chat rendering
      - `note/`
        - `blocks.ts` – block renderer for notes (with citations)
        - `inline.ts` – inline renderer for notes (no KaTeX)
        - `sanitizer.ts` – strict inline sanitizer utilities for notes
        - `html.ts` – orchestrates note render (parse → blocks)
        - `index.ts` – facade for note rendering
    - `providers/`
      - `chatClient.ts` – LLM request/streaming + error model
      - `providerPresets.ts` – built‑in provider presets (endpoint/model/labels)
      - `index.ts` – public facade for provider APIs
    - `prefs.ts` – preset selection + API key storage + validation
  - `shared/`
    - `locale.ts` – Fluent helper (init/lookup)
    - `ztoolkit.ts` – Zotero Toolkit setup and defaults
    - `prefs.ts` – typed plugin preferences helpers
    - `window.ts` – light window‑liveness helper
- `addon/` – runtime assets and localization (shipped as is)
  - `content/` – styles (`zorecto.css`, `global.css`, etc.), vendor KaTeX files
  - `locale/` – Fluent `.ftl` resources
  - `bootstrap.js`, `manifest.json`, `prefs.js`

## Dependency Direction

High‑level dependency flow (one‑way):

- `ui` → `state`, `services`, `render`, `providers`
- `services` → Zotero platform, Reader, clipboard, PDF worker
- `render` → `markdown`, `math`, `sanitize` (pure, testable)
- `state` → in‑memory only (pure)
- `providers` → network (fetch), presets, error mapping

`render` and `state` do not depend on Zotero or DOM APIs, which keeps the core
logic portable and unit‑test‑friendly.

## UI and Styling

- The Reader pane is registered from `chat/ui/pane/readerPane.ts`.
- The message list and interactions live in `chat/ui/messages/messageView.ts`.
- Stylesheets are injected by `chat/ui/pane/paneStyles.ts`:
  - Chat stylesheet: `chrome://<addonRef>/content/zorecto.css`
  - KaTeX stylesheet: `chrome://<addonRef>/content/vendor/katex.min.css`
- Global tokens (`global.css`) are derived by path (`zorecto.css` → `global.css`) and
  injected once when present.

Note: Runtime CSS files live in `addon/content/` and are not moved; the code only
injects links to these shipped assets.

## Rendering Pipeline (Chat)

1. `render/shared/markdown.ts` tokenizes Markdown blocks and inline tokens with
   math support (inline `$...$`, block `$$...$$`, `\(\)`, `\[\]`).
2. `render/chat/blocks.ts` converts blocks into DOM nodes (uses
   `render/chat/inline.ts`), then `render/chat/html.ts` sanitizes fragments via
   `render/chat/sanitizer.ts`.
3. The result is a `DocumentFragment` plus HTML string; math errors are surfaced
   as a hint to UI.

Security notes:
- Allowed tags are narrowly scoped (`p`, `strong`, lists, basic table tags, etc.).
- Links must use `https:` or `mailto:`; `rel="noopener noreferrer"` is enforced.
- KaTeX classes are whitelisted to avoid stripping structural nodes.

## Rendering Pipeline (Notes)

- `render/note/html.ts` outputs Zotero‑note‑compatible HTML without KaTeX. It:
  - Restricts headings to H1–H3.
  - Inlines bold/emphasis and turns newlines into `<br>`.
  - Extracts inline `((cite: {...}))` markers into block citation nodes with
    `data-citation-items` and `data-citation` attributes expected by Zotero.

## Session State

- `state/sessionStore.ts` maintains per‑scope sessions in memory:
  - `messages`: chat logs
  - `context`: collected document text, flags, contributing attachment IDs
  - `status`: `idle` | `sending` | `streaming` | `stopped`
- `sessionScope.ts` derives a stable `sessionId` and `scopeKey` from the UI
  context (reader tab, item pane, attachment view) to isolate conversations.

## Services

- `documentContext.ts` collects relevant PDF attachments from the current reader/item and
  hydrates a combined text via `Zotero.PDFWorker.getFullText`. It also builds an
  "Allowed Attachments" section to guide the model so that inline citation markers
  only reference valid attachments.
- `readerNavigation.ts` opens the Reader (if needed) and navigates to a page; optionally
  triggers a find operation to highlight a short quote.
- `clipboard.ts` copies text using modern Clipboard API, Zotero’s internal helper,
  or a secure `execCommand` fallback.

## Providers

- `providers/chatClient.ts` handles chat completion calls:
  - Appends a system prompt with formatting and inline citation rules.
  - Validates settings (preset + API key); maps HTTP/network/auth/token‑limit errors
    to a unified `ProviderError`.
  - Supports streaming via `text/event-stream` (SSE‑style) with `onToken` callback.
  - Timeouts/abort are supported with an AbortController or a safe noop fallback.
- `providers/providerPresets.ts` enumerates built‑in presets (provider, endpoint, model).
- `chat/ui/prefs/prefs.ts` persists preset choice and provider API keys in Zotero prefs.

### Adding a New Provider (Overview)

1. Add a preset entry to `chat/providers/providerPresets.ts`.
2. If the API differs from OpenAI‑style endpoints, adapt `chatClient.ts`
   (request/response parsing); keep the error mapping consistent.
3. Ensure the settings UI (`chat/ui/prefs/preferencesUi.ts`) covers your provider
   (label localization, endpoint visibility if needed).

## Internationalization (Fluent)

- `shared/locale.ts` initializes a Fluent bundle and provides `getString()` and
  `getLocaleID()` helpers; FTL resources ship in `addon/locale/*`.
- Message IDs are prefixed with `<addonRef>-` automatically.

## Naming and Conventions

- Filenames use lowerCamelCase (e.g., `readerPane.ts`, `messageView.ts`).
- Types/interfaces use `PascalCase`.
- Relative imports only (no path aliases).
- Each domain exposes a small facade (`chat/providers/index.ts`).

## Build and Runtime

- Build is driven by `zotero-plugin-scaffold` (`zotero-plugin.config.ts`). The
  TypeScript bundle (entry: `src/index.ts`) is emitted to
  `addon/content/scripts/<addonRef>.js` and loaded by the add‑on.
- `addon/` content and locale resources are copied as runtime assets.

## Testing Guidance

- Prefer unit tests for pure modules:
  - `chat/render/shared/*`, `chat/render/chat/*`, `chat/render/note/*`
    (markdown, sanitize, math → deterministic)
  - `chat/state/session.ts` (pure state transitions)
- Services and UI depend on Zotero/runtime; prefer integration or manual tests.

## Security Considerations

- Sanitizer blocks unknown tags/attributes and event handlers.
- Links are restricted to known schemes and are forced to open safely.
- KaTeX rendering disables error throwing and ignores `strict` mode to avoid
  crashes, while still surfacing math issues to the UI layer.

---

This layout keeps the chat feature cohesive (`src/chat`) while separating
platform‑dependent services from pure rendering/state logic, making it easier to
evolve and test individual parts without coupling them to Zotero internals.
