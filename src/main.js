/* ============================================================
   MAIN — App bootstrap
   Imports router + supabase, wires up nav, loads default view.
   ============================================================ */
import { router } from './utils/router.js';
import { getCounts, getDomains, getConcepts, getGlossaryTerms, getExamples, getSources } from './supabase.js';
import { difficultyChip, statusChip, formatDate, truncate } from './utils/formatters.js';
import { DIFFICULTY_LEVELS, ENTRY_STATUSES, CONTENT_FORMATS, SOURCE_TYPES } from './utils/constants.js';

/* ── View loader registry ─────────────────────────────────── */
const VIEW_LOADERS = {
  dashboard: loadDashboard,
  domains:   loadDomains,
  concepts:  loadConcepts,
  glossary:  loadGlossary,
  examples:  loadExamples,
  sources:   loadSources,
};

/* ── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  router.onNavigate((key) => {
    const loader = VIEW_LOADERS[key];
    if (loader) loader();
  });
  router.init();

  // Wire sidebar + mobile nav [data-route] clicks to the router
  document.addEventListener('click', (e) => {
    const navTarget = e.target.closest('[data-route]');
    if (navTarget) router.navigate(navTarget.dataset.route);
  });

  // Delegated handler for [data-route-to] (module cards, etc.)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-route-to]');
    if (!target) return;
    const routeKey = target.dataset.routeTo;
    if (!routeKey) return;
    router.navigate(routeKey);
    // Pass domain filter when navigating from a module card
    if (routeKey === 'concepts' && target.dataset.domainId) {
      loadConcepts({ domain_id: target.dataset.domainId });
    }
  });
});

/* ── Helpers ──────────────────────────────────────────────── */
function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

/* ── DASHBOARD ─────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const counts = await getCounts();
    ['domains', 'concepts', 'glossary', 'examples', 'sources'].forEach(k => {
      const el = document.querySelector(`[data-stat="${k}"]`);
      if (el) el.textContent = counts[k];
    });

    const recent = await getConcepts({ status: 'published' });
    const rows = recent.slice(0, 10).map(c => `
      <tr>
        <td class="td-name">${c.name}</td>
        <td>${c.domain?.name ?? '—'}</td>
        <td>${difficultyChip(c.difficulty)}</td>
        <td>${c.format ?? '—'}</td>
        <td>${statusChip(c.status)}</td>
      </tr>
    `).join('');
    setEl('dash-concepts-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No concepts yet</td></tr>');
  } catch (e) {
    console.error('[Dashboard]', e);
  }
}

/* ── DOMAINS (Modules) ──────────────────────────────────────── */
async function loadDomains() {
  try {
    const domains = await getDomains();
    const cards = domains.map(d => `
      <article class="content-card" tabindex="0" data-route-to="concepts" data-domain-id="${d.id}">
        <div class="card-top">
          <div class="card-icon domain">${d.icon ?? '📋'}</div>
        </div>
        <div class="card-title">${d.name}</div>
        <div class="card-summary">${truncate(d.description ?? 'No description.')}</div>
      </article>
    `).join('');
    setEl('domains-grid', cards || emptyState('No Modules', 'Modules will appear here once loaded.'));
  } catch (e) {
    console.error('[Domains]', e);
  }
}

/* ── CONCEPTS ───────────────────────────────────────────────── */
async function loadConcepts(filters = {}) {
  try {
    const concepts = await getConcepts(filters);
    const cards = concepts.map(c => {
      const tags = (c.tags ?? []).map(t => `<span class="tag-chip">${t.tag?.name ?? t}</span>`).join('');
      return `
        <article class="content-card" tabindex="0">
          <div class="card-top">
            <div class="card-icon concept">💡</div>
            ${difficultyChip(c.difficulty)}
          </div>
          <div class="card-title">${c.name}</div>
          <div class="card-summary">${truncate(c.summary ?? '')}</div>
          <div class="card-meta">
            <span>${c.domain?.name ?? '—'}</span>
            <span>·</span>
            <span>${c.format ?? 'text'}</span>
            ${tags ? `<span>·</span>${tags}` : ''}
          </div>
        </article>
      `;
    }).join('');
    setEl('concepts-grid', cards || emptyState('No Concepts', 'Concepts matching your filters will appear here.'));
  } catch (e) {
    console.error('[Concepts]', e);
  }
}

/* ── GLOSSARY ───────────────────────────────────────────────── */
async function loadGlossary(filters = {}) {
  try {
    const terms = await getGlossaryTerms(filters);
    const rows = terms.map(t => `
      <tr>
        <td class="td-name">${t.term}</td>
        <td style="max-width:340px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${truncate(t.definition, 100)}</td>
        <td>${t.concept?.name ?? '—'}</td>
        <td>${statusChip(t.status)}</td>
      </tr>
    `).join('');
    setEl('glossary-tbody', rows || '<tr><td colspan="4" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No terms yet</td></tr>');
    const countEl = document.getElementById('glossary-count');
    if (countEl) countEl.textContent = `${terms.length} terms`;
  } catch (e) {
    console.error('[Glossary]', e);
  }
}

/* ── EXAMPLES (Walkthroughs) ────────────────────────────────── */
async function loadExamples() {
  try {
    const examples = await getExamples();
    const formatLabel = { mixed: 'Walkthrough', table: 'Reference Table', text: 'Text', code: 'Code', diagram: 'Diagram' };
    const cards = examples.map(ex => `
      <article class="content-card" tabindex="0">
        <div class="card-top">
          <div class="card-icon concept">${ex.format === 'table' ? '📊' : '🗺️'}</div>
          <span class="tag-chip">${formatLabel[ex.format] ?? ex.format}</span>
        </div>
        <div class="card-title">${ex.title}</div>
        <div class="card-summary">${truncate(ex.concept?.name ?? '', 80)}</div>
        <div class="card-meta">${statusChip(ex.status)}</div>
      </article>
    `).join('');
    setEl('examples-grid', cards || emptyState('No Walkthroughs', 'Walkthrough examples will appear here.'));
  } catch (e) {
    console.error('[Examples]', e);
  }
}

/* ── SOURCES (Source Modules) ───────────────────────────────── */
async function loadSources() {
  try {
    const sources = await getSources();
    const rows = sources.map(s => `
      <tr>
        <td class="td-name">${s.title}</td>
        <td><span class="tag-chip">${s.type}</span></td>
        <td>${s.author ?? '—'}</td>
        <td>${s.year ?? '—'}</td>
        <td>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:var(--color-primary-hover);text-decoration:underline">View ↗</a>` : '—'}</td>
      </tr>
    `).join('');
    setEl('sources-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No source modules yet</td></tr>');
    const countEl = document.getElementById('sources-count');
    if (countEl) countEl.textContent = `${sources.length} modules`;
  } catch (e) {
    console.error('[Sources]', e);
  }
}

/* ── EMPTY STATE helper ──────────────────────────────────────── */
function emptyState(title, message) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M24 6 L42 16 L42 32 L24 42 L6 32 L6 16 Z"/>
        <circle cx="24" cy="24" r="6"/>
      </svg>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>
  `;
}
