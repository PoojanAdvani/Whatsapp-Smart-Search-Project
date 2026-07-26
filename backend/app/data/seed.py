"""Rich showcase corpus for the WhatsApp Smart Recall prototype.

Each message may carry `processed_text`: the *mock* output of the on-device SLM
pipeline described in the case study (SigLIP 2 OCR/vision, Whisper Tiny voice
transcription, document parsing, link metadata). This is the field that lets a
semantic query like "electricity bill" surface an unnamed `IMG_4821.pdf` even
though nothing in the raw text/filename matches the keyword.

The corpus is deliberately built so that several realistic "context, not keyword"
queries clearly beat exact search:
  - "electricity bill"      -> unnamed utility PDF + a photo of a meter
  - "how much do I owe"     -> invoice / payment-due messages
  - "where is the venue"    -> a shared address
  - "my flight details"     -> an e-ticket PDF
  - "the thing about the leak" -> a transcribed voice note
  - "that article on sleep" -> a shared link card
"""
from __future__ import annotations

from ..models import Chat, Media, Message

# --------------------------------------------------------------------------- #
# Chats
# --------------------------------------------------------------------------- #
CHATS: list[Chat] = [
    Chat(id="c_landlord", name="Rahul (Landlord)", avatar_color="#0ea5e9"),
    Chat(id="c_accountant", name="Priya · Accounts", avatar_color="#f59e0b"),
    Chat(id="c_family", name="Family 🏡", is_group=True, avatar_color="#10b981"),
    Chat(id="c_supplier", name="Kiran Textiles (Supplier)", avatar_color="#8b5cf6"),
    Chat(id="c_travel", name="Travel Desk", avatar_color="#ef4444"),
    Chat(id="c_friends", name="Weekend Crew", is_group=True, avatar_color="#ec4899"),
    Chat(id="c_customer", name="Customer · Anjali", avatar_color="#14b8a6"),
]

CHAT_NAMES = {c.id: c.name for c in CHATS}


