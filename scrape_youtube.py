import json
import re
import time
import yt_dlp

def extract_timestamps_from_description(video_id, title, description):
    # Regex to find timestamps (e.g., 12:34 or 01:23:45)
    # We split the description by lines and look for timestamps
    lines = description.split('\n')
    
    video_data = {
        "video_id": video_id,
        "title": title,
        "hadith_timestamps": []
    }
    
    for line in lines:
        line = line.strip()
        # Find a timestamp in the line
        time_match = re.search(r'(\d{1,2}:\d{2}(?::\d{2})?)', line)
        if time_match:
            timestamp = time_match.group(1)
            # Convert timestamp to seconds
            parts = list(map(int, timestamp.split(':')))
            if len(parts) == 3:
                seconds = parts[0] * 3600 + parts[1] * 60 + parts[2]
            else:
                seconds = parts[0] * 60 + parts[1]
                
            # Now find the Hadith number in the same line
            # It usually looks like "الحديث (12)" or "حديث 15" or "12-15"
            # We look for digits after removing the timestamp
            text_without_time = line.replace(timestamp, '')
            arabic_numerals = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
            text_without_time = text_without_time.translate(arabic_numerals)
            
            # Extract all numbers
            numbers = [int(n) for n in re.findall(r'\b\d+\b', text_without_time)]
            
            if numbers:
                # If there are multiple numbers, it might be a range e.g. "Hadiths 15-18"
                start_hadith = min(numbers)
                end_hadith = max(numbers)
                
                # Filter out crazy numbers (like Hijri years)
                if 0 < start_hadith < 2000:
                    video_data["hadith_timestamps"].append({
                        "start_hadith": start_hadith,
                        "end_hadith": end_hadith,
                        "timestamp_seconds": seconds,
                        "raw_label": line
                    })
                    
    return video_data

def scrape_youtube_playlist():
    playlist_url = "https://youtube.com/playlist?list=PLQR7vbF2Oe1o-O_0Ydjpte7EC8rFKHffB"
    
    print("Fetching playlist metadata. This might take 1-2 minutes...")
    
    ydl_opts = {
        'extract_flat': False, # We need the full descriptions, so we must fetch each video's metadata
        'ignoreerrors': True,
        'quiet': True,
        'no_warnings': True,
        'skip_download': True, # Only get JSON metadata
    }
    
    mapping_data = []
    
    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        try:
            info = ydl.extract_info(playlist_url, download=False)
            entries = info.get('entries', [])
            
            print(f"Found {len(entries)} videos. Scanning descriptions for Hadith numbers...")
            
            for entry in entries:
                if not entry:
                    continue
                
                video_id = entry.get('id')
                title = entry.get('title')
                description = entry.get('description', '')
                
                # Extract timestamps
                parsed_video = extract_timestamps_from_description(video_id, title, description)
                
                if parsed_video["hadith_timestamps"]:
                    mapping_data.append(parsed_video)
                    print(f"✓ Found {len(parsed_video['hadith_timestamps'])} timestamps in: {title}")
                else:
                    print(f"✗ No timestamps found in: {title}")
                    
        except Exception as e:
            print(f"Error fetching playlist: {e}")
            
    # Save the output
    output_file = "sharh_mapping.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(mapping_data, f, ensure_ascii=False, indent=2)
        
    print(f"\nDone! Saved mappings to {output_file}")

if __name__ == "__main__":
    scrape_youtube_playlist()
