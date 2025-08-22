import os, sys, subprocess, pathlib

base = pathlib.Path(__file__).parent / "exercises"
failed = 0
total = 0

for d in sorted(p.name for p in base.iterdir() if p.is_dir() and (p / "test.py").exists()):
    total += 1
    print(f"\n=== {d} ===")
    proc = subprocess.run([sys.executable, "test.py"], cwd=base / d, capture_output=True, text=True)
    print(proc.stdout, end="")
    if proc.returncode != 0:
        print(proc.stderr)
        failed += 1

print(f"\nSummary: {total - failed} passed, {failed} failed, {total} total.")
sys.exit(1 if failed else 0)
