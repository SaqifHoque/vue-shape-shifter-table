<template>
  <div class="container">
    <div class="row">
      <div class="col-md-12 table-fixed">
        <table class="table table-dark table-bordered mb-0 w-100">
          <thead>
              <th scope="col"  v-for="header in headers" :key="header.key" :class="[header.fixed, {  'selected-blue' : checkColumnHoverEvent(header.columnOrder) , 'selected-white': checkColumnSelectEvent(header.columnOrder)}]" @mouseover="hoverEvent(header)" @click="onShiftEvent(header)">
                <div v-if="!header.event" class="d-flex justify-content-between">
                  <div v-if="header.editable && !dragColumn">
                    <span
                      @click="initiateTextField('customHead_' + header.key)"
                      v-if="!checkClickEvent('customHead_' + header.key)"
                      class="tabledit-span">
                       {{ header.field }}
                      </span>
                    <input
                      v-if="checkClickEvent('customHead_' + header.key)"
                      @keydown.enter="checkField()"
                      @blur="saveField(header.key, header.field, header.editEvent, header.editKey)"
                      class="tabledit-input form-control input-sm"
                      type="text"
                      :name="'customHead_' + header.key"
                      v-model="header.field"
                      :ref="'customHead_' + header.key"
                    />
                  </div>
                  <div v-if="!header.editable || dragColumn">
                    <span 
                      class="tabledit-span">
                        {{ header.field }}
                    </span>
                  </div>
                  <div v-if="contextMenuColumn && !dragColumn">
                    <div class="dropdown-menu-wrapper">
                        <i class="icon-more_vert"></i>
                        <div class="dropdown-menu">
                          <a v-for="link in contextMenuColumn" :key="link.event" @click="handleContextEvent({ menu_id: header.key, event: link.event })">{{ link.text }}</a>
                        </div>
                      </div>
                  </div>
                </div>
                <td>
                <span v-if="rowPlus" @click="deleteColumn">d</span>
              </td>
              </th> 
              <th>
                <button v-if="columnPlus" @click.prevent="handleAddColumn" class="link-default-sm color-lighter-1">+</button>
              </th>
          </thead>
          <tbody>
            <tr v-for="(rows, index) in tableData" :key="index">
              <td :class="[row.fixed , {  'selected-blue' : checkHoverEvent(row),'selected-white': checkSelectEvent(row)}]" 
                v-for="(row, index) in rows"
                :key="index"
                @mouseover="hoverEvent(row)" @click="onShiftEvent(row)"
              >
                <div v-if="!row.event" class="d-flex justify-content-between">
                  <div v-if="row.editable && !dragColumn">
                    <span
                      @click="initiateTextField('customRow_' + index + '_' + row.key)"
                      v-if="!checkClickEvent('customRow_' + index + '_' + row.key)"
                      class="tabledit-span"
                      >{{ row.field }}</span
                    >
                    <input
                      v-if="checkClickEvent('customRow_' + index + '_' + row.key)"
                      @keydown.enter="checkField()"
                      @blur="saveField(row.key, row.field, row.editEvent, row.editKey)"
                      class="tabledit-input form-control input-sm"
                      type="text"
                      :name="'customRow_' + index + '_' + row.key"
                      v-model="row.field"
                      :ref="'customRow_' + index + '_' + row.key"
                    />
                  </div>
                  <div v-if="!row.editable || dragColumn">
                    <span 
                      class="tabledit-span"
                      >{{ row.field }}</span
                    >
                  </div>
                  <div v-if="contextMenuRow && !dragColumn">
                    <div class="dropdown-menu-wrapper">
                        <i class="icon-more_vert"></i>
                        <div class="dropdown-menu">
                          <a v-for="link in contextMenuRow" :key="link.event" @click="handleContextEvent({ menu_id: row.key, event: link.event })">{{ link.text }}</a>
                        </div>
                      </div>
                  </div>
                </div>
              </td>
              <td>
                <span v-if="rowPlus" @click="deleteRow">delete</span>
              </td>
            </tr>
            <tr>
              <!-- <td>
                <button v-if="rowPlus" @click.prevent="handleAddRow" class="link-default-sm color-lighter-1">+</button>
              </td>
              <span v-if="row.icon" @click="handleAction(row.eventName, row.key)" :class="row.icon"></span> -->

            </tr>
          </tbody>
          <tfoot>
            <tr v-for="footer in footers" :key="footer.key">
              <td :class="footer.fixed" :colspan=" calculateColSpan">
                <!-- <button @click.prevent="handleAction(footer.eventName)" class="link-default-sm  color-lighter-1">{{ footer.field }}</button
                > -->
                
              </td>
            </tr>
            <tr>
              <td>
                <button v-if="rowPlus" @click.prevent="handleAddRow" class="link-default-sm color-lighter-1" :disabled="headers.length === 0">+</button>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  </div>
