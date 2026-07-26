"""Pydantic models for the WhatsApp Smart Recall prototype."""
from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field

MessageType = Literal["text", "image", "pdf", "voice", "link"]
SearchMode = Literal["keyword", "smart"]
MatchType = Literal["exact", "semantic", "both"]
IndexScope = Literal["all", "docs_only", "custom"]


class Media(BaseModel):
    filename: str
    caption: Optional[str] = None
    # A short human label for the mock SLM processor that produced processed_text
    # (e.g. "SigLIP 2 · OCR", "Whisper Tiny").
    processor: Optional[str] = None


class Chat(BaseModel):
    id: str
    name: str
    is_group: bool = False
    avatar_color: str = "#6b7280"
    # Convenience fields for the sidebar preview.
    last_message: Optional[str] = None
    last_time: Optional[str] = None


class Message(BaseModel):
    id: str
    chat_id: str
    sender: str
    timestamp: str  # ISO-ish display string
    type: MessageType = "text"
    text: str = ""
    media: Optional[Media] = None
    # Mock on-device SLM output: OCR / transcription / doc-parse / link metadata.
    processed_text: str = ""
    # Whether this item is currently included in the semantic index (per settings).
    indexable: bool = True


class SearchRequest(BaseModel):
    query: str = Field(..., min_length=1)
    mode: SearchMode = "keyword"


class SearchResultItem(BaseModel):
    message: Message
    chat_name: str
    match_type: MatchType
    # Normalized 0..1 confidence for display.
    confidence: float
    # Raw fused RRF score (for debugging / ordering transparency).
    rrf_score: float
    exact_rank: Optional[int] = None
    semantic_rank: Optional[int] = None
    # A short highlighted snippet for the result card.
    snippet: str = ""


class SearchResponse(BaseModel):
    query: str
    mode: SearchMode
    engine: str  # "sentence-transformers (all-MiniLM-L6-v2)" or "tfidf-fallback"
    exact: list[SearchResultItem]
    semantic: list[SearchResultItem]
    fused: list[SearchResultItem]
    suggest_smart: bool
    took_ms: int


class Settings(BaseModel):
    enabled: bool = True
    scope: IndexScope = "all"
    exclusions: list[str] = Field(default_factory=list)  # chat ids excluded
    emergency_mode: bool = False


class IndexingStatus(BaseModel):
    engine: str
    charging: bool
    screen_off: bool
    battery: int
    gate_open: bool  # charging & screen_off & battery >= 80
    indexing: bool
    indexed_count: int
    total_count: int
    compression: str = "32x"
    # Approx sizes to illustrate binary quantization.
    raw_size_kb: float = 0.0
    compressed_size_kb: float = 0.0
