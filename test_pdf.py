import fitz # PyMuPDF

doc = fitz.open("بلوغ المرام نسخة القاسم.pdf")
page = doc.load_page(15) # Page 15 (0-indexed 14)
print(page.get_text())
