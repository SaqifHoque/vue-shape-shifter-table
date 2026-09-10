# Vue Shapeshifter Table

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
| `toolbar` | `add-column`, `add-row` |
| `header` | `header`, `column-index` |
| `cell` | `cell`, `header`, `row-index`, `column-index` |
| `empty` | None |
| `footer` | `footers` |

Slot props with multiple words are exposed using kebab-case names (`column-index`, `row-index`, `add-column`, `add-row`). Custom header and cell slots replace the default editing controls. The table provides scoped styles, horizontal scrolling, and reduced-motion support.

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
    <button type="button" @click="actions['add-row']()">Add person</button>
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
sorting, filtering, validation, or persistent storage. `addable` and `removable`
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
