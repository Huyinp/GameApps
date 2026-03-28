<template>
  <div class="data-analysis">
      <!-- 年份选择 -->
      <el-card class="year-selector">
        <el-form :inline="true">
          <el-form-item label="分析年份">
            <el-select v-model="selectedYear" placeholder="请选择年份" @change="handleYearChange" style="width: 150px;">
              <el-option
                v-for="y in availableYears"
                :key="y"
                :label="`${y}年`"
                :value="y"
              />
            </el-select>
          </el-form-item>
        </el-form>
      </el-card>

      <!-- 统计概览 -->
      <el-row :gutter="20" class="stat-row">
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.totalCount }}</div>
            <div class="stat-label">版号总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.domesticCount }}</div>
            <div class="stat-label">国产游戏</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.importedCount }}</div>
            <div class="stat-label">进口游戏</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="stat-card">
            <div class="stat-value">{{ stats.majorCompanyCount }}</div>
            <div class="stat-label">大厂版号</div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <!-- 月度趋势 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>月度审批趋势</span>
              </div>
            </template>
            <div ref="monthChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
        
        <!-- 类型分布 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>类型分布</span>
              </div>
            </template>
            <div ref="typeChartRef" style="height: 300px;"></div>
          </el-card>
        </el-col>
      </el-row>

      <el-row :gutter="20" style="margin-top: 20px;">
        <!-- 热门出版单位 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>热门出版单位 TOP10</span>
              </div>
            </template>
            <el-table :data="topPublishers" style="width: 100%" max-height="300" @row-click="handleRowClick">
              <el-table-column prop="name" label="单位名称" />
              <el-table-column prop="count" label="版号数量" width="100" />
            </el-table>
          </el-card>
        </el-col>
        
        <!-- 热门运营单位 -->
        <el-col :span="12">
          <el-card>
            <template #header>
              <div class="card-header">
                <span>热门运营单位 TOP10</span>
              </div>
            </template>
            <el-table :data="topOperators" style="width: 100%" max-height="300" @row-click="handleRowClick">
              <el-table-column prop="name" label="单位名称" />
              <el-table-column prop="count" label="版号数量" width="100" />
            </el-table>
          </el-card>
        </el-col>
      </el-row>

      <!-- 详情对话框 -->
      <el-dialog v-model="detailDialogVisible" title="版号详情" width="85%">
        <el-table :data="detailData" border stripe max-height="400">
          <el-table-column prop="approval_number" label="批复文号" width="180" show-overflow-tooltip />
          <el-table-column prop="license_number" label="版号(ISBN)" width="150" show-overflow-tooltip />
          <el-table-column prop="game_name" label="游戏名称" min-width="180" show-overflow-tooltip />
          <el-table-column prop="category" label="申报类别" width="100" />
          <el-table-column prop="game_type" label="类型" width="60" />
          <el-table-column prop="publish_unit_name" label="出版单位" min-width="180" show-overflow-tooltip />
          <el-table-column prop="operate_unit_name" label="运营单位" min-width="180" show-overflow-tooltip />
          <el-table-column prop="approval_date" label="审批日期" width="100" />
        </el-table>
      </el-dialog>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'
import { ElMessage } from 'element-plus'

// 当前年份
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

// 可选年份
const availableYears = computed(() => {
  const years: number[] = []
  for (let i = currentYear; i >= 2000; i--) {
    years.push(i)
  }
  return years
})

// 统计数据
const stats = ref({
  totalCount: 0,
  domesticCount: 0,
  importedCount: 0,
  majorCompanyCount: 0
})

// 图表引用
const monthChartRef = ref<HTMLElement>()
const typeChartRef = ref<HTMLElement>()

// 热门单位
const topPublishers = ref<any[]>([])
const topOperators = ref<any[]>([])

// 详情对话框
const detailDialogVisible = ref(false)
const detailData = ref<any[]>([])
const currentDetailUnit = ref('')

