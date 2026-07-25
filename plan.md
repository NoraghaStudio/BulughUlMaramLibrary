# Bulugh al-Maram (بلوغ المرام) Memorization & Study Platform
## Comprehensive Technical Blueprint & Implementation Plan

---

## 1. Executive Summary & Vision

The **Bulugh al-Maram Study & Memorization Application** is a specialized, web-first platform designed to streamline the study, audio listening, active recall memorization, and scholarly understanding (*Sharh*) of Imam Ibn Hajar al-Asqalani’s classic Hadith collection, *Bulugh al-Maram*.

### Key Highlights
- **Glassmorphic & Floating Design**: Premium UI built with frosted glass (`backdrop-filter: blur`), floating cards, ambient depth lighting, and smooth fluid micro-interactions tailored for Arabic typography.
- **Audio Range & Loop Controls**: Granular audio playback allowing seamless selection and looping of individual Hadiths or custom ranges (e.g., Hadiths 1–3) from full-length audiobooks.
- **Automated Sharh Deep-Linking**: Integration with Dr. Abdulmohsen Al-Qasim’s ~200 YouTube lecture series, utilizing automated description timestamp parsing to jump directly to specific Hadiths within each lecture.
- **Smart Memorization & Active Recall**: Progressive word-masking, active recall tests, and offline-first progress tracking across status tiers (*New*, *In Progress*, *Memorized*, *Review Needed*).

---

## 2. UI/UX Design System: "Glass & Float"

The user interface adopts a modern **Glassmorphism** and **Floating UI** aesthetic to create an immersive, distraction-free environment for sacred text study.

### Visual Foundations
- **Background Layer**: Subtle dynamic gradients (dark mode deep obsidian `#0b0f19` to slate `#1a2332` / light mode soft pearl `#f4f6fa` to muted sage `#e8eee9`) with subtle ambient glowing spots.
- **Glassmorphic Panels (`.glass-panel`)**:
  - `background: rgba(255, 255, 255, 0.07)` (Dark) / `rgba(255, 255, 255, 0.65)` (Light)
  - `backdrop-filter: blur(16px) saturate(180%)`
  - `border: 1px solid rgba(255, 255, 255, 0.12)`
  - `box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.18)`
- **Floating Controls (`.floating-bar`)**:
  - Sticky bottom audio player and header floating smoothly above content with `position: fixed` or `sticky`, rounded pill shapes (`border-radius: 9999px`), and elevated box shadows.
- **Typography**:
  - Arabic Hadith Text: High-clarity Naskh/Amiri font (`Amiri`, `Scheherazade New`, or `Noto Naskh Arabic`) with adjusted line-height (`2.2`) for effortless reading.
  - UI Labels & English Translation: Clean geometric sans-serif (`Inter` or `Plus Jakarta Sans`).

---

## 3. System Architecture & Data Pipelines

```
+-----------------------------------------------------------------------------------+
|                                  DATA PIPELINES                                   |
|                                                                                   |
|  [ Hadith Text API / JSON ]        [ 9-Hour Audio File ]      [ YouTube Playlist ]|
|              |                               |                         |          |
|              v                               v                         v          |
|    Hadith Dataset (JSON)              WhisperX / Aeneas       YT Description Scraper|
|   (ID, Text, Chapter, Ref)          (Forced Alignment)      (Video ID + Timestamps)|
|              |                               |                         |          |
+--------------+-------------------------------+-------------------------+----------+
                                               |
                                               v
+-----------------------------------------------------------------------------------+
|                               FRONTEND APPLICATION                                |
|                                                                                   |
|  +--------------------+    +----------------------------+    +-----------------+  |
|  |   Glassy Hadith    |    |   Floating Audio Player    |    |  Sharh Drawer / |  |
|  |    View / Grid     |    |   (Range & Loop Controller) |    |  YouTube Embed  |  |
|  +--------------------+    +----------------------------+    +-----------------+  |
|                                              |                                    |
|                                              v                                    |
|                                  [ LocalStorage / IndexedDB ]                      |
|                                  (User Progress & Notes)                          |
+-----------------------------------------------------------------------------------+
```

