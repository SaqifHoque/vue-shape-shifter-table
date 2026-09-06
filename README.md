# Vue Shapeshifter Table

A lightweight, editable table component for Vue 3.

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

## Demo

Run `npm run dev` to explore the product launch board with three sample projects. Try editing cells and headings, adding or deleting rows and columns, and moving columns from their action menus. The toolbar announces each completed action.

The demo uses local state: changes are discarded when you refresh the page. Build it with `npm run build:demo` and serve it with `npm run preview`.

## License

MIT
