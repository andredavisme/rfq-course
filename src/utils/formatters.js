/* ============================================================
   FORMATTERS — Display helpers for enums, dates, slugs
   ============================================================ */
import { DIFFICULTY_LEVELS, ENTRY_STATUSES, CONTENT_FORMATS } from './constants.js';

/**
 * Render a difficulty badge chip.
 * @param {string|null} difficulty
 * @returns {string} HTML string
 */
export function difficultyChip(difficulty) {
  if (!difficulty) return '';
  const d = DIFFICULTY_LEVELS.find(l => l.value === difficulty);
  if (!d) return `<span class="card-difficulty">${difficulty}</span>`;
  return `<span class="card-difficulty ${d.cssClass}">${d.label}</span>`;
}

/**
 * Render a status badge chip.
 * @param {string} status
 * @returns {string} HTML string
 */
export function statusChip(status) {
  const s = ENTRY_STATUSES.find(e => e.value === status);
  const cssClass = s ? s.cssClass : '';
  const label = s ? s.label : status;
  return `<span class="status-chip ${cssClass}">${label}</span>`;
}

/**
 * Convert a slug to a human-readable label.
 * e.g. 'rfq-communication' → 'Rfq Communication'
 * @param {string} slug
 * @returns {string}
 */
export function slugToLabel(slug) {
  if (!slug) return '';
  return slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

/**
 * Format a Supabase ISO timestamp to a readable date.
 * @param {string} isoString
 * @returns {string}
 */
export function formatDate(isoString) {
  if (!isoString) return '—';
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric', month: 'short', day: 'numeric'
  });
}

/**
 * Truncate text to a max character count.
 * @param {string} text
 * @param {number} max
 * @returns {string}
 */
export function truncate(text, max = 120) {
  if (!text) return '';
  return text.length > max ? text.slice(0, max).trimEnd() + '…' : text;
}

/**
 * Build a format label with icon.
 * @param {string} format
 * @returns {string}
 */
export function formatLabel(format) {
  const icons = { text: '📄', code: '💻', formula: '∑', table: '⊞', diagram: '◈', mixed: '◉' };
  return `${icons[format] || ''} ${format || '—'}`;
}
