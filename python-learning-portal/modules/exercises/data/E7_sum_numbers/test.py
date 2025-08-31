import starter, os
# Create a sample file
with open("numbers.txt","w",encoding="utf-8") as f:
    f.write("1\n2\nthree\n4\n")
assert starter.sum_file("numbers.txt") == 7
open("empty.txt","w").close()
assert starter.sum_file("empty.txt") == 0
print("OK")
