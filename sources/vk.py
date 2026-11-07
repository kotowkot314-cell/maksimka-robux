import httpx
from config import VK_TOKEN

async def check(phone: str, qtype: str = "phone"):
    if not VK_TOKEN:
        return {"source": "vk", "registered": None, "note": "VK_TOKEN не задан"}
    
    url = "https://api.vk.com/method/account.lookupContacts"
    params = {
        "contacts": phone,
        "service": "phone",
        "return_all": 1,
        "access_token": VK_TOKEN,
        "v": "5.131",
    }
    try:
        async with httpx.AsyncClient(timeout=20) as c:
            r = await c.get(url, params=params)
        data = r.json()
    except Exception as e:
        return {"source": "vk", "error": str(e)}

    if "error" in data:
        return {"source": "vk", "error": data["error"].get("error_msg", "VK error")}

    found = data.get("response", {}).get("found", [])
    if not found:
        return {"source": "vk", "registered": False}

    out = []
    for u in found:
        out.append({
            "source": "vk",
            "registered": True,
            "id": u.get("id"),
            "name": f"{u.get('first_name','')} {u.get('last_name','')}".strip(),
            "bot": u.get("is_bot", False),
            "link": f"https://vk.com/id{u.get('id')}",
        })
    return out