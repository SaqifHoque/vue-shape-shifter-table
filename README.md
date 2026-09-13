# Vue Shapeshifter Table

## Sorting and search

Enable `sortable` for a separate sort button on each heading and `filterable` for global search. Both are off by default. They work with pagination and column dragging without adding dependencies:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:sort="sort"
  v-model:filter="filter"
  sortable filterable pagination
  :page-size="10"
/>
```

Initialize `sort` as `ref<TableSort | null>(null)` (import `TableSort` from the package) and `filter` as `ref('')`. In JavaScript, use `ref(null)` for sort. Bindings are optional; internal state also works. `sort` has the shape `{ key: 'name', direction: 'asc' }`, using a stable header key. Clicking the sort button cycles ascending → descending → original order; it emits `update:sort`. Search emits `update:filter` with the entered text.

Search uses a trimmed, case-insensitive substring across columns defined by the headers. It matches string, number, boolean, and bigint cell fields; missing cells and objects are treated as empty. Sorting is stable, compares finite numbers numerically, and otherwise uses English natural text order (so `Item 2` precedes `Item 10`). Empty and unsupported values stay last in either direction. No custom comparator or per-column filters are provided in this release.

The view applies **filter → sort → paginate**. Sorting and filtering never reorder or trim the parent row array. Slot indices and edit/delete payloads keep their absolute source indices. Changing criteria returns to page 1; pagination totals show matching rows, while the main footer still reports the full dataset. Sort selection follows the header key during dragging and clears when that column is removed. Disable either feature to ignore its stored criteria.

Draft edits do not affect sorting or filtering until committed. After saving, a row can move or stop matching the search. Searching, sorting, or navigating cancels any editor still open; ordinary blur saves as before. All rows remain in memory: this is client-side sorting and filtering.

## TypeScript

The package includes declarations for the named component, default plugin, props, events, and slots. No separate `@types` package is needed. Use Vue 3.3+ and TypeScript 5+ with `moduleResolution: "Bundler"` or `"NodeNext"`.

```ts
import { ref } from 'vue'
import { ShapeShifterTable, type TableHeader, type TableRow, type CellUpdate } from 'vue-shapeshifter-table'

const headers = ref<TableHeader[]>([{ key: 'name', field: 'Name' }])
const rows = ref<TableRow[]>([[{ key: 'ada', field: 'Ada' }]])
function onCellUpdate(event: CellUpdate) {
  console.log(event.rowIndex, event.columnIndex, event.value)
}
```

Additional exported types include `ShapeShifterTableProps`, `TableCell`, `TableKey`, `TableFooter`, `TableMenuItem`, `TableSlots`, `TableEventPayloads`, `TableEmits`, `HeaderUpdate`, `ColumnChange`, `RowChange`, `ColumnMove`, and `ContextEvent`.

Cell fields and custom metadata are `unknown`: narrow or format them before use. Edits normally produce strings, but blurring an unchanged field preserves its original value. Short rows may have missing cells, so slot consumers should use `cell?.field`. All event/slot row indices refer to the complete dataset, including when paginated. The plugin registers the component at runtime; import the named component in typed SFCs for template inference.

Run `npm run test:types` for local Vue consumer checks. `npm test` also extracts the npm tarball and checks TypeScript and Vue consumers against its exported declarations using both Bundler and NodeNext resolution. The declarations add no JavaScript or runtime dependencies.

## Drag-and-drop columns

Enable `draggable-columns` on `ShapeShifterTable` to display drag handles. Drag a handle onto another heading to move its column to that position; the target heading is highlighted. Pointer events support mouse, touch, and pen. Moving a column also moves its cells in every row, including rows hidden by pagination.

Focus a handle and press Left or Right to move using the keyboard. Escape, pointer cancellation, or dropping outside this table cancels a drag. The existing Move left/right menu actions remain available. Reordering emits `update:headers`, `update:tableData`, and `move-column` with zero-based `{ from, to }` indices. Bind both data models to retain changes.

Dragging is off by default and adds no dependencies. This implementation does not auto-scroll the table during a drag; use the move buttons or scroll before dragging to a distant column.

## Pagination

Pagination is optional and off by default. Enable it to render a page of the supplied rows while retaining the full array in `v-model:table-data`:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:page="page"
  v-model:page-size="pageSize"
  pagination
  :page-size-options="[10, 25, 50]"
/>
```

