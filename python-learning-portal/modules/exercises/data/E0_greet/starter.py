def greet(name: str) -> str:
    """Return 'Hello, <Name>!' with the name capitalized (first letter upper, rest lower)."""
    return f"Hello, {name.capitalize()}!"
if __name__ == "__main__":
    n = input("Your name: ")
    print(greet(n))
