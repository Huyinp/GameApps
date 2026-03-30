<template>
  <div class="company-manage">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="厂商名称">
            <el-input v-model="searchForm.name" placeholder="请输入厂商名称" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="是否大厂">
            <el-select v-model="searchForm.isMajor" placeholder="请选择" clearable style="width: 120px;">
              <el-option label="是" :value="1" />
              <el-option label="否" :value="0" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button type="success" @click="handleAdd">
              <el-icon><Plus /></el-icon>
              新增
            </el-button>
            <el-button type="warning" @click="handleExportBackup" :loading="exportLoading">
              <el-icon><Download /></el-icon>
              导出备份
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 厂商列表（拖拽关联模式） -->
      <div class="company-layout">
        <!-- 未关联单位列表 -->
        <div class="units-panel">
          <div class="panel-header">
            <span>未关联单位</span>
            <el-input
              v-model="unitSearch"
              placeholder="搜索单位"
              size="small"
              style="width: 150px;"
              clearable
            />
          </div>
          <div class="units-list">
            <div
              v-for="unit in filteredUnlinkedUnits"
              :key="unit.id"
              class="unit-item draggable"
              draggable="true"
              @dragstart="handleDragStart($event, unit)"
            >
              <el-icon><School /></el-icon>
              <span>{{ unit.name }}</span>
              <el-tag size="small" :type="unit.type === '出版' ? 'primary' : 'success'">
                {{ unit.type }}
              </el-tag>
            </div>
            <el-empty v-if="filteredUnlinkedUnits.length === 0" description="暂无未关联单位" />
          </div>
        </div>

        <!-- 厂商列表 -->
        <div class="companies-panel">
          <el-table :data="tableData" v-loading="loading" border stripe>
            <el-table-column prop="id" label="ID" width="60" />
            <el-table-column prop="short_name" label="简称" width="100" />
            <el-table-column prop="full_name" label="全称" min-width="200" show-overflow-tooltip />
            <el-table-column prop="is_major" label="大厂" width="80">
              <template #default="{ row }">
                <el-tag :type="row.is_major ? 'danger' : 'info'" size="small">
                  {{ row.is_major ? '是' : '否' }}
                </el-tag>
              </template>
            </el-table-column>
            <el-table-column label="关联单位" min-width="180">
              <template #default="{ row }">
                <div 
                  class="relation-tags"
                  @dragover.prevent
                  @drop="handleDrop($event, row.id)"
                >
                  <el-tag
                    v-for="rel in getCompanyRelations(row.id)"
                    :key="rel.unit_id"
                    size="small"
                    closable
                    @close="handleRemoveRelation(rel.id)"
                    :type="rel.relation_type === '出版' ? 'primary' : 'success'"
                  >
                    {{ rel.unit_name }}
                  </el-tag>
                  <span v-if="getCompanyRelations(row.id).length === 0" class="no-relation">
                    拖拽单位到此处
                  </span>
                </div>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="120" fixed="right">
              <template #default="{ row }">
                <el-dropdown @command="(cmd: string) => handleCommand(cmd, row)">
                  <el-button link type="primary" size="small">
                    更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
                  </el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item command="edit">编辑</el-dropdown-item>
                      <el-dropdown-item command="delete">删除</el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>
              </template>
            </el-table-column>
          </el-table>

          <!-- 分页 -->
          <div class="pagination-wrap">
            <el-pagination
              v-model:current-page="pagination.page"
              v-model:page-size="pagination.pageSize"
              :total="pagination.total"
              :page-sizes="[10, 20, 50]"
              layout="total, sizes, prev, pager, next"
              @size-change="loadData"
              @current-change="loadData"
            />
          </div>
        </div>
      </div>

      <!-- 编辑对话框 -->
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑厂商' : '新增厂商'" width="500px">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="厂商全称" required>
            <el-input v-model="editForm.full_name" placeholder="请输入厂商全称" />
          </el-form-item>
          <el-form-item label="厂商简称">
            <el-input v-model="editForm.short_name" placeholder="请输入厂商简称" />
          </el-form-item>
          <el-form-item label="是否大厂">
            <el-switch v-model="editForm.is_major" :active-value="1" :inactive-value="0" />
          </el-form-item>
        </el-form>
        <template #footer>
          <el-button @click="dialogVisible = false">取消</el-button>
          <el-button type="primary" @click="handleSave">确定</el-button>
        </template>
      </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = ref({
  name: '',
  isMajor: null as number | null
})

