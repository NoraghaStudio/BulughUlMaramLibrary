/* ============================================
   BULUGH AL-MARAM — MAIN APP CONTROLLER
   Initializes everything & manages views
   ============================================ */

const App = (() => {
  async function init() {
    console.log('[App] Initializing Bulugh al-Maram Platform...');

    // Show loading screen
    const loadingScreen = document.getElementById('loading-screen');
    
    try {
      // 1. Load data
      await DataLayer.init();

      // 2. Initialize all modules
      ThemeManager.init();
      Memorization.init();
      SharhDrawer.init();
      Search.init();
      Renderer.init();

      // 3. Register routes
      _registerRoutes();

      // 4. Setup UI event listeners
      _setupNavbar();

      // 5. Populate chapter dropdown
      _populateChapters();

      // 6. Start router (will render initial view)
      Router.init();

      // 7. Hide loading screen
      if (loadingScreen) {
        loadingScreen.classList.add('loading-screen--hidden');
        setTimeout(() => loadingScreen.remove(), 600);
      }

      console.log('[App] Ready!');
    } catch (err) {
      console.error('[App] Initialization failed:', err);
      if (loadingScreen) {
        loadingScreen.innerHTML = `
          <div style="text-align:center; color: var(--text-primary); font-family: var(--font-ui);">
            <p style="font-size: 48px; margin-bottom: 16px;"><svg class="ui-icon" style="width: 48px; height: 48px; color: var(--color-warning);"><use href="#icon-warning"></use></svg></p>
            <p style="font-size: 18px; margin-bottom: 8px;">فشل تحميل البيانات</p>
            <p style="font-size: 14px; color: var(--text-tertiary);">تأكد من تشغيل التطبيق عبر خادم محلي وليس كملف مباشر</p>
            <p style="font-size: 12px; color: var(--text-tertiary); margin-top: 8px; direction: ltr;">python3 -m http.server 8000</p>
          </div>
        `;
      }
    }
  }

  function _registerRoutes() {
    // Browse — main hadith listing
    Router.register('browse', () => {
      document.getElementById('view-browse')?.classList.add('view--active');
      Renderer.renderAllHadiths();
    });

    // Browse specific chapter
    Router.register('chapter/:id', (params) => {
      document.getElementById('view-browse')?.classList.add('view--active');
      Renderer.renderChapterHadiths(`ch-${params.id}`);
    });

    // Memorize view
    Router.register('memorize', () => {
      document.getElementById('view-memorize')?.classList.add('view--active');
      Memorization.initPlannerUI();
    });

    // Progress view
    Router.register('progress', () => {
      document.getElementById('view-progress')?.classList.add('view--active');
      Memorization.renderProgressView();
    });

    // Single hadith deep link
    Router.register('hadith/:id', (params) => {
      document.getElementById('view-browse')?.classList.add('view--active');
      Renderer.renderAllHadiths();
      setTimeout(() => Renderer.scrollToHadith(parseInt(params.id)), 300);
    });
  }

  function _setupNavbar() {
    // Nav links
    document.querySelectorAll('.navbar__link[data-route]').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        Router.navigate(link.dataset.route);
      });
    });

    // Theme toggle
    document.getElementById('theme-toggle')?.addEventListener('click', () => ThemeManager.toggle());

    // Search button
    document.getElementById('search-btn')?.addEventListener('click', () => Search.open());

    // Mobile menu toggle
    document.getElementById('mobile-menu-btn')?.addEventListener('click', () => {
      document.querySelector('.navbar__nav')?.classList.toggle('navbar__nav--mobile-open');
    });

    // Chapter custom dropdown
    const dropdownTrigger = document.getElementById('chapter-dropdown-trigger');
    const dropdownContainer = document.getElementById('chapter-dropdown');
    
    if (dropdownTrigger && dropdownContainer) {
      dropdownTrigger.addEventListener('click', (e) => {
        e.stopPropagation();
        const isOpen = dropdownContainer.classList.toggle('is-open');
        dropdownTrigger.setAttribute('aria-expanded', isOpen);
      });

      document.addEventListener('click', (e) => {
        if (!dropdownContainer.contains(e.target)) {
          dropdownContainer.classList.remove('is-open');
          dropdownTrigger.setAttribute('aria-expanded', 'false');
        }
      });
    }
  }



  function _populateChapters() {
    const menu = document.getElementById('chapter-dropdown-menu');
    const triggerText = document.getElementById('chapter-dropdown-text');
    const dropdownContainer = document.getElementById('chapter-dropdown');
    const dropdownTrigger = document.getElementById('chapter-dropdown-trigger');
    if (!menu) return;

    const chapters = DataLayer.getChapters();
    menu.innerHTML = '';
    
    // Add "All" option
    const allItem = document.createElement('div');
    allItem.className = 'custom-dropdown__item is-selected';
    allItem.dataset.value = 'all';
    allItem.textContent = 'جميع الأحاديث';
    menu.appendChild(allItem);

    for (const ch of chapters) {
      if (ch.id === 'intro') continue;
      const item = document.createElement('div');
      item.className = 'custom-dropdown__item';
      item.dataset.value = ch.afterHadith || '';
      item.textContent = ch.name;
      menu.appendChild(item);
    }

    // Attach click events to items
    menu.addEventListener('click', (e) => {
      const item = e.target.closest('.custom-dropdown__item');
      if (!item) return;

      // Update active state
      menu.querySelectorAll('.custom-dropdown__item').forEach(el => el.classList.remove('is-selected'));
      item.classList.add('is-selected');
      triggerText.textContent = item.textContent;

      // Close dropdown
      dropdownContainer.classList.remove('is-open');
      dropdownTrigger.setAttribute('aria-expanded', 'false');

      // Navigate
      const val = item.dataset.value;
      if (val === 'all') {
        Router.navigate('browse');
      } else {
        Router.navigate(`chapter/${val}`);
      }
    });
  }

  return { init };
})();

// Boot the app when DOM is ready
document.addEventListener('DOMContentLoaded', () => App.init());
