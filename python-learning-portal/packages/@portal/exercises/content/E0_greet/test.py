import starter

def check(cond, msg):
    if not cond:
        raise AssertionError(msg)

cases = {"ada": "Hello, Ada!", "ALAN": "Hello, Alan!", "tOm": "Hello, Tom!"}
for inp, exp in cases.items():
    out = starter.greet(inp)
    check(out == exp, f"Expected {exp!r}, got {out!r}")
print("OK")
