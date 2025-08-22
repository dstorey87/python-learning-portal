def sum_file(path: str) -> int:
    total = 0
    with open(path, encoding="utf-8") as f:
        for line in f:
            s = line.strip()
            if not s: 
                continue
            try:
                total += int(s)
            except ValueError:
                pass
    return total
