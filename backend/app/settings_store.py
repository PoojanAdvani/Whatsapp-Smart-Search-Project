"""In-memory Smart Search settings + the indexable-message resolver.

The `scope` and `exclusions` decide which seed messages are eligible for the
semantic index, mirroring the case study's granular permission controls
(all chats / docs only / custom exclusions).
"""
from __future__ import annotations

from .data.seed import MESSAGES
from .models import Message, Settings

# Types considered "documents / media" for the docs_only scope.
_DOC_TYPES = {"pdf", "image", "voice", "link"}

_settings = Settings()


def get_settings() -> Settings:
    return _settings


def update_settings(new: Settings) -> Settings:
    global _settings
    _settings = new
    return _settings


def indexable_messages(settings: Settings | None = None) -> list[Message]:
    """Return the messages eligible for the semantic index under current settings."""
    s = settings or _settings
    if not s.enabled:
        return []
    result: list[Message] = []
    for m in MESSAGES:
        if m.chat_id in s.exclusions:
            continue
        if s.scope == "docs_only" and m.type not in _DOC_TYPES:
            continue
        result.append(m)
    return result
