#!/usr/bin/env python3
"""
Extract all .md files from ztoolkit_html directory to ztoolkit_md directory.
Preserves directory structure and provides options for flattening or organizing.
"""

import os
import shutil
from pathlib import Path
from typing import List, Tuple


class MarkdownExtractor:
    def __init__(self, source_dir: str, target_dir: str):
        self.source_dir = Path(source_dir)
        self.target_dir = Path(target_dir)

    def extract_files(self, flatten: bool = False, organize_by_type: bool = False) -> Tuple[int, int, List[str]]:
        """
        Extract all .md files from source to target directory.

        Args:
            flatten: If True, all files will be placed directly in target_dir without subdirectories
            organize_by_type: If True, organize files into subdirectories based on type (Class, Interface, etc.)

        Returns:
            Tuple of (success_count, total_count, errors)
        """
        # Create target directory if it doesn't exist
        self.target_dir.mkdir(parents=True, exist_ok=True)

        # Find all .md files in source directory
        md_files = list(self.source_dir.rglob('*.md'))

        if not md_files:
            print(f"No markdown files found in {self.source_dir}")
            return 0, 0, []

        print(f"Found {len(md_files)} markdown files to extract\n")

        success_count = 0
        errors = []

        for md_file in md_files:
            try:
                if flatten:
                    # Place all files directly in target directory
                    target_path = self.target_dir / md_file.name
                elif organize_by_type:
                    # Organize by file type prefix
                    target_path = self._get_organized_path(md_file)
                else:
                    # Preserve directory structure
                    relative_path = md_file.relative_to(self.source_dir)
                    target_path = self.target_dir / relative_path

                # Create parent directory if needed
                target_path.parent.mkdir(parents=True, exist_ok=True)

                # Copy file
                shutil.copy2(md_file, target_path)

                # Print progress
                relative_source = md_file.relative_to(self.source_dir)
                relative_target = target_path.relative_to(self.target_dir)
                print(f"✓ {relative_source} -> {relative_target}")

                success_count += 1

            except Exception as e:
                error_msg = f"Failed to copy {md_file.name}: {str(e)}"
                errors.append(error_msg)
                print(f"✗ {error_msg}")

        return success_count, len(md_files), errors

    def _get_organized_path(self, md_file: Path) -> Path:
        """
        Determine organized path based on file name pattern.

        Patterns:
        - Class.*.md -> classes/
        - Interface.*.md -> interfaces/
        - TypeAlias.*.md -> types/
        - Function.*.md -> functions/
        - Namespace.*.md -> namespaces/
        - wait.*.md -> wait/
        - Others -> misc/
        """
        name = md_file.name

        if name.startswith('Class.'):
            subdir = 'classes'
        elif name.startswith('Interface.'):
            subdir = 'interfaces'
        elif name.startswith('TypeAlias.'):
            subdir = 'types'
        elif name.startswith('Function.'):
            subdir = 'functions'
        elif name.startswith('Namespace.'):
            subdir = 'namespaces'
        elif name.startswith('wait.'):
            subdir = 'wait'
        elif name == 'index.md':
            subdir = ''  # Keep index at root
        elif name == 'quick-start.md':
            subdir = ''  # Keep quick-start at root
        else:
            subdir = 'misc'

        if subdir:
            return self.target_dir / subdir / md_file.name
        else:
            return self.target_dir / md_file.name

    def print_summary(self, success_count: int, total_count: int, errors: List[str]) -> None:
        """Print extraction summary."""
        print(f"\n{'='*60}")
        print(f"Extraction Summary:")
        print(f"  Total files found: {total_count}")
        print(f"  Successfully extracted: {success_count}")
        print(f"  Failed: {len(errors)}")
        print(f"  Target directory: {self.target_dir}")

        if errors:
            print(f"\nErrors:")
            for error in errors:
                print(f"  - {error}")

        print(f"{'='*60}")


def main():
    """Main entry point."""
    import argparse

    parser = argparse.ArgumentParser(
        description='Extract markdown files from ztoolkit_html to ztoolkit_md'
    )
    parser.add_argument(
        '--source',
        type=str,
        default='ztoolkit_html',
        help='Source directory containing markdown files (default: ztoolkit_html)'
    )
    parser.add_argument(
        '--target',
        type=str,
        default='ztoolkit_md',
        help='Target directory for extracted files (default: ztoolkit_md)'
    )
    parser.add_argument(
        '--flatten',
        action='store_true',
        help='Place all files directly in target directory without subdirectories'
    )
    parser.add_argument(
        '--organize',
        action='store_true',
        help='Organize files by type (classes, interfaces, functions, etc.)'
    )
    parser.add_argument(
        '--clean',
        action='store_true',
        help='Clean target directory before extraction'
    )

    args = parser.parse_args()

    # Get script directory
    script_dir = Path(__file__).parent
    source_dir = script_dir / args.source
    target_dir = script_dir / args.target

    # Validate source directory
    if not source_dir.exists():
        print(f"Error: Source directory '{source_dir}' does not exist")
        return 1

    if not source_dir.is_dir():
        print(f"Error: '{source_dir}' is not a directory")
        return 1

    # Clean target directory if requested
    if args.clean and target_dir.exists():
        print(f"Cleaning target directory: {target_dir}")
        shutil.rmtree(target_dir)
        print()

    # Check if target directory exists and is not empty
    if target_dir.exists() and any(target_dir.iterdir()) and not args.clean:
        response = input(f"Target directory '{target_dir}' already exists and is not empty. Continue? [y/N]: ")
        if response.lower() != 'y':
            print("Extraction cancelled.")
            return 0
        print()

    print(f"Extracting markdown files:")
    print(f"  Source: {source_dir}")
    print(f"  Target: {target_dir}")
    print(f"  Flatten: {args.flatten}")
    print(f"  Organize: {args.organize}")
    print()

    # Extract files
    extractor = MarkdownExtractor(source_dir, target_dir)
    success_count, total_count, errors = extractor.extract_files(
        flatten=args.flatten,
        organize_by_type=args.organize
    )

    # Print summary
    extractor.print_summary(success_count, total_count, errors)

    return 0 if not errors else 1


if __name__ == '__main__':
    exit(main())