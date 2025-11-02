# Feature Specification: Chat KaTeX & UI Cleanup

**Feature Branch**: `002-chat-katex-ui`  
**Created**: 2025-11-01  
**Status**: Draft  
**Input**: User description: "增加几个功能：1：优化对话框AI展示内容格式,用一定的内置提示词限定模型的输出格式，然后用katex渲染。再具体：在回答里输出 Markdown 文本，其中数学部分使用 LaTeX 语法，并用定界符标注（如$...$、$$...$$、\(...\)、\[...\]）。客户端把回复当作 Markdown 解析。解析器会把数学片段标记成 “数学节点”（或先保留原文，交给下一步）。前端（或服务端）把这些数学节点里的 LaTeX 字符串 交给 KaTeX。2：优化设置界面UI设计[codex-clipboard-bX2iip.png 1600x1256]：需要把无关信息删除，在输入框前添加条目名称。3：把整个项目中的template内容注释掉，不要显示出来。4：优化侧边栏输入框UI设计。注意，此spec编号为002!"

## User Scenarios & Testing _(mandatory)_

### User Story 1 - Readable math answers (Priority: P1)

A user asks a math-related question and receives a clearly formatted response where text is Markdown and equations are properly typeset from delimited LaTeX, without raw tokens leaking into prose.

**Why this priority**: Ensures core value of the chat—readable, accurate math explanations—improves comprehension and trust.

**Independent Test**: Ask a prompt with inline and block math; verify rendering, no leakage of raw LaTeX, and consistent Markdown structure.

**Acceptance Scenarios**:

1. Given a response with `$a^2+b^2=c^2$`, When displayed, Then the equation is rendered inline and surrounding text remains Markdown.
2. Given a response with `$$E=mc^2$$`, When displayed, Then the equation is rendered as a centered block without code formatting.
3. Given a response with code blocks containing `$`, When displayed, Then math is not rendered inside code; code remains literal.

---

### User Story 2 - Consistent formatting via output rules (Priority: P2)

As a user, I see answers follow a predictable Markdown structure (headings, lists, code, math), guided by internal output-format rules, so I can scan quickly.

**Why this priority**: Consistency reduces cognitive load and improves perceived quality.

**Independent Test**: Trigger several typical Q&A; verify headings, list styles, and math delimiters are applied consistently across answers.

**Acceptance Scenarios**:

1. Given any answer with sections, When displayed, Then top-level headings and lists follow a consistent style.
2. Given answers with math, When displayed, Then math appears only where delimited by `$...`, `$$...$$`, `\(...\)`, or `\[...\]`.

---

### User Story 3 - Streamlined Settings UI (Priority: P2)

As a user configuring the chat, I see only relevant settings, with clear field names placed before their input controls, matching the provided mockup guidance (codex-clipboard-bX2iip.png).

**Why this priority**: Reduces confusion, speeds configuration, and lowers support burden.

**Independent Test**: Open settings, verify irrelevant items are absent, and each input has a visible label immediately preceding it.

**Acceptance Scenarios**:

1. Given the settings view, When loaded, Then only curated fields are visible with labels placed before inputs.
2. Given a screen reader, When navigating settings, Then labels are announced before inputs.

---

### User Story 4 - Sidebar input clarity (Priority: P3)

As a user composing a prompt in the sidebar, I see a clearly labeled, easy-to-use input with helpful placeholder/microcopy so I can start typing with confidence.

**Why this priority**: Improves task start time and reduces input errors.

**Independent Test**: Inspect the sidebar input; verify label presence, placeholder clarity, and no visual clutter.

**Acceptance Scenarios**:

1. Given the sidebar, When focused, Then input label is visible and placeholder hints expected content.
2. Given long text input, When typed, Then the input remains usable without layout shift.

---

### User Story 5 - No template placeholders visible (Priority: P3)

As a user, I never see internal template/placeholder content in any view.

**Why this priority**: Prevents confusion and maintains a polished experience.

**Independent Test**: Scan the app; no UI displays template-only content.

**Acceptance Scenarios**:

1. Given all views, When navigated, Then no template/placeholder copy is visible.

### Edge Cases

- Math delimiters appear inside code or inline-code: math must not render there.
- Malformed LaTeX in responses: show readable fallback and do not break layout.
- Very long formulas or many equations: layout remains readable without overflow.
- Mixed languages or punctuation around delimiters: no false positives.
- Answers without any math: content still renders as well-structured Markdown.

## Requirements _(mandatory)_

### Functional Requirements

- **FR-001**: The system MUST constrain answer format to Markdown with math segments delimited by `$...`, `$$...$$`, `\(...\)`, or `\[...\]`.
- **FR-002**: The system MUST render delimited math segments as typeset equations and leave non-math Markdown intact.
- **FR-003**: The system MUST NOT render math inside code blocks or inline-code spans.
- **FR-004**: The system MUST preserve original text as a fallback when a math segment cannot be typeset and MUST surface a non-intrusive error indicator.
- **FR-005**: The system MUST ensure headings, lists, code, and math follow a consistent, predictable structure across answers.
- **FR-006**: The Settings UI MUST remove non-essential fields and MUST place a clear label immediately before each input control, per the provided mock guidance.
- **FR-007**: The Sidebar input MUST include a visible label and helpful placeholder/microcopy and MUST avoid visual clutter.
- **FR-008**: Template or placeholder content across the product MUST be hidden from end users (no display in any view).
- **FR-009**: The system MUST support accessibility expectations for labels (e.g., labels announced before inputs by assistive tech).

### Key Entities _(include if feature involves data)_

- **Chat Message**: A user or system message containing Markdown text and possibly delimited math; attributes include role, content, and detected math segments.
- **Math Segment**: A contiguous string between recognized math delimiters; attributes include delimiter type (inline/block) and raw content for typesetting.
- **Setting Field**: A configurable option with a label and value; attributes include label text, input type, visibility (curated), and help text.

## Success Criteria _(mandatory)_

### Measurable Outcomes

- **SC-001**: 95% of valid math expressions in test prompts are displayed as typeset equations without visible raw delimiters.
- **SC-002**: 0 critical UI defects observed in Settings after cleanup, and 90% of evaluators locate and edit a common setting within 10 seconds.
- **SC-003**: 90% of evaluators rate answer readability at least 4/5 in a structured usability check.
- **SC-004**: Sidebar input time-to-first-typed-character improves by 20% compared to baseline in a controlled task.

