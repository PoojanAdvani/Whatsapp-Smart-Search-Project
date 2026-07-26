"""Hybrid embedding engine.

Tries to load a real small sentence-transformer model (all-MiniLM-L6-v2) for
genuine semantic embeddings. If that dependency isn't installed (or fails to
load), it transparently falls back to a dependency-light pure-Python TF-IDF
engine with a curated synonym/intent-expansion map so the demo still behaves
semantically.

Both engines expose the same interface:
    engine.name                 -> str
    engine.encode(texts)        -> np.ndarray (n, dim), L2-normalized rows
    engine.encode_query(text)   -> np.ndarray (dim,)   L2-normalized

Cosine similarity is then just a dot product of normalized vectors.
"""
from __future__ import annotations

import math
import re
from collections import Counter
from typing import Iterable

import numpy as np

_TOKEN_RE = re.compile(r"[a-z0-9]+")


def _tokenize(text: str) -> list[str]:
    return _TOKEN_RE.findall(text.lower())


def _normalize_rows(mat: np.ndarray) -> np.ndarray:
    norms = np.linalg.norm(mat, axis=1, keepdims=True)
    norms[norms == 0] = 1.0
    return mat / norms


# --------------------------------------------------------------------------- #
# Fallback: TF-IDF + synonym/intent expansion (pure Python + numpy)
# --------------------------------------------------------------------------- #
# When a query token appears here, the expansion terms are injected (down-
# weighted) so that "context" queries connect to the vocabulary that actually
# appears in the mock SLM-processed text. This is what fakes semantic recall
# without a real model.
SYNONYMS: dict[str, list[str]] = {
    "bill": ["invoice", "payment", "due", "amount", "utility", "electricity", "msedcl", "kwh", "meter"],
    "electricity": ["msedcl", "meter", "kwh", "units", "utility", "power", "bill"],
    "owe": ["outstanding", "due", "payable", "balance", "receivable", "amount", "pending"],
    "invoice": ["bill", "gst", "tax", "payable", "amount", "receipt"],
    "receipt": ["payment", "confirmation", "paid", "upi", "transaction"],
    "payment": ["paid", "upi", "transaction", "confirmation", "transfer"],
    "address": ["road", "near", "pune", "building", "flat", "location", "venue", "directions"],
    "venue": ["address", "road", "location", "near", "building", "directions"],
    "flight": ["ticket", "boarding", "pnr", "indigo", "departure", "itinerary", "airline", "seat"],
    "ticket": ["flight", "pnr", "boarding", "booking", "itinerary"],
    "leak": ["water", "plumber", "sink", "kitchen", "cabinet"],
    "sleep": ["circadian", "rhythm", "insomnia", "rest", "wellness", "night"],
    "article": ["link", "read", "blog", "post"],
    "meter": ["reading", "electricity", "units", "kwh"],
}


class TfidfEngine:
    name = "tfidf-fallback"

    def __init__(self, corpus: list[str]):
        docs_tokens = [_tokenize(t) for t in corpus]
        # Build vocabulary + IDF from the corpus.
        df: Counter[str] = Counter()
        for toks in docs_tokens:
            for tok in set(toks):
                df[tok] += 1
        n_docs = max(1, len(docs_tokens))
        self.vocab: dict[str, int] = {tok: i for i, tok in enumerate(sorted(df))}
        self.idf = np.zeros(len(self.vocab), dtype=np.float32)
        for tok, i in self.vocab.items():
            self.idf[i] = math.log((1 + n_docs) / (1 + df[tok])) + 1.0
        self.dim = len(self.vocab)

    def _vectorize(self, tokens: Iterable[str]) -> np.ndarray:
        vec = np.zeros(self.dim, dtype=np.float32)
        counts = Counter(tokens)
        if not counts:
            return vec
        max_c = max(counts.values())
        for tok, c in counts.items():
            idx = self.vocab.get(tok)
            if idx is not None:
                tf = 0.5 + 0.5 * (c / max_c)
                vec[idx] = tf * self.idf[idx]
        return vec

    def encode(self, texts: list[str]) -> np.ndarray:
        mat = np.vstack([self._vectorize(_tokenize(t)) for t in texts]) if texts \
            else np.zeros((0, self.dim), dtype=np.float32)
        return _normalize_rows(mat)

    def encode_query(self, text: str) -> np.ndarray:
        tokens = _tokenize(text)
        expanded: list[str] = list(tokens)
        for tok in tokens:
            for syn in SYNONYMS.get(tok, []):
                # Add expansion terms twice so they count, but original stays dominant.
                expanded.append(syn)
        vec = self._vectorize(expanded)
        norm = np.linalg.norm(vec)
        if norm > 0:
            vec = vec / norm
        return vec


# --------------------------------------------------------------------------- #
# Real model wrapper
# --------------------------------------------------------------------------- #
class SentenceTransformerEngine:
    name = "sentence-transformers (all-MiniLM-L6-v2)"

    def __init__(self, model):
        self._model = model

    def encode(self, texts: list[str]) -> np.ndarray:
        if not texts:
            return np.zeros((0, 384), dtype=np.float32)
        emb = self._model.encode(texts, normalize_embeddings=True)
        return np.asarray(emb, dtype=np.float32)

    def encode_query(self, text: str) -> np.ndarray:
        emb = self._model.encode([text], normalize_embeddings=True)
        return np.asarray(emb, dtype=np.float32)[0]


def load_engine(corpus: list[str]):
    """Return the best available engine for the given corpus."""
    try:
        from sentence_transformers import SentenceTransformer  # type: ignore

        model = SentenceTransformer("all-MiniLM-L6-v2")
        return SentenceTransformerEngine(model)
    except Exception:
        # Missing dependency, no model cache, or offline — fall back gracefully.
        return TfidfEngine(corpus)
