/* ============================================================
   MAIN — App bootstrap
   ============================================================ */
import { router } from './utils/router.js';
import { getCounts, getDomains, getConcepts, getConceptById, getGlossaryTerms, getExamples, getExampleById, getSources } from './supabase.js';
import { difficultyChip, statusChip, truncate } from './utils/formatters.js';
import { renderMarkdown } from './utils/markdown.js';

/* ── View loader registry ─────────────────────────────────── */
const VIEW_LOADERS = {
  dashboard: loadDashboard,
  domains:   loadDomains,
  concepts:  loadConcepts,
  glossary:  loadGlossary,
  examples:  loadExamples,
  sources:   loadSources,
};

/* ── Module slug → human-readable label ──────────────────── */
const MODULE_LABELS = {
  'module-01-seeing-failures':  'Module 1 — Seeing Failures',
  'module-02-intake':           'Module 2 — Intake',
  'module-03-communication':    'Module 3 — Communication',
  'module-04-vendor-flows':     'Module 4 — Vendor Flows',
  'module-05-governance':       'Module 5 — Governance',
};

const MODULE_URLS = {
  'module-01-seeing-failures':  'https://github.com/andredavisme/RFQ-solutions/tree/main/course/module-01-seeing-failures',
  'module-02-intake':           'https://github.com/andredavisme/RFQ-solutions/tree/main/course/module-02-intake',
  'module-03-communication':    'https://github.com/andredavisme/RFQ-solutions/tree/main/course/module-03-communication',
  'module-04-vendor-flows':     'https://github.com/andredavisme/RFQ-solutions/tree/main/course/module-04-vendor-flows',
  'module-05-governance':       'https://github.com/andredavisme/RFQ-solutions/tree/main/course/module-05-governance',
};

function moduleLink(slug) {
  if (!slug) return '—';
  const label = MODULE_LABELS[slug] ?? slug;
  const url   = MODULE_URLS[slug];
  if (!url) return `<span class="tag-chip">${label}</span>`;
  return `<a href="${url}" target="_blank" rel="noopener" style="color:var(--color-primary-hover);text-decoration:underline">${label} ↗</a>`;
}

/* ── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {

  router.onNavigate((key) => {
    const loader = VIEW_LOADERS[key];
    if (loader) loader();
  });

  router.onDetail((type, id) => {
    if (type === 'examples') loadExampleDetail(id);
    if (type === 'concepts') loadConceptDetail(id);
  });

  router.init();

  // Sidebar + mobile nav
  document.addEventListener('click', (e) => {
    const navTarget = e.target.closest('[data-route]');
    if (navTarget) router.navigate(navTarget.dataset.route);
  });

  // data-route-to (module cards, back buttons, etc.)
  document.addEventListener('click', (e) => {
    const target = e.target.closest('[data-route-to]');
    if (!target) return;
    const routeKey = target.dataset.routeTo;
    if (!routeKey) return;
    router.navigate(routeKey);
    if (routeKey === 'concepts' && target.dataset.domainId) {
      loadConcepts({ domain_id: target.dataset.domainId });
    }
  });

  // Example detail card clicks
  document.addEventListener('click', (e) => {
    const exCard = e.target.closest('[data-example-id]');
    if (exCard) router.navigateToDetail('examples', exCard.dataset.exampleId);
  });

  // Concept detail card clicks
  document.addEventListener('click', (e) => {
    const cCard = e.target.closest('[data-concept-id]');
    if (cCard) router.navigateToDetail('concepts', cCard.dataset.conceptId);
  });

  // Filter wiring — concepts
  document.getElementById('concepts-search')?.addEventListener('input', (e) => {
    loadConcepts({ search: e.target.value });
  });
  document.getElementById('concepts-filter-domain')?.addEventListener('change', (e) => {
    loadConcepts({ domainId: e.target.value || undefined });
  });
  document.getElementById('concepts-filter-difficulty')?.addEventListener('change', (e) => {
    loadConcepts({ difficulty: e.target.value || undefined });
  });
  document.getElementById('concepts-filter-status')?.addEventListener('change', (e) => {
    loadConcepts({ status: e.target.value || undefined });
  });

  // Filter wiring — glossary
  document.getElementById('glossary-search')?.addEventListener('input', (e) => {
    loadGlossary({ search: e.target.value });
  });
});

/* ── Helpers ─────────────────────────────────────────────── */
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
      </tr>`).join('');
    setEl('dash-concepts-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No concepts yet</td></tr>');
  } catch (e) { console.error('[Dashboard]', e); }
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
      </article>`).join('');
    setEl('domains-grid', cards || emptyState('No Modules', 'Modules will appear here once loaded.'));
  } catch (e) { console.error('[Domains]', e); }
}

/* ── CONCEPTS ───────────────────────────────────────────────── */
async function loadConcepts(filters = {}) {
  try {
    const concepts = await getConcepts(filters);
    const cards = concepts.map(c => {
      const tags = (c.tags ?? []).map(t => `<span class="tag-chip">${t.tag?.name ?? t}</span>`).join('');
      return `
        <article class="content-card content-card--clickable" tabindex="0" role="button"
          aria-label="Open ${c.name}" data-concept-id="${c.id}">
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
            <span class="card-cta">→ Read</span>
          </div>
        </article>`;
    }).join('');
    setEl('concepts-grid', cards || emptyState('No Concepts', 'Concepts matching your filters will appear here.'));
  } catch (e) { console.error('[Concepts]', e); }
}

