# Data Model: Chat KaTeX & UI Cleanup

Date: 2025-11-01  
Branch: 002-chat-katex-ui

## Entities

- ChatMessage
  - id: string — unique per message
  - role: enum("system"|"user"|"assistant")
  - content: string — Markdown text (may include math delimiters)
  - timestamp: number — epoch ms

- MathSegment
  - delimiter: enum("inline-$"|"block-$$"|"inline-\\(\\)"|"block-\\[\\]")
  - content: string — LaTeX source (unescaped)
  - inline: boolean — true for inline math, false for block math
  - startIndex: number — start index in original content
  - endIndex: number — end index in original content (exclusive)
  - error?: string — present if typesetting fails

- RenderFragment
  - kind: enum("text"|"code"|"math-inline"|"math-block")
  - value: string — rendered HTML or plain text
  - source?: string — original substring when applicable

- SettingField
  - key: string — preference key
  - labelId: string — localization key (Fluent id)
  - visible: boolean — curated visibility (true only for relevant inputs)
  - inputType: string — control type (text/password/select)
  - placeholderId?: string — localization key for placeholder

- PreferencesView
  - fields: SettingField[] — ordered fields for rendering
  - errors: string[] — validation message keys

## Validation Rules

- ChatMessage.content MUST be treated as Markdown; code blocks and inline-code MUST NOT be parsed for math.
- MathSegment.content MUST be non-empty when a delimiter is detected.
- SettingField.labelId MUST exist in localization resources when `visible` is true.
- PreferencesView.errors MUST be empty to accept changes.

## Relationships

- A ChatMessage MAY contain zero or more MathSegments derived from parsing.
- Rendering produces an ordered list of RenderFragments from a ChatMessage.
- PreferencesView aggregates curated SettingField instances and validation feedback.

## State Transitions (high-level)

- PreferencesView: { pristine → editing → validating → accepted | rejected }
- Sidebar input: { idle → focused → typing → submitted | canceled }
- Rendering: { parsed → segmented → typeset → fallback-on-error (optional) }
