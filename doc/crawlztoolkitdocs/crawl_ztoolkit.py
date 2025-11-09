#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Mirror HTML pages from https://windingwind.github.io/zotero-plugin-toolkit/
- Only downloads HTML pages (no CSS/JS/images).
- Preserves on-disk folder structure matching the site.
- Stays within the path prefix /zotero-plugin-toolkit/
"""

import argparse
import os
import time
from collections import deque
from urllib.parse import urljoin, urlparse, urlunparse

import requests
from bs4 import BeautifulSoup

DEFAULT_START = "https://windingwind.github.io/zotero-plugin-toolkit/"

def normalize_url(u: str) -> str:
    """Strip fragments/query; normalize scheme/host/path; keep trailing slash semantics."""
    p = urlparse(u)
    # Remove query & fragment
    p = p._replace(query="", fragment="")
    # Normalize scheme/host lowercase
    scheme = p.scheme.lower()
    netloc = p.netloc.lower()
    # Keep path as-is; avoid double slashes
    path = p.path or "/"
    return urlunparse((scheme, netloc, path, "", "", ""))

def within_prefix(abs_url: str, allow_netloc: str, allow_prefix_path: str) -> bool:
    """Only follow links on the same host and inside the given path prefix."""
    p = urlparse(abs_url)
    if p.netloc.lower() != allow_netloc.lower():
        return False
    # Ensure path starts with the desired prefix (with a leading slash)
    return p.path.startswith(allow_prefix_path)

def is_probably_html(resp: requests.Response) -> bool:
    ctype = resp.headers.get("Content-Type", "")
    return "text/html" in ctype.lower() or "application/xhtml+xml" in ctype.lower()

def local_path_for(url: str, base_prefix_path: str, out_dir: str) -> str:
    """
    Map a site URL to a local file path under out_dir, preserving structure.
    - If URL path ends with '/', save as 'index.html' under that folder.
    - If URL path ends with '.html', save as that filename.
    - Otherwise, also save as 'index.html' (handles routes like '/reference').
    """
    p = urlparse(url)
    rel_path = p.path[len(base_prefix_path):].lstrip("/")  # path relative to prefix
    # Directory for site root under given prefix
    if rel_path == "" or rel_path.endswith("/"):
        rel_path = os.path.join(rel_path, "index.html")
    elif not rel_path.endswith(".html"):
        rel_path = os.path.join(rel_path, "index.html")
    return os.path.join(out_dir, rel_path)

def save_bytes(path: str, content: bytes):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(content)

def extract_links(html_bytes: bytes, base_url: str) -> set:
    soup = BeautifulSoup(html_bytes, "html.parser")
    links = set()
    for a in soup.find_all("a", href=True):
        href = a.get("href")
        abs_url = urljoin(base_url, href)
        links.add(abs_url)
    return links

def crawl(start_url: str, out_dir: str, delay: float = 0.2, ref_only: bool = False):
    start_url = normalize_url(start_url)
    parsed = urlparse(start_url)
    allow_netloc = parsed.netloc
    # The site lives under this prefix:
    # e.g. '/zotero-plugin-toolkit/' — enforce trailing slash for correctness
    allow_prefix_path = parsed.path
    if not allow_prefix_path.endswith("/"):
        allow_prefix_path += "/"

    session = requests.Session()
    session.headers.update({
        "User-Agent": "ztoolkit-html-mirror/1.0 (+https://github.com/yourname)"
    })

    # Seed queue
    q = deque([start_url])
    visited = set()
    downloaded = 0

    # Optionally restrict to /reference/
    def allowed_by_user_filter(u: str) -> bool:
        if not ref_only:
            return True
        # allow homepage, quick-start, and anything under /reference/
        p = urlparse(u)
        # local path relative to prefix:
        rel = p.path[len(allow_prefix_path):].lstrip("/")
        return (p.path.rstrip("/").endswith("/zotero-plugin-toolkit")  # homepage (edge case)
                or p.path.endswith("/zotero-plugin-toolkit/")
                or rel == "" or rel == "quick-start.html" or rel.startswith("reference/"))

    while q:
        url = q.popleft()
        url = normalize_url(url)
        if url in visited:
            continue
        visited.add(url)

        # Stay within host + prefix
        if not within_prefix(url, allow_netloc, allow_prefix_path):
            continue
        if not allowed_by_user_filter(url):
            continue

        try:
            resp = session.get(url, timeout=20)
        except requests.RequestException as e:
            print(f"[skip] {url} -> request error: {e}")
            continue

        if resp.status_code != 200:
            print(f"[skip] {url} -> status {resp.status_code}")
            continue

        if not is_probably_html(resp):
            # Only store HTML, but do not enqueue from non-HTML
            continue

        # Save to disk
        path = local_path_for(url, base_prefix_path=allow_prefix_path, out_dir=out_dir)
        save_bytes(path, resp.content)
        downloaded += 1
        print(f"[saved] {url} -> {path}")

        # Extract and enqueue links
        for link in extract_links(resp.content, resp.url):
            link = normalize_url(link)
            if link not in visited and within_prefix(link, allow_netloc, allow_prefix_path):
                q.append(link)

        # politeness delay
        if delay > 0:
            time.sleep(delay)

    print(f"\nDone. Visited: {len(visited)} URLs; Saved HTML pages: {downloaded}. Output dir: {out_dir}")

def main():
    ap = argparse.ArgumentParser(description="Mirror HTML pages of ztoolkit docs (structure-preserving).")
    ap.add_argument("--start", default=DEFAULT_START, help="Start URL (default: site homepage)")
    ap.add_argument("--out", default="ztoolkit_html", help="Output directory")
    ap.add_argument("--delay", type=float, default=0.2, help="Politeness delay between requests (seconds)")
    ap.add_argument("--ref-only", action="store_true",
                    help="Only mirror /reference/ (plus homepage与quick-start)")
    args = ap.parse_args()

    crawl(start_url=args.start, out_dir=args.out, delay=args.delay, ref_only=args.ref_only)

if __name__ == "__main__":
    main()
