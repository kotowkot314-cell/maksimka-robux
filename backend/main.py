from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
import asyncio

from aggregator import aggregate
from sources import telegram, whatsapp, vk, max as max_src, instagram, google_dorks

app = FastAPI(title="HIxRINUX OSINT")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

class Query(BaseModel):
    query: str
    type: str = "phone"
    use_google: bool = True
    sources: List[str] = ["telegram", "vk", "whatsapp", "max", "dorks"]

@app.get("/")
def root():
    return {"app": "HIxRINUX OSINT", "status": "ok"}

@app.post("/api/osint")
async def osint(q: Query):
    if not q.query:
        raise HTTPException(status_code=400, detail="Пустой запрос")

    tasks = []
    if q.type == "phone":
        if "telegram" in q.sources: tasks.append(telegram.check(q.query))
        if "whatsapp" in q.sources: tasks.append(whatsapp.check(q.query))
        if "vk" in q.sources: tasks.append(vk.check(q.query))
        if "max" in q.sources: tasks.append(max_src.check(q.query))
        if "instagram" in q.sources: tasks.append(instagram.check(q.query))

    if q.use_google and "dorks" in q.sources:
        tasks.append(google_dorks.check(q.query, q.type))

    if not tasks:
        return {"query": q.query, "count": 0, "results": []}

    results = await asyncio.gather(*tasks, return_exceptions=True)

    cleaned = []
    for r in results:
        if isinstance(r, Exception):
            cleaned.append({"source": "error", "error": str(r)})
        elif r:
            cleaned.extend(r if isinstance(r, list) else [r])

    table = aggregate(cleaned)
    return {"query": q.query, "count": len(table), "results": table}

from asgiref.wsgi import AsgiToWsgi
application = AsgiToWsgi(app)