"""Vercel ASGI entry point; static React assets are served by its CDN."""

from pathlib import Path

from web.backend.main import create_app

app = create_app(static_dir=Path(__file__).parent / "_no_static")
