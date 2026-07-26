# WhatsApp Smart Recall — Prototype

A working full-stack prototype of the **Smart Recall** feature from `case_study.md.txt`:
on-device semantic search that lets you find WhatsApp content by *meaning* rather than exact
keywords — including unnamed PDFs, images, and voice notes.

> **What it demonstrates:** a Dual-Path Search Orchestrator that runs exact keyword search
> and semantic vector search in parallel, fuses them with **Reciprocal Rank Fusion (RRF)**,
> and wraps it in a WhatsApp-Web-style UI with a proactive fallback nudge, privacy-first
> permission flow, a maintenance-gate/indexing simulator, and an Emergency RAM-only scan.

---

## Architecture

```
frontend (React + Vite + Tailwind, :5173)  ──/api proxy──►  backend (FastAPI, :8000)
  WhatsApp Web 3-pane UI                                     Dual-Path Orchestrator
  keyword ↔ smart search                                      ├─ keyword path (visible text only)
  exact vs smart result split + confidence                    ├─ semantic path (hybrid engine)
  fallback nudge / settings / privacy / emergency             └─ RRF fusion + confidence guardrail
```

The **mock on-device SLM** is modelled by each message's `processed_text` field — the pretend
output of SigLIP 2 (OCR/vision), Whisper Tiny (voice transcription), doc parsing, and link
metadata. Keyword search deliberately ignores it (it only reads text a user actually typed/saw),
so an unnamed `IMG_4821.pdf` is invisible to keyword search but found semantically by "electricity bill".

### Semantic engine (hybrid, with graceful fallback)
- **Real model** (optional): `sentence-transformers` (`all-MiniLM-L6-v2`) for genuine embeddings.
- **Fallback** (default, zero heavy deps): pure-Python TF-IDF cosine + a curated synonym/intent map.

The backend auto-detects which is available and reports it in every search response (`engine` field)
and in the settings panel.

---

## Prerequisites
- **Python** 3.11+ (developed on 3.13)
- **Node** 18+ (developed on 22)

---

## Run it

### 1. Backend (FastAPI)
```bash
cd backend
python -m venv .venv
# Windows:
.venv\Scripts\python -m pip install -r requirements.txt
.venv\Scripts\python -m uvicorn app.main:app --reload --port 8000
# macOS/Linux:
# .venv/bin/pip install -r requirements.txt
# .venv/bin/python -m uvicorn app.main:app --reload --port 8000
```
Backend runs at `http://localhost:8000` — interactive API docs at `http://localhost:8000/docs`.

> **Optional — enable the real semantic model:**
> ```bash
> .venv\Scripts\python -m pip install -r requirements-ml.txt
> ```
> First run downloads ~80 MB. Without it, the fallback engine is used automatically.

> **Port already in use?** Start the backend on another port and point the frontend at it:
> ```bash
> .venv\Scripts\python -m uvicorn app.main:app --port 8008
> # then, in the frontend:  VITE_API_TARGET=http://localhost:8008 npm run dev
> ```

### 2. Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:5173`. The dev server proxies `/api` to the backend (default `:8000`).

---

## Try these (semantic search shines where keyword fails)

| Query | What keyword search finds | What Smart Search finds |
| --- | --- | --- |
| `electricity bill` | nothing | unnamed utility PDF + a photo of the meter |
| `how much do I owe` | nothing | the accounts-receivable statement |
| `where is the venue` | nothing | the shared housewarming address |
| `my flight ticket` | nothing | an unnamed e-ticket PDF |
| `the leak thing` | nothing | a transcribed voice note |
| `that sleep article` | the link | link + semantic match |

**Flow to demo:**
1. Search a query above in **Keyword** mode → *No exact matches* → the **fallback nudge** appears.
2. Click **Try Smart Search** → results appear under a separate **Smart matches** section with confidence bars.
3. Click a result → it jumps to and highlights the message in its chat.
4. **⚙️ Settings** → toggle Smart Search off/on → the **privacy disclaimer** appears; adjust the
   maintenance gate (charging / screen-off / battery) and see the index status + 32× compression readout.
5. **Run Emergency scan** → a one-time RAM-only search that wipes itself afterward.

---

## API reference

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`  | `/api/chats` | Chat list with previews |
| `GET`  | `/api/chats/{id}/messages` | Messages for a chat |
| `POST` | `/api/search` | `{query, mode: keyword\|smart}` → exact + semantic + fused results, `suggest_smart`, engine |
| `GET/PUT` | `/api/settings` | Granular indexing permissions (scope / exclusions / enabled) |
| `GET`  | `/api/indexing/status` | Maintenance-gate + quantization footprint snapshot |
| `POST` | `/api/indexing/simulate` | Flip charging / screen-off / battery telemetry |
| `POST` | `/api/emergency-scan` | One-time RAM-only semantic scan (nothing persisted) |

---

## Project layout
```
backend/
  app/
    main.py               FastAPI app + routes
    models.py             Pydantic models
    settings_store.py     in-memory permissions + indexable-set resolver
    indexing.py           mock maintenance gate + binary-quantization figures
    data/seed.py          rich showcase corpus (chats, messages, mock SLM text)
    search/
      keyword.py          exact/partial keyword path (visible text only)
      embeddings.py       hybrid engine loader (real model OR TF-IDF fallback)
      semantic.py         vector index + cosine search + confidence threshold
      rrf.py              Reciprocal Rank Fusion ranker
      orchestrator.py     dual-path orchestration + result shaping
  requirements.txt        base deps
  requirements-ml.txt     optional real-model deps
frontend/
  src/
    App.jsx               layout + state wiring
    api.js                fetch helpers
    components/           Sidebar, ChatWindow, MessageBubble, SearchBar,
                          SearchResults, FallbackNudge, SettingsPanel,
                          PrivacyModal, EmergencyMode, ui.jsx
                          (indexing-status strip lives in Sidebar + SettingsPanel)
```

---

## What's mocked (non-goals)
This is a **UX + search-orchestration** prototype, not real on-device ML. The SLM components
(SigLIP 2, Whisper Tiny), on-device encrypted storage, binary quantization, and the maintenance
gate are simulated via pre-processed text and status flags. The hybrid engine provides *genuine*
semantic search when the optional model is installed; otherwise the TF-IDF fallback approximates it
over the demo corpus.
