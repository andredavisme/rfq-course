/* ============================================================
   MAIN — App bootstrap
   Imports router + supabase, wires up nav, loads default view.
   ============================================================ */
import { router } from './utils/router.js';
import { getCounts, getDomains, getConcepts, getTechnologies, getGlossaryTerms, getExamples, getSources } from './supabase.js';
import { difficultyChip, statusChip, formatDate, truncate } from './utils/formatters.js';
import { DIFFICULTY_LEVELS, ENTRY_STATUSES, CONTENT_FORMATS, SOURCE_TYPES } from './utils/constants.js';

/* ── View loader registry ─────────────────────────────────── */
const VIEW_LOADERS = {
  dashboard:    loadDashboard,
  domains:      loadDomains,
  concepts:     loadConcepts,
  technologies: loadTechnologies,
  glossary:     loadGlossary,
  examples:     loadExamples,
  sources:      loadSources,
};

/* ── Bootstrap ─────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
  router.onNavigate((key) => {
    const loader = VIEW_LOADERS[key];
    if (loader) loader();
  });
  router.init();
});

/* ── Helpers ──────────────────────────────────────────────── */
function setEl(id, html) {
  const el = document.getElementById(id);
  if (el) el.innerHTML = html;
}

function populateSelect(id, items, valueKey = 'value', labelKey = 'label') {
  const el = document.getElementById(id);
  if (!el) return;
  const opts = items.map(i => `<option value="${i[valueKey]}">${i[labelKey]}</option>`).join('');
  el.innerHTML = `<option value="">All</option>${opts}`;
}

/* ── DASHBOARD ─────────────────────────────────────────────── */
async function loadDashboard() {
  try {
    const counts = await getCounts();
    const keys = ['domains', 'concepts', 'technologies', 'glossary', 'examples'];
    keys.forEach(k => {
      const el = document.querySelector(`[data-stat="${k}"]`);
      if (el) el.textContent = counts[k];
    });

    // Recent concepts table
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

/* ── DOMAINS ────────────────────────────────────────────────── */
async function loadDomains() {
  try {
    const domains = await getDomains();
    const cards = domains.map(d => `
      <article class="content-card" tabindex="0" data-route-to="concepts" data-domain-id="${d.id}">
        <div class="card-top">
          <div class="card-icon domain">${d.icon ?? '🗂️'}</div>
        </div>
        <div class="card-title">${d.name}</div>
        <div class="card-summary">${truncate(d.description ?? 'No description.')}</div>
        <div class="card-meta">
          <span class="tag-chip">${d.slug}</span>
        </div>
      </article>
    `).join('');
    setEl('domains-grid', cards || emptyState('No Domains', 'Add domains in Supabase to see them here.'));
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

/* ── TECHNOLOGIES ───────────────────────────────────────────── */
async function loadTechnologies() {
  try {
    const techs = await getTechnologies();
    const rows = techs.map(t => `
      <tr>
        <td class="td-name">${t.name}</td>
        <td class="td-mono">${t.slug}</td>
        <td>${t.version ?? '—'}</td>
        <td>${t.domain?.name ?? '—'}</td>
        <td>${t.docs_url ? `<a href="${t.docs_url}" target="_blank" rel="noopener" style="color:var(--color-primary-hover);text-decoration:underline">Docs ↗</a>` : '—'}</td>
        <td>${t.is_active ? '<span class="status-chip status-published">Active</span>' : '<span class="status-chip status-archived">Inactive</span>'}</td>
      </tr>
    `).join('');
    setEl('tech-tbody', rows || '<tr><td colspan="6" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No technologies yet</td></tr>');
    const countEl = document.getElementById('tech-count');
    if (countEl) countEl.textContent = `${techs.filter(t => t.is_active).length} active`;
  } catch (e) {
    console.error('[Technologies]', e);
  }
}

/* ── GLOSSARY ───────────────────────────────────────────────── */
async function loadGlossary(filters = {}) {
  try {
    const terms = await getGlossaryTerms(filters);
    const rows = terms.map(t => `
      <tr>
        <td class="td-name">${t.term}</td>
        <td class="td-mono">${t.slug}</td>
        <td style="max-width:300px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${truncate(t.definition, 80)}</td>
        <td>${t.concept?.name ?? '—'}</td>
        <td>${statusChip(t.status)}</td>
      </tr>
    `).join('');
    setEl('glossary-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No terms yet</td></tr>');
    const countEl = document.getElementById('glossary-count');
    if (countEl) countEl.textContent = `${terms.length} terms`;
  } catch (e) {
    console.error('[Glossary]', e);
  }
}

/* ── EXAMPLES ───────────────────────────────────────────────── */
async function loadExamples() {
  try {
    const examples = await getExamples();
    const cards = examples.map(ex => `
      <article class="content-card" tabindex="0">
        <div class="card-top">
          <div class="card-icon concept">💻</div>
          <span class="tag-chip">${ex.format ?? 'code'}</span>
        </div>
        <div class="card-title">${ex.title}</div>
        <div class="card-summary">${ex.concept?.name ?? ''}</div>
        <div class="card-meta">
          ${ex.language ? `<span class="tag-chip">${ex.language}</span>` : ''}
          ${statusChip(ex.status)}
        </div>
      </article>
    `).join('');
    setEl('examples-grid', cards || emptyState('No Examples', 'Code examples attached to concepts will appear here.'));
  } catch (e) {
    console.error('[Examples]', e);
  }
}

/* ── SOURCES ─────────────────────────────────────────────────── */
async function loadSources() {
  try {
    const sources = await getSources();
    const rows = sources.map(s => `
      <tr>
        <td class="td-name">${s.title}</td>
        <td><span class="tag-chip">${s.type}</span></td>
        <td>${s.author ?? '—'}</td>
        <td>${s.year ?? '—'}</td>
        <td>${s.url ? `<a href="${s.url}" target="_blank" rel="noopener" style="color:var(--color-primary-hover);text-decoration:underline">Link ↗</a>` : '—'}</td>
      </tr>
    `).join('');
    setEl('sources-tbody', rows || '<tr><td colspan="5" style="text-align:center;color:var(--color-text-faint);padding:var(--space-8)">No sources yet</td></tr>');
    const countEl = document.getElementById('sources-count');
    if (countEl) countEl.textContent = `${sources.length} sources`;
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
