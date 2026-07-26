"""Dual-Path Search Orchestrator.

Runs the exact keyword path and the semantic vector path, then fuses them with
RRF. In `keyword` mode only the exact path is returned (classic WhatsApp). In
`smart` mode the fused list is returned and the semantic path is exposed
separately so the UI can render a clear "Exact vs Smart" split (risk-mitigation
#3 in the case study).
"""
from __future__ import annotations

import re
import time

from ..models import (
    Message,
    SearchMode,
    SearchResponse,
    SearchResultItem,
)
from . import rrf
from .keyword import keyword_search
from .semantic import SemanticIndex

# If keyword search returns at most this many hits, we suggest Smart Search
# (drives the proactive fallback nudge / discovery-conversion metric).
FALLBACK_THRESHOLD = 1


def _snippet(m: Message, query: str, max_len: int = 160) -> str:
    """Build a short snippet, preferring the region around a query term."""
    source = m.text.strip()
    if not source and m.processed_text:
        source = m.processed_text.strip()
    if not source and m.media is not None:
        source = m.media.filename
    if not source:
        return ""

    low = source.lower()
    terms = [t for t in re.findall(r"[a-z0-9]+", query.lower()) if len(t) > 2]
    pos = -1
    for t in terms:
        pos = low.find(t)
        if pos != -1:
            break
    if pos == -1:
        snippet = source[:max_len]
    else:
        start = max(0, pos - 40)
        snippet = source[start:start + max_len]
        if start > 0:
            snippet = "…" + snippet
    if len(source) > len(snippet):
        snippet = snippet.rstrip() + "…"
    return snippet


def _confidence(entry: dict) -> float:
    """Normalized 0..1 confidence for display."""
    sim = entry.get("semantic_sim")
    if entry["match_type"] == "exact":
        # Exact hits are high-confidence by construction.
        return 0.99
    if sim is None:
        return 0.9
    # Map cosine sim (~0.18..0.9) into a friendly 0.5..0.99 band.
    c = 0.5 + (min(sim, 0.9) - 0.18) / (0.9 - 0.18) * 0.49
    return round(max(0.5, min(0.99, c)), 2)


class Orchestrator:
    def __init__(self, index: SemanticIndex, chat_names: dict[str, str]):
        self.index = index
        self.chat_names = chat_names

    def _to_item(self, entry: dict, query: str) -> SearchResultItem:
        m: Message = entry["message"]
        return SearchResultItem(
            message=m,
            chat_name=self.chat_names.get(m.chat_id, m.chat_id),
            match_type=entry["match_type"],
            confidence=_confidence(entry),
            rrf_score=round(entry["rrf_score"], 6),
            exact_rank=entry.get("exact_rank"),
            semantic_rank=entry.get("semantic_rank"),
            snippet=_snippet(m, query),
        )

    def search(
        self,
        query: str,
        mode: SearchMode,
        messages: list[Message],
    ) -> SearchResponse:
        t0 = time.perf_counter()

        exact = keyword_search(query, messages)
        exact_entries = [
            {"message": m, "match_type": "exact", "rrf_score": 1.0 / (rrf.K + i + 1),
             "exact_rank": i + 1, "semantic_rank": None, "semantic_sim": None}
            for i, (m, _) in enumerate(exact)
        ]
        exact_items = [self._to_item(e, query) for e in exact_entries]

        suggest_smart = len(exact) <= FALLBACK_THRESHOLD

        if mode == "keyword":
            took = int((time.perf_counter() - t0) * 1000)
            return SearchResponse(
                query=query, mode=mode, engine=self.index.engine_name,
                exact=exact_items, semantic=[], fused=exact_items,
                suggest_smart=suggest_smart, took_ms=took,
            )

        # smart mode: run semantic path + fuse.
        semantic = self.index.search(query)
        fused_entries = rrf.fuse(exact, semantic)
        fused_items = [self._to_item(e, query) for e in fused_entries]

        # Semantic-only view for the "Smart matches" UI section.
        semantic_ids_ordered = [m.id for m, _ in semantic]
        entry_by_id = {e["message"].id: e for e in fused_entries}
        semantic_items = [
            self._to_item(entry_by_id[mid], query) for mid in semantic_ids_ordered
        ]

        took = int((time.perf_counter() - t0) * 1000)
        return SearchResponse(
            query=query, mode=mode, engine=self.index.engine_name,
            exact=exact_items, semantic=semantic_items, fused=fused_items,
            suggest_smart=suggest_smart, took_ms=took,
        )
