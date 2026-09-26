# Vue Shapeshifter Table

A responsive, editable table for Vue 3.

Edit cells, reorder columns, sort, search, and paginate your data. Includes TypeScript declarations and customization slots. Requires Vue 3.3+; no additional UI framework or runtime dependencies.

![Vue Shapeshifter Table running locally with editing, search, sorting, and pagination](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/overview.png)

[Quick start](#quick-start) · [Feature examples](#feature-examples) · [API](#table-api) · [Local demo](#demo)

## Install

```bash
npm install vue-shapeshifter-table
```

## Quick start

Copy this into a Vue single-file component. Always import the stylesheet.

```vue
<script setup>
import { ref } from 'vue'
import { ShapeShifterTable } from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers = ref([
  { key: 'project', field: 'Project' },
  { key: 'owner', field: 'Owner' },
  { key: 'status', field: 'Status' },
])
const rows = ref([
  [
    { key: 'aurora-project', field: 'Aurora' },
    { key: 'aurora-owner', field: 'Maya Chen' },
    { key: 'aurora-status', field: 'Ready' },
  ],
  [
    { key: 'northstar-project', field: 'Northstar' },
    { key: 'northstar-owner', field: 'Owen Blake' },
    { key: 'northstar-status', field: 'In review' },
  ],
  [
    { key: 'pulse-project', field: 'Pulse' },
    { key: 'pulse-owner', field: 'Amara Wells' },
    { key: 'pulse-status', field: 'Exploring' },
  ],
])
</script>

<template>
  <ShapeShifterTable
    v-model:headers="headers"
    v-model:table-data="rows"
    title="Projects"
  />
</template>
```

Each row is an array of cells in header order. `field` is the displayed value; `key` is a stable identifier. Bind **both** models to retain edits and keep cells aligned when columns move. Headers and cells are editable unless `editable: false`.

For global registration, use the default plugin instead:

```js
import { createApp } from 'vue'
import ShapeshifterTable from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'
import App from './App.vue'

createApp(App).use(ShapeshifterTable).mount('#app')
```

## Feature examples

Each example below reuses `headers`, `rows`, and the imports from the quick start. Replace its `<ShapeShifterTable>` with the example shown; add any extra JavaScript to `<script setup>`. Features can be combined. Screenshots show the local demo with sample data.

- [Inline editing](#inline-editing)
- [Pagination](#pagination)
- [Drag-and-drop columns](#drag-and-drop-columns)
- [Sorting](#sorting)
- [Search](#search)
- [Custom sorting and column filters](#custom-sorting-and-column-filters)
- [Edit validation](#edit-validation)
- [Combining features](#combining-features)
- [Saved column order](#saved-column-order)
- [Automatic persistence](#automatic-persistence)
- [Resizable columns](#resizable-columns)
- [Row virtualization](#row-virtualization)
- [Server-side data](#server-side-data)
- [Adding and removing rows and columns](#adding-and-removing-rows-and-columns)
- [Custom cells and toolbar](#custom-cells-and-toolbar)
- [Custom actions](#custom-actions)
- [Appearance](#appearance)
- [TypeScript](#typescript)

### Inline editing

Click a cell or heading to edit. Enter or blur saves; Escape cancels.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  @cell-update="onCellUpdate"
/>
```

```js
function onCellUpdate({ rowIndex, columnIndex, value }) {
  console.log('Updated cell:', rowIndex, columnIndex, value)
}

// Make one heading and one cell read-only.
headers.value[0].editable = false
rows.value[0][0].editable = false
```

Setting `editable: false` on a header locks its label, not every cell in that column. Set it on the individual cells too when needed. Changed values are strings; convert or validate them in your application. Event indices always refer to the full source dataset, including when sorted, searched, or paginated.

![Editing a project name in the local demo](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/inline-editing.png)

### Pagination

Display two rows at a time, with page navigation and a page-size selector:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  pagination
  :page-size="2"
  :page-size-options="[2, 10, 25]"
/>
```

To control the page from your application, add these refs:

```js
const page = ref(1)
const pageSize = ref(2)
```

Then use `v-model:page` and `v-model:page-size`:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:page="page"
  v-model:page-size="pageSize"
  pagination
  :page-size-options="[2, 10, 25]"
/>
```

Pages start at 1. Changing page size resets to page 1; removing rows clamps the current page. This is client-side pagination: pass the complete dataset. Navigation cancels unsaved edits, and added rows appear at the end of the dataset.

![Page 2 shows the third project with the first two rows on the previous page](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/pagination.png)

### Row virtualization

Enable `virtualized` for large local datasets. Only the visible window plus `overscan` rows is mounted; spacer rows preserve the full scroll range.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  virtualized
  :row-height="48"
  :virtual-viewport-height="480"
  :overscan="3"
  max-height="480px"
/>
```

Use a fixed body-row height and set `virtual-viewport-height` to the frame's visible height. Sorting, filters, editing, deletion, slots, pagination, and server-provided pages retain source indices. Virtualization reduces DOM work while keeping supplied rows in memory.

### Server-side data

Set `server-side` when an API owns filtering, sorting, and pagination. The table renders the supplied page unchanged and emits `query-change` initially and whenever query controls change.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="currentPageRows"
  server-side pagination sortable filterable column-filterable
  :page="page"
  :page-size="25"
  :total-rows="totalRows"
  :row-offset="(page - 1) * 25"
  :loading="loading"
  @query-change="loadRows"
/>
```

`query-change` contains `{ page, pageSize, sort, filter, columnFilters }`. `totalRows` determines page count; `rowOffset` makes slots and edit/add/delete events absolute. When omitted, the offset follows the current page. Loading sets `aria-busy` and announces status. Networking, caching, cancellation, and errors stay in the application.

### Drag-and-drop columns

Enable drag handles and move a column by dropping its handle onto another heading:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  draggable-columns
  @move-column="onColumnMove"
/>
```

```js
function onColumnMove({ from, to }) {
  console.log('Moved column:', from, 'to', to)
}
```

Mouse, touch, and pen are supported. For keyboard control, focus a handle and press Left or Right. Escape or dropping outside the table cancels a drag. The heading menu also has **Move left** and **Move right** actions.

Cells move with their columns across **all** rows, including hidden pages. Indices in `move-column` are zero-based. Holding a dragged handle near a horizontal or vertical table edge auto-scrolls the frame so distant columns remain reachable.

![Dragging the Project column onto Status highlights the drop target](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/drag-and-drop.png)

### Resizable columns

Add `resizable-columns` for pointer and keyboard resize handles. Widths are numeric `width` values on headers and flow through `update:headers`; `column-resize` reports `{ key, width, columnIndex }`. Focus a handle and press Left or Right for 10-pixel steps.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  resizable-columns
  :minimum-column-width="120"
/>
```

The minimum width defaults to 96 pixels. Combine this with a `persistence-key` to restore widths automatically.

### Sorting

Add `sortable` to enable a sort button on each heading:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  sortable
/>
```

Click to cycle ascending → descending → original order. To start with a selected sort, add a ref:

```js
const sort = ref({ key: 'project', direction: 'asc' })
```

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:sort="sort"
  sortable
/>
```

The key identifies a header. Sorting is stable and does not reorder the source array. Finite numbers sort numerically; other supported values use English natural text order. Empty or unsupported values stay last. A selected sort follows its column when dragged and clears when the column is removed.

![Projects sorted in descending order with Pulse first](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/sorting.png)

### Custom sorting and column filters

Pass a global `comparator(left, right, context)` or add `sortComparator` to one header. A header comparator takes priority. Return a finite number to control ordering or `NaN` to use the built-in comparison.

Enable `column-filterable` for one search field per header. Bind `v-model:column-filters` to state such as `[{ key: 'status', value: 'ready' }]`. Add `filterPredicate(value, query, context)` to a header for custom matching; other columns use case-insensitive substring matching.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:column-filters="columnFilters"
  sortable
  column-filterable
  :comparator="compareValues"
/>
```

Global search and column filters are combined before sorting and pagination.

### Search

Add `filterable` for a search field across all defined columns:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  filterable
/>
```

To bind the search text to your application, add `const filter = ref('')` and use:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  v-model:filter="filter"
  filterable
/>
```

Search is trimmed and case-insensitive. It matches substrings in string, number, boolean, and bigint fields; objects and missing cells count as empty. Searching does not remove rows from your source array. Changing the search returns to page 1.

![Searching for Maya shows only the matching Aurora project](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/search.png)

### Edit validation

Pass `validator(value, context)` for table-wide validation, or place a `validator` on a cell or header. The most specific validator wins. Return `true` or `undefined` to accept; return a message or `false` to keep the editor open, announce the error, and emit `validation-error`.

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  :validator="value => String(value).trim() ? true : 'A value is required.'"
  @validation-error="({ message }) => console.warn(message)"
/>
```

### Combining features

Editing, dragging, sorting, search, and pagination work together:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  title="Projects"
  sortable
  filterable
  column-filterable
  draggable-columns
  resizable-columns
  pagination
  :page-size="2"
  :page-size-options="[2, 10, 25]"
/>
```

The view applies **filter → sort → paginate**. Slot indices and edit/delete events still refer to the original dataset. Draft edits affect the view only after saving; a saved row can move or stop matching a search. Changing search, sort, or page cancels an open editor.

### Saved column order

Save the ordered header keys, then use `applyColumnOrder` to restore them after loading the matching table data. Add this to the quick start's script, replacing its Vue import with `{ onMounted, ref }`:

```js
import { applyColumnOrder } from 'vue-shapeshifter-table'

const storageKey = 'projects:column-order:v1'
const defaultOrder = headers.value.map(header => header.key)

function restoreOrder(order) {
  const restored = applyColumnOrder(headers.value, rows.value, order)
  headers.value = restored.headers
  rows.value = restored.rows
}

function saveOrder() {
  try {
    localStorage.setItem(storageKey, JSON.stringify(headers.value.map(h => h.key)))
  } catch {
    // Storage can be unavailable or full; the table still works.
  }
}

function resetOrder() {
  restoreOrder(defaultOrder)
  try {
    localStorage.removeItem(storageKey)
  } catch {
    // Order resets for this session even if storage is unavailable.
  }
}

onMounted(() => {
  try {
    restoreOrder(JSON.parse(localStorage.getItem(storageKey) ?? 'null'))
  } catch {
    // Keep the current order if stored JSON is invalid or storage is unavailable.
  }
})
```

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  draggable-columns
/>
<button type="button" @click="saveOrder">Save column order</button>
<button type="button" @click="resetOrder">Reset column order</button>
```

For asynchronous data, restore after fetching the rows and headers. `onMounted` keeps browser storage out of server-side rendering. Only column keys are saved; row data stays in your application.

`applyColumnOrder` returns new arrays and shallow copies of headers/cells without mutating inputs. Unknown, duplicate, or invalid saved keys are ignored; new columns are appended in schema order. Header keys must be unique strings or finite numbers (`0` and `'0'` are distinct). Non-array preferences leave the order unchanged. Short rows preserve empty positions, extra cells are retained, and nested metadata remains shared.

![Saved column order restored after a reload, with Owner before Status and Project](https://cdn.jsdelivr.net/npm/vue-shapeshifter-table@1.2.0/docs/images/saved-column-order.png)

### Automatic persistence

Set `persistence-key` to automatically restore and save column order and widths, sorting, filters, page, and page size in `localStorage`. Storage access begins after mount, so server-side rendering remains safe.

```vue
<ShapeShifterTable
  ref="table"
  v-model:headers="headers"
  v-model:table-data="rows"
  persistence-key="projects-table:v1"
  resizable-columns draggable-columns sortable filterable
  @persistence-error="({ operation, error }) => console.warn(operation, error)"
/>
```

Rows are excluded by default. Add `persist-table-data` only when storing table values is appropriate. Supply `persistence-storage` with `getItem`, `setItem`, and `removeItem` methods to use another synchronous store. A component ref exposes `clearPersistence()`. Storage and malformed-data failures emit `persistence-error` without breaking the table.

### Adding and removing rows and columns

The default table includes **+ Row**, **+ Column**, row delete buttons, and a column menu with **Delete column**. Listen for changes if your application needs to respond:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  @add-row="({ rowIndex }) => console.log('Added row', rowIndex)"
  @delete-row="({ rowIndex }) => console.log('Deleted row', rowIndex)"
  @add-column="({ columnIndex }) => console.log('Added column', columnIndex)"
  @delete-column="({ columnIndex }) => console.log('Deleted column', columnIndex)"
/>
```

Hide the built-in add/delete controls with `:addable="false" :removable="false"`. This does not disable editing or column movement. At least one column is needed to add a row.

### Custom cells and toolbar

Slots let you provide your own cell display, toolbar, empty state, and footer:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  title="Projects"
  :addable="false"
>
  <template #toolbar="{ addRow }">
    <button type="button" @click="addRow">Add project</button>
  </template>
  <template #cell="{ cell, header }">
    <strong v-if="header.key === 'status'">{{ cell?.field }}</strong>
    <span v-else>{{ cell?.field }}</span>
  </template>
  <template #empty>No projects yet.</template>
  <template #footer>{{ rows.length }} projects in total</template>
</ShapeShifterTable>
```

Custom `cell` and `header` slots replace their default editing controls. Short rows can have missing cells, so use `cell?.field`. The toolbar callbacks remain available when the built-in add buttons are hidden.

### Custom actions

Add menu items and handle their events in your application:

```vue
<ShapeShifterTable
  v-model:headers="headers"
  v-model:table-data="rows"
  :context-menu-row="[{ text: 'Inspect cell', event: 'inspect' }]"
  :context-menu-column="[{ text: 'Inspect column', event: 'inspect-column' }]"
  @context-events="onContextAction"
/>
```

```js
function onContextAction({ event, menu_id, type }) {
  console.log(event, menu_id, type)
}
```

Row context menus appear on individual cells; their `menu_id` is the cell key. Column actions receive the header key. These actions emit events; your handler implements the behavior.

### Appearance

Use compact spacing, a scrollable height, sticky headings, and accent colors:

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

The table scrolls horizontally on smaller screens. Available CSS variables are `--sst-accent`, `--sst-accent-strong`, `--sst-ink`, `--sst-muted`, and `--sst-line`. Some decorative colors are fixed. Always import `vue-shapeshifter-table/style.css`.

### TypeScript

Declarations are included; no separate `@types` package is needed. In a `<script setup lang="ts">`, use typed refs:

```ts
import { ref } from 'vue'
import {
  ShapeShifterTable,
  type TableHeader,
  type TableRow,
  type TableSort,
  type CellUpdate,
} from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers = ref<TableHeader[]>([{ key: 'name', field: 'Name' }])
const rows = ref<TableRow[]>([[{ key: 'ada-name', field: 'Ada' }]])
const sort = ref<TableSort | null>(null)

function onCellUpdate(event: CellUpdate) {
  console.log(event.rowIndex, event.columnIndex, event.value)
}
```

Use TypeScript 5+ with `moduleResolution: "Bundler"` or `"NodeNext"`. Import the named component for template inference. Cell fields and custom metadata are `unknown`; narrow them before use. Props, events, slots, queries, comparators, validators, persistence, and `applyColumnOrder` are typed.

## Table API

### Props

| Prop | Default | Purpose |
| --- | --- | --- |
| `headers`, `tableData` | `[]` | Column definitions and rows; bind both with `v-model`. |
| `sortable`, `filterable` | `false` | Enable sort buttons and global search. |
| `columnFilterable` | `false` | Enable per-column search fields. |
| `columnFilters` | `[]` | `{ key, value }` filters; supports `v-model:column-filters`. |
| `comparator`, `validator` | `null` | Global custom sorting and edit validation callbacks. |
| `sort` | `null` | `{ key, direction: 'asc' \| 'desc' }`; supports `v-model:sort`. |
| `filter` | `''` | Search text; supports `v-model:filter`. |
| `draggableColumns` | `false` | Enable pointer and keyboard drag handles with edge auto-scroll. |
| `resizableColumns` | `false` | Enable pointer and keyboard column resizing. |
| `minimumColumnWidth` | `96` | Resize floor in pixels. |
| `pagination` | `false` | Enable client-side pagination. |
| `page` | `1` | One-based page; supports `v-model:page`. |
| `pageSize` | `10` | Rows per page; supports `v-model:page-size`. |
| `pageSizeOptions` | `[10, 25, 50]` | Page-size choices; the current size is always included. |
| `serverSide` | `false` | Emit queries and render API-supplied rows unchanged. |
| `totalRows`, `rowOffset` | inferred | Remote total and absolute index offset. |
| `loading` | `false` | Mark the table busy and show loading status. |
| `virtualized` | `false` | Render a fixed-height row window. |
| `rowHeight`, `virtualViewportHeight`, `overscan` | `48`, `480`, `3` | Virtual-window dimensions. |
| `persistenceKey` | `''` | Automatically restore and save table preferences. |
| `persistenceStorage` | `localStorage` | Optional synchronous storage adapter. |
| `persistTableData` | `false` | Include row values in persisted state. |
| `footers` | `[]` | Footer objects with displayed `field` values. |
| `contextMenuColumn`, `contextMenuRow` | `[]` | Custom menu items: `{ text, event }`. |
| `title`, `eyebrow` | `''` | Optional toolbar heading and label. |
| `emptyText` | `'Your table is ready'` | Empty-state heading. |
| `maxHeight` | `'34rem'` | Maximum height of the scrollable table. |
| `stickyHeader` | `true` | Keep column headings visible while scrolling. |
| `addable`, `removable` | `true` | Show built-in add and delete controls. |
| `compact` | `false` | Reduce cell spacing. |

### Events

| Event | Payload |
| --- | --- |
| `update:headers`, `update:tableData` | Replacement header or row array. |
| `update:sort` | `{ key, direction: 'asc' \| 'desc' }` or `null`. |
| `update:filter` | Search string. |
| `update:columnFilters` | Array of `{ key, value }` filters. |
| `update:page`, `update:pageSize` | Page number or page size. |
| `header-update` | `{ key, value, editKey, columnIndex }` |
| `cell-update` | `{ key, value, editKey, rowIndex, columnIndex }` |
| `add-column`, `delete-column` | `{ header, columnIndex }` |
| `add-row`, `delete-row` | `{ row, rowIndex }` |
| `move-column` | `{ from, to }` |
| `context-events` | `{ event, menu_id, type }` |
| `validation-error` | Validation context with `value` and `message`. |
| `query-change` | `{ page, pageSize, sort, filter, columnFilters }` |
| `column-resize` | `{ key, width, columnIndex }` |
| `persistence-error` | `{ operation, error }` |

### Slots

| Slot | Slot props |
| --- | --- |
| `toolbar` | `addColumn`, `addRow` |
| `header` | `header`, `columnIndex` |
| `cell` | `cell`, `header`, `rowIndex`, `columnIndex` |
| `empty` | None |
| `footer` | `footers` |

Slot props use camelCase. All row indices refer to the full source dataset.

### Data and behavior

Use unique, stable keys for headers and cells. The table emits replacement arrays and shallow copies rather than mutating your supplied objects; nested metadata remains shared. One-way props display data, but you must handle updates to retain changes.

Pagination, dragging, resizing, sorting, filtering, virtualization, server mode, validation, and persistence are opt-in. `addable` and `removable` control UI visibility, not authorization. Virtualized rows require the configured fixed height. Server mode emits query state but leaves networking to the application. Persistence is synchronous and excludes row values unless explicitly enabled. The package is ESM-only.

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

The `.github/workflows/publish.yml` workflow publishes a new stable version after it reaches `main`, or can be retried from **Actions → Publish npm package → Run workflow**. It uses npm trusted publishing with GitHub OIDC, verifies the version and lockfile, and runs tests, the demo build, audit, and package inspection before publishing.

For each release, update `package.json`, `package-lock.json`, and `CHANGELOG.md`. Already-published versions are skipped; registry and verification failures stop the workflow.

For a manual fallback:

1. Update the version and release notes.
2. Run `npm test`, `npm run build:demo`, and `npm run security:audit`.
3. Inspect the package contents with `npm pack --dry-run`.
4. Publish with `npm publish` after signing in to npm.

`prepublishOnly` runs the test suite and blocks publication when npm reports a moderate-or-higher vulnerability. Package consumers receive no runtime dependencies; Vue remains a peer dependency.

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
