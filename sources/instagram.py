import httpx
from config import INSTAGRAM_TOKEN

async def check(query: str, qtype: str = "phone"):
    if not INSTAGRAM_TOKEN:
        return {"source": "instagram", "registered": None, "note": "Токен не задан"}

    url = "https://URL_ТВОЕГО_API" 
    headers = {
        "Authorization": f"Bearer {INSTAGRAM_TOKEN}",
        "Content-Type": "application/json"
    }
    params = {"query": query, "type": qtype}

    try:
        async with httpx.AsyncClient(timeout=30) as c:
            r = await c.get(url, headers=headers, params=params)
            
        if r.status_code != 200:
            return {"source": "instagram", "error": f"HTTP {r.status_code}"}
            
        data = r.json()
        
        if not data or not data.get("found"):
             return {"source": "instagram", "registered": False}
             
        user = data.get("user", {})
        return {
            "source": "instagram",
            "registered": True,
            "username": user.get("username"),
            "name": user.get("full_name"),
            "bot": False,
            "link": f"https://instagram.com/{user.get('username')}" if user.get("username") else None,
        }
        
    except Exception as e:
        return {"source": "instagram", "error": str(e)}