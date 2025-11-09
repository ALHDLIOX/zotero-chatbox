# Chat Pane 使用 ztoolkit 的可替换与优化方案

本文梳理当前 Chat Pane 相关源码中适合引入或进一步利用 zotero-plugin-toolkit（下称 ztoolkit）的点位，给出分优先级的落地规划与验收标准，确保改造在保持功能稳定的前提下提升一致性、可维护性与卸载清洁度。

## 背景与范围

- 范围：`src/chat/ui/pane` 与 `src/chat/ui/controls` 下的 UI 代码，以及 `src/chat/services/clipboard.ts`、样式注入逻辑等。
- 目标：
  - 统一 DOM 构建与事件注册（UITool.createElement / ElementProps.listeners）。
  - 利用元素记录与 `ztoolkit.unregisterAll()` 提升卸载清洁度与调试可见性。
  - 用 ztoolkit 提供的 Helper 收敛跨环境降级逻辑（如复制到剪贴板）。
  - 保持 Reader 交互的现有实现（已对接 ztoolkit.Reader.getReader），不改变行为。

参考：`doc/architecture.md` 中 UI 分层与控制器职责说明。

## 可替换与优化点清单（按模块/文件）

### 1) UI 元素构建统一用 UITool.createElement（高优）

- 涉及文件：
  - `src/chat/ui/pane/chatPaneView.ts:1`（当前大量 `doc.createElement` + `appendChild`）。
  - `src/chat/ui/controls/statusBar.ts:1`、`welcomeBlock.ts:1`、`actionButtons.ts:1`、`presetMenu.ts:1`。
- 现状问题：
  - 重复样板代码；属性/类名/事件分散设置，阅读与维护成本高。
  - 卸载清理依赖手写 `removeEventListener`/DOM 清空，易遗漏。
- 替换建议：
  - 使用 `ztoolkit.UI.createElement(doc, tag, { classList, properties, attributes, listeners, children, enableElementRecord: true })` 一次性构建子树。
  - 统一使用 `children/subElementOptions` 追加子节点，减少多次 DOM 变更。
  - 对重要根节点开启 `enableElementRecord: true`，便于卸载。
- 收益：
  - 提升一致性与可读性；开启 `enableElementJSONLog/DOMLog` 后，开发期调试友好（已在 `src/shared/ztoolkit.ts` 配置）。
  - 与 `ztoolkit.unregisterAll()` 协同，避免窗口关闭后残留节点与监听器。

### 2) 事件注册与卸载用 ElementProps.listeners（高优）

- 涉及文件：
  - `src/chat/ui/controls/actionButtons.ts:1`（send/stop/clear）。
  - `src/chat/ui/controls/presetMenu.ts:1`（li 选项点击、菜单键盘事件、按钮点击）。
  - 说明：菜单外部点击关闭需要绑定到 `document`；仍建议在 open/close 生命周期中手动 add/remove，并将菜单/按钮容器自身用 `enableElementRecord` 记录，整体卸载更干净。
- 收益：
  - 事件绑定点集中，减少 `dispose()` 的样板解绑；配合元素记录提升可维护性。

### 3) 复制到剪贴板改为 ClipboardHelper（高优）

- 涉及文件：
  - `src/chat/services/clipboard.ts:1`（现有实现包含 `navigator.clipboard`、`Zotero.Utilities.Internal.copyTextToClipboard`、`execCommand` 的分层降级）。
- 替换建议：
  - 直接使用 `ztoolkit.ClipboardHelper` 的文本复制接口（保持导出 API 不变，内部调用替换）。
- 收益：
  - 移除跨环境降级样板，集中化错误处理，行为更一致。

### 4) 样式注入使用 UITool.createElement（可选，中优）

- 涉及文件：
  - `src/chat/ui/pane/paneStyles.ts:1`（创建 `<link>` 标签注入 global/chat/KaTeX 样式）。
- 替换建议：
  - 使用 `ztoolkit.UI.createElement(doc, 'link', { properties: { rel: 'stylesheet', href }, attributes: { 'data-zorecto-style': '...' } })` 简化属性赋值与插入。
- 收益：
  - 主要为一致性与可读性，功能收益有限。

### 5) 控制器中的插入与显隐微调（可选，低优）

- 涉及文件：
  - `src/chat/ui/pane/controllers/statusController.ts:1`：`insertBefore/appendChild` 可用 `ztoolkit.UI.insertElementBefore/appendElement` 表达；
  - `src/chat/ui/pane/messages/messageRenderer.ts:1`：已使用 UITool 创建元素，后续显隐继续优先使用 `properties.hidden/disabled`，避免 `style.display`。
- 收益：
  - API 风格统一；减少直改样式导致的可访问性与状态错位问题。

### 6) Reader 相关（保持现状）

