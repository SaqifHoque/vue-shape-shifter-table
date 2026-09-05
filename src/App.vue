<template>
  <main id="app">
    <h1>Vue Shape Shifter Table</h1>
    <ShapeShifterTable
      :headers="headers"
      :table-data="rows"
      :footers="footers"
      :context-menu-column="columnMenu"
      :context-menu-row="rowMenu"
    />
  </main>
</template>

<script setup>
import { ref } from 'vue'
import ShapeShifterTable from './components/ShapeShifterTable.vue'

const headers = ref([
  { field: 'Name', key: 'name', editable: true },
])

const rows = ref([
  [{ field: 'Sample value', key: 'sample-name', editable: true }],
])

const footers = ref([])
const columnMenu = [
  { text: 'Shift column', event: 'shift_column' },
  { text: 'Delete column', event: 'delete_column' },
]
const rowMenu = [
  { text: 'Shift row', event: 'shift_row' },
  { text: 'Delete row', event: 'delete_row' },
]
</script>

<style>
body {
  margin: 0;
  background: #f4f5f7;
  font-family: Arial, sans-serif;
}

#app {
  width: min(960px, calc(100% - 2rem));
  margin: 3rem auto;
}

h1 {
  color: #212529;
}
</style>
