import starter
def approx(a,b,eps=1e-6): return abs(a-b) < eps

tip, tot = starter.tip_and_total(80.0, 12.5)
assert approx(tip, 10.0) and approx(tot, 90.0)
tip, tot = starter.tip_and_total(10.0, 0)
assert approx(tip, 0.0) and approx(tot, 10.0)
print("OK")
