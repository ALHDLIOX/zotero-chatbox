<!--
Sync Impact Report:
- Version change: 1.0.0 → 1.0.1
- Added sections:
  - Keyword Convention
- Templates requiring updates:
  - ✅ none
-->

# Constitution for zotero-chatbox

## Preamble

This document outlines the core principles and governance for the `zotero-chatbox` project. Its purpose is to ensure consistent quality, stability, and user focus throughout the development lifecycle. All contributions MUST adhere to these principles.

### Keyword Convention

The key words "MUST", "MUST NOT", "REQUIRED", "SHALL", "SHALL NOT", "SHOULD", "SHOULD NOT", "RECOMMENDED", "MAY", and "OPTIONAL" in this document are to be interpreted as described in RFC 2119.

---

## Governance

- **Constitution Version**: 1.0.1
- **Ratification Date**: 2025-10-28
- **Last Amended Date**: 2025-10-28

### Amendment Procedure

Changes to this constitution require a pull request and approval from the project maintainers. Versioning MUST follow Semantic Versioning rules:

- **MAJOR**: Backward-incompatible changes, such as removing or fundamentally redefining a principle.
- **MINOR**: Adding a new principle or section.
- **PATCH**: Minor clarifications, typo fixes, or wording improvements.

### Compliance

All code, documentation, and project artifacts MUST align with the principles defined herein. Automated checks and code review processes will be used to enforce compliance.

---

## Principles

### Principle 1: Code Quality and Maintainability

**Rule**: All code committed to the repository MUST be of high quality, readable, and maintainable. It MUST adhere to the established coding standards, including style and formatting enforced by Prettier and ESLint. Complex logic MUST be accompanied by explanatory comments.

**Rationale**: A clean and consistent codebase is crucial for long-term project health. It lowers the barrier for new contributors and simplifies debugging and future enhancements.

### Principle 2: Rigorous Testing

**Rule**: All new features or significant refactors MUST be accompanied by corresponding unit or integration tests. All tests MUST pass before any code is merged into the `spec-kit` branch. Test coverage should be actively maintained or increased.

**Rationale**: Testing is non-negotiable for ensuring application stability and preventing regressions. It provides confidence that the software behaves as expected and protects against accidental breakage.

### Principle 3: Consistent User Experience

**Rule**: The plugin's user interface (UI) and user experience (UX) MUST be consistent with the native Zotero 7 environment. All user-facing text MUST be implemented through the localization framework (`.ftl` files) to support multiple languages.

**Rationale**: A seamless integration into the host application provides a professional and intuitive experience for the user. It makes the plugin feel like a natural extension of Zotero, not a disruptive add-on.

### Principle 4: Performance and Efficiency

**Rule**: Plugin operations MUST NOT block the Zotero UI thread or degrade the application's responsiveness. Long-running or computationally expensive tasks MUST be executed asynchronously. Resource usage (memory, CPU) should be kept to a minimum.

**Rationale**: Performance is a core feature. A slow or resource-heavy plugin detracts from the user's workflow and can lead to frustration and abandonment.
