# ZToolkit Documentation Tools

这个工具集用于处理从 ztoolkit 网站爬取并转换的 Markdown 文档。

包含两个主要工具：
1. **extract_md.py** - 提取 MD 文件到新目录
2. **clean_md.py** - 清洗 MD 文件内容

---

## 工具 1: extract_md.py - 提取 MD 文件

### 功能
将 `ztoolkit_html` 目录中的所有 `.md` 文件提取到 `ztoolkit_md` 目录。

### 使用方法

#### 基本用法（保留目录结构）
```bash
# 提取所有 md 文件，保持原有目录结构
python extract_md.py
```

#### 高级选项

```bash
# 扁平化：所有文件放在同一目录
python extract_md.py --flatten

# 按类型组织：按 Class、Interface、Function 等分类
python extract_md.py --organize

# 清理目标目录后再提取
python extract_md.py --clean

# 自定义源目录和目标目录
python extract_md.py --source custom_source --target custom_target
```

#### 组织模式说明
使用 `--organize` 参数时，文件会按照以下规则分类：
- `Class.*.md` → `classes/`
- `Interface.*.md` → `interfaces/`
- `TypeAlias.*.md` → `types/`
- `Function.*.md` → `functions/`
- `Namespace.*.md` → `namespaces/`
- `wait.*.md` → `wait/`
- `index.md`, `quick-start.md` → 根目录
- 其他 → `misc/`

### 示例输出
```
Found 92 markdown files to extract

✓ index.md -> index.md
✓ quick-start.md -> quick-start.md
✓ reference/Class.BasicTool.md -> reference/Class.BasicTool.md
...

============================================================
Extraction Summary:
  Total files found: 92
  Successfully extracted: 92
  Failed: 0
  Target directory: ztoolkit_md
============================================================
```

---

## 工具 2: clean_md.py - 清洗 MD 文件

### 功能
- 移除所有 HTML 标签和 Vue/VitePress 相关元素
- 清理代码块格式（移除 `shiki` 等特殊标记）
- 转换 HTML 链接为标准 Markdown 格式
- 移除导航栏、页面结构等 UI 元素
- 移除锚点链接和冗余空白
- 简化提示框和 Badge 元素

## 使用方法

### 基本用法

```bash
# 清洗 ztoolkit_html 文件夹下的所有 md 文件（包括子文件夹）
python clean_md.py
```

### 高级用法

```bash
# 指定其他目录
python clean_md.py --dir your_directory

# 只处理指定目录，不处理子文件夹
python clean_md.py --no-recursive
```

### 清洗内容

**会被移除的内容：**
- `<div>`, `<span>` 等 HTML 标签及其属性
- Vue/VitePress 相关的类名和属性（如 `v-39a288b8=""`）
- 导航栏和页面布局元素
- 锚点链接（`<a href="#..." class="header-anchor">...)`）
- 代码块的冗余包装（保留代码内容）
- 多余的空白行和分隔线
- Badge 和自定义块的 HTML 包装

**会被保留的内容：**
- Markdown 标题结构
- 纯文本说明
- 代码块（简化格式后）
- 链接（转为标准 Markdown 格式）
- 列表和引用

### 预期效果

清洗后文档大小通常会减少 **60-80%**，同时保持所有重要信息。

### 注意事项

⚠️ **此脚本会直接修改原文件，建议先备份！**

建议在运行前先用 git 提交当前状态，以便出现问题时可以恢复：

```bash
git add .
git commit -m "backup before cleaning md files"
python clean_md.py
```

---

## 推荐工作流

1. **提取文件**（可选）
   ```bash
   # 如果你想保留原始文件，先提取到新目录
   python extract_md.py --clean
   ```

2. **清洗文件**
   ```bash
   # 清洗 ztoolkit_html 或 ztoolkit_md 中的文件
   python clean_md.py
   # 或指定目录
   python clean_md.py --dir ztoolkit_md
   ```

3. **验证结果**
   检查几个文件确保清洗效果符合预期

