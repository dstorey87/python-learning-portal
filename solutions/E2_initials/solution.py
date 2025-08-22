def initials(full_name: str) -> str:
    parts = [p for p in full_name.split() if p]
    return ".".join(p[0].upper() for p in parts) + "."
