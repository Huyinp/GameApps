<template>
  <div class="monthly-license">
    <!-- 月份选择（不包含在截图中） -->
    <el-card class="year-selector">
      <el-form :inline="true">
        <el-form-item label="选择月份">
          <el-date-picker
            v-model="selectedMonth"
            type="month"
            placeholder="请选择月份"
            format="YYYY年MM月"
            value-format="YYYY-MM"
            @change="handleMonthChange"
            style="width: 180px;"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleMonthChange">查询</el-button>
        </el-form-item>
        <el-form-item>
          <el-button type="success" @click="handleExportImage" :loading="exportLoading">
            <el-icon><Picture /></el-icon>
            生成长图
          </el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- 截图内容 -->
    <div ref="captureRef">
      <!-- 标题 -->
      <div class="capture-title">{{ monthTitle }}游戏版号发放详情</div>

      <!-- 统计信息 -->
      <el-row :gutter="20" class="stat-row">
        <el-col :span="12">
          <div class="stat-card">
            <div class="stat-value">{{ monthlyStats.domesticCount }}</div>
            <div class="stat-label">国产游戏版号数</div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="stat-card">
            <div class="stat-value">{{ monthlyStats.importedCount }}</div>
            <div class="stat-label">进口游戏版号数</div>
          </div>
        </el-col>
      </el-row>

      <!-- 国产游戏列表 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span style="color: #67c23a; font-weight: bold;">国产网络游戏审批信息</span>
            <span style="color: #909399; font-weight: normal; margin-left: 10px;">共 {{ monthlyStats.domesticCount }} 条</span>
          </div>
        </template>
        <el-table :data="domesticData" border stripe :row-class-name="getMajorCompanyRowClass" v-loading="domesticLoading">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="game_name" label="游戏名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="license_number" label="版号" width="140" show-overflow-tooltip />
          <el-table-column prop="category" label="类别" width="80" />
          <el-table-column prop="publish_unit_name" label="出版单位" min-width="150" show-overflow-tooltip />
          <el-table-column prop="operate_unit_name" label="运营单位" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-card>

      <!-- 进口游戏列表 -->
      <el-card style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span style="color: #e6a23c; font-weight: bold;">进口网络游戏审批信息</span>
            <span style="color: #909399; font-weight: normal; margin-left: 10px;">共 {{ monthlyStats.importedCount }} 条</span>
          </div>
        </template>
        <el-table :data="importedData" border stripe :row-class-name="getMajorCompanyRowClass" v-loading="importedLoading">
          <el-table-column type="index" label="序号" width="60" align="center" />
          <el-table-column prop="game_name" label="游戏名称" min-width="150" show-overflow-tooltip />
          <el-table-column prop="license_number" label="版号" width="140" show-overflow-tooltip />
          <el-table-column prop="category" label="类别" width="80" />
          <el-table-column prop="publish_unit_name" label="出版单位" min-width="150" show-overflow-tooltip />
          <el-table-column prop="operate_unit_name" label="运营单位" min-width="150" show-overflow-tooltip />
        </el-table>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'

// 月份选择
const selectedMonth = ref('')
const captureRef = ref<HTMLElement>()
const exportLoading = ref(false)

// 标题
const monthTitle = computed(() => {
  if (!selectedMonth.value) return ''
  const [year, month] = selectedMonth.value.split('-')
  return `${year}年${parseInt(month)}月`
})

// 数据
const monthlyStats = ref({
  domesticCount: 0,
  importedCount: 0
})
const domesticData = ref<any[]>([])
const importedData = ref<any[]>([])
const domesticLoading = ref(false)
const importedLoading = ref(false)

// 月份变化
const handleMonthChange = async () => {
  if (!selectedMonth.value) return
  await loadMonthlyData()
}

