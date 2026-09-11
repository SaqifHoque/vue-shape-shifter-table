import { createApp, h } from 'vue'
import plugin, { ShapeShifterTable } from 'vue-shapeshifter-table'
import type {
  TableHeader, TableRow, TableSlots, ShapeShifterTableProps,
  TableEventPayloads, CellUpdate, ColumnMove,
} from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers: TableHeader[] = [{ key: 'name', field: 'Name', editable: true }]
const rows: TableRow[] = [[{ field: 'Ada', key: 1, customMetadata: { active: true } }], []]
createApp({ render: () => h(ShapeShifterTable, { headers, tableData: rows, pagination: true, page: 2 }) }).use(plugin)

const slots: TableSlots = {
  cell: ({ cell, rowIndex }) => h('span', `${rowIndex}: ${String(cell?.field ?? '')}`),
  toolbar: ({ addRow, addColumn }) => h('button', { onClick: () => { addRow(); addColumn() } }, 'Add'),
}
void slots
type Instance = InstanceType<typeof ShapeShifterTable>
declare const instance: Instance
instance.$emit('update:page', 2)
instance.$emit('move-column', { from: 0, to: 2 })
instance.$emit('cell-update', { key: undefined, value: 'Edited', editKey: undefined, rowIndex: 10, columnIndex: 0 })

// Each expected error must remain an error: declarations must not collapse to any.
// @ts-expect-error page numbers must be numeric
const invalidProps: ShapeShifterTableProps = { page: '2' }
// @ts-expect-error unknown prop
const invalidOption: ShapeShifterTableProps = { sortable: true }
// @ts-expect-error cells are object records
const invalidRows: TableRow[] = [['text']]
// @ts-expect-error event payload is numeric
instance.$emit('update:pageSize', '10')
// @ts-expect-error event names are checked
instance.$emit('made-up-event', {})
// @ts-expect-error move requires destination
const invalidMove: ColumnMove = { from: 1 }
// @ts-expect-error numeric row index
const invalidCell: CellUpdate = { key: 1, value: 'a', editKey: undefined, rowIndex: '1', columnIndex: 0 }
// @ts-expect-error slot row index must be numeric
instance.$slots.cell?.({ cell: undefined, header: headers[0], rowIndex: '1', columnIndex: 0 })
// @ts-expect-error declared component props must also reject invalid values
const invalidComponentProps: Instance['$props'] = { pageSize: '10' }
const pagePayload: TableEventPayloads['update:page'] = 3
void [invalidProps, invalidOption, invalidRows, invalidMove, invalidCell, invalidComponentProps, pagePayload]
