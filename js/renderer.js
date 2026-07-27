/* ============================================
   BULUGH AL-MARAM — RENDERER
   Renders hadith cards & chapter headers
   ============================================ */

const Renderer = (() => {
  const ITEMS_PER_PAGE = 50;
  let currentPage = 1;
  let hadithsToRender = [];
  let container = null;
  let paginationContainer = null;

  /**
   * Initialize pagination and container
   */
  function init() {
    container = document.getElementById('hadith-list');
    paginationContainer = document.getElementById('pagination-controls');
  }

  /**
   * Render all hadiths (paginated)
   */
  function renderAllHadiths() {
    if (!container) return;
    hadithsToRender = DataLayer.getAllHadiths();
    currentPage = 1;
    renderPage(currentPage);
  }

  /**
   * Render hadiths for a specific chapter
   */
  function renderChapterHadiths(chapterId) {
    if (!container) return;
    hadithsToRender = DataLayer.getChapterHadiths(chapterId);
    currentPage = 1;
    renderPage(currentPage);
  }

  /**
   * Render a specific set of hadiths
   */
  function renderHadiths(hadithList) {
    if (!container) return;
    hadithsToRender = hadithList;
    currentPage = 1;
    renderPage(currentPage);
  }

  /**
   * Render a specific page of hadiths
   */
  function renderPage(pageNumber, scrollToTop = true) {
    if (!container) return;
    currentPage = pageNumber;
    container.innerHTML = '';
    
    const fragment = document.createDocumentFragment();
    const chapters = DataLayer.getChapters();
    
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, hadithsToRender.length);

    for (let i = startIndex; i < endIndex; i++) {
      const hadith = hadithsToRender[i];
      const fullHadith = DataLayer.getHadith(hadith.id);
      
      // Check if we need to insert a chapter header before this hadith
      for (const ch of chapters) {
        if (ch.startHadith === hadith.id && ch.id !== 'intro') {
          fragment.appendChild(_createChapterHeader(ch));
        }
      }

      fragment.appendChild(_createHadithCard(fullHadith, i - startIndex));
    }

    container.appendChild(fragment);
    
    _renderPagination();
    
    // Scroll to top of list if we're changing pages
    if (scrollToTop && (pageNumber > 1 || hadithsToRender.length > ITEMS_PER_PAGE)) {
       window.scrollTo({
         top: container.parentElement.offsetTop - 100, // Account for navbar
         behavior: 'smooth'
       });
    }
  }

  /**
   * Render pagination controls
   */
  function _renderPagination() {
    if (!paginationContainer) return;
    paginationContainer.innerHTML = '';
    
    const totalPages = Math.ceil(hadithsToRender.length / ITEMS_PER_PAGE);
    
    if (totalPages <= 1) return; // No pagination needed
    
    const fragment = document.createDocumentFragment();
    
    const createBtn = (text, page, isDisabled, isActive = false) => {
      const btn = document.createElement('button');
      btn.className = `pagination-btn ${isActive ? 'pagination-btn--active' : ''}`;
      btn.innerHTML = text;
      btn.disabled = isDisabled;
      if (!isDisabled && !isActive) {
        btn.addEventListener('click', () => renderPage(page));
      }
      return btn;
    };
    
    fragment.appendChild(createBtn('السابق', currentPage - 1, currentPage === 1));
    
    // Page Numbers
    let startP = Math.max(1, currentPage - 2);
    let endP = Math.min(totalPages, currentPage + 2);
    
    if (startP > 1) {
      fragment.appendChild(createBtn('1', 1, false));
      if (startP > 2) {
        const dots = document.createElement('span');
        dots.className = 'pagination-ellipsis';
        dots.textContent = '...';
        fragment.appendChild(dots);
      }
    }
    
    for (let p = startP; p <= endP; p++) {
      fragment.appendChild(createBtn(p.toString(), p, false, p === currentPage));
    }
    
    if (endP < totalPages) {
      if (endP < totalPages - 1) {
        const dots = document.createElement('span');
        dots.className = 'pagination-ellipsis';
        dots.textContent = '...';
        fragment.appendChild(dots);
      }
      fragment.appendChild(createBtn(totalPages.toString(), totalPages, false));
    }
    
    fragment.appendChild(createBtn('التالي', currentPage + 1, currentPage === totalPages));
    
    paginationContainer.appendChild(fragment);
  }

  /**
   * Create a single hadith card element
   */
  function _createHadithCard(hadith, index) {
    const card = document.createElement('div');
    card.className = 'hadith-card';
    card.dataset.hadithId = hadith.id;
    card.dataset.animate = '';
    card.style.animationDelay = `${(index % ITEMS_PER_PAGE) * 0.03}s`;

    const hasSharh = DataLayer.getSharhForHadith(hadith.id).length > 0;

    // Check if it's today's hifz plan
    let hifzBadge = '';
    if (typeof Memorization !== 'undefined') {
      const todayPlan = Memorization.getTodayPlanRange();
      if (todayPlan && hadith.id >= todayPlan.start && hadith.id <= todayPlan.end) {
        if (!todayPlan.completed) {
          hifzBadge = '<span class="today-badge" style="margin-right: 8px;">يجب حفظه اليوم</span>';
        }
      }
    }

    // Clean text (remove chapter markers from display)
    let displayText = hadith.text_ar;
    displayText = displayText.replace(/\s*\*\s*\*\s*\*\s*(كِتَابُ|كتاب|بَابُ|باب)\s+.+$/, '');

    card.innerHTML = `
      <div class="hadith-card__header">
        <span class="hadith-card__number">${hadith.id}</span>
        <span class="hadith-card__chapter-tag"></span>
        ${hifzBadge}
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
    const index = hadithsToRender.findIndex(h => h.id == id);
    if (index === -1) return; // not found in current list
    
    const targetPage = Math.floor(index / ITEMS_PER_PAGE) + 1;
    
    if (currentPage !== targetPage) {
      renderPage(targetPage, false);
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
