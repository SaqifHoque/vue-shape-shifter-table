import ShapeShifterTable from './components/ShapeShifterTable.vue'

const ShapeShifterTablePlugin = {
  install(app) {
    app.component('ShapeShifterTable', ShapeShifterTable)
  },
}

export { ShapeShifterTable }
export { applyColumnOrder } from './columnOrder.js'
export default ShapeShifterTablePlugin
