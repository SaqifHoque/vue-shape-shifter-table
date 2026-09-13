<template>
  <section class="sst" :class="{ 'sst--compact': compact }">
    <header v-if="title || $slots.toolbar" class="sst__toolbar">
      <div>
        <p v-if="eyebrow" class="sst__eyebrow">{{ eyebrow }}</p>
        <h2 v-if="title" class="sst__title">{{ title }}</h2>
      </div>
      <slot name="toolbar" :add-column="addColumn" :add-row="addRow" />
    </header>

    <div v-if="filterable" class="sst__search">
      <label>Search table <input type="search" :value="localFilter" @input="changeFilter($event.target.value)" /></label>
      <button v-if="localFilter" class="sst__button sst__button--secondary" type="button" @click="changeFilter('')">Clear search</button>
      <span role="status">{{ resultCount }} of {{ localRows.length }} rows match</span>
    </div>
    <div class="sst__frame" :style="{ maxHeight }">
      <table ref="tableElement" class="sst__table">
        <thead :class="{ 'sst__head--sticky': stickyHeader }">
          <tr>
            <th v-for="(header, columnIndex) in localHeaders" :key="header.key" scope="col" :aria-sort="sortable ? sortDirection(header.key) : undefined" :data-column-index="columnIndex" :class="[header.fixed, { 'sst__drop-target': dropIndex === columnIndex }]">
              <div class="sst__cell-layout">
                <button v-if="sortable" class="sst__sort-button" type="button" :aria-label="`Sort ${header.field}`" @click="toggleSort(header.key)">{{ sortDirection(header.key) === 'ascending' ? '↑' : sortDirection(header.key) === 'descending' ? '↓' : '↕' }}</button>
                <button v-if="draggableColumns && localHeaders.length > 1" type="button" class="sst__drag-handle"
                  :aria-label="`Move ${header.field} column`" title="Drag to reorder; use arrow keys to move"
                  @pointerdown="beginDrag($event, columnIndex)" @pointermove="trackDrag" @pointerup="finishDrag"
                  @pointercancel="cancelDrag" @lostpointercapture="cancelDrag" @keydown.esc="cancelDrag"
                  @keydown.left.prevent="moveColumn(columnIndex, -1)" @keydown.right.prevent="moveColumn(columnIndex, 1)">⠿</button>
                <slot name="header" :header="header" :column-index="columnIndex">
                  <input
                    v-if="editingId === `header-${header.key}`"
                    :ref="setEditorRef"
                    class="sst__editor sst__editor--header"
                    :value="draftValue"
                    :aria-label="`Edit ${header.field || 'column'} heading`"
                    @input="updateHeaderDraft(columnIndex, $event)"
                    @keydown.enter="finishEditing"
                    @keydown.esc="cancelEditing"
                    @blur="finishHeaderEditing(columnIndex, header)"
                  />
                  <button
                    v-else-if="header.editable !== false"
                    class="sst__text-button sst__heading-button"
                    type="button"
                    :title="`Rename ${header.field || 'column'}`"
                    @click="startEditing(`header-${header.key}`, header)"
                  >{{ header.field }}</button>
                  <span v-else>{{ header.field }}</span>
                </slot>

                <details v-if="showColumnActions" class="sst__menu">
                  <summary :aria-label="`Actions for ${header.field}`">•••</summary>
                  <div class="sst__menu-panel">
                    <button type="button" :disabled="columnIndex === 0" @click="moveColumn(columnIndex, -1)">Move left</button>
                    <button type="button" :disabled="columnIndex === localHeaders.length - 1" @click="moveColumn(columnIndex, 1)">Move right</button>
                    <button v-for="item in contextMenuColumn" :key="item.event" type="button" @click="emitContext(item.event, header.key, 'column')">{{ item.text }}</button>
                    <button v-if="removable" class="sst__danger" type="button" @click="removeColumn(columnIndex)">Delete column</button>
                  </div>
                </details>
              </div>
            </th>
            <th v-if="removable && localRows.length" class="sst__action-column" scope="col"><span class="sst__sr-only">Row actions</span></th>
          </tr>
        </thead>

        <tbody>
          <tr v-if="!resultCount">
            <td class="sst__empty" :colspan="Math.max(localHeaders.length + (removable ? 1 : 0), 1)">
              <slot name="empty">
                <span class="sst__empty-icon">✦</span>
                <strong>{{ localRows.length ? 'No matching rows' : emptyText }}</strong>
                <span>{{ localRows.length ? 'Try a different search.' : 'Add a row to start shaping your table.' }}</span>
              </slot>
            </td>
          </tr>

          <tr v-for="{ row, rowIndex } in visibleRows" :key="rowKey(row, rowIndex)">
            <td v-for="(header, columnIndex) in localHeaders" :key="cellAt(row, columnIndex)?.key || `${rowIndex}-${header.key}`" :class="cellAt(row, columnIndex)?.fixed">
              <div class="sst__cell-layout">
                <slot name="cell" :cell="cellAt(row, columnIndex)" :header="header" :row-index="rowIndex" :column-index="columnIndex">
                  <input
                    v-if="editingId === cellId(rowIndex, columnIndex)"
                    :ref="setEditorRef"
                    class="sst__editor"
                    :value="draftValue"
                    :aria-label="`Edit row ${rowIndex + 1}, ${header.field}`"
                    @input="updateCellDraft(rowIndex, columnIndex, $event)"
                    @keydown.enter="finishEditing"
                    @keydown.esc="cancelEditing"
                    @blur="finishCellEditing(rowIndex, columnIndex)"
                  />
                  <button v-else-if="cellAt(row, columnIndex)?.editable !== false" class="sst__text-button" type="button" @click="startCellEditing(rowIndex, columnIndex)">{{ cellAt(row, columnIndex)?.field }}</button>
                  <span v-else>{{ cellAt(row, columnIndex)?.field }}</span>
                </slot>

                <details v-if="contextMenuRow.length" class="sst__menu sst__menu--cell">
                  <summary :aria-label="`Actions for row ${rowIndex + 1}`">•••</summary>
                  <div class="sst__menu-panel">
                    <button v-for="item in contextMenuRow" :key="item.event" type="button" @click="emitContext(item.event, cellAt(row, columnIndex)?.key, 'row')">{{ item.text }}</button>
                  </div>
                </details>
              </div>
            </td>
            <td v-if="removable" class="sst__row-action"><button type="button" :aria-label="`Delete row ${rowIndex + 1}`" @click="removeRow(rowIndex)">×</button></td>
          </tr>
        </tbody>

        <tfoot v-if="$slots.footer || footers.length">
          <tr><td :colspan="Math.max(localHeaders.length + (removable ? 1 : 0), 1)"><slot name="footer" :footers="footers">{{ footers.map((item) => item.field).join(' · ') }}</slot></td></tr>
        </tfoot>
      </table>
    </div>

    <footer class="sst__controls">
      <p>{{ localRows.length }} {{ localRows.length === 1 ? 'row' : 'rows' }} · {{ localHeaders.length }} columns</p>
      <div>
        <button v-if="addable" class="sst__button sst__button--secondary" type="button" @click="addColumn"><span aria-hidden="true">＋</span> Column</button>
        <button v-if="addable" class="sst__button sst__button--primary" type="button" :disabled="!localHeaders.length" @click="addRow"><span aria-hidden="true">＋</span> Row</button>
      </div>
    </footer>
    <span class="sst__sr-only" role="status">{{ moveAnnouncement }}</span>
    <nav v-if="pagination" class="sst__pagination" aria-label="Table pagination">
      <label>Rows per page
        <select :value="localPageSize" @change="changePageSize(Number($event.target.value))">
          <option v-for="size in pageSizes" :key="size" :value="size">{{ size }}</option>
        </select>
      </label>
      <span role="status">{{ resultCount ? pageStart + 1 : 0 }}–{{ Math.min(pageStart + localPageSize, resultCount) }} of {{ resultCount }} rows · Page {{ currentPage }} of {{ pageCount }}</span>
      <button class="sst__button sst__button--secondary" type="button" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">Previous</button>
      <button class="sst__button sst__button--secondary" type="button" :disabled="currentPage === pageCount" @click="changePage(currentPage + 1)">Next</button>
    </nav>
  </section>
