import starter
res = starter.set_ops(["a","b","c"], ["b","c","d"])
assert set(res["union"]) == set("abcd")
assert set(res["inter"]) == set("bc")
assert set(res["a_minus_b"]) == set("a")
assert set(res["b_minus_a"]) == set("d")
print("OK")
