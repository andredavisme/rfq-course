/* ============================================================
   ROUTER — Hash-based view router
   Maps URL hash → view ID → renders correct section
   Usage: router.navigate('concepts')
   ============================================================ */

const ROUTES = {
  dashboard:    { label: 'Dashboard',     viewId: 'view-dashboard' },
  domains:      { label: 'Domains',       viewId: 'view-domains' },
  concepts:     { label: 'Concepts',      viewId: 'view-concepts' },
  technologies: { label: 'Technologies',  viewId: 'view-technologies' },
  glossary:     { label: 'Glossary',      viewId: 'view-glossary' },
  examples:     { label: 'Code Examples', viewId: 'view-examples' },
  sources:      { label: 'Sources',       viewId: 'view-sources' },
};

const DEFAULT_ROUTE = 'dashboard';

class Router {
  constructor() {
    this._onNavigate = null;
    window.addEventListener('hashchange', () => this._handleHash());
  }

  /** Register a callback fired on every navigation. */
  onNavigate(fn) {
    this._onNavigate = fn;
  }

  /** Navigate to a named route and update the URL hash. */
  navigate(routeKey) {
    const route = ROUTES[routeKey] || ROUTES[DEFAULT_ROUTE];
    // Use pushState so the back button works correctly
    history.pushState(null, '', `#${routeKey}`);
    this._activate(routeKey, route);
  }

  /** Read the current hash and activate matching view. */
  _handleHash() {
    const key = window.location.hash.replace('#', '') || DEFAULT_ROUTE;
    const route = ROUTES[key] || ROUTES[DEFAULT_ROUTE];
    this._activate(key, route);
  }

  _activate(key, route) {
    // Hide all views
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));

    // Show target view
    const viewEl = document.getElementById(route.viewId);
    if (viewEl) viewEl.classList.add('active');

    // Update breadcrumb
    const crumb = document.getElementById('breadcrumb-current');
    if (crumb) crumb.textContent = route.label;

    // Sync sidebar
    document.querySelectorAll('.sidebar-item[data-route]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === key);
    });

    // Sync mobile nav
    document.querySelectorAll('.mobile-nav-item[data-route]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === key);
    });

    // Scroll main content to top
    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });

    // Fire callback
    if (this._onNavigate) this._onNavigate(key, route);
  }

  /** Bootstrap: read hash on first load. */
  init() {
    this._handleHash();
  }
}

export const router = new Router();