</template>

<script setup>
import { computed, nextTick, ref, shallowRef, watch } from 'vue'

defineOptions({ name: 'ShapeShifterTable' })

const props = defineProps({
  headers: { type: Array, default: () => [] },
  tableData: { type: Array, default: () => [] },
  footers: { type: Array, default: () => [] },
  contextMenuColumn: { type: Array, default: () => [] },
  contextMenuRow: { type: Array, default: () => [] },
  title: { type: String, default: '' },
  eyebrow: { type: String, default: '' },
  emptyText: { type: String, default: 'Your table is ready' },
  maxHeight: { type: String, default: '34rem' },
  stickyHeader: { type: Boolean, default: true },
  addable: { type: Boolean, default: true },
  removable: { type: Boolean, default: true },
  compact: { type: Boolean, default: false },
  draggableColumns: { type: Boolean, default: false },
  pagination: { type: Boolean, default: false },
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 10 },
  pageSizeOptions: { type: Array, default: () => [10, 25, 50] },
  sortable: { type: Boolean, default: false },
  filterable: { type: Boolean, default: false },
  sort: { type: Object, default: null },
  filter: { type: String, default: '' },
})

const emit = defineEmits([
  'update:headers', 'update:tableData', 'add-column', 'add-row', 'delete-column',
  'delete-row', 'move-column', 'header-update', 'cell-update', 'context-events',
  'update:page', 'update:pageSize',
  'update:sort', 'update:filter',
])

