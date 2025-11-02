# Quickstart: Chat KaTeX & UI Cleanup

Date: 2025-11-01  
Branch: 002-chat-katex-ui

## Purpose

Validate Markdown + LaTeX math rendering and UI cleanup (Settings and Sidebar) without changing the underlying architecture from 001.

## Prerequisites

- Built and loaded plugin in Zotero 7
- Provider settings configured (endpoint, model, API key)

## Steps

1) Open a PDF in Zotero reader and open the AI chat sidebar.
2) Send a prompt with inline math, e.g., `Pythagorean theorem: $a^2 + b^2 = c^2$`.
   - Expect: Inline typeset math; surrounding text rendered as Markdown.
3) Send a prompt with block math, e.g.,
   ```
   $$
   E = mc^2
   $$
   ```
   - Expect: Centered block equation; no code formatting.
4) Send a message that includes a code block containing dollar signs.
   - Expect: No math rendering inside code; code remains literal.
5) Open Zotero Preferences → the plugin tab.
   - Expect: Only relevant fields visible; labels appear before inputs; screen reader announces labels before fields.
6) Inspect the sidebar input.
   - Expect: Visible label, helpful placeholder text, no visual clutter while typing long messages.

## Notes

- Template/placeholder content should not be visible anywhere in the UI.
- If a math fragment fails to typeset, the original text is shown with a subtle indicator (no layout break).
