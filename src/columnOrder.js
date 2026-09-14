/** Restore stored column keys against the current schema without mutating input. */
export function applyColumnOrder(headers, rows, order) {
  if (!Array.isArray(headers) || !Array.isArray(rows) || rows.some((row) => !Array.isArray(row))) {
    throw new TypeError('Expected header and row arrays')
  }
  const positions = new Map()
  headers.forEach((header, index) => {
    const key = header?.key
    if (!(typeof key === 'string' || (typeof key === 'number' && Number.isFinite(key))) || positions.has(key)) {
      throw new TypeError('Headers must have unique string or finite numeric keys')
    }
    positions.set(key, index)
  })
  const indices = []
  const seen = new Set()
  for (const key of Array.isArray(order) ? order : []) {
    if (positions.has(key) && !seen.has(key)) {
      indices.push(positions.get(key))
      seen.add(key)
    }
  }
  headers.forEach((header, index) => { if (!seen.has(header.key)) indices.push(index) })
  const cloneCell = (cell) => cell == null ? cell : { ...cell }
  return {
    headers: indices.map((index) => ({ ...headers[index] })),
    rows: rows.map((row) => [
      ...indices.map((index) => cloneCell(row[index])),
      // Preserve data beyond the declared schema as well.
      ...row.slice(headers.length).map(cloneCell),
    ]),
  }
}
