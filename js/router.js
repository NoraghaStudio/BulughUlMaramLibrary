/* ============================================
   BULUGH AL-MARAM — ROUTER
   Hash-based multi-view navigation
   ============================================ */

const Router = (() => {
  const routes = {};
  let currentRoute = null;

  /**
   * Register a route
   * @param {string} path - e.g. 'browse', 'hadith/:id', 'memorize', 'progress'
   * @param {Function} handler - called with params when route matches
   */
  function register(path, handler) {
    routes[path] = handler;
  }

  /**
   * Navigate to a route
   */
  function navigate(path) {
    window.location.hash = '#/' + path;
  }

  /**
   * Parse current hash and invoke matching handler
   */
  function _handleRoute() {
    const hash = window.location.hash.slice(2) || 'browse'; // Remove '#/'
    
    // Try exact match first
    if (routes[hash]) {
      _activateRoute(hash, {});
      return;
    }

    // Try parameterized routes (e.g. hadith/:id)
    for (const [pattern, handler] of Object.entries(routes)) {
      if (!pattern.includes(':')) continue;
      
      const patternParts = pattern.split('/');
      const hashParts = hash.split('/');
      
      if (patternParts.length !== hashParts.length) continue;
      
      const params = {};
      let match = true;
      
      for (let i = 0; i < patternParts.length; i++) {
        if (patternParts[i].startsWith(':')) {
          params[patternParts[i].slice(1)] = hashParts[i];
        } else if (patternParts[i] !== hashParts[i]) {
          match = false;
          break;
        }
      }
      
      if (match) {
        _activateRoute(pattern, params);
        return;
      }
    }

    // Fallback to browse
    _activateRoute('browse', {});
  }

  function _activateRoute(routeName, params) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('view--active'));
    
    // Update nav links
    const baseName = routeName.split('/')[0];
    document.querySelectorAll('.navbar__link').forEach(link => {
      link.classList.toggle('navbar__link--active', link.dataset.route === baseName);
    });

    currentRoute = routeName;
    
    // Call the handler
    if (routes[routeName]) {
      routes[routeName](params);
    }
  }

  /**
   * Get current route name
   */
  function getCurrentRoute() {
    return currentRoute;
  }

  /**
   * Initialize router - listen for hash changes
   */
  function init() {
    window.addEventListener('hashchange', _handleRoute);
    // Handle initial route
    _handleRoute();
  }

  return { register, navigate, init, getCurrentRoute };
})();
