import os
import glob

# Try multiple possible root paths
possible_roots = [
    '/vercel/share/v0-project',
    '/home/user',
    os.getcwd(),
]

print(f"CWD: {os.getcwd()}")
print(f"CWD contents: {os.listdir(os.getcwd())}")

# Find the right root
root = None
for r in possible_roots:
    if os.path.exists(r):
        contents = os.listdir(r)
        print(f"Checking {r}: {contents[:10]}")
        if 'package.json' in contents or 'app' in contents:
            root = r
            break

if not root:
    # Search for package.json
    for r in possible_roots:
        if os.path.exists(r):
            for dirpath, dirnames, filenames in os.walk(r):
                if 'package.json' in filenames and 'node_modules' not in dirpath:
                    root = dirpath
                    print(f"Found project root at: {root}")
                    break
            if root:
                break

if not root:
    print("ERROR: Could not find project root")
    exit(1)

print(f"Using root: {root}")

EXTENSIONS = {'.tsx', '.ts', '.css', '.mjs', '.js', '.json'}
SKIP_DIRS = {'node_modules', '.next', '.git', 'android', 'ios', '.vercel', 'scripts'}

count = 0
for dirpath, dirnames, filenames in os.walk(root):
    dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
    for f in filenames:
        ext = os.path.splitext(f)[1]
        if ext in EXTENSIONS:
            full = os.path.join(dirpath, f)
            try:
                content = open(full, 'r', encoding='utf-8').read()
                open(full, 'w', encoding='utf-8').write(content)
                count += 1
            except Exception as e:
                print(f"  Skip {full}: {e}")

print(f"Force-touched {count} files to ensure sync.")