---

## 4. Feature Modules & Technical Approach

### Module 1: Hadith Data Layer
* **Primary Source**: Fawaz Ahmed’s Hadith JSON API (`bulugh-al-maram.json`) or static structured JSON derived from GitHub open-data repositories.
* **Fallback / Verification**: Python script parsing the standard PDF version to handle custom numbering mismatches if required by specific commentary editions.
* **Schema**:
  ```json
  {
    "id": 1,
    "chapter_id": 1,
    "chapter_name_ar": "كتاب الطهارة - باب المياه",
    "hadith_ar": "عَنْ أَبِي هُرَيْرَةَ رَضِيَ اللَّهُ عَنْهُ قَالَ: قَالَ رَسُولُ اللَّهِ...",
    "hadith_en": "Narrated Abu Hurairah (RA)...",
    "grade": "صحيح",
    "source_ref": "أخرجه الأربعة، واللفظ لابن ماجه"
  }
  ```

---

### Module 2: Audio Engine & Forced Alignment
* **Input**: 9-hour complete audiobook MP3 file.
* **Timestamp Extraction Workflow**:
  1. Process the full audio MP3 along with Arabic Hadith text through **WhisperX** or **Aeneas** (forced alignment tool).
  2. Generate a precise `audio_timestamps.json` mapping each Hadith ID to its exact start and end times in seconds.
* **Timestamp Schema**:
  ```json
  [
    {
      "hadith_id": 1,
      "start_time": 14.25,
      "end_time": 52.80
    },
    {
      "hadith_id": 2,
      "start_time": 53.10,
      "end_time": 108.40
    }
  ]
  ```
* **Playback Logic**:
  - Single Hadith mode: Play from `start_time` to `end_time` of `hadith_id`.
  - Range Playback mode (e.g., Hadiths 1–3): Play from `hadith[1].start_time` to `hadith[3].end_time`.
  - Auto-Looping: Re-trigger playback upon reaching `end_time` based on user-selected loop count (e.g., 3x, 5x, Infinite).

---

### Module 3: Sharh Engine (YouTube Description Timestamp Automation)
* **Strategy**: Dr. Abdulmohsen Al-Qasim’s ~200 YouTube videos usually contain detailed chapter/Hadith timestamps in their video descriptions.
* **Automated Extraction Pipeline**:
  1. Write a Python script using `youtube-transcript-api` and `google-api-python-client` (or `yt-dlp`) to fetch video metadata, descriptions, and pinned comments across all 200 videos in the playlist.
  2. Parse Arabic Hadith numbers and timestamps from descriptions using regex patterns (e.g., `حديث 1: 02:15`, `الحديث (1-3): 05:40`).
  3. Output a `sharh_mapping.json`:
     ```json
     [
       {
         "video_id": "dQw4w9WgXcQ",
         "video_title": "شرح بلوغ المرام - الشريط 01",
         "hadith_ranges": [
           { "hadith_start": 1, "hadith_end": 3, "start_seconds": 135 },
           { "hadith_start": 4, "hadith_end": 5, "start_seconds": 642 }
         ]
       }
     ]
     ```
* **Embedded Player Behavior**:
  - When viewing Hadith #2, the Sharh section dynamically displays the relevant YouTube video embedded with `src="https://www.youtube.com/embed/VIDEO_ID?start=135&autoplay=0"`.

---

### Module 4: Active Recall & Memorization Tracker
* **Blur / Masking Mode**: Toggle button to blur individual words or entire Hadith text to facilitate memory testing.
* **Spaced Repetition & Statusing**:
  - Tiers: `Unread` ➔ `Learning` ➔ `Memorized` ➔ `Review Due`.
  - Stored locally via `IndexedDB` / `localStorage` to ensure full offline functionality.
