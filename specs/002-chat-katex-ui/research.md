# Research: Chat KaTeX & UI Cleanup

Date: 2025-11-01  
Branch: 002-chat-katex-ui  
Spec: /Users/epsaliox/Library/CloudStorage/GoogleDrive-alhdliox@gmail.com/My Drive/proj/zotero-chatbox/specs/002-chat-katex-ui/spec.md

## Goals

- Lock decisions for Markdown + LaTeX math rendering and UI refinements
- Keep architecture/design identical to 001 (no structural changes)
- Ensure UX consistency, performance, and accessibility

---

## Output format and math delimiters

Decision: Answers are Markdown; math segments delimited by `$...`, `$$...$$`, `\(...\)`, and `\[...\]`. Parsing recognizes these delimiters while ignoring code blocks and inline-code.

Rationale:
- Matches user requirement and LaTeX conventions; interoperable with common Markdown math usage.
- Avoids false positives and preserves code as literal.

Alternatives considered:
- Custom delimiters (e.g., triple-dollar). Rejected to avoid user confusion and compatibility issues.
- Heuristic detection without delimiters. Rejected due to ambiguity and parsing cost.

---

## Rendering approach (typesetting)

Decision: Detect math segments as “math nodes” after Markdown parse and typeset them. On failure, fall back to original text and display a non-intrusive indicator.

Rationale:
- Keeps non-math Markdown intact and resilient to malformed LaTeX.
- Ensures no UI breakages during rendering.

Alternatives considered:
- Eager typeset before Markdown. Rejected; harder to avoid code/escaped contexts.
- Silently drop invalid math. Rejected; harms transparency.

---

## UI guidelines: Settings and Sidebar

Decision: Settings show only relevant fields with labels before inputs (aligned to mock guidance). Sidebar input has a visible label and informative placeholder; avoid visual clutter.

Rationale:
- Increases clarity and reduces configuration errors; improves discoverability and accessibility.

Alternatives considered:
- Placeholder-only (no labels). Rejected due to accessibility and translation concerns.
- Keep all fields visible. Rejected; contradicts “remove unrelated information”.

---

## Template/placeholder content

Decision: Hide template/placeholder content across the product and ensure it never surfaces in user-facing views.

Rationale:
- Prevents confusion and unpolished feel; aligns with release readiness.

Alternatives considered:
- Leave placeholders visible with badges. Rejected; still noisy.

---

## Architecture alignment with 001

Decision: Keep runtime, module layout, state model, and transport exactly as in 001. No changes to provider transport, session lifecycle, or storage semantics.

Rationale:
- Minimizes risk and scope; reuses established patterns documented in 001’s research and spec.

Alternatives considered:
- Introduce new rendering pipeline or external service. Rejected; unnecessary complexity for scope.

---

## Summary of Resolutions

- Markdown + LaTeX delimiters: `$`, `$$`, `\( \)`, `\[ \]`; code contexts excluded
- Typeset math nodes; fallback to raw on failure with subtle indicator
- Settings trimmed; labels precede inputs; sidebar input labeled with helpful placeholder
- Hide template/placeholder content project-wide
- Architecture remains identical to 001

All decisions above are final for this feature plan.
