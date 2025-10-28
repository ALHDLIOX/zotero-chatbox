# Implementation Plan: AI Chat Sidebar

**Branch**: `001-ai-chat-sidebar` | **Date**: 2025-10-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-ai-chat-sidebar/spec.md`

## Summary

This feature introduces an AI chat sidebar into the Zotero PDF reader. It will allow users to interact with an AI model (DeepSeek by default) using the full-text content of the current PDF as context. The feature includes a settings panel for configuring the AI provider and other options. The core technical approach involves creating a new UI panel in the Zotero reader, managing chat state, and interacting with an external AI service through a provider interface.

## Technical Context

**Language/Version**: TypeScript ^5.9.2
**Primary Dependencies**: zotero-plugin-toolkit, XUL/XHTML for UI
**Storage**: Zotero preferences system for settings; in-memory for session data.
**Testing**: Mocha, Chai
**Target Platform**: Zotero 7
**Project Type**: Zotero Plugin
**Performance Goals**: UI operations must not block the Zotero UI thread. Asynchronous operations for all network requests and long-running tasks.
**Constraints**: UI must be consistent with the native Zotero 7 look and feel. All user-facing strings must be localizable.
**Scale/Scope**: A single new panel within the Zotero reader interface.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- **Code Quality**: The proposed solution will adhere to the existing ESLint and Prettier configurations.
- **Testing Standards**: A clear plan for unit tests for the provider and other logic will be established. UI interaction testing will be done manually given the constraints of the Zotero environment.
- **User Experience Consistency**: The UI will be built using Zotero's standard components and will follow the design patterns of the main application. All strings will be managed via `.ftl` files.
- **Performance Requirements**: All network requests to the AI provider will be asynchronous. The processing of the full-text index will also be handled asynchronously to avoid blocking the UI.

## Project Structure

### Documentation (this feature)

```text
specs/001-ai-chat-sidebar/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── addon.ts             # Main plugin entry point, will be modified to add the new UI
├── modules/
│   ├── chatbox/         # New module for the chatbox feature
│   │   ├── ui.ts        # UI management for the chat sidebar
│   │   ├── provider.ts  # LLMProvider interface and implementations
│   │   └── state.ts     # State management for the chat
│   └── preferenceScript.ts # Existing script, will be modified for new settings
└── utils/
    ├── prefs.ts         # Existing prefs utility, will be updated with new settings

addon/
├── content/
│   ├── zoteroPane.css   # Styles for the new sidebar will be added here
│   └── chatbox.xhtml    # New file for the sidebar UI
└── locale/
    └── en-US/
        └── mainWindow.ftl # Localization strings for the new UI

test/
└── chatbox.test.ts      # New test file for the chatbox logic
```

**Structure Decision**: The existing project structure will be extended with a new `chatbox` module within the `src/modules` directory. New UI components will be added to the `addon/content` directory. This maintains the established modular architecture of the project.

## Complexity Tracking

(No violations of the constitution are anticipated.)