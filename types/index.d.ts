import type { ComponentOptionsMixin, DefineComponent, Plugin, SlotsType, VNodeChild } from 'vue'

export type TableKey = string | number
export interface SortContext {
  leftRow: TableRow
  rightRow: TableRow
  header: TableHeader
  columnIndex: number
}
export type TableComparator = (left: unknown, right: unknown, context: SortContext) => number
export interface FilterContext { row: TableRow; rowIndex: number; header: TableHeader; columnIndex: number }
export type ColumnFilterPredicate = (value: unknown, query: string, context: FilterContext) => boolean
export interface ValidationContext {
  kind: 'cell' | 'header'
  header: TableHeader
  columnIndex: number
  cell?: TableCell
  row?: TableRow
  rowIndex?: number
}
export type TableValidator = (value: unknown, context: ValidationContext) => true | string | boolean | void

/** Cell metadata is preserved by table operations. Inputs commit edited values as strings. */
export interface TableCell {
  field?: unknown
  key?: TableKey
  editable?: boolean
  fixed?: string | string[] | Record<string, boolean>
  editKey?: unknown
  rowKey?: TableKey
  columnKey?: TableKey
  validator?: TableValidator
  width?: number
  [metadata: string]: unknown
}

export interface TableHeader extends TableCell {
  key: TableKey
  sortComparator?: TableComparator
  filterPredicate?: ColumnFilterPredicate
}

/** Short rows and missing cells are supported. Slot consumers must handle undefined cells. */
export type TableRow = Array<TableCell | undefined>
/** Unknown/duplicate saved keys are ignored; new columns are appended in schema order. */
export declare function applyColumnOrder(
  headers: readonly TableHeader[],
  rows: ReadonlyArray<readonly (TableCell | undefined)[]>,
  order: unknown,
): { headers: TableHeader[]; rows: TableRow[] }
export interface TableMenuItem { text: string; event: string }
export interface TableFooter { field?: unknown; [metadata: string]: unknown }
export interface TableColumnFilter { key: TableKey; value: string }
export interface TableQuery {
  page: number
  pageSize: number
  sort: TableSort | null
  filter: string
  columnFilters: TableColumnFilter[]
}

export interface ShapeShifterTableProps {
  sortable?: boolean
  filterable?: boolean
  columnFilterable?: boolean
  sort?: TableSort | null
  filter?: string
  columnFilters?: TableColumnFilter[]
  comparator?: TableComparator
  validator?: TableValidator
  serverSide?: boolean
  totalRows?: number
  rowOffset?: number
  loading?: boolean
  resizableColumns?: boolean
  minimumColumnWidth?: number
  persistenceKey?: string
  persistenceStorage?: TableStorage | null
  persistTableData?: boolean
  headers?: TableHeader[]
  tableData?: TableRow[]
  footers?: TableFooter[]
  contextMenuColumn?: TableMenuItem[]
  contextMenuRow?: TableMenuItem[]
  title?: string
  eyebrow?: string
  emptyText?: string
  maxHeight?: string
  stickyHeader?: boolean
  addable?: boolean
  removable?: boolean
  compact?: boolean
  draggableColumns?: boolean
  pagination?: boolean
  /** One-based page number; defaults to 1. */
  page?: number
  pageSize?: number
  pageSizeOptions?: number[]
}

export interface HeaderUpdate {
  key: TableKey
  value: unknown
  editKey: unknown
  columnIndex: number
}
export interface CellUpdate {
  key: TableKey | undefined
  value: unknown
  editKey: unknown
  /** Absolute index in the complete dataset, including when paginated. */
  rowIndex: number
  columnIndex: number
}
export interface ColumnChange { header: TableHeader; columnIndex: number }
export interface RowChange { row: TableRow; rowIndex: number }
export interface ColumnMove { from: number; to: number }
export interface TableSort { key: TableKey; direction: 'asc' | 'desc' }
export interface ContextEvent { event: string; menu_id: TableKey | undefined; type: 'row' | 'column' }
export interface ValidationError extends ValidationContext { value: unknown; message: string }
export interface ColumnResize { key: TableKey; width: number; columnIndex: number }
export interface PersistenceError { operation: 'restore' | 'save' | 'clear'; error: unknown }
export interface TableStorage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}

/** Public event names and the payload associated with each event. */
export interface TableEventPayloads {
  'update:sort': TableSort | null
  'update:filter': string
  'update:columnFilters': TableColumnFilter[]
  'update:headers': TableHeader[]
  'update:tableData': TableRow[]
  'update:page': number
  'update:pageSize': number
  'add-column': ColumnChange
  'delete-column': ColumnChange
  'add-row': RowChange
  'delete-row': RowChange
  'move-column': ColumnMove
  'header-update': HeaderUpdate
  'cell-update': CellUpdate
  'context-events': ContextEvent
  'validation-error': ValidationError
  'query-change': TableQuery
  'column-resize': ColumnResize
  'persistence-error': PersistenceError
}
export type TableEmits = { [Event in keyof TableEventPayloads]: (payload: TableEventPayloads[Event]) => void }

export interface TableSlots {
  toolbar?: (props: { addColumn: () => void; addRow: () => void }) => VNodeChild
  header?: (props: { header: TableHeader; columnIndex: number }) => VNodeChild
  cell?: (props: { cell: TableCell | undefined; header: TableHeader; rowIndex: number; columnIndex: number }) => VNodeChild
  empty?: () => VNodeChild
  footer?: (props: { footers: TableFooter[] }) => VNodeChild
}

export declare const ShapeShifterTable: DefineComponent<
  ShapeShifterTableProps, {}, {}, {}, {}, ComponentOptionsMixin, ComponentOptionsMixin,
  TableEmits, string, import('vue').PublicProps,
  Readonly<ShapeShifterTableProps> & {
    [Event in keyof TableEventPayloads as `on${Capitalize<Event>}`]?: (payload: TableEventPayloads[Event]) => void
  }, {}, SlotsType<TableSlots>
>

declare const ShapeShifterTablePlugin: Plugin
export default ShapeShifterTablePlugin
