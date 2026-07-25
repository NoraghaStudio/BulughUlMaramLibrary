import json

with open('sharh_mapping.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Video 1: f3taqjzmDdA
video1 = {
    "video_id": "f3taqjzmDdA",
    "title": "شرح بلوغ المرام | لفضيلة الشيخ عبدالمحسن القاسم | الدرس (01)",
    "hadith_timestamps": [
        {"start_hadith": 1, "end_hadith": 1, "timestamp_seconds": 0, "raw_label": "00:00 الحديث الأول"},
        {"start_hadith": 2, "end_hadith": 2, "timestamp_seconds": 336, "raw_label": "05:36 الحديث الثاني"},
        {"start_hadith": 3, "end_hadith": 3, "timestamp_seconds": 454, "raw_label": "07:34 الحديث الثالث"},
        {"start_hadith": 4, "end_hadith": 4, "timestamp_seconds": 840, "raw_label": "14:00 الحديث الرابع"},
        {"start_hadith": 5, "end_hadith": 5, "timestamp_seconds": 1067, "raw_label": "17:47 الحديث الخامس"}
    ]
}

# Video 2: E8AxY2_jaxQ
video2_timestamps = [
    {"start_hadith": 6, "end_hadith": 6, "timestamp_seconds": 0, "raw_label": "00:00 الحديث السادس"},
    {"start_hadith": 7, "end_hadith": 7, "timestamp_seconds": 214, "raw_label": "03:34 الحديث السابع"},
    {"start_hadith": 8, "end_hadith": 8, "timestamp_seconds": 404, "raw_label": "06:44 الحديث الثامن"},
    {"start_hadith": 9, "end_hadith": 9, "timestamp_seconds": 692, "raw_label": "11:32 الحديث التاسع"},
    {"start_hadith": 10, "end_hadith": 10, "timestamp_seconds": 807, "raw_label": "13:27 الحديث العاشر"},
    {"start_hadith": 11, "end_hadith": 11, "timestamp_seconds": 1142, "raw_label": "19:02 الحديث 11"}
]

# Check if video2 exists
video2_found = False
for item in data:
    if item['video_id'] == 'E8AxY2_jaxQ':
        item['hadith_timestamps'] = video2_timestamps
        video2_found = True
        break

if not video2_found:
    data.insert(0, {
        "video_id": "E8AxY2_jaxQ",
        "title": "شرح بلوغ المرام | لفضيلة الشيخ عبدالمحسن القاسم | الدرس (02)",
        "hadith_timestamps": video2_timestamps
    })

# Check if video1 exists
video1_found = False
for item in data:
    if item['video_id'] == 'f3taqjzmDdA':
        item['hadith_timestamps'] = video1['hadith_timestamps']
        video1_found = True
        break

if not video1_found:
    data.insert(0, video1)

with open('sharh_mapping.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, ensure_ascii=False, indent=2)

print("Updated sharh_mapping.json")
