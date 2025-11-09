# Chat UI DOM 改造（统一使用 ztoolkit）

本文档梳理 `src/chat/ui` 目录下仍存在的“手动 DOM 操作”位置，并给出逐项改造方案，目标是在保持行为不变的前提下，尽量以 `ztoolkit.UITool` 的 `createElement/appendElement/insertElementBefore/replaceElement` 与 `ElementProps`（classList/attributes/properties/styles/listeners/children）来统一节点创建与装配。

结论与约定（与产品确认）

- 运行时属性更新（如 `hidden`、`textContent`、`scrollTop`、`style.height` 等）继续使用原生 API；不强制通过 `replaceElement` 做“重建更新”。
- 文档级监听（外击关闭、拖拽全局监听等）继续使用原生 `document.add/removeEventListener`。
- 发送按钮 Send/Stop 的模式切换采用“重建按钮节点”的策略：通过 `UITool.replaceElement` 以新 `TagElementProps` 替换旧按钮，统一 title/class/dataset/icon 等。

---

## 手动 DOM 操作清单与改造要点

以下仅列出需要关注的原生 DOM 操作和对应的替换方案；未提及的文件要么已使用 ztoolkit，要么仅包含运行时属性赋值（按上文约定保留）。

### 1) 控件（src/chat/ui/controls）

- `welcomeBlock.ts`
  - 原生：`list.appendChild(btn)`、`wrap.append(title, sub, list)`
  - 方案：
    - 使用 `UI.appendElement({ tag: 'button', ... }, list)` 替代 `appendChild`。
    - 或在 `wrap` 的构建时通过 `children` 一次性描述 `title/sub/list`，减少后续 `append`。

- `actionButtons.ts`
  - 原生：
    - 图标显隐 `(icon.style as any).display = ...`、`sendButton.append(...)`、`replaceChildren(deleteIcon)`、`dataset/title/classList.toggle`。
  - 方案：
    - 图标改为通过 `children` 描述，按钮初次构建时一起插入；运行时显隐优先用 `hidden` 而非 `style.display`。
    - Send/Stop 模式切换采用“重建按钮节点”：准备 `getSendButtonProps(mode)`，用 `UI.replaceElement(props, oldButton)` 一次性替换，统一 `title/dataset/classList/children(listeners)`，并把新按钮句柄回传给调用方。

- `presetMenu.ts`
  - 原生：`appendChild/append`、`querySelector(All)`、`classList.toggle`、`hidden`、`setAttribute`、document 级 `add/removeEventListener`。
  - 方案：
    - 菜单项与按钮用 `UI.createElement + UI.appendElement` 构建，`listeners` 写入 props。
    - 选中态切换可保留 `classList.toggle`（运行时更新）；外击关闭继续用 document 级监听（已约定）。

### 2) Pane 视图与控制器（src/chat/ui/pane）

- `chatPaneView.ts`
  - 原生：`dialog.append(...)`、`container.appendChild(dialog)`
  - 方案：
    - 用 `children` 把 `messages/error/toolbar/input/resize` 一次性描述在 `dialog` 上，然后 `UI.appendElement({tag:'div', ...}, container)`。

- `chatPaneController.ts`
  - 原生：`this.dialogEl.style.height = ...`、`appendChild(...)`、`replaceChildren(...)`。
  - 方案：
    - 高度设置属于运行时样式，保留原生。
    - 初次挂载用 `UI.appendElement`。
    - 清空并回到占位：优先调用 `messageList.clear()` 管理树；若直接替换，保留 `replaceChildren(placeholder)`。

- `paneStyles.ts`
  - 原生：`(container as any).appendChild(link)`、`querySelector()`
  - 方案：
    - 链接节点用 `UI.appendElement({ tag:'link', properties:{ rel:'stylesheet', href }, attributes:{ 'data-zorecto-style': key } }, container)` 注入，`querySelector` 保留用于去重。

- `controllers/welcomeController.ts`
  - 原生：`appendChild`、fallback 中 `doc.createElement()/className/textContent`、`hidden=`。
  - 方案：
    - 正常路径已通过 `buildWelcomeBlock` 使用 ztoolkit。
    - fallback 也改成 `UI.createElement(doc, 'div', { classList:['zorecto-welcome'], properties:{ textContent:'Welcome' }})` 后 `appendElement`。
    - `hidden` 属于运行时可见性，保留原生。

- `controllers/errorController.ts`
  - 原生：`hidden=`、`textContent=`
  - 方案：运行时更新，按约定保留。

