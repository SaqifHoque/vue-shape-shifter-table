<script setup>
import { computed, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'
import content from './content.json'
import Playground from './Playground.vue'

const pages = content.pages
const initial = window.location.hash.slice(1)
const current = ref(pages.some(p => p.id === initial) ? initial : 'overview')
const query = ref('')
const menu = ref(false)
const copied = ref('')
const copyError = ref('')
const search = ref(null)
let copyTimer
const dark = ref(false)
try { dark.value = localStorage.getItem('component-docs-theme') === 'dark' } catch {}
const active = computed(() => pages.find(p => p.id === current.value) || pages[0])
const results = computed(() => {
  const q = query.value.trim().toLowerCase()
  return q ? pages.filter(p => JSON.stringify(p).toLowerCase().includes(q)) : pages
})
const groups = computed(() => [...new Set(results.value.map(p => p.group))])
const position = computed(() => pages.indexOf(active.value))
const previous = computed(() => pages[position.value - 1])
const next = computed(() => pages[position.value + 1])
function go(id) {
  current.value = id; menu.value = false; query.value = ''
  window.location.hash = id
  document.title = `${active.value.title} · ${content.name}`
  nextTick(() => document.querySelector('#article-title')?.focus({ preventScroll: true }))
  window.scrollTo({ top: 0, behavior: 'auto' })
}
function onHash() {
  const id = window.location.hash.slice(1)
  if (pages.some(p => p.id === id)) current.value = id
}
function onKey(event) {
  if (event.key === '/' && !event.ctrlKey && !event.metaKey && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement?.tagName) && !document.activeElement?.isContentEditable) {
    event.preventDefault(); menu.value = true; nextTick(() => search.value?.focus())
  }
  if (event.key === 'Escape') { menu.value = false; query.value = '' }
}
function toggleTheme() {
  dark.value = !dark.value
  try { localStorage.setItem('component-docs-theme', dark.value ? 'dark' : 'light') } catch {}
}
async function copy(text, id) {
  copyError.value = ''
  try {
    await navigator.clipboard.writeText(text)
    copied.value = id; clearTimeout(copyTimer); copyTimer = setTimeout(() => copied.value = '', 1800)
  } catch { copyError.value = 'Copy was unavailable. Select the code below and copy it manually.' }
}
onMounted(() => { window.addEventListener('hashchange', onHash); window.addEventListener('keydown', onKey) })
onBeforeUnmount(() => { clearTimeout(copyTimer); window.removeEventListener('hashchange', onHash); window.removeEventListener('keydown', onKey) })
</script>

