def greet(name: str) -> str:
    return f"Hello, {name.capitalize()}!"
if __name__ == "__main__":
    n = input("Your name: ")
    print(greet(n))
