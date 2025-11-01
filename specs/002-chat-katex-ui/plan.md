# Implementation Plan: Chat KaTeX & UI Cleanup

**Branch**: `002-chat-katex-ui` | **Date**: 2025-11-01 | **Spec**: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/002-chat-katex-ui/spec.md
**Input**: Feature specification from `/specs/002-chat-katex-ui/spec.md`

## Summary

Constrain AI answers to Markdown with standard LaTeX math delimiters, parse and typeset math segments, and streamline UI (Settings cleanup with labels before inputs, sidebar input clarity). Architecture and design remain identical to 001.

## Technical Context

**Language/Version**: TypeScript 5.x  
**Primary Dependencies**: Zotero 7 plugin APIs, zotero-plugin-toolkit, zotero-types, Markdown parsing, KaTeX for typesetting, Fluent (.ftl) for localization  
**Storage**: N/A – in-memory per reader tab (no cross-item/window persistence)  
**Testing**: Mocha (existing repo setup), manual smoke in Zotero  
**Target Platform**: Zotero 7 runtime (Firefox ESR 115), desktop  
**Project Type**: single project (Zotero desktop plugin)  
**Performance Goals**: No visible UI jank during render; keep sidebar interactions responsive (<100ms perceived latency for input and scrolling)  
**Constraints**: Do not block UI thread; render nothing in code/inline-code; all user-facing text through localization; settings labels precede inputs  
**Scale/Scope**: Typical single-user desktop usage; multiple reader tabs; messages within standard chat limits

## Constitution Check

Gate evaluation prior to research:
- **Code Quality**: PASS — follows existing TypeScript, ESLint/Prettier conventions; no architectural changes from 001.
- **Testing Standards**: PASS — Mocha unit tests for parsing/labeling rules; smoke tests for settings and sidebar input behavior.
- **User Experience Consistency**: PASS — UI aligns with Zotero 7 patterns; labels via .ftl; settings trimmed and labeled before inputs.
- **Performance Requirements**: PASS — math parsing avoids code spans; rendering done without blocking; large math guarded by graceful fallback.

## Project Structure

### Documentation (this feature)

```text
specs/002-chat-katex-ui/
├── plan.md
├── research.md
├── data-model.md
├── quickstart.md
└── contracts/
```

### Source Code (repository root)

```text
src/
├── modules/
│   ├── aiChat/
│   │   ├── readerPane.ts         # Sidebar UI; add math-friendly rendering and input tweaks
│   │   ├── prefs.ts              # Settings UI; remove unrelated fields, ensure labels before inputs
│   │   ├── provider.ts           # Unchanged; response stream remains
│   │   └── session.ts            # Unchanged session model
│   └── preferenceScript.ts       # Preferences page script (bindings, validation)
├── utils/
│   └── locale.ts                 # Localization helpers (.ftl)
└── addon.ts / hooks.ts           # Lifecycle hooks (unchanged)

test/
├── unit/                         # Parsing rules, label presence, template-hidden tests
└── integration/                  # Settings view and sidebar smoke
```

**Structure Decision**: Single-project plugin. Changes are scoped to `src/modules/aiChat/readerPane.ts`, `src/modules/aiChat/prefs.ts`, and tests; architecture remains as in 001.

## Complexity Tracking

No constitution violations expected; no additional complexity to justify.

## Constitution Check (post-design)

- **Code Quality**: PASS — scope limited to rendering rules and UI text; follows repo style and linting.
- **Testing Standards**: PASS — unit coverage for parsing/guardrails; integration smoke for settings/sidebar.
- **User Experience Consistency**: PASS — labels before inputs; localized strings; no placeholders leaked.
- **Performance Requirements**: PASS — non-blocking render; fallback on failure; no regression expected.
