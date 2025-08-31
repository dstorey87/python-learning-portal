import starter, math, pytest, sys

# minimal inbuilt without pytest: emulate
def must_raise_zero_div():
    try:
        starter.div(1,0)
    except ZeroDivisionError:
        return True
    return False

assert starter.add(1,2) == 3
assert starter.sub(5,3) == 2
assert starter.mul(4,3) == 12
assert must_raise_zero_div()
print("OK")
