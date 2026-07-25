import urllib.request
import json
import os

def download_bulugh():
    url = "https://raw.githubusercontent.com/AhmedBaset/hadith-json/main/db/by_book/other_books/bulugh_almaram.json"
    output_file = "bulugh_al_maram.json"
    
    print(f"Downloading data from AhmedBaset GitHub repository...")
    
    try:
        # Download the file
        response = urllib.request.urlopen(url)
        data = json.loads(response.read().decode('utf-8'))
        
        # Save it nicely formatted
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(data, f, ensure_ascii=False, indent=2)
            
        print(f"Success! Data saved to {output_file}")
        
        # The structure is a list of hadiths or a dict with hadiths
        if isinstance(data, dict) and 'hadiths' in data:
            print(f"Total hadiths: {len(data['hadiths'])}")
        elif isinstance(data, list):
            print(f"Total hadiths: {len(data)}")
        else:
            print("Download successful, structure is custom.")

        
    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    download_bulugh()
