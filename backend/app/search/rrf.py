"""Reciprocal Rank Fusion (RRF) ranker.

Fuses the exact-keyword and semantic ranked lists into one ordering.

    rrf(d) = w_exact * 1/(k + rank_exact(d)) + w_semantic * 1/(k + rank_semantic(d))

Per the case study, exact matches are prioritized first, so w_exact > w_semantic
lets a keyword hit win ties against a purely-semantic hit. Items present in both
lists naturally accumulate the highest fused score.
"""
from __future__ import annotations

from ..models import Message

K = 60
W_EXACT = 1.0
W_SEMANTIC = 0.7


def _ranks(scored: list[tuple[Message, float]]) -> dict[str, int]:
    """Map message id -> 1-based rank."""
    return {m.id: i + 1 for i, (m, _) in enumerate(scored)}


def fuse(
    exact: list[tuple[Message, float]],
    semantic: list[tuple[Message, float]],
    k: int = K,
) -> list[dict]:
    """Return fused entries sorted by rrf_score desc.

    Each entry: {message, match_type, rrf_score, exact_rank, semantic_rank,
                 semantic_sim}
    """
    exact_ranks = _ranks(exact)
    semantic_ranks = _ranks(semantic)
    semantic_sims = {m.id: s for m, s in semantic}

    by_id: dict[str, Message] = {}
    for m, _ in exact:
        by_id[m.id] = m
    for m, _ in semantic:
        by_id.setdefault(m.id, m)

    entries: list[dict] = []
    for mid, msg in by_id.items():
        er = exact_ranks.get(mid)
        sr = semantic_ranks.get(mid)
        score = 0.0
        if er is not None:
            score += W_EXACT * (1.0 / (k + er))
        if sr is not None:
            score += W_SEMANTIC * (1.0 / (k + sr))

        if er is not None and sr is not None:
            match_type = "both"
        elif er is not None:
            match_type = "exact"
        else:
            match_type = "semantic"

        entries.append({
            "message": msg,
            "match_type": match_type,
            "rrf_score": score,
            "exact_rank": er,
            "semantic_rank": sr,
            "semantic_sim": semantic_sims.get(mid),
        })

    entries.sort(key=lambda e: e["rrf_score"], reverse=True)
    return entries