# --------------------------------------------------------------------------- #
# Messages
# --------------------------------------------------------------------------- #
MESSAGES: list[Message] = [
    # --- Landlord: the star "electricity bill" scenario ------------------- #
    Message(
        id="m1", chat_id="c_landlord", sender="Rahul", timestamp="Mon 09:12",
        type="text", text="Hey, please clear the pending dues before the 5th.",
    ),
    Message(
        id="m2", chat_id="c_landlord", sender="Rahul", timestamp="Mon 09:13",
        type="pdf",
        media=Media(filename="IMG_4821.pdf", processor="SigLIP 2 · Doc Parse"),
        text="",  # no useful raw text / filename is opaque
        processed_text=(
            "Maharashtra State Electricity Board — MSEDCL utility bill. "
            "Consumer: Flat 3B. Billing month: June. Units consumed 214 kWh. "
            "Amount payable Rs 2,340. Due date 5 July. Late payment surcharge applies."
        ),
    ),
    Message(
        id="m3", chat_id="c_landlord", sender="Rahul", timestamp="Mon 09:14",
        type="image",
        media=Media(filename="photo_2026-06-30.jpg", processor="SigLIP 2 · Vision/OCR"),
        text="",
        processed_text=(
            "Photograph of a domestic electricity meter display showing reading 48213 "
            "units. Handwritten note on the side: 'take this month reading'."
        ),
    ),
    Message(
        id="m4", chat_id="c_landlord", sender="You", timestamp="Mon 18:40",
        type="text", text="Got it, will transfer this week.",
    ),

    # --- Accountant: invoices, GST, "how much do I owe" ------------------- #
    Message(
        id="m5", chat_id="c_accountant", sender="Priya", timestamp="Tue 11:02",
        type="text",
        text="Sharing the outstanding summary for this quarter.",
    ),
    Message(
        id="m6", chat_id="c_accountant", sender="Priya", timestamp="Tue 11:03",
        type="pdf",
        media=Media(filename="stmt_q2.pdf", processor="SigLIP 2 · Doc Parse"),
        text="",
        processed_text=(
            "Accounts receivable statement Q2. Total amount you owe to vendors: "
            "Rs 84,500. Includes GST invoice INV-2211 of Rs 12,000 and pending "
            "supplier payment of Rs 40,000. Net balance due end of month."
        ),
    ),
    Message(
        id="m7", chat_id="c_accountant", sender="Priya", timestamp="Tue 11:20",
        type="text",
        text="Also the reimbursement for your travel was approved.",
    ),

    # --- Family group: address / venue ----------------------------------- #
    Message(
        id="m8", chat_id="c_family", sender="Mom", timestamp="Wed 08:05",
        type="text",
        text="Don't forget lunch on Sunday!",
    ),
    Message(
        id="m9", chat_id="c_family", sender="Uncle Sameer", timestamp="Wed 08:31",
        type="text",
        text=(
            "New house address for the housewarming: 402, Green Meadows, "
            "Baner Road, near DMart, Pune 411045. Parking behind the building."
        ),
    ),
    Message(
        id="m10", chat_id="c_family", sender="You", timestamp="Wed 09:00",
        type="text", text="Perfect, see everyone there 🎉",
    ),

    # --- Supplier: payment confirmation, receipts ------------------------ #
    Message(
        id="m11", chat_id="c_supplier", sender="Kiran", timestamp="Thu 15:44",
        type="text",
        text="Order dispatched, tracking to follow.",
    ),
    Message(
        id="m12", chat_id="c_supplier", sender="You", timestamp="Thu 16:10",
        type="image",
        media=Media(filename="screenshot_upi.png", processor="SigLIP 2 · Vision/OCR"),
        text="",
        processed_text=(
            "UPI payment success screenshot. Paid Rs 40,000 to Kiran Textiles. "
            "Transaction ID 402113998271. Payment confirmation reference. UPI ref via bank."
        ),
    ),
    Message(
        id="m13", chat_id="c_supplier", sender="Kiran", timestamp="Thu 16:12",
        type="text", text="Received, thank you 🙏",
    ),

    # --- Travel: flight e-ticket, hotel ---------------------------------- #
    Message(
        id="m14", chat_id="c_travel", sender="Travel Desk", timestamp="Fri 10:15",
        type="pdf",
        media=Media(filename="doc_final_v2.pdf", processor="SigLIP 2 · Doc Parse"),
        text="",
        processed_text=(
            "Flight e-ticket / boarding itinerary. Passenger: You. "
            "IndiGo 6E-203 Pune (PNQ) to Delhi (DEL). Departure 14 August 06:20, "
            "PNR X4TZ9K, seat 12A. Booking reference and airline confirmation."
        ),
    ),
    Message(
        id="m15", chat_id="c_travel", sender="Travel Desk", timestamp="Fri 10:16",
        type="text",
        text="Hotel voucher will be shared separately.",
    ),

    # --- Friends group: link cards, voice note --------------------------- #
    Message(
        id="m16", chat_id="c_friends", sender="Dev", timestamp="Sat 20:01",
        type="link",
        media=Media(filename="link_preview", processor="Link Metadata"),
        text="https://example.com/why-you-cant-sleep",
        processed_text=(
            "Link preview card: 'The science of why you can't fall asleep' — "
            "a long read about circadian rhythm, blue light and sleep hygiene. "
            "Health and wellness article."
        ),
    ),
    Message(
        id="m17", chat_id="c_friends", sender="Neha", timestamp="Sat 20:14",
        type="voice",
        media=Media(filename="PTT-20260725.opus", processor="Whisper Tiny · Transcription"),
        text="",
        processed_text=(
            "Voice note transcript: 'Hey guys, quick thing — there's a water leak "
            "under the kitchen sink at the Airbnb, I told the host, plumber comes "
            "tomorrow morning so keep that cabinet empty.'"
        ),
    ),
    Message(
        id="m18", chat_id="c_friends", sender="You", timestamp="Sat 20:20",
        type="text", text="Nice, thanks for the heads up!",
    ),

    # --- Customer: an SMB support/order thread --------------------------- #
    Message(
        id="m19", chat_id="c_customer", sender="Anjali", timestamp="Sun 12:30",
        type="text",
        text="Hi, can you resend the invoice for my last order?",
    ),
    Message(
        id="m20", chat_id="c_customer", sender="You", timestamp="Sun 12:33",
        type="pdf",
        media=Media(filename="INV-2211.pdf", processor="SigLIP 2 · Doc Parse"),
        text="Here you go 👍",
        processed_text=(
            "Tax invoice INV-2211. Customer Anjali. 3 metres cotton fabric. "
            "Subtotal Rs 10,170, GST 18 percent Rs 1,830, total Rs 12,000. "
            "Payment due on receipt."
        ),
    ),
    Message(
        id="m21", chat_id="c_customer", sender="Anjali", timestamp="Sun 12:40",
        type="text", text="Perfect, thanks!",
    ),
]


def get_chats_with_previews() -> list[Chat]:
    """Return chats with last_message/last_time populated from their messages."""
    by_chat: dict[str, Message] = {}
    for m in MESSAGES:
        by_chat[m.chat_id] = m  # messages are in order; last wins
    result: list[Chat] = []
    for c in CHATS:
        last = by_chat.get(c.id)
        preview = None
        if last is not None:
            if last.type == "text":
                preview = last.text
            elif last.media is not None:
                icon = {
                    "image": "📷 Photo",
                    "pdf": "📄 Document",
                    "voice": "🎤 Voice message",
                    "link": "🔗 Link",
                }.get(last.type, "Attachment")
                preview = icon
        result.append(
            c.model_copy(update={
                "last_message": preview,
                "last_time": last.timestamp if last else None,
            })
        )
    return result


def messages_for(chat_id: str) -> list[Message]:
    return [m for m in MESSAGES if m.chat_id == chat_id]
