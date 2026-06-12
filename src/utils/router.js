/* ============================================================
   ROUTER — Hash-based view router
   Supports flat routes (#examples) and detail routes (#examples/42)
   ============================================================ */

const ROUTES = {
  introduction:    { label: 'Introduction',    viewId: 'view-introduction' },
  dashboard:       { label: 'Dashboard',       viewId: 'view-dashboard' },
  domains:         { label: 'Modules',         viewId: 'view-domains' },
  concepts:        { label: 'Concepts',        viewId: 'view-concepts' },
  glossary:        { label: 'Glossary',        viewId: 'view-glossary' },
  examples:        { label: 'Walkthroughs',    viewId: 'view-examples' },
  sources:         { label: 'Source Modules',  viewId: 'view-sources' },
  'example-detail': { label: 'Walkthrough',   viewId: 'view-example-detail' },
  'concept-detail': { label: 'Concept',       viewId: 'view-concept-detail' },
};

const DEFAULT_ROUTE = 'dashboard';

class Router {
  constructor() {
    this._onNavigate = null;
    this._onDetail   = null;
    window.addEventListener('hashchange', () => this._handleHash());
    window.addEventListener('popstate',   () => this._handleHash());
  }

  onNavigate(fn) { this._onNavigate = fn; }
  onDetail(fn)   { this._onDetail   = fn; }

  navigate(routeKey) {
    history.pushState(null, '', `#${routeKey}`);
    this._handleHash();
  }

  navigateToDetail(type, id) {
    history.pushState(null, '', `#${type}/${id}`);
    this._handleHash();
  }

  _handleHash() {
    const raw = window.location.hash.replace('#', '') || DEFAULT_ROUTE;

    // Detect detail pattern: examples/42 or concepts/42
    const detailMatch = raw.match(/^([a-z-]+)\/([^/]+)$/);
    if (detailMatch) {
      const [, type, id] = detailMatch;
      const detailRouteKey = `${type.replace(/s$/, '')}-detail`; // examples → example-detail, concepts → concept-detail
      const route = ROUTES[detailRouteKey];
      if (route && this._onDetail) {
        this._activate(detailRouteKey, route, `${type}/${id}`);
        this._onDetail(type, id);
        return;
      }
    }

    // Flat route
    const route = ROUTES[raw] || ROUTES[DEFAULT_ROUTE];
    const key   = ROUTES[raw] ? raw : DEFAULT_ROUTE;
    this._activate(key, route, key);
    if (this._onNavigate) this._onNavigate(key, route);
  }

  _activate(key, route, hashValue) {
    document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
    const viewEl = document.getElementById(route.viewId);
    if (viewEl) viewEl.classList.add('active');

    // Breadcrumb
    const crumb = document.getElementById('breadcrumb-current');
    if (crumb) crumb.textContent = route.label;

    // Sidebar active state
    const parentKey = key.replace('-detail', 's');
    document.querySelectorAll('.sidebar-item[data-route]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === key || btn.dataset.route === parentKey);
    });
    document.querySelectorAll('.mobile-nav-item[data-route]').forEach(btn => {
      btn.classList.toggle('active', btn.dataset.route === key || btn.dataset.route === parentKey);
    });

    document.getElementById('main-content')?.scrollTo({ top: 0, behavior: 'smooth' });
  }

  init() { this._handleHash(); }
}

export const router = new Router();
