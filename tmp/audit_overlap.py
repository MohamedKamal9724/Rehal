import os
import re

def audit():
    print("=== AUDIT OF OVERLAPPING ABSOLUTE ELEMENTS & ICONS ===")
    results = []
    for root, dirs, files in os.walk('src'):
        for file in files:
            if file.endswith('.tsx'):
                path = os.path.join(root, file)
                with open(path, 'r', encoding='utf-8', errors='ignore') as f:
                    lines = f.readlines()
                    for idx, line in enumerate(lines, 1):
                        # Look for absolute positioning that might cause collision
                        if 'absolute' in line:
                            # Check if it has icons or text or keys
                            if any(k in line for k in ['Key', 'Search', 'text-white', 'bottom-', 'inset-x-', '-top-', 'h2', 'h3']):
                                results.append((path, idx, line.strip()))
    for path, idx, line in results:
        print(f"{path}:{idx}: {line}")
    print(f"Total: {len(results)}")

if __name__ == '__main__':
    audit()