* **Statistics Dashboard**: Visual indicators (progress rings, heatmaps) tracking memorization coverage across chapters.

---

## 5. Technology Stack

| Layer | Recommended Technology |
| :--- | :--- |
| **Framework** | Next.js 14 / React (App Router) or Vite + React |
| **Styling** | Tailwind CSS v3 + CSS backdrop filters & animations |
| **Icons & UI** | Lucide-React + Headless UI / Radix Primitives |
| **State & Storage** | Zustand + IndexedDB (`idb` library) |
| **Audio Processing** | Web Audio API / Howler.js |
| **Data Pipelines** | Python (WhisperX, yt-dlp, BeautifulSoup4) |
| **Deployment** | Google Antigravity / Vercel / Cloudflare Pages |

---

## 6. Step-by-Step Development Roadmap

```
+---------------------------------------------------------------------------------+
|                               ROADMAP TIMELINE                                  |
|                                                                                 |
|  [Phase 1] Data Scrubbing & YouTube Scraping (Python Scripts)                   |
|     │                                                                           |
|     ▼                                                                           |
|  [Phase 2] Audio Forced Alignment (WhisperX Timestamping)                       |
|     │                                                                           |
|     ▼                                                                           |
|  [Phase 3] Glassmorphic UI Shell & Design System Setup                          |
|     │                                                                           |
|     ▼                                                                           |
|  [Phase 4] Audio Range Player & Sharh Integration                               |
|     │                                                                           |
|     ▼                                                                           |
|  [Phase 5] Memorization Modes, Storage & Antigravity Deployment                 |
+---------------------------------------------------------------------------------+
```

### Phase 1: Data Acquisition & YouTube Scraping
- [ ] Download complete Arabic text of *Bulugh al-Maram* into standard JSON.
- [ ] Run Python scraper on YouTube playlist descriptions to generate `sharh_mapping.json`.
- [ ] Verify timestamp mappings for YouTube videos.

### Phase 2: Audio Alignment
- [ ] Acquire full 9-hour audiobook MP3.
- [ ] Execute WhisperX forced alignment script against Arabic Hadith text.
- [ ] Export and validate `audio_timestamps.json`.

### Phase 3: Frontend Shell & Glassmorphism Design
- [ ] Set up Next.js / Vite project with Tailwind CSS.
- [ ] Implement glassmorphic UI components (`GlassCard`, `FloatingNavbar`, `FloatingAudioPlayer`).
- [ ] Configure custom Arabic typography (`Amiri` / `Noto Naskh`).

### Phase 4: Core Interactive Features
- [ ] Build Hadith viewer with selection capabilities (single or multi-select range).
- [ ] Build floating media player supporting range audio playback and looping.
- [ ] Embed YouTube Sharh player with automated timestamp jumping (`?start=SEC`).

### Phase 5: Memorization Tools & Deployment
- [ ] Implement word masking/blurring active recall feature.
- [ ] Implement offline progress tracking with `IndexedDB`.
- [ ] Deploy and verify on Google Antigravity hosting environment.

---

## 7. Antigravity Prompting Strategy

When using **Google Antigravity** to write the code, execute these prompts step-by-step:

1. **Prompt 1 (UI Setup)**:
   > *"Build a glassy, modern React component using Tailwind CSS with `backdrop-blur-md`, subtle shadows, dark/light theme, and Amiri Arabic font for displaying a Hadith card with text, narrator, source, and floating action buttons."*

2. **Prompt 2 (Audio Player Component)**:
   > *"Create a floating persistent audio player component in React with HTML5 Audio API that accepts `startTime` and `endTime` in seconds, supports auto-looping, speed adjustment (0.75x to 1.5x), and range playback for Hadiths."*

3. **Prompt 3 (YouTube Deep Linker)**:
   > *"Write a React component that embeds a YouTube video using iframe, accepting a video ID and start timestamp in seconds, with quick toggle tabs to switch between Hadith text, translation, and Sharh."*

---

*Document Generated for Bulugh al-Maram Application Project.*
