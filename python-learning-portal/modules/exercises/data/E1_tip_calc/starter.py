def tip_and_total(bill: float, rate_percent: float) -> tuple[float, float]:
    tip = bill * (rate_percent / 100)
    total = bill + tip
    return (tip, total)