const isObject = (value) => value !== null && typeof value === 'object' && !Array.isArray(value)
const cloneHeaders = (headers) => Array.isArray(headers)
  ? headers.filter(isObject).map((header) => ({ ...header }))
  : []
const cloneRows = (rows) => Array.isArray(rows)
  ? rows.filter(Array.isArray).map((row) => row.map((cell) => isObject(cell) ? { ...cell } : { field: cell }))
  : []
const localHeaders = ref(cloneHeaders(props.headers))
const localRows = ref(cloneRows(props.tableData))
const editingId = ref(null)
const editingTarget = ref(null)
const draftValue = ref('')
const editorRef = ref(null)
let sequence = 0
const tableElement = shallowRef(null)
const dropIndex = ref(null)
const moveAnnouncement = ref('')
let drag = null
function cancelDrag() {
  drag = null
  dropIndex.value = null
}
function beginDrag(event, index) {
  if (!props.draggableColumns || event.button !== 0 || event.isPrimary === false) return
  cancelEditing()
  drag = { index, pointerId: event.pointerId, x: event.clientX, y: event.clientY }
  event.currentTarget.setPointerCapture(event.pointerId)
}
function trackDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return
  if (Math.hypot(event.clientX - drag.x, event.clientY - drag.y) < 5) return
  const table = tableElement.value
  const hit = table?.ownerDocument.elementFromPoint(event.clientX, event.clientY)
  const heading = hit?.closest('th[data-column-index]')
  dropIndex.value = heading?.closest('table') === table ? Number(heading.dataset.columnIndex) : null
}
function finishDrag(event) {
  if (!drag || event.pointerId !== drag.pointerId) return
  trackDrag(event)
  const from = drag.index
  const to = dropIndex.value
  cancelDrag()
  if (to !== null) reorderColumn(from, to)
}
watch(() => props.draggableColumns, cancelDrag)
watch(() => props.headers, cancelDrag, { deep: true })

const positiveInteger = (value, fallback) => Number.isSafeInteger(value) && value > 0 ? value : fallback
const localPage = ref(positiveInteger(props.page, 1))
const localPageSize = ref(positiveInteger(props.pageSize, 10))
const normalizeSort = (sort) => sort && ['string', 'number'].includes(typeof sort.key) && ['asc', 'desc'].includes(sort.direction)
  ? { key: sort.key, direction: sort.direction } : null
