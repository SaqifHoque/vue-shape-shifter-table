<script setup lang="ts">
import { ref } from 'vue'
import { ShapeShifterTable, type TableHeader, type TableRow, type CellUpdate } from 'vue-shapeshifter-table'

const headers = ref<TableHeader[]>([{ key: 'name', field: 'Name' }])
const rows = ref<TableRow[]>([[{ field: 'Ada' }]])
const page = ref(1)
const pageSize = ref(10)
function onEdit(payload: CellUpdate) { rows.value[payload.rowIndex][payload.columnIndex] = { field: payload.value } }
</script>

<template>
  <ShapeShifterTable v-model:headers="headers" v-model:table-data="rows"
    v-model:page="page" v-model:page-size="pageSize" pagination draggable-columns @cell-update="onEdit">
    <template #cell="{ cell, rowIndex, columnIndex }">
      {{ rowIndex.toFixed() }}:{{ columnIndex.toFixed() }} {{ cell?.field }}
    </template>
    <template #toolbar="{ addRow }"><button @click="addRow">Add row</button></template>
  </ShapeShifterTable>
  <!-- @vue-expect-error page must be numeric -->
  <ShapeShifterTable page="invalid" />
</template>
