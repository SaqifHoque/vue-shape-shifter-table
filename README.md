# Vue Shape Shifter Table

An editable and responsive table component being modernized for Vue 3.

## Requirements

- Node.js 20.19 or newer for development
- Vue 3.3 or newer

## Development

```bash
npm install
npm run dev
```

Create a production build with:

```bash
npm run build
```

## Vue 3 migration

The project now uses Vue 3's `createApp` entry point, a Vue 3-compatible plugin installer, and Vite in place of Vue CLI. Existing header and row data retain the original cell-object format so later feature work can remain backward compatible.