- `controllers/citationController.ts`
  - 原生：委托容器上的 `add/removeEventListener`、`closest()`
  - 方案：这是事件代理场景，保留原生（效率更高）。

- `controllers/inputController.ts`
  - 原生：`mount.appendChild(this.inputEl)`、为 `textarea` 绑定 `keydown`/解绑。
  - 方案：
    - `inputEl` 构建时把 `keydown` 放到 `listeners`，减少手动 `add/removeEventListener`。
    - 首次挂载改用 `UI.appendElement`。

- `controllers/messageListController.ts`
  - 原生：`hidden=`、`textContent=""`、`appendChild(...)`、`scrollTop` 更新。
  - 方案：
    - 列表清空用 `textContent = ''` 性能较好，可保留；追加项用 `UI.appendElement({tag:'div', ...}, root)` 或直接 append 已构建的节点（后者已由 MessageView 创建）。
    - `scrollToBottom` 保留原生。

### 3) Pane 消息渲染（src/chat/ui/pane/messages）

- `messageRenderer.ts`
  - 原生：多个 `appendChild`、`replaceChildren`、`querySelector` 检测错误节点、`hidden=`/`textContent=`。
  - 方案：
    - 初次构建 DOM 时用 `children` 组织 `content/mathError/actions`，减少后续追加。
    - 渲染内容使用 `replaceChildren(fragment)` 性能更佳，保留。
    - 错误标记检测用 `querySelector` 合理，保留；错误横幅显隐/文本按运行时保留。

- `messageView.ts`
  - 原生：`textContent=` 清空角色标签、`dataset.role=`、`actions.hidden=`、`disabled=`。
  - 方案：均属运行时更新，保留原生。

### 4) 偏好面板（src/chat/ui/prefs）

- `preferencesUi.ts`
  - 原生：获取静态节点、创建 `<option>/<li>` 并 `appendChild`、大量运行时切换（hidden/class/attributes）、document 级监听。
  - 方案：
    - 动态创建的 `<option>/<li>` 改为 `UI.createElement + UI.appendElement`；其点击/键盘事件写入 `listeners`。
    - 其他运行时切换与文档级监听按约定保留原生。

### 5) 工具（src/chat/ui/utils）

- `icons.ts`
  - 原生：`doc.createElementNS(...)` + `setAttribute(...)` + `appendChild(...)` + `style.display`。
  - 方案：
    - 改为用 `UI.createElement(doc, 'svg', { namespace:'svg', attributes:{...}, styles:{ display:'block' }, children:[{ tag:'path', namespace:'svg', attributes:{ d:'...', fill:'currentColor' } }] })`。
    - 或者导出 `TagElementProps` 工厂（如 `getSendIconProps()`），让调用处统一 `UI.appendElement(props, parent)`。

- `inputAutoResize.ts`
  - 原生：多个 `style.*=` 与 `add/removeEventListener`。
  - 方案：
    - 初始化的静态样式（如 `resize: none`, `overflowY: auto`, `maxHeight`）建议在 textarea 构建时放入 `props.styles`；
    - 高度的动态计算/赋值继续保留原生；`input` 监听存在生命周期控制，保持现状（或迁移到 textarea 的 `listeners` 由控制器托管）。

---

## 具体重构建议与示例

### A. 以 children/appendElement 收敛 append/appendChild

以 `chatPaneView.ts` 为例：

```ts
// 现在：
dialog.append(messages, error, toolbarRow, inputWrapper, resizeHandle);
container.appendChild(dialog);

// 建议：构造 dialog 时一次性给出 children；插入 container 用 appendElement：
const dialog = ztoolkit.UI.createElement(doc, 'div', {
  classList: ['zorecto-dialog'],
  children: [
    { tag: 'div', classList: ['zorecto-messages'] },
    { tag: 'div', classList: ['zorecto-error'], properties: { hidden: true } },
    { tag: 'div', classList: ['zorecto-toolbar'] },
    { tag: 'div', classList: ['zorecto-input-wrapper'] },
    { tag: 'div', classList: ['zorecto-resize-handle'] },
  ],
});
ztoolkit.UI.appendElement({ tag: 'div', classList: ['zorecto-pane'], children: [{ tag: dialog as any }] }, someContainer);
```

### B. Send/Stop 按钮“重建”策略

在 `actionButtons.ts` 中，提供工厂函数：

