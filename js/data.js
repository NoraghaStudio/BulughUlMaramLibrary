/* ============================================
   BULUGH AL-MARAM — DATA LAYER
   Loads, indexes, and merges all JSON data
   ============================================ */

const DataLayer = (() => {
  let hadiths = [];
  let sharhVideos = [];
  let chapters = [];
  let hadithMap = new Map();
  let sharhIndex = new Map();
  let chapterForHadith = new Map();

  /**
   * Load JSON data files
   */
  async function init() {
    const [hadithData, sharhData] = await Promise.all([
      fetch('./bulugh_al_maram_qasim_shamela.json').then(r => r.json()),
      fetch('./sharh_mapping.json').then(r => r.json()),
    ]);

    hadiths = hadithData;
    sharhVideos = sharhData;

    _buildHadithMap();
    _buildChapterIndex();
    _buildSharhIndex();

    console.log(`[DataLayer] Loaded: ${hadiths.length} hadiths, ${sharhVideos.length} sharh videos`);
  }

  /**
   * Build a map from hadith ID to full hadith object
   */
  function _buildHadithMap() {
    for (const h of hadiths) {
      hadithMap.set(h.id, {
        ...h,
      });
    }
  }

  /**
   * Extract chapter/section markers from hadith text.
   * Chapters appear as "* * * كتاب ..." or "* * * باب ..." 
   * at the END of some hadith texts.
   */
  function _buildChapterIndex() {
    chapters = [];
    let currentChapter = { id: 'ch-0', name: 'باب المياه', type: 'باب', startHadith: 1, afterHadith: 0, hadiths: [] };
    chapters.push(currentChapter);

    for (const h of hadiths) {
      currentChapter.hadiths.push(h.id);
      chapterForHadith.set(h.id, currentChapter.id);

      // Check for chapter markers at end of text
      const text = h.text_ar;
      // Match patterns like "* * * كتاب الطهارة" or "بَابُ المِيَاهِ"
      const kitabMatch = text.match(/\*\s*\*\s*\*\s*(كِتَابُ\s+.+|كتاب\s+.+)$/);
      const babMatch = text.match(/\*\s*\*\s*\*\s*(بَابُ\s+.+|باب\s+.+)$/);
      
      if (kitabMatch || babMatch) {
        const match = kitabMatch || babMatch;
        const chapterName = match[1].trim();
        const type = kitabMatch ? 'كتاب' : 'باب';
        const chapterId = `ch-${h.id}`;
        
        currentChapter = {
          id: chapterId,
          name: chapterName,
          type: type,
          startHadith: h.id + 1,
          afterHadith: h.id,
          hadiths: [],
        };
        chapters.push(currentChapter);
      }
    }
  }

  /**
   * Build a reverse index: hadith ID -> array of { videoId, title, timestampSeconds }
   */
  function _buildSharhIndex() {
    for (const video of sharhVideos) {
      for (const ts of (video.hadith_timestamps || [])) {
        const startH = ts.start_hadith;
        const endH = ts.end_hadith;
        for (let id = startH; id <= endH; id++) {
          if (!sharhIndex.has(id)) {
            sharhIndex.set(id, []);
          }
          sharhIndex.get(id).push({
            videoId: video.video_id,
            title: video.title,
            timestampSeconds: ts.timestamp_seconds,
            rawLabel: ts.raw_label,
          });
        }
      }
    }
  }

  /**
   * Strip tashkeel/diacritics for search
   */
  function stripTashkeel(text) {
    return text.replace(/[\u064B-\u065F\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED]/g, '');
  }

  // ── Public API ──

  function getHadith(id) {
    return hadithMap.get(id) || null;
  }

  function getAllHadiths() {
    return hadiths;
  }

  function getHadithCount() {
    return hadiths.length;
  }

  function getChapters() {
    return chapters;
  }

  function getChapterForHadith(id) {
    return chapterForHadith.get(id) || null;
  }

  function getSharhForHadith(id) {
    return sharhIndex.get(id) || [];
  }

  /**
   * Search hadiths by Arabic text (tashkeel-insensitive)
   */
  function searchHadiths(query, limit = 30) {
    if (!query) return [];
    const normalizedQuery = stripTashkeel(query.toString());
    if (normalizedQuery.length < 1) return [];
    const results = [];
    
    const queryNum = parseInt(normalizedQuery);
    
    for (const h of hadiths) {
      if (results.length >= limit) break;
      
      // Match by ID
      if (!isNaN(queryNum) && h.id === queryNum) {
        results.push({
          ...hadithMap.get(h.id),
          matchIndex: 0,
        });
        continue;
      }
      
      const normalizedText = stripTashkeel(h.text_ar);
      if (normalizedText.includes(normalizedQuery)) {
        results.push({
          ...hadithMap.get(h.id),
          matchIndex: normalizedText.indexOf(normalizedQuery),
        });
      }
    }
    return results;
  }

  /**
   * Get hadiths for a chapter
   */
  function getChapterHadiths(chapterId) {
    const chapter = chapters.find(c => c.id === chapterId);
    if (!chapter) return [];
    return chapter.hadiths.map(id => hadithMap.get(id)).filter(Boolean);
  }

  /**
   * Get the chapter that a particular hadith ID falls under,
   * returning the full chapter object
   */
  function getChapterObject(hadithId) {
    const chId = chapterForHadith.get(hadithId);
    return chapters.find(c => c.id === chId) || null;
  }

  return {
    init,
    getHadith,
    getAllHadiths,
    getHadithCount,
    getChapters,
    getChapterForHadith,
    getChapterObject,
    getSharhForHadith,
    getChapterHadiths,
    searchHadiths,
    stripTashkeel,
  };
})();
