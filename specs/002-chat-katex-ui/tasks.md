---
description: "Task list for Chat KaTeX & UI Cleanup"
---

# Tasks: Chat KaTeX & UI Cleanup

**Input**: Design documents from `/specs/002-chat-katex-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL. This plan focuses on implementation tasks; use quickstart.md for validation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2)
- Include exact file paths in descriptions

## Path Conventions

- Single project: `src/`, `addon/` at repository root

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Prepare localization and assets referenced by later phases

- [X] T001 Add new localization keys `zorecto-input-label`, `zorecto-math-render-error` in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/locale/en-US/addon.ftl` and `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/locale/zh-CN/addon.ftl`
- [X] T002 [P] Create stylesheet stub for chat and math rendering in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/content/zorecto.css`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core rendering utilities and safe HTML pipeline (blocks user stories)

- [X] T003 Create Markdown parsing and math segmentation utility in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/markdown.ts` (recognize `$...`, `$$...$$`, `\(...\)`, `\[...\]`; ignore code blocks and inline-code)
- [X] T004 [P] Create math typesetting utility in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/math.ts` (accept LaTeX string, return HTML; on failure return original with error flag)
- [X] T005 [P] Create sanitizer in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/sanitize.ts` (allow headings, lists, paragraphs, code, strong/emphasis, links, math containers)
- [X] T006 Implement renderer in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/render.ts` (compose markdown.ts + math.ts + sanitize.ts to return safe `DocumentFragment` or HTML)
- [X] T007 [P] Load chat and KaTeX styles in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts` (inject `<link>` to `addon/content/zorecto.css` and KaTeX CSS if present)

**Checkpoint**: Foundation ready — user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Readable math answers (Priority: P1) 🎯 MVP

**Goal**: Render assistant answers as Markdown, typeset math segments from LaTeX delimiters; no math inside code; graceful fallback

**Independent Test**: Send prompts with inline `$a^2+b^2=c^2$` and block `$$E=mc^2$$`; verify typeset output; code blocks containing `$` remain literal

### Implementation for User Story 1

- [X] T008 [US1] Replace plaintext rendering with renderer in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts` (`updateMessageDom` uses render.ts output)
- [X] T009 [US1] Integrate renderer in streaming path in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts` (`onToken` updates message using render.ts)
- [X] T010 [US1] Show subtle error indicator when typesetting fails in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/render.ts` (use `zorecto-math-render-error` text)
- [X] T011 [US1] Ensure code blocks and inline-code bypass math rendering in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/markdown.ts`

**Checkpoint**: US1 independently delivers readable, math-formatted answers

---

## Phase 4: User Story 2 - Consistent formatting via output rules (Priority: P2)

**Goal**: Use internal output-format rules to guide consistent Markdown structure with LaTeX math delimiters

**Independent Test**: Multiple answers follow consistent headings/lists; math appears only where properly delimited

### Implementation for User Story 2

- [X] T012 [US2] Add system prompt constant (Markdown + LaTeX delimiter rules) in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/provider.ts`
- [X] T013 [US2] Inject system prompt as the first message in request body in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/provider.ts` (prepend to `messages` when sending)

**Checkpoint**: US1 and US2 both functional and independently verifiable

---

## Phase 5: User Story 3 - Streamlined Settings UI (Priority: P2)

**Goal**: Show only relevant settings; labels before inputs; accessible labeling

**Independent Test**: Preferences show curated fields; labels precede inputs and are announced before fields by screen readers

### Implementation for User Story 3

- [X] T014 [US3] Remove unrelated help block from preferences UI in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/content/preferences.xhtml` (delete bottom `<vbox>` with `pref-help`)
- [X] T015 [US3] Verify and align `<label for>` with matching input `id` in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/content/preferences.xhtml`
- [X] T016 [US3] Add `aria-labelledby` to each input referencing its label in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/content/preferences.xhtml`

**Checkpoint**: US3 preferences are simpler and accessible

---

## Phase 6: User Story 4 - Sidebar input clarity (Priority: P3)

**Goal**: Sidebar input has a visible label and helpful placeholder/microcopy; no visual clutter

**Independent Test**: Input shows label before textarea; placeholder clarifies usage; long text does not break layout

### Implementation for User Story 4

- [X] T017 [US4] Add visible label element before textarea in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts` (use `zorecto-input-label`)
- [X] T018 [US4] Add `aria-labelledby`/`aria-label` for textarea in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts`
- [X] T019 [P] [US4] Refine placeholder microcopy in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/locale/zh-CN/addon.ftl` and `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/locale/en-US/addon.ftl`

**Checkpoint**: US4 improves prompt composition clarity

---

## Phase 7: User Story 5 - No template placeholders visible (Priority: P3)

**Goal**: Template/sample content does not appear in any user-facing UI

**Independent Test**: Scan app; no example menus, popups, or placeholder copy visible

### Implementation for User Story 5

- [X] T020 [US5] Disable example registrations in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/hooks.ts` (comment out `UIExampleFactory`, `PromptExampleFactory`, `HelperExampleFactory` calls)
- [X] T021 [US5] Remove notifier example call path in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/hooks.ts` (avoid `BasicExampleFactory.exampleNotifierCallback()` on tab select)
- [X] T022 [P] [US5] Ensure no example-only UI strings are referenced in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/examples.ts` (comment out exports used only by examples)

**Checkpoint**: US5 leaves only production UI visible

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Final improvements across stories

- [X] T023 Review rendering performance and avoid reflow thrash in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/src/modules/zoRecto/readerPane.ts`
- [X] T024 Align localized strings and punctuation across languages in `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/addon/locale/`
- [ ] T025 Run quickstart validation from `/Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/002-chat-katex-ui/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- Setup (Phase 1): No dependencies
- Foundational (Phase 2): Depends on Setup completion — BLOCKS all user stories
- User Stories (Phases 3–7): Depend on Foundational completion; can proceed in parallel by priority
- Polish (Final Phase): Depends on target user stories being complete

### User Story Dependencies

- US1 (P1): After Phase 2 — no other story dependency
- US2 (P2): After Phase 2 — independent of US1 (provider-level guidance)
- US3 (P2): After Phase 2 — independent of US1/US2
- US4 (P3): After Phase 2 — independent; minor overlap with US1 file but separable
- US5 (P3): After Phase 2 — independent; primarily `src/hooks.ts` and examples

### Parallel Opportunities

- T002 can run parallel to T001
- T004, T005, T007 can run parallel to T003/T006
- After Phase 2: US2 tasks (provider.ts) can run parallel with US1 tasks (readerPane.ts)
- US4 T019 (localization) can run parallel to US4 code edits
- US5 T022 (examples.ts) can run parallel to US5 edits in hooks.ts

---

## Parallel Example: User Story 1

```text
Task: "Integrate renderer in streaming path in src/modules/zoRecto/readerPane.ts"
Task: "Ensure code blocks bypass math in src/modules/zoRecto/markdown.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL)
3. Complete Phase 3: User Story 1 (Readable math answers)
4. STOP and validate using quickstart.md
5. Proceed to P2 stories (US2 & US3) in parallel, then P3 (US4 & US5)

---

## Validation

Format validation: ALL tasks follow the checklist format `- [ ] T### [P?] [US?] Description with absolute path`.

Summary metrics:
- Total tasks: 25
- Per user story: US1=4, US2=2, US3=3, US4=3, US5=3 (Setup=2, Foundational=5, Polish=3)
- Parallel opportunities identified: 6 (T002, T004, T005, T007, T019, T022)
- Independent test criteria per story: provided at the start of each story phase
- Suggested MVP scope: Phase 3 (US1) only