const localSort = ref(normalizeSort(props.sort))
const localFilter = ref(typeof props.filter === 'string' ? props.filter : '')
const scalarText = (value) => ['string', 'number', 'boolean', 'bigint'].includes(typeof value) ? String(value) : ''
const collator = new Intl.Collator('en', { numeric: true, sensitivity: 'base' })
const processedRows = computed(() => {
  const query = props.filterable ? localFilter.value.trim().toLowerCase() : ''
  const rows = localRows.value.map((row, rowIndex) => ({ row, rowIndex })).filter(({ row }) =>
    !query || localHeaders.value.some((_, index) => scalarText(row[index]?.field).toLowerCase().includes(query)))
  const column = props.sortable && localSort.value ? localHeaders.value.findIndex((header) => header.key === localSort.value.key) : -1
  if (column >= 0) rows.sort((a, b) => {
    const left = a.row[column]?.field
    const right = b.row[column]?.field
    const leftText = scalarText(left)
    const rightText = scalarText(right)
    // Empty and unsupported values remain last in either direction.
    if (!leftText || !rightText) return Number(!leftText) - Number(!rightText) || a.rowIndex - b.rowIndex
    const comparison = typeof left === 'number' && typeof right === 'number' && Number.isFinite(left) && Number.isFinite(right)
      ? left - right : collator.compare(leftText, rightText)
    return comparison * (localSort.value.direction === 'asc' ? 1 : -1) || a.rowIndex - b.rowIndex
  })
  return rows
})
const resultCount = computed(() => processedRows.value.length)
const pageCount = computed(() => Math.max(1, Math.ceil(resultCount.value / localPageSize.value)))
const currentPage = computed(() => Math.min(localPage.value, pageCount.value))
const pageStart = computed(() => props.pagination ? (currentPage.value - 1) * localPageSize.value : 0)
const pageSizes = computed(() => [...new Set([
  localPageSize.value,
  ...(Array.isArray(props.pageSizeOptions) ? props.pageSizeOptions : []).filter((size) => positiveInteger(size, 0)),
])].sort((a, b) => a - b))
const visibleRows = computed(() => {
  const start = pageStart.value
  return props.pagination ? processedRows.value.slice(start, start + localPageSize.value) : processedRows.value
})

function sortDirection(key) {
  return localSort.value?.key === key ? (localSort.value.direction === 'asc' ? 'ascending' : 'descending') : 'none'
}
function changeSort(sort) {
  const next = normalizeSort(sort)
  if (next?.key === localSort.value?.key && next?.direction === localSort.value?.direction) return
  localSort.value = next
  changePage(1)
  emit('update:sort', next ? { ...next } : null)
}
function toggleSort(key) {
  changeSort(localSort.value?.key !== key ? { key, direction: 'asc' }
    : localSort.value.direction === 'asc' ? { key, direction: 'desc' } : null)
}
function changeFilter(filter) {
  const next = typeof filter === 'string' ? filter : ''
  if (next === localFilter.value) return
  localFilter.value = next
  changePage(1)
  emit('update:filter', next)
}
watch(() => props.sort, changeSort, { deep: true })
watch(() => props.filter, changeFilter)
watch([() => props.sortable, () => props.filterable], () => changePage(1))
watch(() => localHeaders.value.map((header) => header.key), (keys) => {
  if (localSort.value && !keys.includes(localSort.value.key)) changeSort(null)
})

function changePage(page) {
  cancelEditing()
  const next = Math.min(positiveInteger(page, 1), pageCount.value)
  if (localPage.value !== next) {
    localPage.value = next
    emit('update:page', next)
  }
}
function changePageSize(size) {
  cancelEditing()
  const next = positiveInteger(size, 10)
  if (localPageSize.value !== next) {
    localPageSize.value = next
    emit('update:pageSize', next)
    changePage(1)
  }
}
watch(() => props.page, (page) => changePage(page))
watch(() => props.pageSize, (size) => changePageSize(size))
watch([pageCount, () => props.pagination], () => {
  if (props.pagination && localPage.value > pageCount.value) changePage(pageCount.value)
}, { immediate: true })
watch(() => props.pagination, () => cancelEditing())

watch(() => props.headers, (headers) => { cancelEditing(); localHeaders.value = cloneHeaders(headers) }, { deep: true })
watch(() => props.tableData, (rows) => { cancelEditing(); localRows.value = cloneRows(rows) }, { deep: true })

