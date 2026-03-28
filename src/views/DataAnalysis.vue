<template>
  <div class="data-analysis">
      <!-- 标签页切换 -->
      <el-card class="year-selector">
        <el-tabs v-model="activeTab" @tab-change="handleTabChange">
          <el-tab-pane label="单年份分析" name="single">
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
          </el-tab-pane>
          
          <el-tab-pane label="多年份比较" name="compare">
            <el-form :inline="true">
              <el-form-item label="选择年份">
                <el-select 
                  v-model="selectedYears" 
                  multiple 
                  placeholder="请选择年份（多选）" 
                  @change="handleCompareChange"
                  style="width: 300px;"
                  collapse-tags
                  collapse-tags-tooltip
                >
                  <el-option
                    v-for="y in availableYears"
                    :key="y"
                    :label="`${y}年`"
                    :value="y"
                  />
                </el-select>
              </el-form-item>
              <el-form-item label="游戏类型">
                <el-radio-group v-model="compareGameType" @change="handleCompareChange">
                  <el-radio label="all">全部</el-radio>
                  <el-radio label="国产">国产</el-radio>
                  <el-radio label="进口">进口</el-radio>
                </el-radio-group>
              </el-form-item>
            </el-form>
          </el-tab-pane>
        </el-tabs>
      </el-card>

      <!-- 单年份分析内容 -->
      <div v-show="activeTab === 'single'">
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
      </div>

      <!-- 多年份比较内容 -->
      <div v-show="activeTab === 'compare'">
        <el-row :gutter="20">
          <!-- 国产游戏比较 -->
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>国产游戏月度审批对比</span>
                </div>
              </template>
              <div ref="compareDomesticChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
          
          <!-- 进口游戏比较 -->
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>进口游戏月度审批对比</span>
                </div>
              </template>
              <div ref="compareImportedChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 总计对比 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>年度总量对比</span>
                </div>
              </template>
              <div ref="compareTotalChartRef" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>
      </div>

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

// 标签页
const activeTab = ref('single')

// 多年份比较
const selectedYears = ref<number[]>([])
const compareGameType = ref('all')

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

// 多年份比较图表引用
const compareDomesticChartRef = ref<HTMLElement>()
const compareImportedChartRef = ref<HTMLElement>()
const compareTotalChartRef = ref<HTMLElement>()

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

// 标签页切换
const handleTabChange = async (tab: string) => {
  if (tab === 'compare') {
    await nextTick()
    // 默认选择近两年
    if (selectedYears.value.length === 0) {
      selectedYears.value = [currentYear, currentYear - 1]
    }
    await loadCompareCharts()
  }
}

// 多年份比较变化
const handleCompareChange = async () => {
  await loadCompareCharts()
}

// 加载多年份比较图表
const loadCompareCharts = async () => {
  if (selectedYears.value.length === 0) return

  await nextTick()
  
  // 加载国产比较
  if (compareDomesticChartRef.value) {
    await loadCompareChart('domestic')
  }
  
  // 加载进口比较
  if (compareImportedChartRef.value) {
    await loadCompareChart('imported')
  }
  
  // 加载总量对比
  if (compareTotalChartRef.value) {
    await loadTotalCompareChart()
  }
}

// 加载单类型多年份比较
const loadCompareChart = async (type: 'domestic' | 'imported') => {
  const chartRef = type === 'domestic' ? compareDomesticChartRef : compareImportedChartRef
  if (!chartRef.value) return

  const chart = echarts.init(chartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const series: any[] = []
  
  // 颜色配置
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
  
  // 获取每个年份的数据
  for (let i = 0; i < selectedYears.value.length; i++) {
    const year = selectedYears.value[i]
    const data: number[] = []
    
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      const gameType = type === 'domestic' ? '国产' : '进口'
      
      let result
      if (compareGameType.value === 'all') {
        result = await window.electronAPI.database.query(
          `SELECT COUNT(*) as count FROM game_license WHERE game_type = '${gameType}' AND approval_date LIKE '${year}-${monthStr}%'`
        )
      } else {
        result = await window.electronAPI.database.query(
          `SELECT COUNT(*) as count FROM game_license WHERE game_type = '${compareGameType.value}' AND approval_date LIKE '${year}-${monthStr}%'`
        )
      }
      data.push(result.data?.[0]?.count || 0)
    }
    
    series.push({
      name: `${year}年`,
      type: 'line',
      data: data,
      smooth: true,
      itemStyle: { color: colors[i % colors.length] }
    })
  }

  const typeLabel = type === 'domestic' ? '国产' : '进口'
  
  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: selectedYears.value.map(y => `${y}年`)
    },
    xAxis: {
      type: 'category',
      data: months
    },
    yAxis: {
      type: 'value'
    },
    series
  })
}

// 加载年度总量对比
const loadTotalCompareChart = async () => {
  if (!compareTotalChartRef.value) return

  const chart = echarts.init(compareTotalChartRef.value)
  
  const years = selectedYears.value.map(y => `${y}年`)
  const domesticData: number[] = []
  const importedData: number[] = []
  const totalData: number[] = []
  
  for (const year of selectedYears.value) {
    // 国产总数
    let result = await window.electronAPI.database.query(
      `SELECT COUNT(*) as count FROM game_license WHERE game_type = '国产' AND approval_date LIKE '${year}%'`
    )
    const domestic = result.data?.[0]?.count || 0
    domesticData.push(domestic)
    
    // 进口总数
    result = await window.electronAPI.database.query(
      `SELECT COUNT(*) as count FROM game_license WHERE game_type = '进口' AND approval_date LIKE '${year}%'`
    )
    const imported = result.data?.[0]?.count || 0
    importedData.push(imported)
    
    // 总数
    totalData.push(domestic + imported)
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['国产', '进口', '总计']
    },
    xAxis: {
      type: 'category',
      data: years
    },
    yAxis: {
      type: 'value'
    },
    series: [
      {
        name: '国产',
        type: 'bar',
        data: domesticData,
        itemStyle: { color: '#67c23a' }
      },
      {
        name: '进口',
        type: 'bar',
        data: importedData,
        itemStyle: { color: '#e6a23c' }
      },
      {
        name: '总计',
        type: 'line',
        data: totalData,
        smooth: true,
        itemStyle: { color: '#409eff' }
      }
    ]
  })
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
