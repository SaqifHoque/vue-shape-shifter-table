import { test } from 'node:test'
import assert from 'node:assert/strict'
import { applyColumnOrder } from '../dist/vue-shapeshifter-table.js'

test('saved order restores alignment without mutating rows or headers', () => {
  const headers = Object.freeze([{ key: 'name' }, { key: 'role' }].map(Object.freeze))
  const rows = Object.freeze([Object.freeze([{ field: 'Ada' }, { field: 'Engineer' }].map(Object.freeze))])
  const result = applyColumnOrder(headers, rows, ['role', 'name'])
  assert.deepEqual(result.headers.map((header) => header.key), ['role', 'name'])
  assert.deepEqual(result.rows[0].map((cell) => cell.field), ['Engineer', 'Ada'])
  result.headers[0].field = 'New heading'
  result.rows[0][0].field = 'Changed'
  assert.equal(headers[1].field, undefined)
  assert.equal(rows[0][1].field, 'Engineer')
})

test('stale, duplicate and unknown saved keys tolerate schema evolution', () => {
  const headers = [{ key: 'a' }, { key: 'b' }, { key: 'new' }]
  const result = applyColumnOrder(headers, [], ['deleted', 'b', 'b', {}, '__proto__'])
  assert.deepEqual(result.headers.map((header) => header.key), ['b', 'a', 'new'])
  for (const invalid of [null, undefined, {}, 'b']) {
    assert.deepEqual(applyColumnOrder(headers, [], invalid).headers, headers)
  }
})

test('short rows retain missing positions and excess cells are preserved', () => {
  const result = applyColumnOrder([{ key: 'a' }, { key: 'b' }], [[{ field: 'A' }], [{ field: 1 }, { field: 2 }, { field: 3 }]], ['b', 'a'])
  assert.equal(result.rows[0][0], undefined)
  assert.equal(result.rows[0][1].field, 'A')
  assert.deepEqual(result.rows[1].map((cell) => cell.field), [2, 1, 3])
})

test('numeric and string keys stay distinct; prototype-like keys are ordinary keys', () => {
  const result = applyColumnOrder([{ key: 0 }, { key: '0' }, { key: '__proto__' }], [], ['0', '__proto__', 0])
  assert.deepEqual(result.headers.map((header) => header.key), ['0', '__proto__', 0])
})

test('ambiguous or malformed schemas fail clearly', () => {
  for (const headers of [[{ key: 'a' }, { key: 'a' }], [{}], [{ key: Infinity }]]) {
    assert.throws(() => applyColumnOrder(headers, [], []), TypeError)
  }
  assert.throws(() => applyColumnOrder([], [{}], []), TypeError)
})
