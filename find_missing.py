import json

with open('bulugh_al_maram_qasim_shamela.json', 'r', encoding='utf-8') as f:
    hadiths = json.load(f)

ids = [h['id'] for h in hadiths]
missing = []
for i in range(1, 1353):
    if i not in ids:
        missing.append(i)

print(f"Total extracted: {len(ids)}")
print(f"Missing count: {len(missing)}")
print("Missing IDs:", missing[:20], "..." if len(missing) > 20 else "")

# Also find duplicate IDs
duplicates = set([x for x in ids if ids.count(x) > 1])
if duplicates:
    print("Duplicate IDs:", duplicates)