const showColumnActions = computed(() => props.removable || props.contextMenuColumn.length > 0 || localHeaders.value.length > 1)
const cellAt = (row, columnIndex) => row[columnIndex]
const cellId = (rowIndex, columnIndex) => `cell-${rowIndex}-${columnIndex}`
const rowKey = (row, rowIndex) => row[0]?.rowKey || row[0]?.key || `row-${rowIndex}`
const setEditorRef = (element) => { if (element) editorRef.value = element }
const nextKey = (prefix) => `${prefix}-${Date.now().toString(36)}-${sequence++}`

function publish() {
  emit('update:headers', cloneHeaders(localHeaders.value))
  emit('update:tableData', cloneRows(localRows.value))
}

function startEditing(id, target) {
  editingId.value = id
  editingTarget.value = target
  draftValue.value = target?.field
  nextTick(() => {
    editorRef.value?.focus()
    editorRef.value?.select()
  })
}

function startCellEditing(rowIndex, columnIndex) {
  const row = localRows.value[rowIndex]
  row[columnIndex] ??= { field: '', key: nextKey('cell'), editable: true }
  startEditing(cellId(rowIndex, columnIndex), row[columnIndex])
}

function finishEditing() { editorRef.value?.blur() }
function cancelEditing() {
  editingId.value = null
  editingTarget.value = null
}
function updateHeaderDraft(columnIndex, event) { draftValue.value = event.target.value }
function finishHeaderEditing(columnIndex, header) {
  if (editingId.value !== `header-${header.key}`) return
  editingId.value = null
  editingTarget.value = null
  header.field = draftValue.value
  publish()
  const payload = { key: header.key, value: header.field, editKey: header.editKey, columnIndex }
  emit('header-update', payload)
}
function updateCellDraft(rowIndex, columnIndex, event) { draftValue.value = event.target.value }
function finishCellEditing(rowIndex, columnIndex) {
  if (editingId.value !== cellId(rowIndex, columnIndex)) return
  editingId.value = null
  editingTarget.value = null
  const cell = localRows.value[rowIndex][columnIndex]
  cell.field = draftValue.value
  publish()
  emit('cell-update', { key: cell.key, value: cell.field, editKey: cell.editKey, rowIndex, columnIndex })
}
function addColumn() {
  cancelDrag()
  const columnIndex = localHeaders.value.length
  const header = { field: `Column ${columnIndex + 1}`, key: nextKey('column'), editable: true }
  localHeaders.value.push(header)
  localRows.value.forEach((row, rowIndex) => { row[columnIndex] = { field: '', key: nextKey(`cell-${rowIndex}`), editable: true } })
  publish()
  emit('add-column', { header, columnIndex })
}
function addRow() {
  if (!localHeaders.value.length) return
  const rowIndex = localRows.value.length
  const row = localHeaders.value.map((header, columnIndex) => ({ field: '', key: nextKey(`cell-${rowIndex}-${columnIndex}`), columnKey: header.key, editable: true }))
  localRows.value.push(row)
  publish()
  emit('add-row', { row, rowIndex })
}
function removeColumn(columnIndex) {
  cancelDrag()
  const [header] = localHeaders.value.splice(columnIndex, 1)
  localRows.value.forEach((row) => row.splice(columnIndex, 1))
  publish()
  emit('delete-column', { header, columnIndex })
}
function removeRow(rowIndex) {
  const [row] = localRows.value.splice(rowIndex, 1)
  publish()
  emit('delete-row', { row, rowIndex })
}
function moveColumn(columnIndex, direction) {
  reorderColumn(columnIndex, columnIndex + direction)
}
function reorderColumn(columnIndex, destination) {
  cancelDrag()
  if (!Number.isInteger(columnIndex) || !Number.isInteger(destination) || columnIndex < 0 || columnIndex >= localHeaders.value.length || destination < 0 || destination >= localHeaders.value.length || destination === columnIndex) return
  cancelEditing()
  const columnCount = localHeaders.value.length
  const [header] = localHeaders.value.splice(columnIndex, 1)
  localHeaders.value.splice(destination, 0, header)
  localRows.value.forEach((row) => {
    // Preserve empty column positions when consumers supply short rows.
    while (row.length < columnCount) row.push(undefined)
    const [cell] = row.splice(columnIndex, 1)
    row.splice(destination, 0, cell)
  })
  publish()
  moveAnnouncement.value = `${header.field} moved to column ${destination + 1}`
  emit('move-column', { from: columnIndex, to: destination })
}
function emitContext(event, menuId, type) { emit('context-events', { event, menu_id: menuId, type }) }
</script>

