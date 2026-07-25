/* ============================================
   BULUGH AL-MARAM — SHARH DRAWER
   YouTube commentary integration
   ============================================ */

const SharhDrawer = (() => {
  let isOpen = false;
  let currentHadithId = null;

  function init() {
    // Close button
    document.getElementById('sharh-close')?.addEventListener('click', close);
    // Overlay click to close
    document.getElementById('sharh-overlay')?.addEventListener('click', close);
    // Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && isOpen) close();
    });
  }

  /**
   * Open drawer for a hadith
   */
  function open(hadithId) {
    currentHadithId = hadithId;
    const sharhList = DataLayer.getSharhForHadith(hadithId);
    const body = document.getElementById('sharh-body');
    
    if (!body) return;

    if (sharhList.length === 0) {
      body.innerHTML = `
        <div class="sharh-drawer__no-data">
          <div class="sharh-drawer__no-data-icon"><svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-inbox"></use></svg></div>
          <p>لا يتوفر شرح مسجل لهذا الحديث</p>
        </div>
      `;
    } else {
      // Show the first (most relevant) sharh video
      const sharh = sharhList[0];
      body.innerHTML = `
        <div class="sharh-drawer__video-wrapper">
          <iframe 
            src="https://www.youtube.com/embed/${sharh.videoId}?start=${sharh.timestampSeconds}&rel=0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowfullscreen
          ></iframe>
        </div>
        <div class="sharh-drawer__video-title">${sharh.title}</div>
        <p style="font-size: var(--font-size-xs); color: var(--text-tertiary); margin-bottom: var(--space-4);">
          ⏱️ ${sharh.rawLabel || ''}
        </p>
        ${sharhList.length > 1 ? `
          <div style="border-top: 1px solid var(--border-subtle); padding-top: var(--space-4);">
            <p style="font-size: var(--font-size-sm); color: var(--text-secondary); margin-bottom: var(--space-3);">دروس أخرى تشمل هذا الحديث:</p>
            ${sharhList.slice(1).map(s => `
              <a href="#" class="search-result-item" onclick="SharhDrawer._switchVideo('${s.videoId}', ${s.timestampSeconds}, '${s.title.replace(/'/g, "\\'")}'); return false;">
                <span class="search-result-item__number"><svg class="ui-icon" style="width: 48px; height: 48px;"><use href="#icon-video"></use></svg></span>
                <span class="search-result-item__text">${s.title}<br><small style="color: var(--text-tertiary)">${s.rawLabel || ''}</small></span>
              </a>
            `).join('')}
          </div>
        ` : ''}
      `;
    }

    // Update drawer title
    const titleEl = document.getElementById('sharh-drawer-title');
    if (titleEl) {
      titleEl.textContent = `شرح الحديث ${hadithId}`;
    }

    // Show drawer
    document.getElementById('sharh-drawer')?.classList.add('sharh-drawer--open');
    document.getElementById('sharh-overlay')?.classList.add('sharh-overlay--visible');
    isOpen = true;
  }

  /**
   * Switch to a different sharh video
   */
  function _switchVideo(videoId, timestamp, title) {
    const body = document.getElementById('sharh-body');
    const wrapper = body?.querySelector('.sharh-drawer__video-wrapper');
    const titleEl = body?.querySelector('.sharh-drawer__video-title');
    
    if (wrapper) {
      wrapper.innerHTML = `
        <iframe 
          src="https://www.youtube.com/embed/${videoId}?start=${timestamp}&rel=0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowfullscreen
        ></iframe>
      `;
    }
    if (titleEl) {
      titleEl.textContent = title;
    }
  }

  function close() {
    document.getElementById('sharh-drawer')?.classList.remove('sharh-drawer--open');
    document.getElementById('sharh-overlay')?.classList.remove('sharh-overlay--visible');
    
    // Stop YouTube video by clearing iframe
    const iframe = document.querySelector('.sharh-drawer__video-wrapper iframe');
    if (iframe) {
      iframe.src = '';
    }
    
    isOpen = false;
    currentHadithId = null;
  }

  return { init, open, close, _switchVideo };
})();
