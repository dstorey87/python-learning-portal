def set_ops(a, b):
    A, B = set(a), set(b)
    return {
        "union": list(A|B),
        "inter": list(A&B),
        "a_minus_b": list(A-B),
        "b_minus_a": list(B-A),
    }
