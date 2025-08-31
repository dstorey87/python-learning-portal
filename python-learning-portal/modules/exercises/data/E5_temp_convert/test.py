import starter
def approx(a,b,eps=1e-9): return abs(a-b)<eps
assert approx(starter.c_to_f(0), 32)
assert approx(starter.c_to_f(100), 212)
assert approx(starter.f_to_c(32), 0)
assert approx(starter.f_to_c(212), 100)
print("OK")
