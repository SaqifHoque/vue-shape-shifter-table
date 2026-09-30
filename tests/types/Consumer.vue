<script setup lang="ts">
import { ref } from 'vue'
import { ShapeShifterTable, type TableHeader, type TableRow, type CellUpdate, type TableSort, type TableColumnFilter, type TableQuery, type TableStorage, type ValidationError } from 'vue-shapeshifter-table'

const headers = ref<TableHeader[]>([{
  key: 'name', field: 'Name',
  sortComparator: (left, right) => String(left).localeCompare(String(right)),
  filterPredicate: (value, query) => String(value).startsWith(query),
  validator: (value) => String(value).length > 1 || 'Too short',
}])
const rows = ref<TableRow[]>([[{ field: 'Ada' }]])
const page = ref(1)
const pageSize = ref(10)
const sort = ref<TableSort | null>(null)
const filter = ref('')
const columnFilters = ref<TableColumnFilter[]>([])
function onEdit(payload: CellUpdate) { rows.value[payload.rowIndex][payload.columnIndex] = { field: payload.value } }
function onInvalid(payload: ValidationError) { console.log(payload.message) }
function loadPage(query: TableQuery) { console.log(query.page, query.pageSize) }
const storage: TableStorage = { getItem: () => null, setItem: () => {}, removeItem: () => {} }
</script>

<template>
  <ShapeShifterTable v-model:headers="headers" v-model:table-data="rows"
    v-model:page="page" v-model:page-size="pageSize" v-model:sort="sort" v-model:filter="filter"
    v-model:column-filters="columnFilters" sortable filterable column-filterable pagination draggable-columns
    :validator="value => Boolean(value) || 'Required'" @cell-update="onEdit" @validation-error="onInvalid">
    <template #cell="{ cell, rowIndex, columnIndex }">
      {{ rowIndex.toFixed() }}:{{ columnIndex.toFixed() }} {{ cell?.field }}
    </template>
    <template #toolbar="{ addRow }"><button @click="addRow">Add row</button></template>
  </ShapeShifterTable>
  <!-- @vue-expect-error page must be numeric -->
  <ShapeShifterTable page="invalid" />
  <ShapeShifterTable server-side :total-rows="100" :row-offset="20" loading @query-change="loadPage" />
  <ShapeShifterTable resizable-columns :minimum-column-width="100" persistence-key="people" :persistence-storage="storage" />
  <ShapeShifterTable virtualized :row-height="44" :virtual-viewport-height="440" :overscan="4" />
</template>
