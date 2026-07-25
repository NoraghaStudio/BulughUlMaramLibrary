import urllib.request
from bs4 import BeautifulSoup
url = "https://shamela.ws/book/961/17"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')
container = soup.find('div', class_='book-container')
if container:
    for p in container.find_all('p'):
        print("PARAGRAPH:", repr(p.get_text().strip()))
