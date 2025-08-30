def username_slug(full_name: str, year: str) -> str:
    parts = [p for p in full_name.strip().lower().split() if p]
    return ".".join(parts + [year])
