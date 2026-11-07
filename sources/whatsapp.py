import httpx
from config import APIFY_TOKEN

async def check(phone: str, qtype: str = "phone"):
    clean = phone.replace("+", "").replace(" ", "")
    exists = None
    try:
        async with httpx.AsyncClient(timeout=15, follow_redirects=True) as c:
            r = await c.get(f"https://wa.me/{clean}", headers={"User-Agent": "Mozilla/5.0"})
            text = r.text.lower()
            exists = ("continue to chat" in text) or ("продолжить" in text)
    except Exception:
        exists = None

    enriched = {}
    if APIFY_TOKEN and exists:
        actor = "eduair94~whatsapp-data-lookup"
        url = f"https://api.apify.com/v2/acts/{actor}/run-sync-get-dataset-items?token={APIFY_TOKEN}"
        try:
            async with httpx.AsyncClient(timeout=120) as c:
                r = await c.post(url, json={"phoneNumber": clean})
            data = r.json()
            if data:
                enriched = data[0]
        except Exception:
            pass

    return {
        "source": "whatsapp",
        "registered": exists,
        "name": enriched.get("name"),
        "about": enriched.get("about"),
        "bot": False,
    }