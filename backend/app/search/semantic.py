"""Semantic vector search over the indexable corpus.

Builds a per-message searchable document from visible text + mock SLM
`processed_text`, embeds it with the hybrid engine, and ranks by cosine
similarity. A confidence threshold implements the case study's "zero
hallucination" guardrail: low-similarity noise is dropped rather than shown.
"""
from __future__ import annotations

import numpy as np

from ..models import Message
from .embeddings import load_engine

# Below this cosine similarity a semantic hit is considered noise and discarded
# (the case study's "zero hallucination" guardrail). The two engines occupy
# different similarity ranges, so the cutoff is engine-aware: MiniLM produces
# denser mid-range scores and needs a higher bar to stay crisp, while the
# sparser TF-IDF fallback needs a lower one.
# 0.22 keeps genuinely-relevant-but-differently-worded targets (e.g. a shared
# address answering "where is the venue" sits ~0.23) while trimming the noise
# tail; a higher bar starts dropping real answers on this small model.
THRESHOLD_MINILM = 0.22
THRESHOLD_TFIDF = 0.18
# Back-compat default (used when an engine name isn't recognised).
CONFIDENCE_THRESHOLD = THRESHOLD_TFIDF


def _threshold_for(engine_name: str) -> float:
    return THRESHOLD_MINILM if "MiniLM" in engine_name else THRESHOLD_TFIDF


def _doc_for(m: Message) -> str:
    parts = [m.text]
    if m.media is not None:
        parts.append(m.media.filename)
        if m.media.caption:
            parts.append(m.media.caption)
    if m.processed_text:
        parts.append(m.processed_text)
    return " ".join(p for p in parts if p)


class SemanticIndex:
    """Holds the embedded corpus. Rebuildable when the indexable set changes."""

    def __init__(self, messages: list[Message]):
        self.engine = load_engine([_doc_for(m) for m in messages])
        self.threshold = _threshold_for(self.engine.name)
        self.rebuild(messages)

    @property
    def engine_name(self) -> str:
        return self.engine.name

    def rebuild(self, messages: list[Message]) -> None:
        self._messages = messages
        docs = [_doc_for(m) for m in messages]
        self._matrix = self.engine.encode(docs) if docs else np.zeros((0, 1))

    @property
    def indexed_count(self) -> int:
        return len(self._messages)

    def search(self, query: str, threshold: float | None = None
               ) -> list[tuple[Message, float]]:
        """Return (message, cosine_similarity) above threshold, best first."""
        if self._matrix.shape[0] == 0:
            return []
        thr = self.threshold if threshold is None else threshold
        q = self.engine.encode_query(query)
        sims = self._matrix @ q  # rows are normalized -> cosine similarity
        order = np.argsort(-sims)
        results: list[tuple[Message, float]] = []
        for idx in order:
            score = float(sims[idx])
            if score < thr:
                break
            results.append((self._messages[idx], score))
        return results
