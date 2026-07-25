import json

with open("bulugh_al_maram_qasim_shamela.json", "r") as f:
    hadiths = json.load(f)

print("Total hadiths:", len(hadiths))
print("Last ID:", hadiths[-1]["id"])
