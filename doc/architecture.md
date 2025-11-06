% src 目录架构说明（Architecture）

本文件展示 `src/` 的树状结构，并用中文说明每个目录与文件的职责；末尾给出结构改进建议。

## 目录结构树（含中文标注）

```
src
├─ index.ts — 插件入口：确保单例、挂载全局、暴露 ztoolkit 获取器
├─ addon.ts — 插件数据容器：环境/配置/工具初始化，挂接 hooks 与 API 外壳
├─ hooks.ts — 生命周期与事件分发：启动/关闭、主窗口加载、偏好面板脚本、Notify 等
├─ shared — 共享工具模块
│  ├─ ztoolkit.ts — 初始化 Zotero Toolkit：日志前缀、UI 调试、插件图标等
│  ├─ locale.ts — Fluent 本地化工具：initLocale/getString/getLocaleID
│  ├─ prefs.ts — 偏好读写封装：getPref/setPref/clearPref（按插件前缀命名）
│  └─ window.ts — 轻量窗口存活检测 isWindowAlive
└─ chat — 聊天功能域（服务、状态、渲染、UI）
   ├─ services — 功能服务层（与 Zotero/Reader 交互、上下文、流程）
   │  ├─ documentContext.ts — 收集当前条目/Reader 的 PDF 附件，读取全文并构建 System 上下文（Allowed Attachments + Document Context），提供缓存键
   │  ├─ readerNavigation.ts — 打开 Reader、等待 PDF 就绪、翻页与查找高亮
   │  ├─ sessionScope.ts — 计算会话 ID 与作用域 key（reader/attachment/item），作用域切换时重置会话
   │  ├─ chatFlow.ts — 对话流程控制：启动/中止、流式 token 回调、错误处理并更新 sessionStore
   │  ├─ createNotes.ts — 将助手回复渲染为 Zotero Note 兼容 HTML 并保存到关联条目
   │  └─ clipboard.ts — 复制纯文本到剪贴板（原生 Clipboard API/Zotero 工具/execCommand 回退）
   ├─ state — 会话内存状态
   │  └─ sessionStore.ts — 在内存中维护 {status, messages, context, lastResult}；提供增删改与作用域隔离
   ├─ providers — 模型服务商与请求客户端
   │  ├─ providerPresets.ts — 内置模型预设（OpenAI/DeepSeek）：id/endpoint/model/本地化 key
   │  ├─ chatClient.ts — OpenAI 风格 Chat API 客户端：系统提示拼接、token 估算与上限、Abort/超时、SSE 流解析、错误分类映射
   │  └─ index.ts — 对外导出 sendChat/预设与类型
   ├─ render — 渲染层（Markdown/数学/清洗；聊天视图与笔记视图）
   │  ├─ shared — 渲染共享模块（无 DOM 副作用的解析/工具）
   │  │  ├─ markdown.ts — 轻量 Markdown+数学 解析（段落/标题/列表/表格/代码/数学）
   │  │  ├─ mathKatex.ts — 使用 KaTeX 将 LaTeX 渲染为 HTML（失败时回退为转义文本）
   │  │  ├─ inlineUtils.ts — 行内文本/属性转义工具
   │  │  └─ citations.ts — 解析与抽取内联引用 JSON 的工具（((cite: ...))）
   │  ├─ chat — 聊天视图渲染（DOM 片段 + 严格清洗）
   │  │  ├─ html.ts — Markdown→DOM 片段并清洗，返回 fragment/html/数学错误标记
   │  │  ├─ blocks.ts — 块级渲染器：段落/标题/列表/表格/代码/数学（调用 KaTeX）
   │  │  ├─ inline.ts — 行内渲染器：文本/代码/数学（KaTeX）
   │  │  └─ sanitizer.ts — 聊天内容严格 HTML 白名单清洗（标签/属性/协议/样式）
   │  └─ note — 笔记视图渲染（无 KaTeX，保留数学文本为 $...$/<pre.math>）
   │     ├─ html.ts — 生成 Zotero Note 兼容 HTML，((cite)) 转 data-citation 区块
   │     ├─ blocks.ts — 笔记用块级渲染器（严格行内规则）
   │     ├─ inline.ts — 笔记用行内渲染（无 KaTeX）
   │     └─ sanitizer.ts — 笔记用行内级别过滤与链接安全处理
   └─ ui — UI 组件与 Reader 面板
      ├─ controls — 纯 UI 控件
      │  ├─ statusBar.ts — 状态条元素工厂
      │  ├─ welcomeBlock.ts — 欢迎占位与快捷提问按钮
      │  ├─ presetMenu.ts — 预设选择下拉菜单（ARIA/键盘交互）
      │  └─ actionButtons.ts — 发送/停止与清空按钮（图标/模式切换）
      ├─ prefs — 偏好面板（about:addons）
      │  ├─ preferencesPane.ts — 注册偏好面板入口与图标/文案
      │  ├─ preferencesUi.ts — 偏好脚本：预设与 API Key 管理、测试连接、面板切换
      │  └─ prefs.ts — 偏好读写与校验（预设选择、API Key、endpoint https 校验）
      ├─ utils — UI 辅助
      │  ├─ icons.ts — SVG 图标构造器（发送/停止/删除/复制/笔记）
      │  ├─ rafBatcher.ts — requestAnimationFrame 合帧批量渲染工具
      │  └─ inputAutoResize.ts — 文本域自动高度（最大高度、滚动条策略）
      └─ pane — Reader 侧边面板
         ├─ chatPaneView.ts — 纯视图骨架构建（容器/消息区/工具栏/输入区/拖拽手柄）
         ├─ chatPaneController.ts — Presenter：装配控制器与服务、处理提交/中止/清空/引用跳转、注入样式与 KaTeX CSS
         ├─ paneStyles.ts — 注入聊天与 KaTeX 样式表（可作用于 ShadowRoot）
         ├─ controllers — 面板子控制器
         │  ├─ messageListController.ts — 列表渲染与增量更新（与 MessageView 协作）
         │  ├─ messageActions.ts — 助手消息：复制到剪贴板 / 添加为 Zotero 笔记
         │  ├─ inputController.ts — 文本输入与快捷键、动作行（发送/停止/清空）
         │  ├─ presetController.ts — 模型预设选择与持久化
         │  ├─ resizeController.ts — 面板高度拖拽（最小/默认高度回调）
         │  └─ citationController.ts — 内联引用点击/键盘激活事件绑定
         └─ messages — 消息条目视图
            ├─ messageView.ts — 视图适配层：id→DOM 映射、批量渲染调度、引用装饰
            ├─ messageRenderer.ts — 单条消息 DOM 结构与内容渲染、数学错误横幅
            ├─ makeCitations.ts — 将 ((cite: ...)) 替换为可点击编号徽标并建立跳转映射
            └─ types.ts — 消息视图 DOM 句柄/渲染选项类型
```

