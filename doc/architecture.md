% src 目录架构说明（Architecture）

本文件展示 `src/` 的树状结构，并用中文说明每个目录与文件的职责。

## 目录结构树

```
src
├─ index.ts — 插件入口：确保单例、挂载全局、暴露 ztoolkit 获取器
├─ addon.ts — 插件数据容器：环境/配置/工具初始化，挂接 hooks 与 API 外壳
├─ hooks.ts — 生命周期与事件分发：启动/关闭、主窗口加载、偏好面板脚本、Notify 等
├─ shared — 共享工具模块
│  ├─ ztoolkit.ts — 初始化 Zotero Toolkit：日志前缀、UI 调试、插件图标等
│  ├─ locale.ts — Fluent 本地化工具：initLocale/getString/getLocaleID
│  ├─ prefs.ts — 偏好读写封装：getPref/setPref/clearPref（按插件前缀命名）
│  ├─ window.ts — 轻量窗口存活检测 isWindowAlive
│  ├─ errors.ts — Provider error types and HTTP/status mapping to localized messages
│  ├─ i18nKeys.ts — Centralized Fluent message ID constants used by chat
│  └─ abort.ts — AbortSignal utilities (timeout/any/polyfill/combine)
└─ chat — 聊天功能域（服务、状态、渲染、UI）
   ├─ services — 功能服务层（与 Zotero/Reader 交互、上下文、流程）
   │  ├─ conversation.ts — 会话发送管道：追加 user/可选 system 文档上下文，驱动 ChatFlow 流式请求，提供 abort 句柄与只读助手文本获取
   │  ├─ documentContext.ts — 收集当前条目/Reader 的 PDF 附件，读取全文并构建 System 上下文（Allowed Attachments + Document Context），提供缓存键
   │  │                       （提供 createContextLoader(doc) 工厂，内部维护附件 key，控制器仅触发 refresh）
   │  ├─ readerNavigation.ts — 打开 Reader、等待 PDF 就绪、翻页与查找高亮
   │  ├─ session — 会话作用域与状态
   │  │  ├─ sessionScope.ts — 计算会话 ID 与作用域 key（reader/attachment/item），作用域切换时重置会话
   │  │  └─ sessionStore.ts — 在内存中维护 {status, messages, context, lastResult}；提供增删改与作用域隔离
   │  ├─ chatFlow.ts — 对话流程控制：启动/中止、流式 token 回调、错误处理并更新 sessionStore
   │  ├─ createNotes.ts — 将助手回复渲染为 Zotero Note 兼容 HTML 并保存到关联条目；提供按消息ID创建笔记
   │  └─ copyMessage.ts — 复制消息文本到剪贴板（仅使用 Toolkit ClipboardHelper；提供按消息ID复制）
   ├─ providers — 模型服务商与请求客户端
   │  ├─ providerPresets.ts — 内置模型预设（OpenAI/DeepSeek）：id/endpoint/model/本地化 key
   │  ├─ chatClient.ts — OpenAI 风格 Chat API 客户端：token 估算与上限、Abort/超时、SSE 流解析（系统提示与错误映射已拆分）
   │  ├─ prompts.ts — System prompts for LLMs (extracted from chat client)
   │  ├─ constants.ts — Provider-level constants (token limits, timeouts)
   │  └─ index.ts — 对外导出 sendChat/预设与类型
   ├─ render — 渲染层（Markdown/数学/清洗；聊天视图与笔记视图）
   │  ├─ shared — 渲染共享模块（按领域分层，避免单文件子目录）
   │  │  ├─ parsing
   │  │  │  ├─ markdown.ts — 轻量 Markdown + 数学 解析（段落/标题/列表/表格/代码/数学）
   │  │  │  └─ cite.ts — 统一 [-[cite: ...]-] 正则与 JSON 解析；产出 CiteToken/CitationTarget
   │  │  ├─ renderer.ts — 统一块级渲染器（段落/标题/列表/代码/数学），通过 Strategy 注入 chat/note 差异（h1–h3、空节点跳过、无表格）
      │  │  ├─ inlineFormat.ts — Shared inline formatter（bold/italic/links + <br />；保留链接内强调）
   │  │  ├─ sanitizer.ts — 统一清洗器（协议/属性/类/样式白名单；强制 <a> rel+target）
   │  │  └─ mathKatex.ts — KaTeX 工具：renderMath（字符串）与 renderMathNode（生成已清洗 DOM 节点）
   │  ├─ chat — 聊天视图渲染（DOM 片段 + 严格清洗）
   │  │  ├─ block.ts — 基于 shared/renderer 的 ChatStrategy（段落内联徽章、KaTeX、HTML 序列化）
   │  │  ├─ inline.ts — 行内渲染器：文本（复用 shared/inlineFormat）/代码/数学（KaTeX）；识别 CiteToken 并渲染可点击编号徽章
   │  │  ├─ citationTargets.ts — 引用跳转目标 WeakMap 注册/查询（徽章元素 → CitationTarget）
   │  │  └─ （清洗逻辑已收敛至 shared/sanitizer 的 CHAT_PRESET）
   │  └─ note — 笔记视图渲染（无 KaTeX，保留数学文本为 $...$/<pre.math>）
   │     ├─ block.ts — 基于 shared/renderer 的 NoteStrategy（段落中分段插入 data-citation 区块；数学文本化；包装 data-schema-version）
   │     ├─ inline.ts — 笔记用行内渲染（文本复用 shared/inlineFormat + shared/NOTE_INLINE_PRESET 清洗；行内代码 <code>；无 KaTeX）
   │     └─ （清洗逻辑已收敛至 shared/sanitizer 的 NOTE_INLINE_PRESET）
   └─ ui — UI 组件与 Reader 面板
      ├─ prefs — 偏好面板（about:addons）
      │  ├─ prefRegister.ts — 注册偏好面板入口与图标/文案（仅注册，无 UI 逻辑）
      │  ├─ prefController.ts — 偏好控制器：事件绑定、偏好读写、校验与连接测试、面板切换
      │  └─ prefView.ts — 偏好视图：纯视图查询与更新（渲染 options/列表/错误与显隐），无持久化与网络
      ├─ utils — UI 辅助
      │  ├─ icons.ts — SVG 图标构造器（发送/停止/删除/复制/笔记）
      │  ├─ rafBatcher.ts — requestAnimationFrame 合帧批量渲染工具
      │  └─ inputAutoResize.ts — 文本域自动高度（最大高度、滚动条策略）
      └─ pane — Reader 侧边面板
         ├─ paneView.ts — 纯视图骨架构建（容器/消息区/工具栏/输入区/拖拽手柄）
         ├─ paneController.ts — Presenter：装配控制器与服务、处理提交/中止/清空/引用跳转、注入样式与 KaTeX CSS
         ├─ paneStyles.ts — 注入聊天与 KaTeX 样式表（可作用于 ShadowRoot）
         ├─ elements — 面板通用视图构件（纯 UI 控件）
         │  ├─ statusBar.ts — 状态条元素工厂
         │  ├─ welcomeBlock.ts — 欢迎占位与快捷提问按钮
         │  ├─ presetMenu.ts — 预设选择下拉菜单（ARIA/键盘交互）
         │  └─ actionButtons.ts — 发送/停止与清空按钮（图标/模式切换）
         ├─ controllers — 面板子控制器
         │  ├─ statusController.ts — 状态条控制器：集中管理 Loading/Sending/Loaded/Missing 文案
         │  ├─ welcomeController.ts — 欢迎占位控制器：构建与显隐，承载快捷提问回调
         │  ├─ errorController.ts — 错误横幅控制器：统一错误展示与清空
         │  ├─ messageListController.ts — 列表渲染与增量更新（与 MessageView 协作）
         │  ├─ messageActionsController.ts — 助手消息：复制到剪贴板 / 添加为 Zotero 笔记
         │  │                      （薄封装：仅收集视图 fallback 文本并转调 services/copyMessage 与 services/createNotes）
         │  ├─ inputController.ts — 文本输入与快捷键、动作行（发送/停止/清空）
         │  ├─ presetController.ts — 模型预设选择与持久化
         │  ├─ resizeController.ts — 面板高度拖拽（最小/默认高度回调）
         │  └─ citationController.ts — 内联引用点击/键盘激活事件绑定
         └─ messages — 消息条目视图
            ├─ messageView.ts — 视图适配层：id→DOM 映射、批量渲染调度
            ├─ messageRenderer.ts — 单条消息 DOM 结构与内容渲染、数学错误横幅
            └─ types.ts — 消息视图 DOM 句柄/渲染选项类型
```

## 取消（Cancellation）

聊天流程采用“单一所有者”的取消模型：
- 所有权：`ChatFlow` 在每次运行时创建且仅创建一个内部 `AbortController`，独占取消控制。UI 控制器不再自建控制器，只调用 `chatFlow.abort()`。
- 上游信号：`ChatFlow.start({ signal })` 使用 `shared/abort.combineSignals` 将上游信号与内部信号合并，任一来源触发中止都会传递到 Provider 请求。
- 原因透传：`ChatFlow.abort(reason?)` 在宿主支持时向内部控制器透传 `reason`；Provider 端接收合并后的 `AbortSignal`，在支持时可通过 `signal.reason` 区分“用户取消/超时”等来源。
- 工具：`shared/abort` 负责解析宿主环境中的 `AbortSignal/AbortController`，提供 `combineSignals`（优先用原生 `AbortSignal.any`，否则回退到 polyfill）与 `startTimeout(ms)` 等能力；当前未启用默认超时。
- 表现：当请求被取消（`ABORTED`）时，`ChatFlow` 保留已流式生成的助手内容并静默结束，不用错误文案覆盖消息，同时记录详细日志以便排查。
