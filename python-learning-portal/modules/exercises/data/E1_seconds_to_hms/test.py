import starter
assert starter.to_hms(0) == "00:00:00"
assert starter.to_hms(59) == "00:00:59"
assert starter.to_hms(60) == "00:01:00"
assert starter.to_hms(3661) == "01:01:01"
print("OK")
