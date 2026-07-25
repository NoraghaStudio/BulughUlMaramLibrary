/* ============================================
   BULUGH AL-MARAM — THEME MANAGER
   Dark/Light mode toggle with persistence
   ============================================ */

const ThemeManager = (() => {
  const STORAGE_KEY = 'bulugh-theme';
  let currentTheme = 'dark';

  function init() {
    // Check stored preference
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      currentTheme = stored;
    } else {
      // Check system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      currentTheme = prefersDark ? 'dark' : 'dark'; // Default to dark
    }
    _apply();

    // Listen for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      if (!localStorage.getItem(STORAGE_KEY)) {
        currentTheme = e.matches ? 'dark' : 'light';
        _apply();
      }
    });
  }

  function toggle() {
    document.documentElement.classList.add('theme-transitioning');
    currentTheme = currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem(STORAGE_KEY, currentTheme);
    _apply();
    
    setTimeout(() => {
      document.documentElement.classList.remove('theme-transitioning');
    }, 500);
  }

  function _apply() {
    document.documentElement.setAttribute('data-theme', currentTheme);
    
    const btn = document.getElementById('theme-toggle');
    if (btn) {
      btn.innerHTML = currentTheme === 'dark' ? '<svg class="ui-icon" id="theme-icon"><use href="#icon-sun"></use></svg>' : '<svg class="ui-icon" id="theme-icon"><use href="#icon-moon"></use></svg>';
      btn.setAttribute('data-tooltip', currentTheme === 'dark' ? 'الوضع الفاتح' : 'الوضع الداكن');
    }
  }

  function getTheme() {
    return currentTheme;
  }

  return { init, toggle, getTheme };
})();
