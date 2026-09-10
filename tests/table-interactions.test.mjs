import assert from 'node:assert/strict'
import { test } from 'node:test'
import { createRenderer, h, nextTick, ref } from 'vue'
import { ShapeShifterTable } from '../dist/vue-shapeshifter-table.js'

// Exercise the compiled component through Vue's renderer without a browser dependency.
function element(type, text = '') {
  return { type, text, children: [], props: {}, parent: null,
    focus() {}, select() {}, blur() { this.props.onBlur?.() } }
}
const { createApp } = createRenderer({
  createElement: element,
  createText: (text) => element('#text', text),
  createComment: (text) => element('#comment', text),
  setText: (node, text) => { node.text = text },
  setElementText: (node, text) => { node.text = text; node.children = [] },
  patchProp: (node, key, previous, value) => { node.props[key] = value },
  insert(node, parent, anchor = null) {
    if (node.parent) node.parent.children.splice(node.parent.children.indexOf(node), 1)
    const index = anchor ? parent.children.indexOf(anchor) : -1
    parent.children.splice(index < 0 ? parent.children.length : index, 0, node)
    node.parent = parent
  },
  remove(node) { node.parent?.children.splice(node.parent.children.indexOf(node), 1); node.parent = null },
  parentNode: (node) => node.parent,
  nextSibling: (node) => node.parent?.children[node.parent.children.indexOf(node) + 1] ?? null,
})
const walk = (node) => [node, ...node.children.flatMap(walk)]
const text = (node) => node.text + node.children.map(text).join('')
function mount(options = {}) {
  const originalHeaders = [{ field: 'Name', key: 'name' }, { field: 'Role', key: 'role' }]
  const originalRows = [[{ field: 'Maya', key: 'maya' }, { field: 'Designer', key: 'designer' }]]
  const headers = ref(options.headers ?? originalHeaders)
  const rows = ref(options.rows ?? originalRows)
  const paginationProps = ref(options.props ?? {})
  const events = []
  const root = element('root')
  const app = createApp({ render: () => h(ShapeShifterTable, {
    headers: headers.value, tableData: rows.value,
    'onUpdate:headers': (value) => { headers.value = value },
    'onUpdate:tableData': (value) => { rows.value = value },
    onCellUpdate: (value) => events.push(['cell', value]),
    onHeaderUpdate: (value) => events.push(['header', value]),
    onContextEvents: (value) => events.push(['context', value]),
    ...paginationProps.value,
  }, options.slots) })
  app.mount(root)
  const find = (predicate) => {
    const node = walk(root).find(predicate)
    assert.ok(node, 'Expected rendered control to exist')
    return node
  }
  const button = (label) => find((node) => node.type === 'button' && text(node).trim() === label)
  const click = async (label) => { button(label).props.onClick(); await nextTick() }
  return { root, headers, rows, events, originalHeaders, originalRows, find, button, click, paginationProps, unmount: () => app.unmount() }
}

const pagedRows = () => Array.from({ length: 5 }, (_, index) => [
  { field: `Person ${index + 1}`, key: `person-${index}` },
  { field: `Role ${index + 1}`, key: `role-${index}` },
])

test('pointer dragging moves non-adjacent columns across all pages', async () => {
  const table = mount({ headers: ['A', 'B', 'C'].map((field) => ({ field, key: field })),
    rows: [[{ field: 'a' }, { field: 'b' }, { field: 'c' }], [{ field: 'd' }]],
    props: { draggableColumns: true, pagination: true, pageSize: 1 } })
  const grid = table.find((node) => node.type === 'table')
  grid.ownerDocument = { elementFromPoint: () => ({ closest: () => ({ dataset: { columnIndex: '2' }, closest: () => grid }) }) }
  const handle = table.find((node) => node.props['aria-label'] === 'Move A column')
  const event = { pointerId: 1, button: 0, isPrimary: true, clientX: 0, clientY: 0, currentTarget: { setPointerCapture() {} } }
  handle.props.onPointerdown(event)
  handle.props.onPointermove({ ...event, clientX: 100 })
  await nextTick()
  handle.props.onPointerup({ ...event, clientX: 100 })
  await nextTick()
  assert.deepEqual(table.headers.value.map((column) => column.field), ['B', 'C', 'A'])
  assert.deepEqual(table.rows.value[0].map((cell) => cell.field), ['b', 'c', 'a'])
  assert.equal(table.rows.value[1][2].field, 'd')
  assert.match(text(table.root), /A moved to column 3/)
  table.unmount()
})

