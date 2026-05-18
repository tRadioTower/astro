#!/usr/bin/env python3
"""Download elementlist.html and its referenced assets without rewriting paths.

Usage:
  BASIC_USER='your-id' BASIC_PASS='your-password' python3 download_elementlist.py
"""

from __future__ import annotations

import argparse
import base64
import mimetypes
import os
import posixpath
import re
import sys
import time
from html.parser import HTMLParser
from pathlib import Path
from typing import Iterable
from urllib.error import HTTPError, URLError
from urllib.parse import unquote, urldefrag, urljoin, urlparse
from urllib.request import Request, build_opener


DEFAULT_URL = "https://test847.dev.members-dev.com/elementlist.html"
SKIP_SCHEMES = {"data", "mailto", "tel", "javascript", "blob"}
RESOURCE_ATTRS = {
    "src",
    "href",
    "poster",
    "data-src",
    "data-href",
    "data-original",
}
SRCSET_ATTRS = {"srcset", "data-srcset"}
CSS_URL_RE = re.compile(r"url\(\s*(['\"]?)(?!data:)([^'\"\)]+)\1\s*\)", re.I)
CSS_IMPORT_RE = re.compile(r"@import\s+(?:url\(\s*)?(['\"])([^'\"]+)\1\s*\)?", re.I)


class AssetHTMLParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=False)
        self.urls: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._collect(attrs)

    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        self._collect(attrs)

    def _collect(self, attrs: list[tuple[str, str | None]]) -> None:
        for name, value in attrs:
            if not value:
                continue
            lower_name = name.lower()
            if lower_name in RESOURCE_ATTRS:
                self.urls.append(value)
            elif lower_name in SRCSET_ATTRS:
                self.urls.extend(parse_srcset(value))
            elif lower_name == "style":
                self.urls.extend(css_urls(value))


def parse_srcset(value: str) -> list[str]:
    urls: list[str] = []
    for part in value.split(","):
        piece = part.strip()
        if not piece:
            continue
        urls.append(piece.split()[0])
    return urls


def css_urls(css: str) -> list[str]:
    found = [match.group(2).strip() for match in CSS_URL_RE.finditer(css)]
    found.extend(match.group(2).strip() for match in CSS_IMPORT_RE.finditer(css))
    return found


def should_skip(raw_url: str, page_url: str, same_host_only: bool) -> bool:
    raw_url = raw_url.strip()
    if not raw_url or raw_url.startswith("#"):
        return True
    parsed = urlparse(raw_url)
    if parsed.scheme.lower() in SKIP_SCHEMES:
        return True
    if same_host_only:
        absolute = urlparse(urljoin(page_url, raw_url))
        base = urlparse(page_url)
        return absolute.netloc != base.netloc
    return False


def safe_local_path(url: str, output_dir: Path, base_url: str | None = None) -> Path:
    parsed = urlparse(url)
    base = urlparse(base_url) if base_url else None
    path = unquote(parsed.path)
    if not path or path.endswith("/"):
        path = posixpath.join(path, "index.html")

    parts = [part for part in path.split("/") if part not in ("", ".", "..")]
    if not parts:
        parts = ["index.html"]

    filename = parts[-1]
    stem, ext = os.path.splitext(filename)
    if not ext:
        guessed = mimetypes.guess_extension(mimetypes.guess_type(url)[0] or "")
        parts[-1] = f"{filename}{guessed or '.bin'}"

    if parsed.query:
        query_suffix = re.sub(r"[^A-Za-z0-9._-]+", "_", parsed.query).strip("_")
        if query_suffix:
            stem, ext = os.path.splitext(parts[-1])
            parts[-1] = f"{stem}_{query_suffix}{ext}"

    if base and parsed.netloc and parsed.netloc != base.netloc:
        return output_dir / "_external" / parsed.netloc / Path(*parts)

    return output_dir / Path(*parts)