## 结构改进建议

- Providers 抽象分层
  - 以统一接口抽象不同服务商（OpenAI/DeepSeek/本地服务），将 `chatClient.ts` 作为 OpenAI 适配器；新增 `providers/core.ts` 定义 `ProviderAdapter` 接口，便于扩展和测试替身。
- 引用解析逻辑去重
  - `render/shared/citations.ts` 与 Note 渲染中的 ((cite)) 解析存在重复与正则散落，建议提取到 `render/shared/citeParser.ts` 并复用，统一类型与边界处理。
- Markdown 解析模块化与测试
  - `render/shared/markdown.ts` 体量较大，建议拆分 tokenizer/block-parser/table/parser utils；补充快照与边界单测（数学/表格/列表/代码围栏）。
- 上下文读取缓存与并发控制
  - `documentContext.ts` 逐个附件顺序读取全文，可加入并发上限（如 p-limit）与按 attachmentID 的短时缓存，降低大文献下的等待与重复 IO。
- UI 控制器职责边界
  - `chatPaneController.ts` 已较清晰，但仍较长；可将状态条/欢迎占位的装配与文案更新抽成小型 helper，进一步降低文件长度、便于测试。
- 错误与提示文案集中化
  - Provider 错误码、偏好校验与 UI 提示分散；建议集中到 `shared/errors.ts` 与 `i18n` key 常量，避免魔法字符串分布式修改。
- 类型与 any 降低
  - 与 Zotero 运行时交互处存在 `any` 回退，逐步梳理 `zotero-types` 的覆盖并补充轻量本地类型，减少潜在运行时错误。
- KaTeX 与样式按需注入
  - 当前总是注入 KaTeX CSS，后续可在首次检测到数学片段时再注入，减少无数学对话时的样式负担。

以上建议以最小侵入为原则，优先拆分复用与测试覆盖，逐步演进而非一次性重构。
