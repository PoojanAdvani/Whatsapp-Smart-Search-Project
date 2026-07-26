"""WhatsApp Smart Recall — FastAPI backend.

Exposes the chat data plus the Dual-Path Search Orchestrator (exact keyword +
semantic vector search fused with RRF) and the privacy/indexing controls.
"""
from __future__ import annotations

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from . import indexing, settings_store
from .data.seed import CHAT_NAMES, MESSAGES, get_chats_with_previews, messages_for
from .models import (
    Chat,
    IndexingStatus,
    Message,
    SearchRequest,
    SearchResponse,
    Settings,
)
from .search.orchestrator import Orchestrator
from .search.semantic import SemanticIndex

app = FastAPI(title="WhatsApp Smart Recall API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --------------------------------------------------------------------------- #
# Index lifecycle
# --------------------------------------------------------------------------- #
# Built once at startup over the currently-indexable set; rebuilt whenever the
# indexing settings change.
_index = SemanticIndex(settings_store.indexable_messages())
_orchestrator = Orchestrator(_index, CHAT_NAMES)


def _rebuild_index() -> None:
    _index.rebuild(settings_store.indexable_messages())


# --------------------------------------------------------------------------- #
# Chats & messages
# --------------------------------------------------------------------------- #
@app.get("/api/chats", response_model=list[Chat])
def list_chats() -> list[Chat]:
    return get_chats_with_previews()


@app.get("/api/chats/{chat_id}/messages", response_model=list[Message])
def get_messages(chat_id: str) -> list[Message]:
    if chat_id not in CHAT_NAMES:
        raise HTTPException(status_code=404, detail="Chat not found")
    return messages_for(chat_id)


# --------------------------------------------------------------------------- #
# Search
# --------------------------------------------------------------------------- #
@app.post("/api/search", response_model=SearchResponse)
def search(req: SearchRequest) -> SearchResponse:
    # Search runs over the full message set for the exact path; the semantic
    # index already reflects the indexable (permitted) subset.
    return _orchestrator.search(req.query, req.mode, MESSAGES)


# --------------------------------------------------------------------------- #
# Settings (granular indexing permissions)
# --------------------------------------------------------------------------- #
@app.get("/api/settings", response_model=Settings)
def get_settings() -> Settings:
    return settings_store.get_settings()


@app.put("/api/settings", response_model=Settings)
def put_settings(new: Settings) -> Settings:
    updated = settings_store.update_settings(new)
    _rebuild_index()  # permissions changed -> re-index the permitted set
    return updated


# --------------------------------------------------------------------------- #
# Indexing / maintenance gate
# --------------------------------------------------------------------------- #
@app.get("/api/indexing/status", response_model=IndexingStatus)
def indexing_status() -> IndexingStatus:
    return indexing.status(
        engine_name=_index.engine_name,
        indexed_count=_index.indexed_count,
        total_count=len(MESSAGES),
    )


class SimulateRequest(BaseModel):
    charging: bool | None = None
    screen_off: bool | None = None
    battery: int | None = None


@app.post("/api/indexing/simulate", response_model=IndexingStatus)
def indexing_simulate(req: SimulateRequest) -> IndexingStatus:
    indexing.simulate(req.charging, req.screen_off, req.battery)
    return indexing.status(
        engine_name=_index.engine_name,
        indexed_count=_index.indexed_count,
        total_count=len(MESSAGES),
    )


# --------------------------------------------------------------------------- #
# Emergency RAM-only scan
# --------------------------------------------------------------------------- #
@app.post("/api/emergency-scan", response_model=SearchResponse)
def emergency_scan(req: SearchRequest) -> SearchResponse:
    """One-time, RAM-only semantic scan for users who decline persistent indexing.

    Builds a throwaway index over ALL messages, answers the query, and discards
    the index immediately — nothing is persisted.
    """
    temp_index = SemanticIndex(MESSAGES)
    temp_orch = Orchestrator(temp_index, CHAT_NAMES)
    result = temp_orch.search(req.query, "smart", MESSAGES)
    del temp_index, temp_orch  # wipe from memory
    return result


@app.get("/api/health")
def health() -> dict:
    return {"status": "ok", "engine": _index.engine_name}
