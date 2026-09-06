<template>
  <section class="sst" :class="{ 'sst--compact': compact }">
    <header v-if="title || $slots.toolbar" class="sst__toolbar">
      <div>
        <p v-if="eyebrow" class="sst__eyebrow">{{ eyebrow }}</p>
        <h2 v-if="title" class="sst__title">{{ title }}</h2>
      </div>
      <slot name="toolbar" :add-column="addColumn" :add-row="addRow" />
    </header>

    <div class="sst__frame" :style="{ maxHeight }">
      <table class="sst__table">
        <thead :class="{ 'sst__head--sticky': stickyHeader }">
          <tr>
            <th v-for="(header, columnIndex) in localHeaders" :key="header.key" scope="col" :class="header.fixed">
              <div class="sst__cell-layout">
                <slot name="header" :header="header" :column-index="columnIndex">
                  <input
                    v-if="editingId === `header-${header.key}`"
                    :ref="setEditorRef"
                    class="sst__editor sst__editor--header"
                    :value="header.field"
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
          <tr v-if="!localRows.length">
            <td class="sst__empty" :colspan="Math.max(localHeaders.length + (removable ? 1 : 0), 1)">
              <slot name="empty">
                <span class="sst__empty-icon">✦</span>
                <strong>{{ emptyText }}</strong>
                <span>Add a row to start shaping your table.</span>
              </slot>
            </td>
          </tr>

          <tr v-for="(row, rowIndex) in localRows" :key="rowKey(row, rowIndex)">
            <td v-for="(header, columnIndex) in localHeaders" :key="cellAt(row, columnIndex)?.key || `${rowIndex}-${header.key}`" :class="cellAt(row, columnIndex)?.fixed">
              <div class="sst__cell-layout">
                <slot name="cell" :cell="cellAt(row, columnIndex)" :header="header" :row-index="rowIndex" :column-index="columnIndex">
                  <input
                    v-if="editingId === cellId(rowIndex, columnIndex)"
                    :ref="setEditorRef"
                    class="sst__editor"
                    :value="cellAt(row, columnIndex)?.field"
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
  </section>
</template>

<script setup>
import { computed, nextTick, ref, watch } from 'vue'

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
})

const emit = defineEmits([
  'update:headers', 'update:tableData', 'add-column', 'add-row', 'delete-column',
  'delete-row', 'move-column', 'header-update', 'cell-update', 'context-events',
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
const originalValue = ref('')
const editorRef = ref(null)
let sequence = 0

watch(() => props.headers, (headers) => { localHeaders.value = cloneHeaders(headers) }, { deep: true })
watch(() => props.tableData, (rows) => { localRows.value = cloneRows(rows) }, { deep: true })

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
  originalValue.value = target?.field ?? ''
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
  if (editingTarget.value) editingTarget.value.field = originalValue.value
  editingId.value = null
  editingTarget.value = null
}
function updateHeaderDraft(columnIndex, event) { localHeaders.value[columnIndex].field = event.target.value }
function finishHeaderEditing(columnIndex, header) {
  if (editingId.value !== `header-${header.key}`) return
  editingId.value = null
  editingTarget.value = null
  publish()
  const payload = { key: header.key, value: header.field, editKey: header.editKey, columnIndex }
  emit('header-update', payload)
}
function updateCellDraft(rowIndex, columnIndex, event) { localRows.value[rowIndex][columnIndex].field = event.target.value }
function finishCellEditing(rowIndex, columnIndex) {
  if (editingId.value !== cellId(rowIndex, columnIndex)) return
  editingId.value = null
  editingTarget.value = null
  const cell = localRows.value[rowIndex][columnIndex]
  publish()
  emit('cell-update', { key: cell.key, value: cell.field, editKey: cell.editKey, rowIndex, columnIndex })
}
function addColumn() {
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
  const destination = columnIndex + direction
  if (destination < 0 || destination >= localHeaders.value.length) return
  const [header] = localHeaders.value.splice(columnIndex, 1)
  localHeaders.value.splice(destination, 0, header)
  localRows.value.forEach((row) => {
    const [cell] = row.splice(columnIndex, 1)
    row.splice(destination, 0, cell)
  })
  publish()
  emit('move-column', { from: columnIndex, to: destination })
}
function emitContext(event, menuId, type) { emit('context-events', { event, menu_id: menuId, type }) }
</script>

<style scoped>
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
