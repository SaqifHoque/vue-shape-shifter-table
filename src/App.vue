<template>
  <main class="demo">
    <div class="demo__glow demo__glow--one" aria-hidden="true" />
    <div class="demo__glow demo__glow--two" aria-hidden="true" />
    <section class="hero">
      <span class="hero__badge">Built for Vue 3</span>
      <h1>A table that adapts<br><span>as fast as your ideas.</span></h1>
      <p>Build, rename, reorder, and reshape data without wrestling with rigid grids.</p>
    </section>
    <ShapeShifterTable
      v-model:headers="headers"
      v-model:table-data="rows"
      title="Product launch board"
      eyebrow="Live workspace"
      :footers="[{ field: 'Click any value to edit. Changes last until you refresh the page.' }]"
      @cell-update="lastChange = 'Cell updated'"
      @header-update="lastChange = 'Column renamed'"
      @add-column="lastChange = 'Column added'"
      @add-row="lastChange = 'Row added'"
      @delete-column="lastChange = 'Column deleted'"
      @delete-row="lastChange = 'Row deleted'"
      @move-column="lastChange = 'Column moved'"
    >
      <template #toolbar>
        <span class="status" role="status"><i aria-hidden="true" /> {{ lastChange }}</span>
      </template>
    </ShapeShifterTable>
    <section class="features">
      <article><span>01</span><h2>Shape freely</h2><p>Add, remove, edit, or rearrange columns and rows in place.</p></article>
      <article><span>02</span><h2>Vue 3 native</h2><p>Keep your data in sync as you edit, with room for your own controls.</p></article>
      <article><span>03</span><h2>Responsive by default</h2><p>Touch-friendly controls and safe horizontal scrolling on small screens.</p></article>
    </section>
  </main>
</template>

<script setup>
import { ref } from 'vue'
import ShapeShifterTable from './components/ShapeShifterTable.vue'

const headers = ref([
  { field: 'Project', key: 'project', editable: true }, { field: 'Owner', key: 'owner', editable: true },
  { field: 'Status', key: 'status', editable: true }, { field: 'Launch', key: 'launch', editable: true },
])
const rows = ref([
  [{ field: 'Aurora', key: 'aurora-project', editable: true }, { field: 'Maya Chen', key: 'aurora-owner', editable: true }, { field: 'Ready', key: 'aurora-status', editable: true }, { field: 'Sep 18', key: 'aurora-launch', editable: true }],
  [{ field: 'Northstar', key: 'northstar-project', editable: true }, { field: 'Owen Blake', key: 'northstar-owner', editable: true }, { field: 'In review', key: 'northstar-status', editable: true }, { field: 'Oct 02', key: 'northstar-launch', editable: true }],
  [{ field: 'Pulse', key: 'pulse-project', editable: true }, { field: 'Amara Wells', key: 'pulse-owner', editable: true }, { field: 'Exploring', key: 'pulse-status', editable: true }, { field: 'Oct 21', key: 'pulse-launch', editable: true }],
])
const lastChange = ref('Ready to explore')
</script>

<style>
:root { color: #182033; background: #f6f4fb; font-family: Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif; font-synthesis: none; } body { min-width: 320px; min-height: 100vh; margin: 0; } button,input { font: inherit; }
.demo { position: relative; isolation: isolate; width: min(1120px,calc(100% - 2rem)); margin: auto; padding: 5rem 0 4rem; }
.demo__glow { position: fixed; z-index: -1; width: min(28rem, 80vw); height: min(28rem, 80vw); border-radius: 50%; filter: blur(90px); opacity: .25; } .demo__glow--one { top: -12rem; left: -8rem; background: #a78bfa; } .demo__glow--two { right: -10rem; bottom: -14rem; background: #38bdf8; }
.hero { max-width: 780px; margin: 0 auto 3rem; text-align: center; } .hero__badge { display: inline-block; padding: .45rem .75rem; color: #6d28d9; background: #ede9fe; border: 1px solid #ddd6fe; border-radius: 99px; font-size: .75rem; font-weight: 800; letter-spacing: .04em; text-transform: uppercase; }
.hero h1 { margin: 1.25rem 0 1rem; font-size: clamp(2.7rem,7vw,5.7rem); line-height: .96; letter-spacing: -.065em; } .hero h1 span { color: transparent; background: linear-gradient(100deg,#7c3aed,#2563eb 58%,#0891b2); background-clip: text; -webkit-background-clip: text; } .hero p { max-width: 620px; margin: auto; color: #667085; font-size: clamp(1rem,2vw,1.2rem); line-height: 1.7; }
.status { display: inline-flex; align-items: center; gap: .45rem; padding: .5rem .7rem; color: #475569; background: rgba(255,255,255,.75); border: 1px solid #e2e8f0; border-radius: 99px; font-size: .75rem; font-weight: 650; } .status i { width: .45rem; height: .45rem; background: #22c55e; border-radius: 50%; box-shadow: 0 0 0 .2rem rgba(34,197,94,.13); }
.features { display: grid; grid-template-columns: repeat(3,1fr); gap: 1rem; margin-top: 1.25rem; } .features article { padding: 1.4rem; background: rgba(255,255,255,.62); border: 1px solid rgba(124,58,237,.1); border-radius: 1rem; backdrop-filter: blur(14px); } .features span { color: #8b5cf6; font-size: .72rem; font-weight: 900; letter-spacing: .12em; } .features h2 { margin: .55rem 0 .35rem; font-size: 1rem; } .features p { margin: 0; color: #667085; font-size: .85rem; line-height: 1.6; }
@media (max-width: 720px) { .demo { padding-top: 3rem; } .features { grid-template-columns: 1fr; } .demo .sst__toolbar { flex-wrap: wrap; } }
</style>
