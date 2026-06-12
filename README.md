# RFQ Course — Warrior X Platform

**RFQ Communication Essentials** — a database-driven online course built on Supabase.
Content lives in the database; the frontend reads and renders it statically via GitHub Pages.

## Stack
- **Frontend:** Vanilla JS + CSS custom properties, no build step
- **Backend:** Supabase (project: `nmemmfblpzrkwyljpmvp`, region: `us-east-2`)
- **Hosting:** GitHub Pages → `main` branch, `index.html` root

## Supabase Tables Used
| Table | Role |
|---|---|
| `concepts` | Core course content units |
| `domains` | Knowledge area grouping |
| `technologies` | Stack references per concept |
| `tags` + `concept_tags` | Cross-cutting labels |
| `examples` | Code / diagram examples per concept |
| `glossary` | Term definitions |
| `sources` | Bibliographic citations |
| `concept_relationships` | Prerequisite / extends graph |

## File Structure
```
rfq-course/
├── index.html               # App shell entry point
├── src/
│   ├── main.js              # Bootstrap — nav init + default view
│   ├── supabase.js          # createClient() + all query helpers
│   ├── styles/
│   │   ├── tokens.css       # Design tokens — palette, type, spacing
│   │   ├── base.css         # Reset + base element styles
│   │   ├── layout.css       # App shell grid, sidebar, topbar
│   │   ├── components.css   # Cards, tables, buttons, chips
│   │   └── warrior-x.css   # Brand overrides — Bebas Neue, crimson
│   └── utils/
│       ├── constants.js     # Enum arrays for filters
│       ├── formatters.js    # Date, slug, enum → display label
│       └── router.js        # Hash-based view router
```

## GitHub Pages Setup
1. Go to **Settings → Pages**
2. Source: **Deploy from branch**
3. Branch: `main` / `/ (root)`
4. Live at: `https://andredavisme.github.io/rfq-course/`

## Development
No build step required. Edit files, push to `main`, GitHub Pages serves them live.
Open `index.html` directly in a browser for local preview.
