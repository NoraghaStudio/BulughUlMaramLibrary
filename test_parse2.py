import urllib.request
from bs4 import BeautifulSoup
url = "https://shamela.ws/book/961/17"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')
container = soup.find('div', class_='book-container')
if container:
    print("Found container!")
    for tag in container.find_all(True):
        print("TAG:", tag.name, repr(tag.get_text()[:50]))
else:
    print("No container found.")
