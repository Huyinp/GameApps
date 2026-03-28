<template>
  <div class="license-manage">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="游戏名称">
            <el-input v-model="searchForm.gameName" placeholder="请输入游戏名称" clearable />
          </el-form-item>
          <el-form-item label="版号">
            <el-input v-model="searchForm.licenseNumber" placeholder="请输入版号" clearable />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.gameType" placeholder="请选择" clearable style="width: 120px;">
              <el-option label="国产" value="国产" />
              <el-option label="进口" value="进口" />
            </el-select>
          </el-form-item>
          <el-form-item>
            <el-button type="primary" @click="handleSearch">
              <el-icon><Search /></el-icon>
              查询
            </el-button>
            <el-button @click="handleReset">
              <el-icon><Refresh /></el-icon>
              重置
            </el-button>
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="approval_number" label="批复文号" width="180" show-overflow-tooltip />
        <el-table-column prop="license_number" label="版号(ISBN)" width="150" show-overflow-tooltip />
        <el-table-column prop="game_name" label="游戏名称" min-width="180" show-overflow-tooltip />
        <el-table-column prop="category" label="申报类别" width="100" />
        <el-table-column prop="game_type" label="类型" width="70">
          <template #default="{ row }">
            <el-tag :type="row.game_type === '国产' ? 'success' : 'warning'">
              {{ row.game_type }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="publish_unit_name" label="出版单位" min-width="180" show-overflow-tooltip />
        <el-table-column prop="operate_unit_name" label="运营单位" min-width="180" show-overflow-tooltip />
        <el-table-column prop="approval_date" label="审批日期" width="120" />
        <el-table-column label="操作" width="150" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">
              编辑
            </el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrap">
        <el-pagination
          v-model:current-page="pagination.page"
          v-model:page-size="pagination.pageSize"
          :total="pagination.total"
          :page-sizes="[10, 20, 50, 100]"
          layout="total, sizes, prev, pager, next, jumper"
          @size-change="loadData"
          @current-change="loadData"
        />
      </div>

      <!-- 编辑对话框 -->
      <el-dialog v-model="dialogVisible" title="编辑版号信息" width="650px">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="批复文号">
            <el-input v-model="editForm.approval_number" />
          </el-form-item>
          <el-form-item label="版号(ISBN)">
            <el-input v-model="editForm.license_number" />
          </el-form-item>
          <el-form-item label="游戏名称">
            <el-input v-model="editForm.game_name" />
          </el-form-item>
          <el-form-item label="申报类别">
            <el-input v-model="editForm.category" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="editForm.game_type" style="width: 100%;">
              <el-option label="国产" value="国产" />
              <el-option label="进口" value="进口" />
            </el-select>
          </el-form-item>
          <el-form-item label="出版单位">
            <el-select v-model="editForm.publish_unit_id" placeholder="请选择" style="width: 100%;" filterable>
              <el-option
                v-for="unit in units"
                :key="unit.id"
                :label="unit.name"
                :value="unit.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="运营单位">
            <el-select v-model="editForm.operate_unit_id" placeholder="请选择" style="width: 100%;" filterable>
              <el-option
                v-for="unit in units"
                :key="unit.id"
                :label="unit.name"
                :value="unit.id"
              />
            </el-select>
          </el-form-item>
          <el-form-item label="审批日期">
            <el-date-picker
              v-model="editForm.approval_date"
              type="date"
              placeholder="选择日期"
              style="width: 100%;"
              value-format="YYYY-MM-DD"
            />
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
import { ref, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'

// 搜索表单
const searchForm = ref({
  gameName: '',
  licenseNumber: '',
  gameType: ''
})

// 表格数据
const tableData = ref<any[]>([])
const loading = ref(false)

// 分页
const pagination = ref({
  page: 1,
  pageSize: 20,
  total: 0
})

// 单位列表
const units = ref<any[]>([])

// 编辑对话框
const dialogVisible = ref(false)
const editForm = ref<any>({
  id: 0,
  approval_number: '',
  license_number: '',
  game_name: '',
  category: '',
  game_type: '',
  publish_unit_id: null,
  operate_unit_id: null,
  approval_date: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    let sql = 'SELECT gl.*, pu.name as publish_unit_name, ou.name as operate_unit_name FROM game_license gl LEFT JOIN unit pu ON gl.publish_unit_id = pu.id LEFT JOIN unit ou ON gl.operate_unit_id = ou.id WHERE 1=1'
    const params: any[] = []

    if (searchForm.value.gameName) {
      sql += ' AND gl.game_name LIKE ?'
      params.push(`%${searchForm.value.gameName}%`)
    }
    if (searchForm.value.licenseNumber) {
      sql += ' AND gl.license_number LIKE ?'
      params.push(`%${searchForm.value.licenseNumber}%`)
    }
    if (searchForm.value.gameType) {
      sql += ' AND gl.game_type = ?'
      params.push(searchForm.value.gameType)
    }

    // 获取总数
    const countSql = sql.replace('SELECT gl.*, pu.name as publish_unit_name, ou.name as operate_unit_name', 'SELECT COUNT(*) as count')
    const countResult = await window.electronAPI.database.query(countSql, params)
    pagination.value.total = countResult.data?.[0]?.count || 0

    // 获取分页数据
    sql += ` ORDER BY gl.approval_date DESC LIMIT ${pagination.value.pageSize} OFFSET ${(pagination.value.page - 1) * pagination.value.pageSize}`
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
    units.value = result.data || []
  }
}

// 搜索
const handleSearch = () => {
  pagination.value.page = 1
  loadData()
}

// 重置
const handleReset = () => {
  searchForm.value = {
    gameName: '',
    licenseNumber: '',
    gameType: ''
  }
  handleSearch()
}

// 编辑
const handleEdit = (row: any) => {
  editForm.value = { ...row }
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  try {
    const result = await window.electronAPI.database.update(
      'game_license',
      editForm.value.id,
      editForm.value
    )
    if (result.success) {
      ElMessage.success('保存成功')
      dialogVisible.value = false
      loadData()
    } else {
      ElMessage.error(result.error || '保存失败')
    }
  } catch (error) {
    ElMessage.error('保存失败')
  }
}

// 删除
const handleDelete = async (row: any) => {
  try {
    await ElMessageBox.confirm('确定要删除这条记录吗？', '提示', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.database.delete('game_license', row.id)
    if (result.success) {
      ElMessage.success('删除成功')
      loadData()
    } else {
      ElMessage.error(result.error || '删除失败')
    }
  } catch {
    // 用户取消
  }
}

onMounted(() => {
  loadData()
  loadUnits()
})
</script>

<style lang="scss" scoped>
.license-manage {
  .toolbar {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    margin-bottom: 16px;
  }
  
  .pagination-wrap {
    margin-top: 16px;
    display: flex;
    justify-content: flex-end;
  }
}
</style>
