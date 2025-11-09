#!/usr/bin/env python3
"""
Clean and simplify Markdown files converted from HTML.
Removes Vue/VitePress artifacts, HTML tags, and redundant elements.
"""

import re
import os
from pathlib import Path
from typing import List, Tuple


class MarkdownCleaner:
    def __init__(self):
        # Patterns for cleaning
        self.patterns = [
            # Remove HTML comments
            (r'<!--[\s\S]*?-->', ''),

            # Remove Vue/VitePress divs and spans with attributes
            (r'<div[^>]*>', ''),
            (r'</div>', ''),
            (r'<span[^>]*>', ''),
            (r'</span>', ''),

            # Remove anchor links (header anchors)
            (r'<a href="#[^"]*" class="header-anchor"[^>]*>​?</a>', ''),

            # Clean up code block wrappers - keep content
            (r'``` shiki\n', '```\n'),
            (r'<span class="lang">([^<]+)</span>\n', ''),

            # Remove VitePress specific elements
            (r'<a href="[^"]*" class="VPLink[^>]*>([^<]+)</a>', r'\1'),

            # Convert remaining links to markdown format (keep external links)
            (r'<a href="([^"]+)" target="_blank" rel="noreferrer">([^<]+)</a>', r'[\2](\1)'),

            # Remove badge/alert wrappers but keep content
            (r'<div class="[^"]*custom-block[^"]*">\n+', '\n> '),

            # Clean up escaped blockquote markers
            (r'\\> ', '> '),
            (r'\\\*\\\*', '**'),
            (r'\\`', '`'),

            # Remove horizontal rules (we'll add them back strategically)
            (r'\n-{72}\n', '\n\n---\n\n'),

            # Remove multiple consecutive blank lines
            (r'\n{3,}', '\n\n'),

            # Remove trailing whitespace
            (r' +\n', '\n'),
        ]

    def clean_code_blocks(self, content: str) -> str:
        """Clean code block formatting."""
        # Find all code blocks and clean them
        def replace_code_block(match):
            lang = match.group(1) or ''
            code = match.group(2)
            return f'```{lang}\n{code}\n```'

        # Handle ``` shiki format
        content = re.sub(r'```\s*shiki\s*\n', '```\n', content)

        return content

    def clean_links(self, content: str) -> str:
        """Convert HTML links to Markdown format and clean up internal links."""
        # Convert .html to .md for internal links
        content = re.sub(r'\]\(\.\/([^)]+)\.html\)', r'](\1.md)', content)

        return content

    def remove_navigation_elements(self, content: str) -> str:
        """Remove navigation and layout elements."""
        lines = content.split('\n')
        cleaned_lines = []
        skip_until_content = True
        found_first_heading = False

        for line in lines:
            # Skip lines until we find actual content (first real heading or text)
            if skip_until_content:
                if line.strip().startswith('#') and not 'class=' in line:
                    skip_until_content = False
                    found_first_heading = True
                    cleaned_lines.append(line)
                elif found_first_heading and line.strip() and not line.strip().startswith('<'):
                    cleaned_lines.append(line)
            else:
                cleaned_lines.append(line)

        # If we never found content, return original (fallback)
        if not found_first_heading:
            return content

        return '\n'.join(cleaned_lines)

    def clean_content(self, content: str) -> str:
        """Apply all cleaning patterns to content."""
        # First remove navigation elements
        content = self.remove_navigation_elements(content)

        # Apply all regex patterns
        for pattern, replacement in self.patterns:
            content = re.sub(pattern, replacement, content)

        # Clean code blocks
        content = self.clean_code_blocks(content)

        # Clean links
        content = self.clean_links(content)

        # Final cleanup: remove leading/trailing whitespace
        content = content.strip()

        # Ensure file ends with single newline
        content = content + '\n'

        return content

    def process_file(self, file_path: Path) -> Tuple[bool, str]:
        """
        Process a single markdown file.
        Returns (success, message)
        """
        try:
            # Read original content
            with open(file_path, 'r', encoding='utf-8') as f:
                original_content = f.read()

            # Clean content
            cleaned_content = self.clean_content(original_content)

            # Calculate size reduction
            original_size = len(original_content)
            cleaned_size = len(cleaned_content)
            reduction = ((original_size - cleaned_size) / original_size * 100) if original_size > 0 else 0

            # Write cleaned content back
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(cleaned_content)

            return True, f"Reduced by {reduction:.1f}% ({original_size} -> {cleaned_size} bytes)"

        except Exception as e:
            return False, f"Error: {str(e)}"

    def process_directory(self, directory: Path, recursive: bool = True) -> None:
        """
        Process all markdown files in a directory.
        """
        # Find all .md files
        if recursive:
            md_files = list(directory.rglob('*.md'))
        else:
            md_files = list(directory.glob('*.md'))

        if not md_files:
            print(f"No markdown files found in {directory}")
            return

        print(f"Found {len(md_files)} markdown files to process\n")

        total_original_size = 0
        total_cleaned_size = 0
        success_count = 0

        for md_file in md_files:
            # Read original size
            original_size = md_file.stat().st_size
            total_original_size += original_size

            # Process file
            success, message = self.process_file(md_file)

            # Get cleaned size
            cleaned_size = md_file.stat().st_size
            total_cleaned_size += cleaned_size

            # Print result
            relative_path = md_file.relative_to(directory)
            if success:
                success_count += 1
                print(f"✓ {relative_path}: {message}")
            else:
                print(f"✗ {relative_path}: {message}")

        # Print summary
        print(f"\n{'='*60}")
        print(f"Summary:")
        print(f"  Total files processed: {len(md_files)}")
        print(f"  Successful: {success_count}")
        print(f"  Failed: {len(md_files) - success_count}")
        print(f"  Original total size: {total_original_size:,} bytes")
        print(f"  Cleaned total size: {total_cleaned_size:,} bytes")
        if total_original_size > 0:
            total_reduction = ((total_original_size - total_cleaned_size) / total_original_size * 100)
            print(f"  Total reduction: {total_reduction:.1f}%")
        print(f"{'='*60}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Clean and simplify Markdown files converted from HTML'
    )
    parser.add_argument(
        '--dir',
        type=str,
        default='ztoolkit_html',
        help='Directory containing markdown files (default: ztoolkit_html)'
    )
    parser.add_argument(
        '--no-recursive',
        action='store_true',
        help='Do not process subdirectories'
    )

    args = parser.parse_args()

    # Get script directory
    script_dir = Path(__file__).parent
    target_dir = script_dir / args.dir

    if not target_dir.exists():
        print(f"Error: Directory '{target_dir}' does not exist")
        return 1

    if not target_dir.is_dir():
        print(f"Error: '{target_dir}' is not a directory")
        return 1

    print(f"Cleaning markdown files in: {target_dir}")
    print(f"Recursive: {not args.no_recursive}\n")

    cleaner = MarkdownCleaner()
    cleaner.process_directory(target_dir, recursive=not args.no_recursive)

    return 0


if __name__ == '__main__':
    exit(main())
