import json
import uuid
import websockets
from config import MAX_TOKEN

async def check(phone: str, qtype: str = "phone"):
    if not MAX_TOKEN:
        return {"source": "max", "registered": None, "note": "MAX_TOKEN не задан"}

    uri = "wss://ws-api.oneme.ru/websocket"
    try:
        async with websockets.connect(uri, open_timeout=15) as ws:
            await ws.send(json.dumps({
                "ver": 11, "cmd": 0, "seq": 0, "opcode": 17,
                "payload": {"deviceId": str(uuid.uuid4())},
            }))
            await ws.recv()

            await ws.send(json.dumps({
                "ver": 11, "cmd": 1, "seq": 1, "opcode": 19,
                "payload": {"token": MAX_TOKEN},
            }))
            await ws.recv()

            await ws.send(json.dumps({
                "ver": 11, "cmd": 2, "seq": 2, "opcode": 32,
                "payload": {"phone": phone},
            }))
            raw = await ws.recv()
            resp = json.loads(raw)
            contact = resp.get("payload", {}).get("contact") or {}

            return {
                "source": "max",
                "registered": bool(contact),
                "name": contact.get("name"),
                "bot": contact.get("bot", False),
            }
    except Exception as e:
        return {"source": "max", "error": str(e)}