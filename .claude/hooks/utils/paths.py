"""Shared filesystem path helpers for hooks."""

import os
from pathlib import Path


def project_dir() -> Path:
    """Project root, anchored via CLAUDE_PROJECT_DIR (set by Claude Code) so
    data/log paths don't depend on the hook's working directory; falls back to
    the repo root derived from this file's location."""
    # paths.py lives at .claude/hooks/utils/, so the repo root is 3 levels up.
    env = os.environ.get("CLAUDE_PROJECT_DIR")
    return Path(env) if env else Path(__file__).resolve().parents[3]
