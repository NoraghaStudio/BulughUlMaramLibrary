import urllib.request
from bs4 import BeautifulSoup
url = "https://shamela.ws/book/961/17"
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
html = urllib.request.urlopen(req).read().decode('utf-8')
soup = BeautifulSoup(html, 'html.parser')
# Print classes of all divs to find the content one
divs = soup.find_all('div')
for div in divs:
    cls = div.get('class')
    if cls and len(div.get_text()) > 100:
        print("DIV CLASS:", cls, "LENGTH:", len(div.get_text()))
