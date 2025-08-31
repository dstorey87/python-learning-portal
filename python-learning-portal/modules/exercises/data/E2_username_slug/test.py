import starter
assert starter.username_slug("Ada Lovelace", "1815") == "ada.lovelace.1815"
assert starter.username_slug("  Alan   Turing ", "1912") == "alan.turing.1912"
assert starter.username_slug("grace  hopper", "1906") == "grace.hopper.1906"
print("OK")
