def tip_and_total(bill: float, rate_percent: float) -> tuple[float, float]:
    tip = bill * (rate_percent/100)
    return round(tip, 2), round(bill + tip, 2)
