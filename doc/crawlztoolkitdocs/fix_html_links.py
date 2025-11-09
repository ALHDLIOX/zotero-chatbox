#!/usr/bin/env python3
"""
修复 ztoolkit_md 文件夹中的 .html# 链接为 .md# 链接

用法:
    python fix_html_links.py --dry-run  # 预览将要修改的内容
    python fix_html_links.py            # 实际执行修改
"""

import os
import re
import argparse
from pathlib import Path
from typing import List, Tuple


def find_markdown_files(base_dir: str) -> List[Path]:
    """查找所有需要处理的 markdown 文件"""
    base_path = Path(base_dir)
    return list(base_path.rglob("*.md"))


def preview_changes(file_path: Path) -> Tuple[str, str, List[Tuple[int, str, str]]]:
    """
    预览文件中将要进行的更改

    返回: (原始内容, 新内容, 更改列表)
    更改列表格式: [(行号, 原始行, 新行), ...]
    """
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()

    # 正则表达式: 匹配 ](./xxx.html#xxx) 格式
    pattern = r'\]\(\.\/([^)]+)\.html(#[^)]*)\)'
    replacement = r'](./\1.md\2)'

    # 查找所有匹配项
    matches = list(re.finditer(pattern, content))

    if not matches:
        return content, content, []

    # 生成新内容
    new_content = re.sub(pattern, replacement, content)

    # 生成逐行对比
    changes = []
    original_lines = content.split('\n')
    new_lines = new_content.split('\n')

    for i, (orig_line, new_line) in enumerate(zip(original_lines, new_lines), 1):
        if orig_line != new_line:
            changes.append((i, orig_line, new_line))

    return content, new_content, changes


def apply_fixes(file_path: Path) -> int:
    """
    应用修复到文件

    返回: 修改的次数
    """
    _, new_content, changes = preview_changes(file_path)

    if changes:
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        return len(changes)

    return 0


def main():
    parser = argparse.ArgumentParser(
        description='修复 ztoolkit_md 文件夹中的 .html# 链接为 .md# 链接'
    )
    parser.add_argument(
        '--dry-run',
        action='store_true',
        help='预览模式,只显示将要修改的内容,不实际修改文件'
    )
    parser.add_argument(
        '--max-preview',
        type=int,
        default=5,
        help='每个文件最多显示多少处更改 (默认: 5)'
    )

    args = parser.parse_args()

    # 获取脚本所在目录
    script_dir = Path(__file__).parent
    md_dir = script_dir / "ztoolkit_md"

    if not md_dir.exists():
        print(f"❌ 错误: 目录不存在: {md_dir}")
        return 1

    print(f"🔍 正在扫描目录: {md_dir}")
    md_files = find_markdown_files(str(md_dir))
    print(f"📄 找到 {len(md_files)} 个 Markdown 文件\n")

    total_files_to_change = 0
    total_changes = 0

    # 统计和预览
    for md_file in md_files:
        _, _, changes = preview_changes(md_file)

        if changes:
            total_files_to_change += 1
            total_changes += len(changes)

            rel_path = md_file.relative_to(md_dir)
            print(f"\n{'='*80}")
            print(f"📝 文件: {rel_path}")
            print(f"   共 {len(changes)} 处需要修改")
            print(f"{'='*80}")

            # 显示前几处更改
            for i, (line_num, old_line, new_line) in enumerate(changes[:args.max_preview]):
                print(f"\n  第 {line_num} 行:")
                print(f"  - {old_line}")
                print(f"  + {new_line}")

            if len(changes) > args.max_preview:
                print(f"\n  ... 还有 {len(changes) - args.max_preview} 处更改未显示")

    # 总结
    print(f"\n\n{'='*80}")
    print(f"📊 统计信息:")
    print(f"{'='*80}")
    print(f"  需要修改的文件数: {total_files_to_change}")
    print(f"  总修改次数: {total_changes}")
    print(f"{'='*80}\n")

    if total_changes == 0:
        print("✅ 没有需要修改的内容")
        return 0

    # 执行修改
    if args.dry_run:
        print("ℹ️  这是预览模式,未实际修改文件")
        print("💡 要执行修改,请运行: python fix_html_links.py")
    else:
        response = input("\n⚠️  确定要执行修改吗? (yes/no): ").strip().lower()

        if response in ('yes', 'y'):
            print("\n🔧 正在修改文件...")

            modified_count = 0
            for md_file in md_files:
                changes_made = apply_fixes(md_file)
                if changes_made > 0:
                    modified_count += 1
                    rel_path = md_file.relative_to(md_dir)
                    print(f"  ✅ {rel_path} ({changes_made} 处修改)")

            print(f"\n✅ 完成! 共修改了 {modified_count} 个文件")
        else:
            print("\n❌ 已取消修改")

    return 0


if __name__ == "__main__":
    exit(main())