test('drag cancellation, foreign targets, and keyboard movement', async () => {
  const table = mount({ props: { draggableColumns: true } })
  const handle = table.find((node) => node.props['aria-label'] === 'Move Name column')
  const grid = table.find((node) => node.type === 'table')
  grid.ownerDocument = { elementFromPoint: () => null }
  const event = { pointerId: 1, button: 0, clientX: 0, clientY: 0, currentTarget: { setPointerCapture() {} } }
  handle.props.onPointerdown(event)
  handle.props.onPointercancel()
  handle.props.onPointerup({ ...event, clientX: 100 })
  handle.props.onPointerdown(event)
  handle.props.onPointerup({ ...event, clientX: 100 })
  await nextTick()
  assert.equal(table.headers.value[0].field, 'Name')
  for (const handler of handle.props.onKeydown) handler({ key: 'ArrowRight', preventDefault() {} })
  await nextTick()
  assert.equal(table.headers.value[0].field, 'Role')
  table.unmount()
  const disabled = mount()
  assert.equal(walk(disabled.root).some((node) => node.props.class === 'sst__drag-handle'), false)
  disabled.unmount()
})

test('pagination edits and deletes absolute rows and clamps the final page', async () => {
  const pages = []
  const table = mount({ rows: pagedRows(), props: { pagination: true, pageSize: 2, 'onUpdate:page': (page) => pages.push(page) } })
  assert.equal(table.button('Previous').props.disabled, true)
  assert.match(text(table.root), /1–2 of 5 rows/)
  await table.click('Next')
  await table.click('Person 3')
  const input = table.find((node) => node.type === 'input')
  input.props.onInput({ target: { value: 'Edited third' } })
  input.props.onBlur()
  await nextTick()
  assert.equal(table.rows.value[2][0].field, 'Edited third')
  assert.equal(table.events[0][1].rowIndex, 2)
  assert.equal(table.rows.value[0][0].field, 'Person 1')
  await table.click('Next')
  assert.equal(table.button('Next').props.disabled, true)
  await table.click('×')
  assert.equal(table.rows.value.length, 4)
  assert.match(text(table.root), /Page 2 of 2/)
  assert.deepEqual(pages, [2, 3, 2])
  table.unmount()
})

test('page size and external data changes keep pagination valid', async () => {
  const sizes = []
  const table = mount({ rows: pagedRows(), props: { pagination: true, page: 3, pageSize: 2, 'onUpdate:pageSize': (size) => sizes.push(size) } })
  const select = table.find((node) => node.type === 'select')
  select.props.onChange({ target: { value: '3' } })
  await nextTick()
  assert.deepEqual(sizes, [3])
  assert.match(text(table.root), /1–3 of 5 rows · Page 1 of 2/)
  table.paginationProps.value = { pagination: true, page: 2, pageSize: 3 }
  await nextTick()
  assert.match(text(table.root), /4–5 of 5 rows/)
  table.rows.value = []
  await nextTick()
  assert.match(text(table.root), /0–0 of 0 rows · Page 1 of 1/)
  assert.equal(table.button('Next').props.disabled, true)
  table.unmount()
})

test('pagination is opt-in and normalizes invalid sizes and pages', async () => {
  const table = mount({ rows: pagedRows(), props: { pageSize: 2 } })
  assert.ok(table.button('Person 5'))
  assert.equal(walk(table.root).some((node) => node.type === 'nav'), false)
  table.paginationProps.value = { pagination: true, page: Infinity, pageSize: 0, pageSizeOptions: [-1, 0, NaN, 5, 5] }
  await nextTick()
  assert.match(text(table.root), /Page 1 of 1/)
  const options = walk(table.root).filter((node) => node.type === 'option')
  assert.deepEqual(options.map((node) => node.props.value), [5, 10])
  table.unmount()
})

