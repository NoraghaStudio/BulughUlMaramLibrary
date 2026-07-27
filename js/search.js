/* ============================================
   BULUGH AL-MARAM — SEARCH
   Full-text Arabic search with diacritic stripping
   ============================================ */

const Search = (() => {
  let isOpen = false;
  let debounceTimer = null;

  function init() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    const closeBtn = document.getElementById('search-close');

    // Open search with Ctrl+K or button click
    document.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggle();
      }
      if (e.key === 'Escape' && isOpen) {
        close();
      }
    });

    // Search input handler
    input?.addEventListener('input', (e) => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        _performSearch(e.target.value);
      }, 200);
    });

    // Close on overlay click
    modal?.addEventListener('click', (e) => {
      if (e.target === modal) close();
    });

    closeBtn?.addEventListener('click', close);
  }

  function toggle() {
    isOpen ? close() : open();
  }

  function open() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    modal?.classList.add('search-modal--open');
    isOpen = true;
    setTimeout(() => input?.focus(), 100);
  }

  function close() {
    const modal = document.getElementById('search-modal');
    const input = document.getElementById('search-input');
    modal?.classList.remove('search-modal--open');
    isOpen = false;
    if (input) input.value = '';
    _showHint();
  }

  function _performSearch(query) {
    const resultsContainer = document.getElementById('search-results');
    if (!resultsContainer) return;

    if (!query || query.trim().length < 1) {
      _showHint();
      return;
    }

    const results = DataLayer.searchHadiths(query.trim());
    
    if (results.length === 0) {
      resultsContainer.innerHTML = `
        <div class="search-hint">
          <p>لم يتم العثور على نتائج لـ "${query}"</p>
        </div>
      `;
      return;
    }

    const normalizedQuery = DataLayer.stripTashkeel(query.trim());

    resultsContainer.innerHTML = results.map(h => {
      // Create a snippet around the match
      const normalizedText = DataLayer.stripTashkeel(h.text_ar);
      const matchIdx = normalizedText.indexOf(normalizedQuery);
      const snippetStart = Math.max(0, matchIdx - 40);
      const snippetEnd = Math.min(h.text_ar.length, matchIdx + normalizedQuery.length + 40);
      let snippet = h.text_ar.substring(snippetStart, snippetEnd);
      if (snippetStart > 0) snippet = '...' + snippet;
      if (snippetEnd < h.text_ar.length) snippet = snippet + '...';

      return `
        <a href="#" class="search-result-item" data-hadith-id="${h.id}">
          <span class="search-result-item__number">${h.id}</span>
          <span class="search-result-item__text">${snippet}</span>
        </a>
      `;
    }).join('');

    // Click handler for results
    resultsContainer.querySelectorAll('.search-result-item').forEach(item => {
      item.addEventListener('click', (e) => {
        e.preventDefault();
        const id = parseInt(item.dataset.hadithId);
        close();
        // Navigate to browse and scroll to hadith
        Router.navigate('browse');
        setTimeout(() => Renderer.scrollToHadith(id), 300);
      });
    });
  }

  function _showHint() {
    const resultsContainer = document.getElementById('search-results');
    if (resultsContainer) {
      resultsContainer.innerHTML = `
        <div class="search-hint">
          <p>ابحث في أحاديث بلوغ المرام...</p>
          <p style="font-size: var(--font-size-xs); margin-top: var(--space-2); color: var(--text-tertiary);">
            <svg class="ui-icon"><use href="#icon-lightbulb"></use></svg> البحث يتجاهل التشكيل تلقائياً
          </p>
        </div>
      `;
    }
  }

  return { init, open, close, toggle };
})();
