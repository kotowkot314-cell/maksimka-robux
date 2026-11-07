import httpx
from config import APIFY_TOKEN

ACTOR = "akula.marketing~telegram-get-phone-info"

async def check(phone: str, qtype: str = "phone"):
    if not APIFY_TOKEN:
        return {"source": "telegram", "registered": None, "note": "APIFY_TOKEN не задан"}
    
    url = f"https://api.apify.com/v2/acts/{ACTOR}/run-sync-get-dataset-items?token={APIFY_TOKEN}"
    try:
        async with httpx.AsyncClient(timeout=120) as c:
            r = await c.post(url, json={"phone": phone})
        if r.status_code != 200:
            return {"source": "telegram", "error": f"HTTP {r.status_code}"}
        items = r.json()
        if not items:
            return {"source": "telegram", "registered": False}
        d = items[0]
        return {
            "source": "telegram",
            "registered": d.get("registered", True),
            "username": d.get("username"),
            "name": " ".join(filter(None, [d.get("firstName"), d.get("lastName")])),
            "premium": d.get("premium", False),
            "bot": d.get("bot", False),
            "link": f"https://t.me/{d['username']}" if d.get("username") else None,
        }
    except Exception as e:
        return {"source": "telegram", "error": str(e)}