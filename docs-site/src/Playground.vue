<script setup>
import { ref } from 'vue'
import { ShapeShifterTable, applyColumnOrder } from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'
function initial() {
  return {
    headers: [{key:'name',field:'Name'},{key:'role',field:'Role'},{key:'team',field:'Team'},{key:'status',field:'Status'}],
    rows: [['Amina','Engineer','Platform','Active'],['Rafi','Designer','Product','Review'],['Mika','Reviewer','Quality','Active'],['Noah','Engineer','Platform','Away'],['Hana','Lead','Product','Active']].map((row,i) => row.map((field,j) => ({key:`${i}-${j}`,field})))
  }
}
const data = initial()
const headers = ref(data.headers)
const rows = ref(data.rows)
const sortable = ref(true), filterable = ref(true), pagination = ref(true), draggable = ref(true), compact = ref(false)
const sort = ref(null), filter = ref(''), page = ref(1)
const message = ref('Edit a cell, sort a heading, or drag a column handle.')
function reset() { const d=initial(); headers.value=d.headers; rows.value=d.rows; sort.value=null; filter.value=''; page.value=1; message.value='Demo data reset.' }
function saveOrder() {
  try { localStorage.setItem('shapeshifter-docs-order',JSON.stringify(headers.value.map(h=>h.key))); message.value='Column keys saved in this browser.' }
  catch { message.value='Browser storage is unavailable; the table still works.' }
}
function restoreOrder() {
  try { const result=applyColumnOrder(headers.value,rows.value,JSON.parse(localStorage.getItem('shapeshifter-docs-order')??'null')); headers.value=result.headers; rows.value=result.rows; message.value='Saved column order applied.' }
  catch { message.value='No valid saved column layout was available.' }
}
</script>
<template>
  <div class="playground">
    <div class="playground-controls">
      <label><input type="checkbox" v-model="sortable"> Sorting</label><label><input type="checkbox" v-model="filterable"> Search</label><label><input type="checkbox" v-model="pagination"> Pagination</label><label><input type="checkbox" v-model="draggable"> Drag columns</label><label><input type="checkbox" v-model="compact"> Compact</label>
    </div>
    <ShapeShifterTable v-model:headers="headers" v-model:table-data="rows" v-model:sort="sort" v-model:filter="filter" v-model:page="page" :sortable="sortable" :filterable="filterable" :pagination="pagination" :draggable-columns="draggable" :compact="compact" :page-size="3" :page-size-options="[3,5,10]" title="Team directory" eyebrow="EDITABLE EXAMPLE" @cell-update="message = `Edited row ${$event.rowIndex + 1}, column ${$event.columnIndex + 1}.`" @move-column="message = 'Column reordered across every row.'" />
    <p role="status" class="playground-status">{{ message }}</p>
    <div class="playground-controls" style="margin-top:14px;margin-bottom:0"><button @click="reset">Reset data</button><button @click="saveOrder">Save column order</button><button @click="restoreOrder">Restore column order</button></div>
    <details style="margin-top:15px;font-size:12px;color:var(--muted)"><summary>Inspect bound data</summary><pre class="playground-output">{{ JSON.stringify({headers,rows},null,2) }}</pre></details>
  </div>
</template>