</template>
<script>
export default {
  name: 'ShapeShifterTable',
  props: {
    headers: {
      type: Array,
      default: () => [],
    },
    tableData: {
      type: Array,
      default: () => [],
    },
    footers: {
      type: Array,
      default: () => [],
    },
    contextMenuColumn: {
      type: Array,
      default: () => [],
    },
    contextMenuRow: {
      type: Array,
      default: () => [],
    },
  },
  data() {
    return {
      selected: null,
      colSelected: null,
      rowSelected: null,
      columnHover: null,
      rowHover: null,
      dragColumn: false,
      dragRow: false,
      columnPlus: true,
      rowPlus: true,
      headerList: [],
      rowList: [],
    };
  },
  computed: {
    calculateColSpan(){
      if(this.headers.length > 12)
        return 12;
      else
        return this.headers.length;
    },
    checkClickEvent:function(){
      return (tableId) => this.selected === tableId;
    },
    checkColumnHoverEvent:function(){
      return(columnOrder) =>  this.columnHover === columnOrder && this.colSelected != this.columnHover && typeof(this.columnHover) != 'undefined'; 
    },
    checkColumnSelectEvent:function(){
      return(columnOrder) => this.colSelected === columnOrder;
    },
    checkRowHoverEvent:function(){
      return(rowOrder) =>  this.rowHover === rowOrder && this.rowSelected != this.rowHover && typeof(this.rowHover) != 'undefined' && this.dragRow; 
    },
     checkRowSelectEvent:function(){
      return(rowOrder) => this.rowSelected === rowOrder;
    },
    checkHoverEvent:function(){
      return (data) => this.checkColumnHoverEvent(data.columnOrder) || this.checkRowHoverEvent(data.rowOrder);
    },
    checkSelectEvent:function(){
      return (data) => this.checkColumnSelectEvent(data.columnOrder) || this.checkRowSelectEvent(data.rowOrder);
    }
  },
  methods: {
    hoverEvent(data){
      if(this.dragColumn){
        this.columnHover = data.columnOrder;
      } else if(this.dragRow){
        this.rowHover = data.rowOrder;
      }
    },
    onShiftEvent(data){
      if(this.dragColumn && !this.checkColumnSelectEvent(data.columnOrder) && typeof(data.columnOrder) != 'undefined'){
          this.$emit("shiftColumn", data, this.colSelected);
          this.colSelected = null;
          this.dragColumn = false;
          this.columnHover = null;
      } else if(this.dragRow && !this.checkRowSelectEvent(data.rowOrder) && typeof(data.columnOrder) != 'undefined'){
        this.$emit("shiftRow", data, this.rowSelected);
          this.rowSelected = null;
          this.dragRow = false;
          this.rowHover = null;
      } 
    },
    handleAddColumn(){
      this.headerList = this.headers;
      this.rowList = this.tableData;
       if(this.tableData.length == 0)
        this.headerList.push({ field: 'sample', key: 'col_' + this.headers.length, editable: true });
      else {
        this.headerList.push({ field: 'sample', key: 'col_' + this.headers.length, editable: true });
        this.rowList.map((row, index) => {
            return row.push({ field: 'sample', key: 'row_' + index + this.headers.length, editable: true });
        })  
      }
    },
    handleAddRow(){
      let row = [];
      this.headerList = this.headers;
      this.rowList = this.tableData;
      this.headerList.forEach((header, index) => {
        row.push({ field: 'sample', key: 'row_' + this.tableData.length + index, editable: true });
      })
      this.rowList.push(row);
    },
    handleContextEvent(contextEvent){
      if(contextEvent.event === 'shift_column'){
        let columnData = this.headers.filter(size => size.key === contextEvent.menu_id);
        this.colSelected = columnData[0].columnOrder;
        this.dragColumn = true;
      } else if ( contextEvent.event === 'shift_row'){
        let rowData = this.tableData.filter(rows => rows.every(row => row.key === contextEvent.menu_id));
        this.dragRow = true;
        this.rowSelected = rowData[0][0].rowOrder;
      } else 
        this.$emit("contextEvents", contextEvent);
    },
    initiateTextField(tableId) {
      this.selected = tableId;
      this.$nextTick(() => {
        const input = this.$refs[tableId];
        const element = Array.isArray(input) ? input[0] : input;
        element?.focus();
      });
    },
    saveField(key,value,editEvent,editKey) {
      this.selected = null;
      this.$emit(editEvent, { key: key, value: value, editKey: editKey });
    },
    checkField(){
      this.selected = null;
    },
    deleteRow() {
      this.rowList.splice(-1);
    },
    deleteColumn() {
      this.headerList.splice(-1);
      this.rowList.map((row) => {
        return row.splice(-1);
      })
    }
  }
};
</script>