test('page navigation cancels unsaved edits and slots receive absolute indices', async () => {
  const table = mount({ rows: pagedRows(), props: { pagination: true, pageSize: 2 } })
  await table.click('Person 1')
  table.find((node) => node.type === 'input').props.onInput({ target: { value: 'Draft' } })
  await table.click('Next')
  await table.click('Previous')
  assert.ok(table.button('Person 1'))
  table.unmount()
  const slotted = mount({ rows: pagedRows(), props: { pagination: true, pageSize: 2, page: 2 },
    slots: { cell: ({ rowIndex }) => h('span', `Index ${rowIndex}`) } })
  assert.match(text(slotted.root), /Index 2/)
  assert.doesNotMatch(text(slotted.root), /Index 0/)
  slotted.unmount()
})

test('row and column operations keep parent models aligned without mutating input objects', async () => {
  const table = mount()
  await table.click('Move right')
  assert.deepEqual(table.headers.value.map((header) => header.field), ['Role', 'Name'])
  assert.deepEqual(table.rows.value[0].map((cell) => cell.field), ['Designer', 'Maya'])
  await table.click('＋ Column')
  assert.equal(table.headers.value.length, 3)
  assert.equal(table.rows.value[0].length, 3)
  await table.click('＋ Row')
  assert.equal(table.rows.value.length, 2)
  assert.equal(table.rows.value[1].length, 3)
  await table.click('Delete column')
  assert.equal(table.headers.value.length, 2)
  assert.ok(table.rows.value.every((row) => row.length === 2))
  await table.click('×')
  assert.equal(table.rows.value.length, 1)
  assert.deepEqual(table.originalHeaders.map((header) => header.field), ['Name', 'Role'])
  assert.deepEqual(table.originalRows[0].map((cell) => cell.field), ['Maya', 'Designer'])
  table.unmount()
})

test('editing commits on Enter, cancels on Escape, and reports cell and heading payloads', async () => {
  const table = mount()
  await table.click('Maya')
  let input = table.find((node) => node.type === 'input')
  input.props.onInput({ target: { value: 'Amara' } })
  input.props.onKeydown[0]({ key: 'Enter' })
  await nextTick()
  assert.equal(table.rows.value[0][0].field, 'Amara')
  assert.equal(table.originalRows[0][0].field, 'Maya')
  assert.deepEqual(table.events[0], ['cell', { key: 'maya', value: 'Amara', editKey: undefined, rowIndex: 0, columnIndex: 0 }])
  await table.click('Amara')
  input = table.find((node) => node.type === 'input')
  input.props.onInput({ target: { value: 'Discard' } })
  input.props.onKeydown[1]({ key: 'Escape' })
  input.props.onBlur()
  await nextTick()
  assert.equal(table.rows.value[0][0].field, 'Amara')
  assert.equal(table.events.length, 1)
  await table.click('Name')
  input = table.find((node) => node.type === 'input')
  input.props.onInput({ target: { value: 'Person' } })
  input.props.onBlur()
  await nextTick()
  assert.equal(table.headers.value[0].field, 'Person')
  assert.equal(table.events[1][0], 'header')
  table.rows.value = [[{ field: 'External', key: 'external' }]]
  await nextTick()
  assert.ok(table.button('External'))
  table.unmount()
})

test('custom slots and legacy context events remain available', async () => {
  const table = mount({ props: { contextMenuRow: [{ text: 'Inspect', event: 'inspect' }] },
    slots: { toolbar: () => h('span', 'Toolbar'), footer: () => h('span', 'Footer') } })
  await table.click('Inspect')
  assert.deepEqual(table.events[0], ['context', { event: 'inspect', menu_id: 'maya', type: 'row' }])
  assert.match(text(table.root), /Toolbar/)
  assert.match(text(table.root), /Footer/)
  table.unmount()
})

test('empty tables disable adding rows and expose the empty slot', () => {
  const table = mount({ props: { headers: [], tableData: [] }, slots: { empty: () => h('span', 'No records') } })
  assert.equal(table.button('＋ Row').props.disabled, true)
  assert.match(text(table.root), /No records/)
  table.unmount()
})

test('missing cells can be edited and new columns retain their header position', async () => {
  const table = mount({ props: { tableData: [[]] } })
  await table.click('')
  const input = table.find((node) => node.type === 'input')
  input.props.onInput({ target: { value: 'New value' } })
  input.props.onBlur()
  await nextTick()
  assert.equal(table.rows.value[0][0].field, 'New value')
  await table.click('＋ Column')
  assert.equal(table.rows.value[0].length, 3)
  assert.equal(table.rows.value[0][2].field, '')
  table.unmount()
})
