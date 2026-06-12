/* ============================================================
   MARKDOWN — Lightweight renderer for course body content.
   Supports: h1-h3, bold, inline code, code blocks, tables,
   unordered lists, ordered lists, paragraphs, hr, blockquote.
   No external dependency.
   ============================================================ */

export function renderMarkdown(md) {
  if (!md) return '';
  let html = '';
  const lines = md.split('\n');
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    // Fenced code block
    if (line.startsWith('```')) {
      const lang = line.slice(3).trim();
      let code = '';
      i++;
      while (i < lines.length && !lines[i].startsWith('```')) {
        code += escHtml(lines[i]) + '\n';
        i++;
      }
      html += `<pre class="prose-code"><code${lang ? ` class="lang-${lang}"` : ''}>${code.trimEnd()}</code></pre>\n`;
      i++;
      continue;
    }

    // Table (line contains |)
    if (line.includes('|') && line.trim().startsWith('|')) {
      const tableLines = [];
      while (i < lines.length && lines[i].includes('|') && lines[i].trim().startsWith('|')) {
        tableLines.push(lines[i]);
        i++;
      }
      html += renderTable(tableLines);
      continue;
    }

    // Horizontal rule
    if (/^[-*_]{3,}$/.test(line.trim())) {
      html += '<hr class="prose-hr">\n';
      i++;
      continue;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      let quote = '';
      while (i < lines.length && lines[i].startsWith('> ')) {
        quote += inlineFormat(lines[i].slice(2)) + ' ';
        i++;
      }
      html += `<blockquote class="prose-blockquote">${quote.trim()}</blockquote>\n`;
      continue;
    }

    // Headings
    const h3 = line.match(/^### (.+)/);
    const h2 = line.match(/^## (.+)/);
    const h1 = line.match(/^# (.+)/);
    if (h1) { html += `<h1 class="prose-h1">${inlineFormat(h1[1])}</h1>\n`; i++; continue; }
    if (h2) { html += `<h2 class="prose-h2">${inlineFormat(h2[1])}</h2>\n`; i++; continue; }
    if (h3) { html += `<h3 class="prose-h3">${inlineFormat(h3[1])}</h3>\n`; i++; continue; }

    // Unordered list
    if (/^[-*] /.test(line)) {
      let items = '';
      while (i < lines.length && /^[-*] /.test(lines[i])) {
        items += `<li>${inlineFormat(lines[i].slice(2))}</li>\n`;
        i++;
      }
      html += `<ul class="prose-list">${items}</ul>\n`;
      continue;
    }

    // Ordered list
    if (/^\d+\. /.test(line)) {
      let items = '';
      while (i < lines.length && /^\d+\. /.test(lines[i])) {
        items += `<li>${inlineFormat(lines[i].replace(/^\d+\. /, ''))}</li>\n`;
        i++;
      }
      html += `<ol class="prose-list prose-ol">${items}</ol>\n`;
      continue;
    }

    // Empty line
    if (line.trim() === '') {
      i++;
      continue;
    }

    // Paragraph
    let para = '';
    while (i < lines.length && lines[i].trim() !== '' &&
           !lines[i].startsWith('#') && !lines[i].startsWith('```') &&
           !lines[i].startsWith('> ') && !/^[-*] /.test(lines[i]) &&
           !/^\d+\. /.test(lines[i]) && !/^[-*_]{3,}$/.test(lines[i].trim()) &&
           !(lines[i].includes('|') && lines[i].trim().startsWith('|'))) {
      para += inlineFormat(lines[i]) + ' ';
      i++;
    }
    if (para.trim()) html += `<p class="prose-p">${para.trim()}</p>\n`;
  }

  return html;
}

function renderTable(lines) {
  const rows = lines.filter(l => !/^\|[-| :]+\|$/.test(l.trim()));
  if (rows.length === 0) return '';
  const parse = (row) => row.replace(/^\|/, '').replace(/\|$/, '').split('|').map(c => inlineFormat(c.trim()));
  const [head, ...body] = rows;
  const ths = parse(head).map(c => `<th>${c}</th>`).join('');
  const trs = body.map(r => `<tr>${parse(r).map(c => `<td>${c}</td>`).join('')}</tr>`).join('\n');
  return `<div class="prose-table-wrap"><table class="prose-table"><thead><tr>${ths}</tr></thead><tbody>${trs}</tbody></table></div>\n`;
}

function inlineFormat(text) {
  if (!text) return '';
  return text
    // Bold+italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    // Bold
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    // Italic
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Inline code
    .replace(/`([^`]+)`/g, '<code class="prose-inline-code">$1</code>')
    // Arrows
    .replace(/->/g, '→')
    .replace(/=>/g, '⇒');
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
