# Vue Shapeshifter Table

A lightweight, editable table component for Vue 3.

## Install

```bash
npm install vue-shapeshifter-table
```

Register the plugin globally:

```js
import { createApp } from 'vue'
import ShapeshifterTable from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'
import App from './App.vue'

createApp(App).use(ShapeshifterTable).mount('#app')
```

Or import the component directly:

```vue
<script setup>
import { ref } from 'vue'
import { ShapeShifterTable } from 'vue-shapeshifter-table'
import 'vue-shapeshifter-table/style.css'

const headers = ref([
  { field: 'Name', key: 'name', editable: true },
])

const rows = ref([
  [{ field: 'Maya', key: 'maya-name', editable: true }],
])
</script>

<template>
  <ShapeShifterTable :headers="headers" :table-data="rows" />
</template>
```

## Development

Development requires Node.js 20.19 or newer.

```bash
npm install
npm run dev
npm run build
npm run build:demo
npm run preview
```

`npm run build` creates the externalized, ESM-only library bundle in `dist/`. `npm run build:demo` creates the standalone demonstration site in `demo-dist/`, and `npm run preview` serves that site. The two builds keep their output separate.

`npm pack` rebuilds the library automatically before creating the package archive.

## License

MIT
