import json
import os

filepath = "sharh_mapping.json"
backup_path = "sharh_mapping_backup.json"

# Restore from original backup
if os.path.exists(backup_path):
    with open(backup_path, "r", encoding="utf-8") as f:
        data = json.load(f)
else:
    print("Backup not found! Cannot restore.")
    exit(1)

for video in data:
    new_timestamps = []
    for ts in video.get("hadith_timestamps", []):
        
        # 1. REMOVE the incorrect split at 06:40 (which was labeled 194)
        if ts["start_hadith"] == 194 and ts["timestamp_seconds"] == 400:
            continue # Skip adding it to the new list
        
        # 2. For everything that was 195 and above, subtract 1
        # So the old 195 (at 10:32) becomes 194
        # The old 196 becomes 195, etc.
        elif ts["start_hadith"] >= 195:
            ts["start_hadith"] -= 1
            ts["end_hadith"] -= 1
            new_timestamps.append(ts)
            
        else:
            # Keep 193 and below exactly as they were
            new_timestamps.append(ts)
            
    video["hadith_timestamps"] = new_timestamps

# Save the corrected mapping
with open(filepath, "w", encoding="utf-8") as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Successfully removed the fake 194 split and shifted everything down by 1. Now 194 is at 10:32!")
