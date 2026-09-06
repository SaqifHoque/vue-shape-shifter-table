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
  const headers = ref(originalHeaders)
  const rows = ref(originalRows)
  const events = []
  const root = element('root')
  const app = createApp({ render: () => h(ShapeShifterTable, {
    headers: headers.value, tableData: rows.value,
    'onUpdate:headers': (value) => { headers.value = value },
    'onUpdate:tableData': (value) => { rows.value = value },
    onCellUpdate: (value) => events.push(['cell', value]),
    onHeaderUpdate: (value) => events.push(['header', value]),
    onContextEvents: (value) => events.push(['context', value]),
    ...options.props,
  }, options.slots) })
  app.mount(root)
  const find = (predicate) => {
    const node = walk(root).find(predicate)
    assert.ok(node, 'Expected rendered control to exist')
    return node
  }
  const button = (label) => find((node) => node.type === 'button' && text(node).trim() === label)
  const click = async (label) => { button(label).props.onClick(); await nextTick() }
  return { root, headers, rows, events, originalHeaders, originalRows, find, button, click, unmount: () => app.unmount() }
}

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
