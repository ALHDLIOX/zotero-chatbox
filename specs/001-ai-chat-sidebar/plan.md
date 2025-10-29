# Implementation Plan: AI Chat Sidebar

**Branch**: `001-ai-chat-sidebar` | **Date**: 2025-10-29 | **Spec**: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/001-ai-chat-sidebar/spec.md
**Input**: Feature specification from `/specs/001-ai-chat-sidebar/spec.md`

**Note**: Generated following the specified plan workflow. All outputs conform to the Zotero Plugin Template style in `README.md` and the project constitution.

## Summary

Add an AI Chat sidebar as a new Reader Item Pane section in Zotero 7. When a PDF is opened, the sidebar shows document-context status based on the PDF’s full‑text index and page mapping. Users can chat with an OpenAI‑compatible provider, interrupt streaming with a Stop button, and clear the chat history while retaining the document context. Settings (provider endpoint, model, API key) are configurable in the Preferences panel. All user‑facing strings appear in Simplified Chinese via `.ftl` localization.

## Technical Context

**Language/Version**: TypeScript 5.x, targeting Zotero 7 runtime (Firefox platform), Node.js LTS for tooling  
**Primary Dependencies**: `zotero-plugin-toolkit`, `zotero-types`; built‑ins: `fetch`, `AbortController`, Streams API  
**Storage**: Zotero Preferences (`prefsPrefix` in `package.json`), in‑memory per‑reader‑tab session state (no persistence across items/windows)  
**Testing**: Mocha + Chai via `zotero-plugin test` (existing template setup)  
**Target Platform**: Zotero 7 desktop (Windows/macOS/Linux)  
**Project Type**: Single plugin project using the Zotero Plugin Template  
**Performance Goals**: Stop action aborts streaming within ≤1s; Clear chat ≤500ms; chat UI non‑blocking (no UI thread stalls)  
**Constraints**: No conversation persistence across items/windows; no automatic truncation/summarization on token‑limit errors; UI strings MUST use `.ftl`  
**Scale/Scope**: Single‑user desktop plugin; per‑document session sized for typical PDFs (up to model token limits)

NEEDS CLARIFICATION extracted for Phase 0 research:
- Full‑text index detection with page mapping: exact Zotero 7 API surface and best practice (Zotero.Fulltext / ItemPane / Reader APIs)
- Streaming integration pattern for OpenAI‑compatible providers in Zotero runtime (SSE vs chunked streaming, headers, CORS within Zotero)
- Preferences storage keys and validation UX specifics under template conventions

## Constitution Check

GATE pre‑research assessment (to be re‑checked post‑design):
- **Code Quality**: Will follow template ESLint/Prettier; isolate UI registration in `hooks`/module; all user strings in `.ftl`. STATUS: PASS (by design)
- **Testing Standards**: Add unit tests for settings validation and session state; integration test for plugin initialization; manual scenario steps in quickstart. STATUS: PASS (planned)
- **User Experience Consistency**: Implement as `ItemPaneManager.registerSection` in Reader; follow template localization/menus/styles. STATUS: PASS (template‑aligned)
- **Performance Requirements**: Use async fetch + `AbortController`; avoid blocking UI thread; lazy‑init context. STATUS: PASS (planned)

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-sidebar/
├── plan.md              # This file (filled by current workflow)
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
└── contracts/           # Phase 1 output (OpenAPI for provider integration)
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── aiChat/
│   │   ├── readerPane.ts      # Register Reader Item Pane section and wire UI events
│   │   ├── provider.ts        # OpenAI‑compatible request wrapper (fetch + streaming)
│   │   ├── session.ts         # In‑memory session state (messages, status, context)
│   │   └── prefs.ts           # Preferences get/set + validation helpers
│   └── ... (existing examples remain)
├── hooks.ts                   # Dispatch only; call into modules above
├── utils/locale.ts            # Localization utilities (existing)
└── addon.ts / index.ts        # Template bootstrap (existing)

test/
├── unit/
│   ├── prefs.validation.test.ts
│   └── session.state.test.ts
└── integration/
    └── reader.pane.smoke.test.ts
```

**Structure Decision**: Single template plugin. New feature lives under `src/modules/aiChat/` with clear separation of UI registration, provider I/O, session state, and preferences. Tests follow existing Mocha/Chai setup under `test/`.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| None | N/A | N/A |

## Constitution Check (Post-Design)

- Code Quality: PASS — Template ESLint/Prettier, `.ftl` localization enforced, clear module boundaries.
- Testing Standards: PASS — Unit tests and an integration smoke test planned under Mocha/Chai.
- User Experience Consistency: PASS — Implemented via Reader Item Pane section with localized UI per template.
- Performance Requirements: PASS — Async streaming, AbortController for Stop, no UI thread blocking.