// 单位搜索
const unitSearch = ref('')

// 表格数据
const tableData = ref<any[]>([])
const loading = ref(false)
const exportLoading = ref(false)

// 所有单位
const allUnits = ref<any[]>([])

// 厂商-单位关联关系
const relations = ref<any[]>([])

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 编辑对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const editForm = ref({
  id: 0,
  full_name: '',
  short_name: '',
  is_major: 0
})

// 未关联单位
const unlinkedUnits = computed(() => {
  const linkedUnitIds = new Set(relations.value.map(r => r.unit_id))
  return allUnits.value.filter(u => !linkedUnitIds.has(u.id))
})

// 过滤后的未关联单位
const filteredUnlinkedUnits = computed(() => {
  if (!unitSearch.value) return unlinkedUnits.value
  return unlinkedUnits.value.filter(u => 
    u.name.toLowerCase().includes(unitSearch.value.toLowerCase())
  )
})

// 获取厂商的关联关系
const getCompanyRelations = (companyId: number) => {
  return relations.value
    .filter(r => r.company_id === companyId)
    .map(r => {
      const unit = allUnits.value.find(u => u.id === r.unit_id)
      return {
        ...r,
        unit_name: unit?.name || ''
      }
    })
}

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    let sql = 'SELECT * FROM company WHERE 1=1'
    const params: any[] = []

    if (searchForm.value.name) {
      sql += ' AND (full_name LIKE ? OR short_name LIKE ?)'
      params.push(`%${searchForm.value.name}%`, `%${searchForm.value.name}%`)
    }
    if (searchForm.value.isMajor !== null) {
      sql += ' AND is_major = ?'
      params.push(searchForm.value.isMajor)
    }

    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count')
    const countResult = await window.electronAPI.database.query(countSql, params)
    pagination.value.total = countResult.data?.[0]?.count || 0

    // 获取分页数据
    sql += ` ORDER BY is_major DESC, id DESC LIMIT ${pagination.value.pageSize} OFFSET ${(pagination.value.page - 1) * pagination.value.pageSize}`
    const result = await window.electronAPI.database.query(sql, params)
    
    if (result.success) {
      tableData.value = result.data || []
    }
  } catch (error) {
    console.error('加载数据失败:', error)
    ElMessage.error('加载数据失败')
  } finally {
    loading.value = false
  }
}

// 加载单位列表
const loadUnits = async () => {
  const result = await window.electronAPI.database.getAll('unit')
  if (result.success) {
    allUnits.value = result.data || []
  }
}

