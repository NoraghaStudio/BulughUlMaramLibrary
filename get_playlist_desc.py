import yt_dlp

playlist_url = "https://youtube.com/playlist?list=PLQR7vbF2Oe1o-O_0Ydjpte7EC8rFKHffB"
ydl_opts = {'extract_flat': False, 'quiet': True}
with yt_dlp.YoutubeDL(ydl_opts) as ydl:
    info = ydl.extract_info(playlist_url, download=False)
    for entry in info.get('entries', [])[:3]:
        print("TITLE:", entry.get('title'))
        print("DESC:", entry.get('description'))
        print("-" * 50)
