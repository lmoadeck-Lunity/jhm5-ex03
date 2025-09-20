# Vanilla To-Do (tod)

Migrated on 2025-09-20 from the React implementation located in `tdl/` to a single-page, framework-free HTML/CSS/JS version.

## Features

- Task CRUD with title, description, priority, due date, tags
- Kanban style columns: To-Do, In Progress, Done
- Sorting (deadline, priority, title)
- Filtering by status and multiple tags
- Custom tag & priority management (Settings view)
- Basic statistics (counts + simple SVG bar charts) without external libraries
- Light/Dark theme toggle (persisted)
- LocalStorage persistence for tasks, tags, priorities, theme, tag filters
- Accessible keyboard navigation for sidebar and form inputs

## Files

- `index.html` – Structure + modal + root containers
- `styles.css` – Consolidated styling adapted from original React CSS
- `app.js` – All application logic (state, rendering, events, persistence)

## How to Use

Open `tod/index.html` directly in a modern browser. No build or dependencies required.

## Data Persistence

LocalStorage keys used: `tasks`, `tags`, `priorities`, `theme`, `filterByTags`.

## Differences from React Version

- No external charting library; replaced Recharts with lightweight inline SVG bar charts
- All UI rendering done via direct DOM manipulation
- No per-column collapse toggle (could be added similarly if needed)
- Form validation logic ported closely with minimal changes

## Possible Enhancements

- Drag & drop for changing task status
- Column collapse/expand state persistence
- Improved accessibility for modal focus trap
- Export/import data (JSON download)

Enjoy!
