import ShapeShifterTable from './components/ShapeShifterTable.vue'

const ShapeShifterTablePlugin = {
  install(app) {
    app.component('ShapeShifterTable', ShapeShifterTable)
  },
}

export { ShapeShifterTable }
export default ShapeShifterTablePlugin