// 加载关联关系
const loadRelations = async () => {
  const sql = `
    SELECT cur.*, u.name as unit_name 
    FROM company_unit_relation cur 
    LEFT JOIN unit u ON cur.unit_id = u.id
  `
  const result = await window.electronAPI.database.query(sql)
  if (result.success) {
    relations.value = result.data || []
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

// 新增
const handleAdd = () => {
  isEdit.value = false
  editForm.value = {
    id: 0,
    full_name: '',
    short_name: '',
    is_major: 0
  }
  dialogVisible.value = true
}

// 导出大厂关联数据备份
const handleExportBackup = async () => {
  exportLoading.value = true
  try {
    const result = await window.electronAPI.database.exportMajorCompanyBackup()
    if (result.success && result.data) {
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: 'application/json' })
      const link = document.createElement('a')
      const timestamp = new Date().toISOString().slice(0, 10)
      link.download = `大厂关联数据备份_${timestamp}.json`
      link.href = URL.createObjectURL(blob)
      link.click()
      URL.revokeObjectURL(link.href)
      ElMessage.success('导出成功')
    } else {
      ElMessage.error('导出失败: ' + (result.error || '未知错误'))
    }
  } catch (error) {
    console.error('导出失败:', error)
    ElMessage.error('导出失败')
  } finally {
    exportLoading.value = false
  }
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  editForm.value = { ...row }
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!editForm.value.full_name) {
    ElMessage.warning('请输入厂商全称')
    return
  }

  try {
    let result
    if (isEdit.value) {
      result = await window.electronAPI.database.update('company', editForm.value.id, {
        full_name: editForm.value.full_name,
        short_name: editForm.value.short_name,
        is_major: editForm.value.is_major
      })
    } else {
      result = await window.electronAPI.database.insert('company', {
        full_name: editForm.value.full_name,
        short_name: editForm.value.short_name,
        is_major: editForm.value.is_major
      })
    }

    if (result.success) {
      ElMessage.success(isEdit.value ? '更新成功' : '添加成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '操作失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '操作失败')
  }
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这个厂商吗？', '提示', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.database.delete('company', row.id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
      loadRelations()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

// 下拉菜单命令
const handleCommand = (command: string, row: any) => {
  if (command === 'edit') {
    handleEdit(row)
  } else if (command === 'delete') {
    handleDelete(row)
  }
}

// 拖拽开始
const handleDragStart = (event: DragEvent, unit: any) => {
  if (event.dataTransfer) {
    event.dataTransfer.setData('unitId', unit.id.toString())
    event.dataTransfer.setData('unitName', unit.name)
    event.dataTransfer.effectAllowed = 'link'
  }
}

// 处理放置事件
const handleDrop = async (event: DragEvent, companyId: number) => {
  if (event.dataTransfer) {
    const unitId = parseInt(event.dataTransfer.getData('unitId'))
    if (unitId) {
      await handleTableDrop(companyId, unitId)
    }
  }
}

// 表格行作为放置目标 - 通过事件委托处理
const handleTableDrop = async (companyId: number, unitId: number) => {
  try {
    // 检查是否已关联
    const existing = relations.value.find(
      r => r.company_id === companyId && r.unit_id === unitId
    )
    if (existing) {
      ElMessage.warning('该单位已关联到此厂商')
      return
    }

    const result = await window.electronAPI.database.insert('company_unit_relation', {
      company_id: companyId,
      unit_id: unitId,
      relation_type: '出版'
    })

    if (result.success) {
      ElMessage.success('关联成功')
      loadRelations()
    } else {
      ElMessage.error(result.error || '关联失败')
    }
  } catch (error: any) {
    ElMessage.error(error.message || '关联失败')
  }
}

// 移除关联
const handleRemoveRelation = async (relationId: number) => {
  try {
    await ElMessageBox.confirm('确定要移除此关联吗？', '提示', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.database.delete('company_unit_relation', relationId)
    if (result.success) {
      ElMessage.success('移除成功')
      loadRelations()
    } else {
      ElMessage.error(result.error || '移除失败')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadData()
  loadUnits()
  loadRelations()
})
</script>

<style lang="scss" scoped>
.company-manage {
  .toolbar {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .company-layout {
    display: flex;
    gap: 16px;
    
    .units-panel {
      width: 300px;
      background: #fff;
      border-radius: 8px;
      padding: 16px;
      flex-shrink: 0;
      
      .panel-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 12px;
        font-weight: 500;
      }
      
      .units-list {
        max-height: calc(100vh - 350px);
        overflow-y: auto;
        
        .unit-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 10px;
          border: 1px solid #e6e6e6;
          border-radius: 6px;
          margin-bottom: 8px;
          cursor: grab;
          transition: all 0.2s;
          
          &:hover {
            border-color: #409eff;
            background: #f5f7fa;
          }
          
          span {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }
        }
      }
    }
    
    .companies-panel {
      flex: 1;
      
      .relation-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        min-height: 24px;
        padding: 4px;
        border-radius: 4px;
        transition: background-color 0.2s;
        
        &:hover {
          background-color: #f5f7fa;
        }
        
        .no-relation {
          color: #c0c4cc;
          font-size: 12px;
        }
      }
    }
  }
  
  .pagination-wrap {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