<template>
  <div class="docs-app" :class="[{ dark }, content.accent]">
    <a class="skip-link" href="#main-content">Skip to documentation</a>
    <header class="topbar">
      <a href="#overview" class="brand" @click.prevent="go('overview')">
        <span class="brand-symbol" aria-hidden="true">{{ content.isDicom ? '◈' : '▦' }}</span>
        <span>{{ content.name }}<small>Documentation</small></span>
      </a>
      <div class="top-actions">
        <span class="version">v{{ content.version }}</span>
        <a class="github-link" :href="`https://github.com/SaqifHoque/${content.repo}`" target="_blank" rel="noopener noreferrer">GitHub <span aria-hidden="true">↗</span></a>
        <button class="icon-button" @click="toggleTheme" :aria-label="dark ? 'Switch to light theme' : 'Switch to dark theme'">{{ dark ? '☀' : '☾' }}</button>
        <button class="icon-button mobile-menu" @click="menu = !menu" :aria-expanded="menu" aria-controls="docs-sidebar" aria-label="Toggle documentation navigation">☰</button>
      </div>
    </header>
    <div v-if="menu" class="menu-scrim" @click="menu = false"></div>
    <aside id="docs-sidebar" class="sidebar" :class="{ open: menu }">
      <label class="search-box"><span aria-hidden="true">⌕</span><input ref="search" v-model="query" placeholder="Search documentation…" aria-label="Search documentation"><kbd>/</kbd></label>
      <p v-if="query" class="search-count" role="status">{{ results.length }} matching pages</p>
      <nav aria-label="Documentation">
        <div v-for="group in groups" :key="group" class="nav-group">
          <h2>{{ group }}</h2>
          <a v-for="item in results.filter(p => p.group === group)" :key="item.id" :href="`#${item.id}`" @click.prevent="go(item.id)" :class="{ active: current === item.id }" :aria-current="current === item.id ? 'page' : undefined">{{ item.title }}<span v-if="item.id === 'playground'" class="live-dot" aria-label="Interactive"></span></a>
        </div>
        <p v-if="!results.length" class="no-results">No matching pages. Try “source”, “events”, or “styles”.</p>
      </nav>
      <div class="sidebar-footer"><span class="tiny-label">MADE FOR VUE 3</span><a :href="`https://www.npmjs.com/package/${content.package}`" target="_blank" rel="noopener noreferrer">View on npm ↗</a><p>By Saqif Hoque · {{ content.license }}</p></div>
    </aside>
    <main id="main-content" class="main-content">
      <article>
        <div class="breadcrumb">{{ active.group }} <span>/</span> {{ active.title }}</div>
        <div v-if="active.id === 'overview'" class="eyebrow"><span class="live-dot"></span> VUE 3 COMPONENT LIBRARY</div>
        <h1 id="article-title" tabindex="-1">{{ active.id === 'overview' ? content.name : active.title }}</h1>
        <p class="lead">{{ active.lead }}</p>
        <div v-if="active.id === 'overview'" class="hero-actions"><a href="#quickstart" @click.prevent="go('quickstart')" class="primary-button">Start building <span aria-hidden="true">→</span></a><a href="#playground" @click.prevent="go('playground')" class="secondary-button">Open playground</a></div>
        <div v-if="active.id === 'overview'" class="feature-grid">
          <div><span class="feature-icon">{{ content.isDicom ? '◎' : '↔' }}</span><h2>{{ content.isDicom ? 'An imaging workspace' : 'Your data, your layout' }}</h2><p>{{ content.isDicom ? 'Slices, contrast, measurements, and annotations in a single embeddable viewer.' : 'Editable cells, flexible columns, search, and paging in a reusable table.' }}</p></div>
          <div><span class="feature-icon">&lt;/&gt;</span><h2>A native Vue component</h2><p>Bring it into an existing page. Bind your state, use the public API, and keep control of your application.</p></div>
        </div>
        <div v-if="active.id === 'playground'" class="playground-section"><div class="panel-caption"><span class="live-dot"></span> LIVE NPM COMPONENT <span class="caption-version">v{{ content.version }}</span></div><Playground /></div>
        <div v-for="(block, index) in active.blocks" :key="`${active.id}-${index}`" class="content-block">
          <p v-if="block.kind === 'p'" class="body-copy">{{ block.text }}</p>
          <aside v-else-if="block.kind === 'note'" class="callout"><span aria-hidden="true">i</span><p>{{ block.text }}</p></aside>
          <ul v-else-if="block.kind === 'list'" class="doc-list"><li v-for="item in block.items" :key="item">{{ item }}</li></ul>
          <div v-else-if="block.kind === 'code'" class="code-block"><div class="code-caption"><span>{{ block.lang }}</span><button @click="copy(block.text, `${active.id}-${index}`)" :aria-label="`Copy ${block.lang} code example`">{{ copied === `${active.id}-${index}` ? 'Copied ✓' : 'Copy' }}</button></div><pre tabindex="0" :aria-label="`${block.lang} code example`"><code>{{ block.text }}</code></pre></div>
          <div v-else-if="block.kind === 'table'" class="table-scroll" tabindex="0" aria-label="Scrollable API reference"><table class="api-table"><thead><tr><th v-for="heading in block.head" :key="heading" scope="col">{{ heading }}</th></tr></thead><tbody><tr v-for="(row, r) in block.rows" :key="r"><td v-for="(cell, c) in row" :key="c" :class="{ 'api-name': c === 0 }">{{ cell }}</td></tr></tbody></table></div>
        </div>
        <p v-if="copyError" role="status" class="copy-error">{{ copyError }}</p>
        <div class="page-pagination"><a v-if="previous" :href="`#${previous.id}`" @click.prevent="go(previous.id)"><small>← Previous</small>{{ previous.title }}</a><span v-else></span><a v-if="next" :href="`#${next.id}`" @click.prevent="go(next.id)" class="next-page"><small>Next →</small>{{ next.title }}</a></div>
        <footer class="article-footer"><p>Documentation for {{ content.package }} v{{ content.version }}</p><a :href="`https://github.com/SaqifHoque/${content.repo}/issues`" target="_blank" rel="noopener noreferrer">Report an issue ↗</a></footer>
      </article>
    </main>
  </div>
</template>
