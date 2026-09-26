# Changelog

## 1.2.0

- Add custom sort comparators and per-column filters.
- Add accessible validation for cell and heading edits.
- Add server-driven query mode with remote totals, loading state, and absolute row offsets.
- Add pointer/keyboard column resizing and persisted widths.
- Add opt-in automatic persistence for table preferences and optional row values.
- Add fixed-height row virtualization and edge auto-scroll while dragging columns.
- Simplify the npm description and organize the README into feature examples with local demo screenshots.

## 1.1.0

- Optional pagination with page-size controls and absolute row indices.
- Pointer/keyboard column reordering, stable sorting, and global search.
- Published TypeScript declarations and packaged consumer type checks.
- Export `applyColumnOrder` to restore saved column keys against the current schema without mutating data.
- Demo save/reset controls store column keys only; storage failures are handled without breaking the table.
- Expand the README with preferences, sorting/filtering, pagination, and TypeScript examples.
- Include release notes in the npm archive.

## 1.0.0

- Vue 3 plugin and named component exports with separate CSS.
- Two-way header and row bindings, inline editing, and row/column controls.
- Custom header, cell, toolbar, empty, and footer slots.
- Responsive demo consuming the package's public exports.
- API documentation, MIT license, and release checks.