<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.container {
  width: 100%;
  padding-right: 15px;
  padding-left: 15px;
  margin-right: auto;
  margin-left: auto;
}

.row {
  display: flex;
  flex-wrap: wrap;
  flex: 1 1 auto;
  margin-right: -12px;
  margin-left: -12px;
}

.col-md-12 {
  flex: 0 0 100%;
  max-width: 100%;
}

.table {
  width: 100%;
  margin-bottom: 1rem;
  color: #212529;
}

.table-fixed {
  max-width: 938px;
  max-height: 320px;
  min-height: auto;
  overflow: auto;
  position: relative;
  padding: 0px !important;
  margin: 0px 0px 0px auto;
}

.table-dark,
.table-dark > th,
.table-dark > td {
  background-color: #bcbcbe;
}
.table-dark th,
.table-dark td,
.table-dark thead th,
.table-dark tbody + tbody {
  border-color: #838387;
}

.table-bordered {
  border: 1px solid #dee2e6;
}
.table-bordered th,
.table-bordered td {
  border: 1px solid #dee2e6;
}
.table-bordered thead th,
.table-bordered thead td {
  border-bottom-width: 2px;
}

.mb-0 {
  margin-bottom: 0 !important;
}

.w-100 {
  width: 100% !important;
}

.table-fixed .table td.selected-blue,
.table-fixed .table th.selected-blue {
  border: 2.5px solid #0079ff !important;
  border-left: 2.5px solid #0079ff !important;
  border-top: 2.5px solid #0079ff !important;
}
.table-fixed .table td.selected-white,
.table-fixed .table th.selected-white {
  border: 2.5px solid white !important;
  border-left: 2.5px solid white !important;
  border-top: 2.5px solid white !important;
}

.d-flex {
  display: flex !important;
}

.justify-content-between {
  justify-content: space-between !important;
}

.form-control, .form-group input {
  display: block;
  width: 100%;
  height: calc(1.5em + 0.75rem + 2px);
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.5;
  color: #495057;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid #ced4da;
  border-radius: 0.25rem;
  transition: border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

 .menu {
  bottom: 0.75rem;
  right: 0.25rem;
  font-size: 1.25rem;
  cursor: pointer;
   position: absolute !important;
}

.icon-more_vert:before {
  content: "\EB4C";
}

.color-lighter-1 {
  color: #ffffff !important;
}

.link-default-sm {
  display: inline-block;
  font-weight: 400;
  color: #212529;
  text-align: center;
  vertical-align: middle;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  background-color: transparent;
  border: 1px solid transparent;
  padding: 0.375rem 0.75rem;
  font-size: 1rem;
  line-height: 1.5;
  border-radius: 0.25rem;
  transition: color 0.15s ease-in-out, background-color 0.15s ease-in-out, border-color 0.15s ease-in-out, box-shadow 0.15s ease-in-out;
}

.dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  z-index: 1000;
  display: none;
  float: left;
  min-width: 10rem;
  padding: 0.5rem 0;
  margin: 0.125rem 0 0;
  font-size: 1rem;
  color: #212529;
  text-align: left;
  list-style: none;
  background-color: #fff;
  background-clip: padding-box;
  border: 1px solid rgba(0, 0, 0, 0.15);
  border-radius: 0.25rem;
}

.dropdown-menu-wrapper:hover .dropdown-menu {
  display: flex !important;
}

.dropdown-menu-wrapper .dropdown-menu {
  border-top-left-radius: 0px;
  z-index: 1000 !important;
  background-color: #101018;
  color: #fff;
}
.dropdown-menu-wrapper .dropdown-menu a {
  cursor: pointer;
}
.dropdown-menu-wrapper .dropdown-menu a:hover {
  color: white;
}
.dropdown-menu-wrapper:hover .dropdown-menu {
  top: 50%;
  left: 50%;
  z-index: 1000 !important;
}
.dropdown-menu-wrapper:hover .dropdown-menu {
  width: 100%;
}

.table-fixed th .dropdown-menu-wrapper:hover .dropdown-menu {
  top: 90% !important;
  left: 40% !important;
  z-index: 1000 !important;
}

.table-fixed .fixed-left .dropdown-menu-wrapper:hover .dropdown-menu {
  top: -50% !important;
  left: 90% !important;
  z-index: 1000 !important;
}


/* .dropdown-menu-wrapper {
  font-size: 1rem !important;
  display: flex !important;
  flex-direction: column !important;
  margin: 0 !important;
   border-top-left-radius: 0px;
  z-index: 1000 !important;
  background-color: #101018;
  color: #fff;
  cursor: pointer;
  color: white;
  top: 50%;
  left: 50%;
  z-index: 1000 !important;
} */
</style>
