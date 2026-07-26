"""Mock maintenance-gate + binary-quantization state.

Purely illustrative: models the case study's hardware guardrails (indexing runs
only when charging + screen off + battery >= 80%) and the 32x binary-quantization
compression figure, so the UI can show a believable status pill.
"""
from __future__ import annotations

from .models import IndexingStatus

# Mock device telemetry. Defaults satisfy the maintenance gate so the demo shows
# an "indexed" state out of the box.
_state = {
    "charging": True,
    "screen_off": True,
    "battery": 87,
    "indexing": False,
}

# float32 vector = 4 bytes/dim; binary-quantized = 1 bit/dim => 32x smaller.
_DIM = 384
_BYTES_FP32 = _DIM * 4
_BYTES_BIN = _DIM / 8


def gate_open() -> bool:
    return bool(_state["charging"] and _state["screen_off"] and _state["battery"] >= 80)


def status(engine_name: str, indexed_count: int, total_count: int) -> IndexingStatus:
    raw_kb = indexed_count * _BYTES_FP32 / 1024
    comp_kb = indexed_count * _BYTES_BIN / 1024
    return IndexingStatus(
        engine=engine_name,
        charging=bool(_state["charging"]),
        screen_off=bool(_state["screen_off"]),
        battery=int(_state["battery"]),
        gate_open=gate_open(),
        indexing=bool(_state["indexing"]),
        indexed_count=indexed_count,
        total_count=total_count,
        compression="32x",
        raw_size_kb=round(raw_kb, 2),
        compressed_size_kb=round(comp_kb, 2),
    )


def simulate(charging: bool | None = None, screen_off: bool | None = None,
             battery: int | None = None) -> None:
    if charging is not None:
        _state["charging"] = charging
    if screen_off is not None:
        _state["screen_off"] = screen_off
    if battery is not None:
        _state["battery"] = max(0, min(100, battery))
    # An indexing run only "happens" while the gate is open.
    _state["indexing"] = gate_open()