<style scoped>
.sst__search { display: flex; flex-wrap: wrap; align-items: center; gap: .75rem; padding: 1rem; border-bottom: 1px solid var(--sst-line); }
.sst__search label { display: flex; flex-wrap: wrap; align-items: center; gap: .5rem; }
.sst__search input { min-width: 0; max-width: 100%; padding: .5rem; border: 1px solid var(--sst-line); border-radius: .5rem; font: inherit; }
.sst__search span { font-size: .85rem; }
.sst__sort-button { min-width: 2rem; min-height: 2rem; border: 0; border-radius: .35rem; background: transparent; color: inherit; cursor: pointer; }
.sst__sort-button:focus-visible { outline: 2px solid var(--sst-accent); }
.sst__drag-handle { touch-action: none; cursor: grab; border: 0; border-radius: .35rem; background: transparent; color: inherit; min-width: 2rem; min-height: 2rem; font-size: 1.25rem; }
.sst__drag-handle:active { cursor: grabbing; }
.sst__drag-handle:focus-visible { outline: 2px solid var(--sst-accent); }
.sst thead th.sst__drop-target { box-shadow: inset 0 0 0 2px var(--sst-accent); }
.sst__pagination { display: flex; align-items: center; flex-wrap: wrap; gap: .75rem; padding: 1rem; border-top: 1px solid var(--sst-line); font-size: .85rem; }
.sst__pagination label { display: flex; align-items: center; gap: .5rem; }
.sst__pagination select { padding: .5rem; border: 1px solid var(--sst-line); border-radius: .5rem; background: white; color: inherit; font: inherit; }
.sst { --sst-accent: #7c3aed; --sst-accent-strong: #5b21b6; --sst-ink: #172033; --sst-muted: #6b7280; --sst-line: #e7e5ee; width: 100%; overflow: hidden; color: var(--sst-ink); background: rgba(255,255,255,.96); border: 1px solid rgba(124,58,237,.14); border-radius: 1.25rem; box-shadow: 0 1.5rem 4rem rgba(37,28,70,.12); font-family: Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; }
.sst *, .sst *::before, .sst *::after { box-sizing: border-box; }
.sst__toolbar, .sst__controls { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: 1.25rem 1.5rem; }
.sst__toolbar { background: linear-gradient(135deg,#faf8ff 0%,#f0f9ff 100%); border-bottom: 1px solid var(--sst-line); }
.sst__eyebrow { margin: 0 0 .25rem; color: var(--sst-accent); font-size: .7rem; font-weight: 800; letter-spacing: .14em; text-transform: uppercase; }
.sst__title { margin: 0; font-size: clamp(1.1rem,2vw,1.45rem); letter-spacing: -.025em; }
.sst__frame { width: 100%; overflow: auto; scrollbar-color: #c4b5fd transparent; }
.sst__table { width: 100%; min-width: 42rem; border-spacing: 0; border-collapse: separate; table-layout: auto; }
.sst th, .sst td { min-width: 10rem; padding: .9rem 1rem; text-align: left; border-right: 1px solid var(--sst-line); border-bottom: 1px solid var(--sst-line); }
.sst th:last-child, .sst td:last-child { border-right: 0; } .sst tbody tr:last-child td { border-bottom: 0; }
.sst thead th { color: #4c1d95; background: #f7f4ff; font-size: .78rem; font-weight: 800; letter-spacing: .045em; text-transform: uppercase; }
.sst__head--sticky th { position: sticky; top: 0; z-index: 4; }
.sst tbody tr { transition: background-color .18s ease; } .sst tbody tr:hover { background: #fafaff; }
.sst__cell-layout { display: flex; min-height: 2rem; align-items: center; justify-content: space-between; gap: .6rem; }
.sst__text-button { width: 100%; padding: .25rem 0; overflow: hidden; color: inherit; background: transparent; border: 0; font: inherit; text-align: left; text-overflow: ellipsis; white-space: nowrap; cursor: text; }
.sst__heading-button { color: inherit; font-weight: inherit; text-transform: inherit; letter-spacing: inherit; }
.sst__editor { width: 100%; min-width: 5rem; padding: .52rem .65rem; color: var(--sst-ink); background: white; border: 1px solid var(--sst-accent); border-radius: .55rem; outline: 3px solid rgba(124,58,237,.12); font: inherit; }
.sst__editor--header { font-weight: 700; }
.sst__menu { position: relative; flex: 0 0 auto; } .sst__menu summary { display: grid; width: 1.8rem; height: 1.8rem; place-items: center; color: var(--sst-muted); border-radius: .45rem; cursor: pointer; list-style: none; letter-spacing: .05em; }
.sst__menu summary::-webkit-details-marker { display: none; } .sst__menu summary:hover { color: var(--sst-accent); background: #ede9fe; }
.sst__menu-panel { position: absolute; top: calc(100% + .35rem); right: 0; z-index: 10; display: grid; min-width: 9.5rem; padding: .35rem; background: white; border: 1px solid var(--sst-line); border-radius: .7rem; box-shadow: 0 .8rem 2rem rgba(23,32,51,.16); }
.sst__menu-panel button { padding: .6rem .7rem; color: var(--sst-ink); background: transparent; border: 0; border-radius: .45rem; font: inherit; font-size: .8rem; text-align: left; cursor: pointer; }
.sst__menu-panel button:hover:not(:disabled) { color: var(--sst-accent-strong); background: #f5f3ff; } .sst__menu-panel button:disabled { opacity: .4; cursor: not-allowed; } .sst__menu-panel .sst__danger { color: #be123c; }
.sst__menu--cell { opacity: 0; transition: opacity .18s; } .sst td:hover .sst__menu--cell, .sst__menu--cell:focus-within { opacity: 1; }
.sst__action-column, .sst__row-action { width: 3.5rem; min-width: 3.5rem !important; text-align: center !important; }
.sst__row-action button { display: grid; width: 2rem; height: 2rem; margin: auto; place-items: center; color: #9f1239; background: #fff1f2; border: 0; border-radius: 50%; font-size: 1.2rem; cursor: pointer; }
.sst__row-action button:hover { color: white; background: #e11d48; }
.sst__empty { height: 15rem; color: var(--sst-muted); text-align: center !important; } .sst__empty > * { display: block; margin: .3rem auto; } .sst__empty strong { color: var(--sst-ink); font-size: 1rem; } .sst__empty-icon { color: var(--sst-accent); font-size: 2rem; }
.sst tfoot td { color: var(--sst-muted); background: #fafafa; font-size: .82rem; }
.sst__controls { border-top: 1px solid var(--sst-line); background: #fff; } .sst__controls p { margin: 0; color: var(--sst-muted); font-size: .82rem; } .sst__controls > div { display: flex; gap: .6rem; }
.sst__button { display: inline-flex; align-items: center; gap: .35rem; padding: .62rem .9rem; border: 1px solid transparent; border-radius: .65rem; font: inherit; font-size: .84rem; font-weight: 750; cursor: pointer; transition: transform .15s ease,box-shadow .15s ease; }
.sst__button:hover:not(:disabled) { transform: translateY(-1px); box-shadow: 0 .5rem 1rem rgba(91,33,182,.16); } .sst__button:disabled { opacity: .45; cursor: not-allowed; }
.sst__button--primary { color: white; background: linear-gradient(135deg,var(--sst-accent),#2563eb); } .sst__button--secondary { color: var(--sst-accent-strong); background: #f5f3ff; border-color: #ddd6fe; }
.sst--compact th, .sst--compact td { padding: .55rem .7rem; }
.sst__sr-only { position: absolute; width: 1px; height: 1px; padding: 0; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
@media (max-width: 640px) { .sst { border-radius: .9rem; } .sst__toolbar, .sst__controls { align-items: flex-start; padding: 1rem; } .sst__controls { flex-direction: column; } .sst__controls > div { width: 100%; } .sst__button { flex: 1; justify-content: center; } }
@media (prefers-reduced-motion: reduce) { .sst *, .sst *::before, .sst *::after { scroll-behavior: auto !important; transition: none !important; } }
</style>
