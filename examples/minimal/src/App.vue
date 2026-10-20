<script setup>
import { ref } from 'vue'
import { ShapeShifterTable } from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers = ref([{ key: 'name', field: 'Name' }, { key: 'role', field: 'Role' }])
const rows = ref([
  [{ field: 'Amina' }, { field: 'Engineer' }],
  [{ field: 'Rafi' }, { field: 'Designer' }],
  [{ field: 'Mika' }, { field: 'Reviewer' }],
])
</script>

<template>
  <main>
    <h1>Table component inside a div</h1>
    <p>A plain Vue page importing the published npm package. Try editing a cell, sorting, or searching.</p>
    <div id="component-container" style="width: 100%; max-width: 900px; border: 2px solid #475569; margin-top: 16px; padding: 12px; box-sizing: border-box;">
      <ShapeShifterTable v-model:headers="headers" v-model:table-data="rows" sortable filterable pagination draggable-columns :page-size="2" />
    </div>
  </main>
</template>

<style>
body { margin: 24px; font-family: system-ui, sans-serif; color: #111827; background: white; }
main { max-width: 1000px; }
h1 { font-size: 24px; }
</style>