// 加载月度详情数据
const loadMonthlyData = async () => {
  if (!selectedMonth.value) return
  
  const monthPrefix = selectedMonth.value + '%'
  
  // 加载国产游戏
  domesticLoading.value = true
  try {
    const domesticResult = await window.electronAPI.database.query(`
      SELECT gl.*, pu.name as publish_unit_name, ou.name as operate_unit_name,
        CASE WHEN EXISTS (
          SELECT 1 FROM company_unit_relation curb
          INNER JOIN company c ON curb.company_id = c.id
          WHERE curb.unit_id = gl.publish_unit_id AND c.is_major = 1
        ) THEN 1 ELSE 0 END as is_major_publish,
        CASE WHEN EXISTS (
          SELECT 1 FROM company_unit_relation curb
          INNER JOIN company c ON curb.company_id = c.id
          WHERE curb.unit_id = gl.operate_unit_id AND c.is_major = 1
        ) THEN 1 ELSE 0 END as is_major_operate
      FROM game_license gl
      LEFT JOIN unit pu ON gl.publish_unit_id = pu.id
      LEFT JOIN unit ou ON gl.operate_unit_id = ou.id
      WHERE gl.game_type = '国产' AND gl.approval_date LIKE '${monthPrefix}'
      ORDER BY gl.approval_date DESC, gl.id DESC
    `)
    domesticData.value = domesticResult.data || []
    monthlyStats.value.domesticCount = domesticData.value.length
  } finally {
    domesticLoading.value = false
  }
  
  // 加载进口游戏
  importedLoading.value = true
  try {
    const importedResult = await window.electronAPI.database.query(`
      SELECT gl.*, pu.name as publish_unit_name, ou.name as operate_unit_name,
        CASE WHEN EXISTS (
          SELECT 1 FROM company_unit_relation curb
          INNER JOIN company c ON curb.company_id = c.id
          WHERE curb.unit_id = gl.publish_unit_id AND c.is_major = 1
        ) THEN 1 ELSE 0 END as is_major_publish,
        CASE WHEN EXISTS (
          SELECT 1 FROM company_unit_relation curb
          INNER JOIN company c ON curb.company_id = c.id
          WHERE curb.unit_id = gl.operate_unit_id AND c.is_major = 1
        ) THEN 1 ELSE 0 END as is_major_operate
      FROM game_license gl
      LEFT JOIN unit pu ON gl.publish_unit_id = pu.id
      LEFT JOIN unit ou ON gl.operate_unit_id = ou.id
      WHERE gl.game_type = '进口' AND gl.approval_date LIKE '${monthPrefix}'
      ORDER BY gl.approval_date DESC, gl.id DESC
    `)
    importedData.value = importedResult.data || []
    monthlyStats.value.importedCount = importedData.value.length
  } finally {
    importedLoading.value = false
  }
}

// 大厂商行样式
const getMajorCompanyRowClass = ({ row }: { row: any }) => {
  if (row.is_major_publish === 1 || row.is_major_operate === 1) {
    return 'major-company-row'
  }
  return ''
}

// 生成长图
const handleExportImage = async () => {
  if (!captureRef.value) return
  
  exportLoading.value = true
  try {
    // 创建canvas
    const canvas = await html2canvas(captureRef.value, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    })
    
    // 转换为图片
    const link = document.createElement('a')
    link.download = `游戏版号_${monthTitle.value}发放详情.png`
    link.href = canvas.toDataURL('image/png')
    link.click()
    
    ElMessage.success('长图生成成功')
  } catch (error) {
    console.error('生成图片失败:', error)
    ElMessage.error('生成图片失败')
  } finally {
    exportLoading.value = false
  }
}

onMounted(async () => {
  // 默认选择当前月份
  const now = new Date()
  selectedMonth.value = `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`
  await loadMonthlyData()
})
</script>

<style lang="scss" scoped>
.monthly-license {
  .year-selector {
    margin-bottom: 20px;
  }
  
  .capture-title {
    font-size: 24px;
    font-weight: bold;
    text-align: center;
    padding: 20px 0;
    color: #303133;
  }
  
  .stat-row {
    margin-bottom: 20px;
  }
  
  .stat-card {
    background: #fff;
    border-radius: 8px;
    padding: 24px;
    text-align: center;
    
    .stat-value {
      font-size: 32px;
      font-weight: bold;
      color: #303133;
    }
    
    .stat-label {
      font-size: 14px;
      color: #909399;
      margin-top: 8px;
    }
  }
  
  .card-header {
    font-weight: 500;
  }
  
  :deep(.major-company-row) {
    font-weight: bold;
  }
}
</style>
