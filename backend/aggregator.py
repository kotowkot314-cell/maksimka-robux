def aggregate(items):
    cleaned = []
    for i in items:
        if not i or i.get("bot") is True:
            continue
        cleaned.append(i)

    seen, unique = set(), []
    for i in cleaned:
        key = (
            i.get("source"),
            i.get("id") or i.get("username") or i.get("link") or i.get("phone")
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(i)

    unique.sort(key=lambda x: (not x.get("registered"), x.get("source", "")))
    return unique