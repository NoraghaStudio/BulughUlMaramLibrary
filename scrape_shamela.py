import urllib.request
from bs4 import BeautifulSoup
import json
import re
import time

def scrape_shamela():
    base_url = "https://shamela.ws/book/961/"
    # From the index, Book of Taharah starts at page 17, and the book ends at 480
    start_page = 17
    end_page = 480
    
    hadiths = []
    current_hadith_number = 1
    
    print(f"Starting to scrape Bulugh al-Maram from Shamela (Pages {start_page} to {end_page})...")
    print("This might take a few minutes. Please wait.")
    
    # Regex to catch hadith numbers like: 1- عن فلان... or (1) عن فلان
    # We will just collect all text paragraphs and try to split them intelligently
    full_text = ""
    
    for page_num in range(start_page, end_page + 1):
        try:
            url = f"{base_url}{page_num}"
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            html = urllib.request.urlopen(req).read().decode('utf-8')
            soup = BeautifulSoup(html, 'html.parser')
            
            # Extract ONLY the main text container, which Shamela labels with the class 'nass'
            text_container = soup.find('div', class_='nass')
            if text_container:
                page_text = text_container.get_text(separator='\n')
            else:
                # Fallback if 'nass' isn't found
                page_text = ""
            
            # Convert Eastern Arabic numerals (١, ٢, ٣...) to Western numerals (1, 2, 3...)
            arabic_numerals = str.maketrans('٠١٢٣٤٥٦٧٨٩', '0123456789')
            page_text = page_text.translate(arabic_numerals)
            
            full_text += page_text + "\n"
            
            print(f"Scraped page {page_num}/{end_page} ", end='\r')
            time.sleep(0.3)
            
        except Exception as e:
            print(f"\nError on page {page_num}: {e}")
            
    print("\n\nScraping complete! Processing text...")
    
    # Split the massive text by newlines
    lines = full_text.split('\n')
    current_hadith_text = ""
    current_id = 0
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Match "1 -" or "1-" or "1 -" anywhere at the start of a line
        match = re.search(r'^(\d+)\s*[-:]\s*(.*)', line)
        if match:
            new_id = int(match.group(1))
            
            # Valid hadith numbers don't jump massively (avoid random dates like 1445)
            if 0 < new_id < 2000 and new_id >= current_id:
                if current_id > 0 and current_hadith_text:
                    hadiths.append({
                        "id": current_id,
                        "text_ar": current_hadith_text.strip()
                    })
                    
                current_id = new_id
                current_hadith_text = match.group(2) + " "
                continue
                
        if current_id > 0:
            # Avoid appending massive footer/header boilerplate that might sneak in
            if len(line) < 30 and ("shamela.ws" in line or "البحث" in line or "الصفحة" in line):
                continue
            current_hadith_text += line + " "
                
    # Save the last one
    if current_id > 0 and current_hadith_text:
        hadiths.append({
            "id": current_id,
            "text_ar": current_hadith_text.strip()
        })
        
    output_file = "bulugh_al_maram_qasim_shamela.json"
    with open(output_file, 'w', encoding='utf-8') as f:
        json.dump(hadiths, f, ensure_ascii=False, indent=2)
        
    print(f"Successfully saved {len(hadiths)} hadiths to {output_file}!")

if __name__ == "__main__":
    scrape_shamela()
