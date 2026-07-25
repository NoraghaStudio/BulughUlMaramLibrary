import urllib.request
from bs4 import BeautifulSoup
import json
import re
import time

def append_missing_pages():
    base_url = "https://shamela.ws/book/961/"
    start_page = 473
    end_page = 480
    
    print(f"Scraping the missing pages ({start_page} to {end_page})...")
    full_text = ""
    
    for page_num in range(start_page, end_page + 1):
        try:
            url = f"{base_url}{page_num}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urllib.request.urlopen(req).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            page_text = soup.body.get_text(separator='\n')
            arabic_numerals = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
            page_text = page_text.translate(arabic_numerals)
            full_text += page_text + "\n"
            print(f"Scraped page {page_num}/{end_page} ", end='\r')
            time.sleep(0.3)
        except Exception as e:
            print(f"\nError on page {page_num}: {e}")
            
    print("\nProcessing text...")
    lines = full_text.split('\n')
    
    # Load existing
    with open('bulugh_al_maram_qasim_shamela.json', 'r', encoding='utf-8') as f:
        hadiths = json.load(f)
        
    current_id = hadiths[-1]['id'] if hadiths else 0
    current_hadith_text = ""
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        match = re.search(r'^(\d+)\s*[-:]\s*(.*)', line)
        if match:
            new_id = int(match.group(1))
            if 0 < new_id < 2000 and new_id > current_id:
                if current_id >= 1329 and current_hadith_text:
                    hadiths.append({
                        "id": current_id,
                        "text_ar": current_hadith_text.strip()
                    })
                current_id = new_id
                current_hadith_text = match.group(2) + " "
                continue
                
        if current_id >= 1329:
            if len(line) < 30 and ("shamela.ws" in line or "البحث" in line or "الصفحة" in line):
                continue
            current_hadith_text += line + " "
            
    # Save the last one
    if current_id >= 1329 and current_hadith_text:
        hadiths.append({
            "id": current_id,
            "text_ar": current_hadith_text.strip()
        })
        
    with open('bulugh_al_maram_qasim_shamela.json', 'w', encoding='utf-8') as f:
        json.dump(hadiths, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully appended! Total hadiths is now: {len(hadiths)}")

if __name__ == "__main__":
    append_missing_pages()
