def fizzbuzz(n: int):
    out = []
    for i in range(1, n+1):
        s = ""
        if i % 3 == 0: s += "Fizz"
        if i % 5 == 0: s += "Buzz"
        out.append(s or i)
    return out