def request_headers(user: str | None, password: str | None) -> dict[str, str]:
    headers = {
        "User-Agent": "Mozilla/5.0 local-asset-downloader/1.0",
        "Accept": "*/*",
    }
    if user is not None and password is not None:
        token = base64.b64encode(f"{user}:{password}".encode()).decode()
        headers["Authorization"] = f"Basic {token}"
    return headers


def fetch(url: str, headers: dict[str, str], retries: int = 2) -> tuple[bytes, str]:
    opener = build_opener()
    last_error: Exception | None = None
    for attempt in range(retries + 1):
        try:
            req = Request(url, headers=headers)
            with opener.open(req, timeout=30) as response:
                content_type = response.headers.get("Content-Type", "")
                return response.read(), content_type
        except (HTTPError, URLError, TimeoutError) as exc:
            last_error = exc
            if attempt < retries:
                time.sleep(0.8 * (attempt + 1))
    raise RuntimeError(f"failed to fetch {url}: {last_error}")


def decode_text(content: bytes, content_type: str) -> str:
    match = re.search(r"charset=([^;\s]+)", content_type, re.I)
    encodings = [match.group(1)] if match else []
    encodings.extend(["utf-8", "shift_jis", "euc-jp", "iso-8859-1"])
    for encoding in encodings:
        try:
            return content.decode(encoding)
        except (LookupError, UnicodeDecodeError):
            continue
    return content.decode("utf-8", errors="replace")


def iter_html_urls(html: str) -> Iterable[str]:
    parser = AssetHTMLParser()
    parser.feed(html)
    return parser.urls


def download_asset(
    raw_url: str,
    base_url: str,
    output_dir: Path,
    headers: dict[str, str],
    downloaded: dict[str, Path],
    same_host_only: bool,
) -> Path | None:
    if should_skip(raw_url, base_url, same_host_only):
        return None

    absolute, _fragment = urldefrag(urljoin(base_url, raw_url))
    if absolute in downloaded:
        return downloaded[absolute]

    destination = safe_local_path(absolute, output_dir, base_url)
    destination.parent.mkdir(parents=True, exist_ok=True)

    try:
        content, content_type = fetch(absolute, headers)
    except RuntimeError as exc:
        print(f"warn: {exc}", file=sys.stderr)
        return None

    destination.write_bytes(content)
    downloaded[absolute] = destination
    print(f"saved: {absolute} -> {destination}")

    if "text/css" in content_type or destination.suffix.lower() == ".css":
        css = decode_text(content, content_type)
        for nested in css_urls(css):
            download_asset(nested, absolute, output_dir, headers, downloaded, same_host_only)

    return destination


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--url", default=DEFAULT_URL)
    parser.add_argument("--output-dir", default="downloaded_site")
    parser.add_argument("--include-external", action="store_true")
    args = parser.parse_args()

    user = os.environ.get("BASIC_USER")
    password = os.environ.get("BASIC_PASS")
    headers = request_headers(user, password)
    output_dir = Path(args.output_dir).resolve()
    output_dir.mkdir(parents=True, exist_ok=True)

    print(f"fetching page: {args.url}")
    try:
        html_bytes, content_type = fetch(args.url, headers, retries=0)
    except RuntimeError as exc:
        print(exc, file=sys.stderr)
        if "HTTP Error 401" in str(exc):
            print("Basic認証が必要です。BASIC_USER と BASIC_PASS を設定してください。", file=sys.stderr)
        return 1

    html = decode_text(html_bytes, content_type)
    page_path = safe_local_path(args.url, output_dir, args.url)
    page_path.parent.mkdir(parents=True, exist_ok=True)
    downloaded: dict[str, Path] = {}

    same_host_only = not args.include_external
    for raw_url in iter_html_urls(html):
        download_asset(raw_url, args.url, output_dir, headers, downloaded, same_host_only)

    page_path.write_bytes(html_bytes)
    print(f"saved page: {page_path}")
    print(f"assets: {len(downloaded)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