- 涉及文件：
  - `src/chat/services/readerNavigation.ts:1`：已通过 `ztoolkit.Reader.getReader(waitMs)` 获取 Reader；页码跳转与查找基于 PDF.js 内部对象，无等价 ztoolkit API，可保持不变。

## 落地规划（按优先级分阶段）

### 阶段 P1（高优，核心替换，预估 1–2 人日）

目标：统一 DOM 与事件、替换剪贴板逻辑，确保 UI 结构与行为不变。

- 步骤：
  1) 将以下文件改为 UITool + ElementProps.listeners：
     - `src/chat/ui/pane/chatPaneView.ts`
     - `src/chat/ui/controls/statusBar.ts`
     - `src/chat/ui/controls/welcomeBlock.ts`
     - `src/chat/ui/controls/actionButtons.ts`
     - `src/chat/ui/controls/presetMenu.ts`
  2) 为主要容器开启 `enableElementRecord: true`，自检 `unregisterAll()` 是否能清理。
  3) 将 `src/chat/services/clipboard.ts` 改为使用 `ztoolkit.ClipboardHelper`（保留导出签名）。

- 验收标准：
  - UI 布局与样式无回归：消息列表、欢迎区、输入区、工具栏、拖拽手柄齐全；
  - 事件行为一致：发送/停止/清空按钮、快捷键（Shift+Enter）稳定；
  - 预设菜单可点可键控，外部点击关闭正常；
  - 复制到剪贴板在 macOS/Linux/Windows 下可用；
  - 插件关闭/窗口关闭后节点与监听器无残留（通过手动检查或 `enableElementDOMLog` 观察）。

### 阶段 P2（中优，一致性优化，预估 0.5 人日）

目标：样式注入与插入 API 风格统一，可读性提升。

- 步骤：
  1) `src/chat/ui/pane/paneStyles.ts` 统一用 UITool 创建 `<link>` 注入；
  2) `statusController` 等处使用 `ztoolkit.UI.insertElementBefore/appendElement`（非功能性变更）。

- 验收标准：
  - 样式注入顺序与去重逻辑与现状一致；
  - Reader Pane 首次打开时样式可用，KaTeX 公式展示不变。

### 阶段 P3（低优，微调与清理，预估 0.5 人日）

目标：细节一致性与注释补齐。

- 步骤：
  1) 消息渲染中显隐统一用 `hidden/disabled`，避免直接 `style.display`；
  2) 对外导出的 UI 构建/控制器文件补齐 TSDoc 与模块注释；
  3) 自检所有新建元素的 `enableElementRecord` 设置是否合理（避免给大量短生命周期节点开启记录导致日志噪音）。

- 验收标准：
  - 无功能变化；
  - 注释覆盖符合项目规范（见 AGENTS.md 注释要求）。

## 影响面与回滚策略

- 影响面：仅 UI 层元素创建与事件绑定实现细节；`sessionStore`、渲染层（Markdown/KaTeX/清洗）与 Provider 请求逻辑不变。
- 回滚策略：每个阶段改造保持小步提交（或独立补丁），如发现行为不一致，优先回滚单文件变更；ClipboardHelper 替换若出现兼容问题，可临时回退到本地降级实现。

## 测试要点（建议手测清单）

- 面板装载/卸载：打开/关闭 Reader、切换条目、关闭主窗口后无残留。
- 发送流程：
  - 输入、回车发送、Shift+Enter 发送、停止、再次发送；
  - 错误时错误横幅展示与清空；状态条文案切换。
- 预设菜单：鼠标点选、键盘上下/回车选择、外部点击关闭与焦点返回。
- 复制/添加笔记：复制可用、笔记创建成功，数学/链接/引用在笔记中按策略渲染。
- 拖拽手柄：高度变化与输入框自适应兼容。
- 引用跳转：点击徽章能打开/切换 Reader、定位页码并高亮（已有实现不改）。

## 示例：用 UITool 重写元素构建（片段）

```ts
// 以 chatPaneView 为例：
const container = ztoolkit.UI.createElement(doc, 'div', {
  classList: ['zorecto-pane'],
  enableElementRecord: true,
  children: [
    { tag: 'div', classList: ['zorecto-dialog'], subElementOptions: [
      { tag: 'div', classList: ['zorecto-messages'] },
      { tag: 'div', classList: ['zorecto-error'], properties: { hidden: true } },
      { tag: 'div', classList: ['zorecto-toolbar'] },
      { tag: 'div', classList: ['zorecto-input-wrapper'] },
      { tag: 'div', classList: ['zorecto-resize-handle'] },
    ] }
  ]
}) as HTMLDivElement;
```

## 结论

优先完成 P1（统一 DOM/事件 + 剪贴板），即可获得最显著的维护性与稳定性提升；随后在 P2/P3 完成一致性与注释清理，避免后续 UI 维护反复。Reader 与渲染流程保持不变，风险可控。

