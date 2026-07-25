/* ============================================
   BULUGH AL-MARAM — RENDERER
   Renders hadith cards & chapter headers
   ============================================ */

const Renderer = (() => {
  const BATCH_SIZE = 40;
  let renderedCount = 0;
  let hadithsToRender = [];
  let observer = null;
  let container = null;

  /**
   * Initialize infinite scroll observer
   */
  function init() {
    container = document.getElementById('hadith-list');
    
    // Sentinel for infinite scroll
    const sentinel = document.getElementById('scroll-sentinel');
    if (sentinel) {
      observer = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && renderedCount < hadithsToRender.length) {
          _renderBatch();
        }
      }, { rootMargin: '400px' });
      observer.observe(sentinel);
    }
  }

  /**
   * Render all hadiths (lazy loaded)
   */
  function renderAllHadiths() {
    if (!container) return;
    container.innerHTML = '';
    hadithsToRender = DataLayer.getAllHadiths();
    renderedCount = 0;
    _renderBatch();
  }

  /**
   * Render hadiths for a specific chapter
   */
  function renderChapterHadiths(chapterId) {
    if (!container) return;
    container.innerHTML = '';
    hadithsToRender = DataLayer.getChapterHadiths(chapterId);
    renderedCount = 0;
    _renderBatch();
  }

  /**
   * Render a specific set of hadiths
   */
  function renderHadiths(hadithList) {
    if (!container) return;
    container.innerHTML = '';
    hadithsToRender = hadithList;
    renderedCount = 0;
    _renderBatch();
  }

  /**
   * Render next batch
   */
  function _renderBatch() {
    const fragment = document.createDocumentFragment();
    const chapters = DataLayer.getChapters();
    const end = Math.min(renderedCount + BATCH_SIZE, hadithsToRender.length);

    for (let i = renderedCount; i < end; i++) {
      const hadith = hadithsToRender[i];
      const fullHadith = DataLayer.getHadith(hadith.id);
      
      // Check if we need to insert a chapter header before this hadith
      for (const ch of chapters) {
        if (ch.startHadith === hadith.id && ch.id !== 'intro') {
          fragment.appendChild(_createChapterHeader(ch));
        }
      }

      fragment.appendChild(_createHadithCard(fullHadith, i));
    }

    container.appendChild(fragment);
    renderedCount = end;
  }

  /**
   * Create a single hadith card element
   */
  function _createHadithCard(hadith, index) {
    const card = document.createElement('div');
    card.className = 'hadith-card';
    card.dataset.hadithId = hadith.id;
    card.dataset.animate = '';
    card.style.animationDelay = `${(index % BATCH_SIZE) * 0.03}s`;

    const hasSharh = DataLayer.getSharhForHadith(hadith.id).length > 0;

    // Clean text (remove chapter markers from display)
    let displayText = hadith.text_ar;
    displayText = displayText.replace(/\s*\*\s*\*\s*\*\s*(كِتَابُ|كتاب|بَابُ|باب)\s+.+$/, '');

    card.innerHTML = `
      <div class="hadith-card__header">
        <span class="hadith-card__number">${hadith.id}</span>
        <span class="hadith-card__chapter-tag"></span>
      </div>
      <div class="hadith-card__text" dir="rtl">${displayText}</div>
      <div class="hadith-card__actions">
        ${hasSharh ? `<button class="btn btn--ghost btn--pill" data-action="sharh" data-id="${hadith.id}" data-tooltip="الشرح"><svg class="ui-icon"><use href="#icon-video"></use></svg> الشرح</button>` : ''}

        <span style="flex:1"></span>
        <button class="btn btn--ghost btn--icon-sm" data-action="copy" data-id="${hadith.id}" data-tooltip="نسخ"><svg class="ui-icon"><use href="#icon-clipboard"></use></svg></button>
      </div>
    `;

    // Attach event delegation
    card.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('[data-action]');
      if (!actionBtn) return;
      
      const action = actionBtn.dataset.action;
      const id = parseInt(actionBtn.dataset.id);

      switch (action) {
        case 'sharh':
          SharhDrawer.open(id);
          break;
        case 'copy':
          _copyHadith(id);
          break;
      }
    });

    return card;
  }

  /**
   * Create a chapter header element
   */
  function _createChapterHeader(chapter) {
    const header = document.createElement('div');
    header.className = 'chapter-header';
    header.id = `chapter-${chapter.id}`;
    
    header.innerHTML = `
      <h2 class="chapter-header__title">${chapter.name}</h2>
      <div class="chapter-header__line"></div>
    `;
    
    return header;
  }


  async function _copyHadith(id) {
    const h = DataLayer.getHadith(id);
    if (!h) return;
    
    const textToCopy = `${h.id} - ${h.text_ar}`;
    
    const showSuccess = () => {
      const card = document.querySelector(`[data-hadith-id="${id}"]`);
      if (card) {
        const btn = card.querySelector('[data-action="copy"]');
        if (btn) {
          btn.innerHTML = '<svg class="ui-icon"><use href="#icon-check"></use></svg>';
          setTimeout(() => { btn.innerHTML = '<svg class="ui-icon"><use href="#icon-clipboard"></use></svg>'; }, 1500);
        }
      }
    };

    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(textToCopy);
        showSuccess();
      } catch {
        console.warn('Clipboard API failed');
      }
    } else {
      // Fallback for file:/// and non-secure contexts
      try {
        const textArea = document.createElement("textarea");
        textArea.value = textToCopy;
        textArea.style.position = "fixed";
        textArea.style.left = "-9999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        textArea.remove();
        showSuccess();
      } catch (err) {
        console.warn('Fallback copy failed', err);
      }
    }
  }

  /**
   * Scroll to a specific hadith card
   */
  function scrollToHadith(id) {
    // Make sure the hadith is rendered
    while (renderedCount < hadithsToRender.length) {
      const lastRendered = hadithsToRender[renderedCount - 1];
      if (lastRendered && lastRendered.id >= id) break;
      _renderBatch();
    }
    
    setTimeout(() => {
      const card = document.querySelector(`[data-hadith-id="${id}"]`);
      if (card) {
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
        card.classList.add('hadith-card--active');
        setTimeout(() => card.classList.remove('hadith-card--active'), 2000);
      }
    }, 100);
  }

  return { init, renderAllHadiths, renderChapterHadiths, renderHadiths, scrollToHadith };
})();