/* ── CONCEPT DETAIL ─────────────────────────────────────────── */
async function loadConceptDetail(id) {
  setEl('concept-detail-body', '<div class="prose-loading">Loading…</div>');
  setEl('concept-detail-title', '');
  setEl('concept-detail-meta', '');
  try {
    const c = await getConceptById(id);
    if (!c) {
      setEl('concept-detail-body', emptyState('Not Found', 'This concept could not be loaded.'));
      return;
    }

    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = c.name;

    setEl('concept-detail-title', c.name);

    const tags = (c.tags ?? []).map(t => `<span class="tag-chip">${t.tag?.name ?? t}</span>`).join('');
    setEl('concept-detail-meta', `
      ${difficultyChip(c.difficulty)}
      ${c.domain?.name ? `<span class="tag-chip">${c.domain.name}</span>` : ''}
      ${tags}
      ${statusChip(c.status)}
    `);

    // Body: prefer full body, fall back to summary
    const bodyHtml = c.body
      ? renderMarkdown(c.body)
      : `<p class="prose-p" style="color:var(--color-text-muted);font-style:italic">${c.summary ?? 'No content yet.'}</p>`;

    // Glossary terms panel
    const glossaryHtml = (c.glossary_terms ?? []).length
      ? `<div class="prose-hr"></div>
         <h2 class="prose-h2">Related Terms</h2>
         <ul class="prose-list">${(c.glossary_terms).map(t =>
           `<li><strong>${t.term}</strong> — ${t.definition}${t.module_slug ? ` ${moduleLink(t.module_slug)}` : ''}</li>`
         ).join('')}</ul>`
      : '';

    setEl('concept-detail-body', bodyHtml + glossaryHtml);
  } catch (e) {
    console.error('[ConceptDetail]', e);
    setEl('concept-detail-body', emptyState('Error', 'Could not load this concept.'));
  }
}

/* ── GLOSSARY ───────────────────────────────────────────────── */
async function loadGlossary(filters = {}) {
  try {
    const terms = await getGlossaryTerms(filters);
    const rows = terms.map(t => `
      <tr>
        <td class="td-name">${t.term}</td>
        <td class="td-definition">${t.definition}</td>
        <td>${moduleLink(t.module_slug)}</td>
        <td>${t.concept?.name ?? '—'}</td>
        <td>${statusChip(t.status)}</td>
      </tr>`).join('');
    setEl('glossary-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No terms yet</td></tr>');
    const countEl = document.getElementById('glossary-count');
    if (countEl) countEl.textContent = `${terms.length} terms`;
  } catch (e) { console.error('[Glossary]', e); }
}

/* ── EXAMPLES (Walkthroughs list) ────────────────────────────────── */
async function loadExamples() {
  try {
    const examples = await getExamples();
    const formatLabel = { mixed: 'Walkthrough', table: 'Reference Table', text: 'Text', code: 'Code', diagram: 'Diagram' };
    const cards = examples.map(ex => `
      <article class="content-card content-card--clickable" tabindex="0" role="button"
        aria-label="Open ${ex.title}" data-example-id="${ex.id}">
        <div class="card-top">
          <div class="card-icon concept">${ex.format === 'table' ? '📊' : '🗺️'}</div>
          <span class="tag-chip">${formatLabel[ex.format] ?? ex.format}</span>
        </div>
        <div class="card-title">${ex.title}</div>
        <div class="card-summary">${truncate(ex.concept?.name ?? '', 80)}</div>
        <div class="card-meta">
          ${statusChip(ex.status)}
          <span class="card-cta">→ Read</span>
        </div>
      </article>`).join('');
    setEl('examples-grid', cards || emptyState('No Walkthroughs', 'Walkthrough examples will appear here.'));
  } catch (e) { console.error('[Examples]', e); }
}

/* ── EXAMPLE DETAIL ────────────────────────────────────────────── */
async function loadExampleDetail(id) {
  setEl('example-detail-body', '<div class="prose-loading">Loading…</div>');
  setEl('example-detail-title', '');
  setEl('example-detail-meta', '');
  try {
    const ex = await getExampleById(id);
    if (!ex) {
      setEl('example-detail-body', emptyState('Not Found', 'This walkthrough could not be loaded.'));
      return;
    }

    const formatLabel = { mixed: 'Walkthrough', table: 'Reference Table', text: 'Text', code: 'Code', diagram: 'Diagram' };
    const breadcrumb = document.getElementById('breadcrumb-current');
    if (breadcrumb) breadcrumb.textContent = ex.title;

    setEl('example-detail-title', ex.title);
    setEl('example-detail-meta', `
      <span class="tag-chip">${formatLabel[ex.format] ?? ex.format}</span>
      ${ex.concept?.name ? `<span class="tag-chip tag-chip--concept">💡 ${ex.concept.name}</span>` : ''}
      ${statusChip(ex.status)}
    `);
    setEl('example-detail-body', renderMarkdown(ex.body));
  } catch (e) {
    console.error('[ExampleDetail]', e);
    setEl('example-detail-body', emptyState('Error', 'Could not load this walkthrough.'));
  }
}

/* ── SOURCES ───────────────────────────────────────────────── */
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
      </tr>`).join('');
    setEl('sources-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No source modules yet</td></tr>');
    const countEl = document.getElementById('sources-count');
    if (countEl) countEl.textContent = `${sources.length} modules`;
  } catch (e) { console.error('[Sources]', e); }
}

/* ── EMPTY STATE ─────────────────────────────────────────────── */
function emptyState(title, message) {
  return `
    <div class="empty-state">
      <svg viewBox="0 0 48 48" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
        <path d="M24 6 L42 16 L42 32 L24 42 L6 32 L6 16 Z"/>
        <circle cx="24" cy="24" r="6"/>
      </svg>
      <h3>${title}</h3>
      <p>${message}</p>
    </div>`;
}
