<template>
  <div class="unit-manage">
      <!-- 搜索栏 -->
      <div class="toolbar">
        <el-form :inline="true" :model="searchForm">
          <el-form-item label="单位名称">
            <el-input v-model="searchForm.name" placeholder="请输入单位名称" clearable style="width: 200px;" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="searchForm.type" placeholder="请选择" clearable style="width: 120px;">
              <el-option label="出版" value="出版" />
              <el-option label="运营" value="运营" />
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
          </el-form-item>
        </el-form>
      </div>

      <!-- 数据表格 -->
      <el-table :data="tableData" v-loading="loading" border stripe>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="单位名称" min-width="250" show-overflow-tooltip />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.type === '出版' ? 'primary' : 'success'">
              {{ row.type || '未分类' }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="created_at" label="创建时间" width="180" />
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
      <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑单位' : '新增单位'" width="500px">
        <el-form :model="editForm" label-width="100px">
          <el-form-item label="单位名称" required>
            <el-input v-model="editForm.name" placeholder="请输入单位名称" />
          </el-form-item>
          <el-form-item label="类型">
            <el-select v-model="editForm.type" placeholder="请选择" style="width: 100%;">
              <el-option label="出版" value="出版" />
              <el-option label="运营" value="运营" />
              <el-option label="出版/运营" value="出版/运营" />
            </el-select>
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
  name: '',
  type: ''
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

// 编辑对话框
const dialogVisible = ref(false)
const isEdit = ref(false)
const editForm = ref({
  id: 0,
  name: '',
  type: ''
})

// 加载数据
const loadData = async () => {
  loading.value = true
  try {
    let sql = 'SELECT * FROM unit WHERE 1=1'
    const params: any[] = []

    if (searchForm.value.name) {
      sql += ' AND name LIKE ?'
      params.push(`%${searchForm.value.name}%`)
    }
    if (searchForm.value.type) {
      sql += ' AND type = ?'
      params.push(searchForm.value.type)
    }

    // 获取总数
    const countSql = sql.replace('SELECT *', 'SELECT COUNT(*) as count')
    const countResult = await window.electronAPI.database.query(countSql, params)
    pagination.value.total = countResult.data?.[0]?.count || 0

    // 获取分页数据
    sql += ` ORDER BY id DESC LIMIT ${pagination.value.pageSize} OFFSET ${(pagination.value.page - 1) * pagination.value.pageSize}`
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
    name: '',
    type: ''
  }
  dialogVisible.value = true
}

// 编辑
const handleEdit = (row: any) => {
  isEdit.value = true
  editForm.value = { ...row }
  dialogVisible.value = true
}

// 保存
const handleSave = async () => {
  if (!editForm.value.name) {
    ElMessage.warning('请输入单位名称')
    return
  }

  try {
    let result
    if (isEdit.value) {
      result = await window.electronAPI.database.update('unit', editForm.value.id, {
        name: editForm.value.name,
        type: editForm.value.type
      })
    } else {
      result = await window.electronAPI.database.insert('unit', {
        name: editForm.value.name,
        type: editForm.value.type
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
    await ElMessageBox.confirm('确定要删除这个单位吗？', '提示', {
      type: 'warning'
    })
    
    const result = await window.electronAPI.database.delete('unit', row.id)
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
})
</script>

<style lang="scss" scoped>
.unit-manage {
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
