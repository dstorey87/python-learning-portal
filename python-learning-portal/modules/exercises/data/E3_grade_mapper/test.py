import starter
for s, g in [(95,"A"), (80,"B"), (70,"C"), (60,"D"), (13,"F"), (-1,"Invalid"), (101,"Invalid")]:
    assert starter.grade(s) == g
print("OK")