Initialize `page` with `ref(1)` and `pageSize` with `ref(10)`. These bindings are optional: the component also maintains page state internally. `page` is one-based; `pageSize` defaults to 10. Invalid numbers fall back to 1 and 10 respectively. The current page size is always included in the selector.

Changing the page size returns to page 1. Deleting rows or replacing the dataset clamps the page to the last available page. Empty tables show page 1 of 1 with navigation disabled. Added rows are appended to the dataset without moving the current page. Cell events and slot `rowIndex` values always refer to the full dataset, not the visible page. Navigation cancels any draft still open; ordinary input blur saves edits as before.

This is client-side pagination, not server-side fetching or virtualization: all supplied rows remain in memory. No additional runtime dependencies are required.

A lightweight, editable table component for Vue 3.

Edit cells and headings, add or remove rows and columns, and move columns together
with their data. Includes customization slots, sticky headings, horizontal
scrolling, and compact spacing. Vue 3.3 or newer is required. The package is
ESM-only and includes its own CSS; no additional UI framework is required.

[Quick start](#install) · [API](#table-api) · [Examples](#examples) ·
[Development](#development) · [Demo](#demo) · [License](#license)

## Install

```bash
npm install vue-shapeshifter-table
```

Register the plugin globally:

```js
import { createApp } from 'vue'
import ShapeshifterTable from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'
import App from './App.vue'

createApp(App).use(ShapeshifterTable).mount('#app')
```

Or import the component directly:

```vue
<script setup>
import { ref } from 'vue'
import { ShapeShifterTable } from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers = ref([
  { field: 'Name', key: 'name', editable: true },
])

const rows = ref([
  [{ field: 'Maya', key: 'maya-name', editable: true }],
])
</script>

<template>
  <ShapeShifterTable v-model:headers="headers" v-model:table-data="rows" />
</template>
```

## Table API

Use `v-model:headers` and `v-model:table-data` to keep parent data synchronized with edits. The component edits local copies and emits replacement arrays; it no longer mutates the supplied header and cell objects. One-way props still display data, but parents must handle the update events to retain changes.

Headers use `{ field, key, editable }`; rows are arrays of cell objects in header order. Give headers and cells unique, stable keys. Set `editable: false` to make a heading or cell read-only. Click an editable value to edit it, then press Enter or leave the input to save; Escape discards the draft.

| Prop | Default | Purpose |
| --- | --- | --- |
| `headers`, `tableData` | `[]` | Column definitions and rows. |
| `footers` | `[]` | Footer objects whose `field` values are displayed. |
| `contextMenuColumn`, `contextMenuRow` | `[]` | Custom actions using `{ text, event }`. |
| `title`, `eyebrow` | `''` | Optional toolbar heading and label. |
| `emptyText` | `'Your table is ready'` | Empty-state heading. |
| `maxHeight` | `'34rem'` | Maximum height of the scrollable table. |
| `stickyHeader` | `true` | Keep column headings visible while scrolling. |
| `addable`, `removable` | `true` | Show built-in add and delete controls. |
| `compact` | `false` | Reduce cell spacing. |

Column menus move columns left or right together with their cells. Custom menu actions emit `context-events` with `{ event, menu_id, type }`; consumers implement those custom actions themselves.

| Event | Payload |
| --- | --- |
| `update:headers`, `update:tableData` | Replacement header or row array. |
| `header-update` | `{ key, value, editKey, columnIndex }` |
| `cell-update` | `{ key, value, editKey, rowIndex, columnIndex }` |
| `add-column`, `delete-column` | `{ header, columnIndex }` |
| `add-row`, `delete-row` | `{ row, rowIndex }` |
| `move-column` | `{ from, to }` |
| `context-events` | `{ event, menu_id, type }` |

| Slot | Slot props |
| --- | --- |
| `toolbar` | `addColumn`, `addRow` |
| `header` | `header`, `columnIndex` |
| `cell` | `cell`, `header`, `rowIndex`, `columnIndex` |
| `empty` | None |
| `footer` | `footers` |

Slot props with multiple words are exposed using camelCase names (`columnIndex`, `rowIndex`, `addColumn`, `addRow`). Custom header and cell slots replace the default editing controls. The table provides scoped styles, horizontal scrolling, and reduced-motion support.

## Examples

### Data format

Each row is an array in the same order as the headers. The `field` property is the
displayed value, `key` identifies the header or cell, and `editable` defaults to
enabled unless explicitly set to `false`. Optional `editKey` metadata is included
in edit events. Prefer plain string or number values; input edits produce strings.

```js
const headers = ref([
  { key: 'name', field: 'Name', editable: false },
  { key: 'role', field: 'Role', editable: true },
])
const rows = ref([
  [
    { key: 'maya-name', field: 'Maya', editable: false },
    { key: 'maya-role', field: 'Designer', editable: true },
  ],
])
```

Changing `rows` or `headers` in the parent updates the table. The component copies
header and cell objects before editing; nested custom metadata is not deep-cloned.

### Custom cells and toolbar

Use this template with the `headers` and `rows` refs from the quick start:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  title="Team"
  :addable="false"
>
  <template #toolbar="actions">
    <button type="button" @click="actions.addRow()">Add person</button>
  </template>
  <template #cell="{ cell }">
    <strong>{{ cell?.field }}</strong>
  </template>
  <template #empty>No team members yet.</template>
</ShapeShifterTable>
```

This cell slot displays values instead of the built-in editor. `addable` controls
the default add buttons; toolbar callbacks remain available.

### Handling changes and custom actions

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  :context-menu-row="[{ text: 'Inspect cell', event: 'inspect' }]"
  @cell-update="onCellUpdate"
  @context-events="onContextAction"
/>
```

```js
function onCellUpdate({ key, value, rowIndex, columnIndex }) {
  console.log('Edited cell', { key, value, rowIndex, columnIndex })
}

function onContextAction({ event, menu_id, type }) {
  console.log('Custom action', { event, menu_id, type })
}
```

Row context menus appear on individual cells, so their `menu_id` is the cell key.
Column context menus supply the header key. Custom actions emit events only;
implement their effects in the parent. Persistence is also the parent's
responsibility: connect updates to your API or storage if needed.

### Appearance

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  compact
  max-height="24rem"
  :sticky-header="true"
  style="--sst-accent: #047857; --sst-accent-strong: #065f46"
/>
```

The root exposes `--sst-accent`, `--sst-accent-strong`, `--sst-ink`,
`--sst-muted`, and `--sst-line` CSS variables. Some decorative colors are fixed.
Always import `vue-shapeshifter-table/style.css` in the consuming application.

### Current limits

The component renders all rows unless pagination is enabled. It does not provide virtualization,
server-side queries, validation, or persistent storage. `addable` and `removable`
control UI visibility; they are not authorization rules. Column movement remains
available when more than one column exists, even with both set to `false`.

## Development

Development requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
npm test
npm run build
npm run build:demo
npm run preview
```

`npm run build` creates the externalized, ESM-only library bundle in `dist/`. `npm run build:demo` creates the standalone demonstration site in `demo-dist/`, and `npm run preview` serves that site. The two builds keep their output separate.

`npm pack` rebuilds the library automatically before creating the package archive.

The demo imports the package's public JavaScript and CSS exports. `npm run dev`
and `npm run build:demo` first build the library automatically. After editing the
library component during a demo session, run `npm run build` again to refresh
the consumed bundle.

## Publishing

Before publishing a release:

1. Update the version and release notes.
2. Run `npm test`, `npm run build:demo`, and `npm run security:audit`.
3. Inspect the package contents with `npm pack --dry-run`.
4. Publish with `npm publish` after signing in to npm.

`prepublishOnly` runs the test suite and blocks publication when npm reports a
moderate-or-higher vulnerability. Package consumers receive no runtime
dependencies; Vue remains a peer dependency.

## Security

Report suspected vulnerabilities privately through the repository's Security
tab. See [SECURITY.md](SECURITY.md) for supported versions, reporting details,
and the component's security design.

## Demo

Run `npm run dev` to explore the product launch board with three sample projects. Try editing cells and headings, adding or deleting rows and columns, and moving columns from their action menus. The toolbar announces each completed action.

The demo uses local state: changes are discarded when you refresh the page. Build it with `npm run build:demo` and serve it with `npm run preview`.

## License

Licensed under [MIT](LICENSE). This permits commercial use, modification, and
redistribution, provided the copyright and license notices are retained. The
software is provided without warranty. See the [MIT license text](https://opensource.org/license/mit).
