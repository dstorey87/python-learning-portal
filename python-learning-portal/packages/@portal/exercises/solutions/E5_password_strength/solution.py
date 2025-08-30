import string
def score_password(pw: str) -> int:
    score = 0
    score += min(len(pw), 12)
    score += any(c.islower() for c in pw)
    score += any(c.isupper() for c in pw)
    score += any(c.isdigit() for c in pw)
    score += any(c in string.punctuation for c in pw)
    return score
