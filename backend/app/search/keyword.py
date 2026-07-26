"""Exact / partial keyword search — the classic WhatsApp path.

Deliberately literal: it only looks at text a user would actually *see* (the
message text, filename and caption) — NOT the mock SLM `processed_text`. That is
the whole point of the case study: keyword search cannot find an unnamed PDF
whose contents were never typed. The semantic path is what reads processed_text.
"""
from __future__ import annotations

from ..models import Message

# Very common words that shouldn't count as keyword hits on their own — matching
# WhatsApp's behaviour of returning meaningful matches, not every message
# containing "the" or "do".
_STOPWORDS = {
    "the", "a", "an", "is", "are", "was", "were", "be", "to", "of", "in", "on",
    "at", "for", "and", "or", "but", "do", "does", "did", "i", "you", "my",
    "me", "we", "it", "this", "that", "how", "what", "where", "when", "much",
    "many", "can", "will", "with", "about", "please", "hey", "hi",
}


def _visible_text(m: Message) -> str:
    parts = [m.text]
    if m.media is not None:
        parts.append(m.media.filename)
        if m.media.caption:
            parts.append(m.media.caption)
    return " ".join(p for p in parts if p)


def keyword_search(query: str, messages: list[Message]) -> list[tuple[Message, float]]:
    """Return (message, raw_score) ranked by keyword hits, best first."""
    q = query.lower().strip()
    if not q:
        return []
    # Meaningful tokens only: drop stopwords and 1-2 char fragments so a query
    # like "how much do I owe" doesn't match every message containing "do"/"i".
    q_tokens = [t for t in q.split() if len(t) > 2 and t not in _STOPWORDS]

    scored: list[tuple[Message, float]] = []
    for m in messages:
        hay = _visible_text(m).lower()
        if not hay:
            continue
        score = 0.0
        # Whole-phrase match is strongest (only when the phrase is substantive).
        if len(q) > 2 and q in hay:
            score += 5.0
        # Per-token partial matches.
        for tok in q_tokens:
            if tok in hay:
                score += 1.0
        if score > 0:
            scored.append((m, score))

    scored.sort(key=lambda x: x[1], reverse=True)
    return scored
