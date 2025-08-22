import starter, string
s1 = starter.score_password("abc")        # 3 length + lowercase
assert s1 >= 4
s2 = starter.score_password("Abc123!")    # length 6 + 4 kinds = 10
assert s2 >= 10
s3 = starter.score_password("X"*20)       # cap at 12 + uppercase
assert s3 >= 13
print("OK")