// 加载统计数据
const loadStats = async () => {
  const year = selectedYear.value
  
  // 全部
  let result = await window.electronAPI.database.query(
    `SELECT COUNT(*) as count FROM game_license WHERE approval_date LIKE '${year}%'`
  )
  stats.value.totalCount = result.data?.[0]?.count || 0

  // 国产
  result = await window.electronAPI.database.query(
    `SELECT COUNT(*) as count FROM game_license WHERE game_type = '国产' AND approval_date LIKE '${year}%'`
  )
  stats.value.domesticCount = result.data?.[0]?.count || 0

  // 进口
  result = await window.electronAPI.database.query(
    `SELECT COUNT(*) as count FROM game_license WHERE game_type = '进口' AND approval_date LIKE '${year}%'`
  )
  stats.value.importedCount = result.data?.[0]?.count || 0

  // 大厂
  result = await window.electronAPI.database.query(`
    SELECT COUNT(*) as count FROM game_license gl
    INNER JOIN company_unit_relation curb ON gl.publish_unit_id = curb.unit_id
    INNER JOIN company c ON curb.company_id = c.id
    WHERE c.is_major = 1 AND gl.approval_date LIKE '${year}%'
  `)
  stats.value.majorCompanyCount = result.data?.[0]?.count || 0
}

// 加载月度趋势
const loadMonthChart = async () => {
  await nextTick()
  if (!monthChartRef.value) return

  const chart = echarts.init(monthChartRef.value)
  const year = selectedYear.value

  const months: string[] = []
  const domesticData: number[] = []
  const importedData: number[] = []

  for (let i = 1; i <= 12; i++) {
    const month = i.toString().padStart(2, '0')
    months.push(`${i}月`)

    let result = await window.electronAPI.database.query(
      `SELECT COUNT(*) as count FROM game_license WHERE game_type = '国产' AND approval_date LIKE '${year}-${month}%'`
    )
    domesticData.push(result.data?.[0]?.count || 0)

    result = await window.electronAPI.database.query(
      `SELECT COUNT(*) as count FROM game_license WHERE game_type = '进口' AND approval_date LIKE '${year}-${month}%'`
    )
    importedData.push(result.data?.[0]?.count || 0)
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['国产', '进口']
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '国产',
        type: 'line',
        data: domesticData,
        smooth: true,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '进口',
        type: 'line',
        data: importedData,
        smooth: true,
        itemStyle: { color: '#e6a23c' }
      }
    ]
  })
}

// 加载类型分布图
const loadTypeChart = async () => {
  await nextTick()
  if (!typeChartRef.value) return

  const chart = echarts.init(typeChartRef.value)

  chart.setOption({
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    series: [
      {
        name: '类型分布',
        type: 'pie',
        radius: ['40%', '70%'],
        data: [
          { name: '国产', value: stats.value.domesticCount, itemStyle: { color: '#67c23a' } },
          { name: '进口', value: stats.value.importedCount, itemStyle: { color: '#e6a23c' } }
        ],
        label: {
          show: true,
          formatter: '{b}: {c}'
        }
      }
    ]
  })
}

// 加载热门单位
const loadTopUnits = async () => {
  const year = selectedYear.value

  // 热门出版单位
  let result = await window.electronAPI.database.query(`
    SELECT u.name, COUNT(*) as count 
    FROM game_license gl 
    INNER JOIN unit u ON gl.publish_unit_id = u.id 
    WHERE gl.approval_date LIKE '${year}%'
    GROUP BY u.id 
    ORDER BY count DESC 
    LIMIT 10
  `)
  topPublishers.value = result.data || []

  // 热门运营单位
  result = await window.electronAPI.database.query(`
    SELECT u.name, COUNT(*) as count 
    FROM game_license gl 
    INNER JOIN unit u ON gl.operate_unit_id = u.id 
    WHERE gl.approval_date LIKE '${year}%'
    GROUP BY u.id 
    ORDER BY count DESC 
    LIMIT 10
  `)
  topOperators.value = result.data || []
}

// 年份变化
const handleYearChange = async () => {
  await loadStats()
  await loadMonthChart()
  await loadTypeChart()
  await loadTopUnits()
}

// 查看详情
const handleRowClick = async (row: any) => {
  currentDetailUnit.value = row.name
  const year = selectedYear.value

  // 查询该单位的版号
  const result = await window.electronAPI.database.query(`
    SELECT gl.*, pu.name as publish_unit_name, ou.name as operate_unit_name
    FROM game_license gl
    LEFT JOIN unit pu ON gl.publish_unit_id = pu.id
    LEFT JOIN unit ou ON gl.operate_unit_id = ou.id
    WHERE (pu.name = '${row.name.replace(/'/g, "''")}' OR ou.name = '${row.name.replace(/'/g, "''")}')
    AND gl.approval_date LIKE '${year}%'
    ORDER BY gl.approval_date DESC
  `)

  if (result.success) {
    detailData.value = result.data || []
    detailDialogVisible.value = true
  }
}

onMounted(async () => {
  await handleYearChange()
})
</script>

<style lang="scss" scoped>
.data-analysis {
  .year-selector {
    margin-bottom: 20px;
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
}
</style>
