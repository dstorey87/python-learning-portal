import starter
def run(n):
    out = starter.fizzbuzz(n)
    assert out[2] == "Fizz"    # 3
    assert out[4] == "Buzz"    # 5
    assert out[14] == "FizzBuzz"  # 15
    assert out[0] == 1 and out[1] == 2
run(30)
print("OK")
