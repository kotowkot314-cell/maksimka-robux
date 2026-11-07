import httpx
from bs4 import BeautifulSoup

DORK_PHONE = [
    '"{q}" site:t.me',
    '"{q}" site:vk.com',
    '"{q}" site:wa.me',
    '"{q}" site:instagram.com',
]

DORK_EMAIL = [
    '"{q}"',
    '"{q}" (filetype:pdf OR filetype:xlsx OR filetype:doc)',
    '"{q}" site:pastebin.com',
    '"{q}" site:github.com',
]

async def check(query: str, qtype: str = "phone"):
    out = []
    templates = DORK_PHONE if qtype == "phone" else DORK_EMAIL
    headers = {"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    
    async with httpx.AsyncClient(timeout=20) as client:
        for tpl in templates:
            q = tpl.format(q=query)
            try:
                url = f"https://html.duckduckgo.com/html/?q={q}"
                resp = await client.get(url, headers=headers)
                soup = BeautifulSoup(resp.text, "html.parser")
                
                for result in soup.select(".result"):
                    title_el = result.select_one(".result__a")
                    snippet_el = result.select_one(".result__snippet")
                    if title_el:
                        out.append({
                            "source": "dorks",
                            "registered": True,
                            "title": title_el.text.strip(),
                            "link": title_el.get("href"),
                            "snippet": snippet_el.text.strip() if snippet_el else "",
                            "bot": False,
                        })
            except Exception:
                continue

    return out