```ts
function getSendButtonProps(mode: 'send'|'stop', handlers: { onSend: Fn; onStop: Fn; }): TagElementProps {
  const isSend = mode === 'send';
  return {
    tag: 'button',
    classList: ['zorecto-send-button', ...(isSend ? [] : ['zorecto-send-button--stop'])],
    properties: { type: 'button', title: isSend ? 'Send' : 'Stop' },
    attributes: { 'data-mode': mode },
    children: [ isSend ? getSendIconProps() : getStopIconProps() ],
    listeners: [{ type: 'click', listener: (e) => (isSend ? handlers.onSend(e) : handlers.onStop(e)) }],
  };
}

// 切换：
const next = getSendButtonProps(newMode, handlers);
const newNode = ztoolkit.UI.replaceElement(next, oldButton) as HTMLButtonElement;
sendButton = newNode; // 更新句柄
```

这样可以避免 `dataset/title/classList.toggle/children 显隐` 的多点更新，统一由 props 描述。

### C. SVG 图标改为 UITool

以“发送”图标为例：

```ts
export function getSendIconProps(): TagElementProps {
  return {
    tag: 'svg',
    namespace: 'svg',
    styles: { display: 'block' },
    attributes: {
      viewBox: '0 0 1024 1024', width: '16', height: '16', 'aria-hidden': 'true', fill: 'currentColor'
    },
    children: [
      { tag: 'path', namespace: 'svg', attributes: { d: 'M931.4 498.9L94.9 79.5 ...', fill: 'currentColor' } }
    ],
  };
}

// 使用：
ztoolkit.UI.appendElement(getSendIconProps(), button);
```

### D. 偏好面板的动态项

把 `<option>` 与 `<li>` 的创建切到 UITool：

```ts
const opt = ztoolkit.UI.createElement(doc, 'option', {
  properties: { value: p.id, textContent: p.label },
});
ztoolkit.UI.appendElement(opt as any, selectEl);

const li = ztoolkit.UI.createElement(doc, 'li', {
  classList: ['pref-model-item'],
  attributes: { role: 'option', 'data-id': p.id },
  properties: { textContent: p.label },
  listeners: [{ type: 'click', listener: () => selectModelById(p.id) }],
});
ztoolkit.UI.appendElement(li as any, listEl);
```

---

## 实施顺序（建议）

1) 低风险/高收益
   - icons.ts → UITool/TagElementProps；替换 `actionButtons/presetMenu/messageRenderer` 的图标插入调用。
   - chatPaneView.ts、welcomeBlock.ts：用 `children/appendElement` 收敛追加操作。
   - inputController.ts：textarea 事件迁移至 `listeners`，静态样式移至 `styles`。

2) 中等改动
   - presetMenu.ts：菜单项/菜单监听改用 UITool；按钮内部结构用 `children`。
   - messageRenderer.ts：子树用 `children` 组织，内容更新继续 `replaceChildren`。
   - paneStyles.ts：样式注入改 `appendElement`。

3) 可选增强
   - actionButtons.ts：落实“重建按钮”切换，去除零散 `toggle/dataset/title` 更新。
   - chatPaneController.ts：空态复位优先走 `messageList.clear()`；`replaceChildren` 作为兜底。
   - preferencesUi.ts：仅对动态创建节点切换至 UITool，其余运行时更新保持原生。

---

## 注意事项

- 对“频繁小范围更新”（显隐、禁用、滚动、拖拽高度）保留原生能获得更好性能与更低复杂度。
- 使用 `replaceElement` 重建节点会改变 DOM 引用，务必把新引用回填到控制器/组件内部状态，避免后续事件或样式更新指向旧节点。
- 使用 `children` 组织树可以显著减少后续 `append`/`appendChild` 次数，但要注意部分子节点需要在控制器中保留句柄（如 `textarea`、消息列表容器）。

---

## 受影响文件一览（需调整处）

- controls: `welcomeBlock.ts`、`actionButtons.ts`、`presetMenu.ts`
- pane: `chatPaneView.ts`、`paneStyles.ts`、（可选）`chatPaneController.ts`、`controllers/welcomeController.ts`（fallback 路径）
- messages: `messageRenderer.ts`
- prefs: `preferencesUi.ts`（仅动态节点）
- utils: `icons.ts`（强烈建议优先）、`inputAutoResize.ts`（仅将静态样式前移到 textarea 构建）

以上改造完成后，`src/chat/ui` 将在节点创建/插入层面统一使用 ztoolkit，运行时更新采用原生 API 的策略不变，并落实 Send/Stop 按钮的“重建节点”切换。

