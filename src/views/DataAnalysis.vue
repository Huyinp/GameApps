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
              <el-form-item>
                <el-button type="success" @click="handleExportSingle" :loading="exportLoading">
                  <el-icon><Picture /></el-icon>
                  生成长图
                </el-button>
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
              <el-form-item>
                <el-button type="success" @click="handleExportCompare" :loading="exportLoading">
                  <el-icon><Picture /></el-icon>
                  生成长图
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

          <el-tab-pane label="大厂分析" name="major">
            <el-form :inline="true">
              <el-form-item label="选择年份">
                <el-select 
                  v-model="majorYears" 
                  multiple 
                  placeholder="请选择年份（多选）" 
                  @change="handleMajorChange"
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
              <el-form-item>
                <el-button type="success" @click="handleExportMajor" :loading="exportLoading">
                  <el-icon><Picture /></el-icon>
                  生成长图
                </el-button>
              </el-form-item>
            </el-form>
          </el-tab-pane>

        </el-tabs>
      </el-card>

      <!-- 单年份分析内容 -->
      <div v-show="activeTab === 'single'" ref="singleCaptureRef">
        <div class="capture-title">{{ selectedYear }}年版号数据分析</div>
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
              <el-table :data="topPublishers" style="width: 100%" @row-click="handleRowClick">
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
              <el-table :data="topOperators" style="width: 100%" @row-click="handleRowClick">
                <el-table-column prop="name" label="单位名称" />
                <el-table-column prop="count" label="版号数量" width="100" />
              </el-table>
            </el-card>
          </el-col>
        </el-row>
      </div>

      <!-- 多年份比较内容 -->
      <div v-show="activeTab === 'compare'" ref="compareCaptureRef">
        <div class="capture-title">{{ selectedYears.join('、') }}年度版号对比分析</div>
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

      <!-- 大厂分析内容 -->
      <div v-show="activeTab === 'major'" ref="majorCaptureRef">
        <div class="capture-title">{{ majorYears.join('、') }}年度大厂版号分析</div>
        <el-row :gutter="20">
          <!-- 大厂月度审批对比 -->
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>大厂版号月度审批对比</span>
                </div>
              </template>
              <div ref="majorCompareChartRef" style="height: 400px;"></div>
            </el-card>
          </el-col>
        </el-row>
        
        <!-- 大厂年度总量对比 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="24">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>大厂年度版号总量对比</span>
                </div>
              </template>
              <div ref="majorTotalChartRef" style="height: 300px;"></div>
            </el-card>
          </el-col>
        </el-row>

        <!-- 大厂详情列表 -->
        <el-row :gutter="20" style="margin-top: 20px;">
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>大厂版号排行 TOP10</span>
                </div>
              </template>
              <el-table :data="majorCompanyRanking" border stripe>
                <el-table-column type="index" label="排名" width="60" align="center" />
                <el-table-column prop="company_name" label="厂商名称" min-width="150" />
                <el-table-column prop="license_count" label="版号数量" width="100" align="center" />
              </el-table>
            </el-card>
          </el-col>
          <el-col :span="12">
            <el-card>
              <template #header>
                <div class="card-header">
                  <span>大厂版号占比统计</span>
                </div>
              </template>
              <div ref="majorRatioChartRef" style="height: 300px;"></div>
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
import html2canvas from 'html2canvas'
import { ElMessage } from 'element-plus'

// 当前年份
const currentYear = new Date().getFullYear()
const selectedYear = ref(currentYear)

// 标签页
const activeTab = ref('single')

// 多年份比较
const selectedYears = ref<number[]>([])
const compareGameType = ref('all')

// 大厂分析
const majorYears = ref<number[]>([])
const majorCompanyRanking = ref<any[]>([])

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

// 截图引用
const singleCaptureRef = ref<HTMLElement>()
const compareCaptureRef = ref<HTMLElement>()
const majorCaptureRef = ref<HTMLElement>()
const exportLoading = ref(false)

// 多年份比较图表引用
const compareDomesticChartRef = ref<HTMLElement>()
const compareImportedChartRef = ref<HTMLElement>()
const compareTotalChartRef = ref<HTMLElement>()

// 大厂分析图表引用
const majorCompareChartRef = ref<HTMLElement>()
const majorTotalChartRef = ref<HTMLElement>()
const majorRatioChartRef = ref<HTMLElement>()

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
  } else if (tab === 'major') {
    await nextTick()
    // 默认选择近两年
    if (majorYears.value.length === 0) {
      majorYears.value = [currentYear, currentYear - 1]
    }
    await loadMajorCharts()
  }
}

// 多年份比较变化
const handleCompareChange = async () => {
  await loadCompareCharts()
}

// 大厂分析变化
const handleMajorChange = async () => {
  await loadMajorCharts()
}

// 加载大厂分析图表
const loadMajorCharts = async () => {
  if (majorYears.value.length === 0) return

  await nextTick()
  
  // 加载大厂月度对比
  if (majorCompareChartRef.value) {
    await loadMajorCompareChart()
  }
  
  // 加载大厂年度总量
  if (majorTotalChartRef.value) {
    await loadMajorTotalChart()
  }
  
  // 加载大厂占比
  if (majorRatioChartRef.value) {
    await loadMajorRatioChart()
  }
  
  // 加载大厂排行
  await loadMajorRanking()
}

// 大厂月度审批对比
const loadMajorCompareChart = async () => {
  if (!majorCompareChartRef.value) return

  const chart = echarts.init(majorCompareChartRef.value)
  const months = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
  const series: any[] = []
  const colors = ['#5470c6', '#91cc75', '#fac858', '#ee6666', '#73c0de', '#3ba272', '#fc8452', '#9a60b4']
  
  for (let i = 0; i < majorYears.value.length; i++) {
    const year = majorYears.value[i]
    const data: number[] = []
    
    for (let month = 1; month <= 12; month++) {
      const monthStr = month.toString().padStart(2, '0')
      const result = await window.electronAPI.database.query(`
        SELECT COUNT(*) as count FROM game_license gl
        INNER JOIN company_unit_relation curb ON gl.publish_unit_id = curb.unit_id
        INNER JOIN company c ON curb.company_id = c.id
        WHERE c.is_major = 1 AND gl.approval_date LIKE '${year}-${monthStr}%'
      `)
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

  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: majorYears.value.map(y => `${y}年`)
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

// 大厂年度总量对比
const loadMajorTotalChart = async () => {
  if (!majorTotalChartRef.value) return

  const chart = echarts.init(majorTotalChartRef.value)
  const years = majorYears.value.map(y => `${y}年`)
  const majorData: number[] = []
  const totalData: number[] = []
  
  for (const year of majorYears.value) {
    // 大厂版号数
    let result = await window.electronAPI.database.query(`
      SELECT COUNT(*) as count FROM game_license gl
      INNER JOIN company_unit_relation curb ON gl.publish_unit_id = curb.unit_id
      INNER JOIN company c ON curb.company_id = c.id
      WHERE c.is_major = 1 AND gl.approval_date LIKE '${year}%'
    `)
    const major = result.data?.[0]?.count || 0
    majorData.push(major)
    
    // 总版号数
    result = await window.electronAPI.database.query(
      `SELECT COUNT(*) as count FROM game_license WHERE approval_date LIKE '${year}%'`
    )
    const total = result.data?.[0]?.count || 0
    totalData.push(total)
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['大厂版号', '总版号']
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
        name: '大厂版号',
        type: 'bar',
        data: majorData,
        itemStyle: { color: '#ee6666' }
      },
      {
        name: '总版号',
        type: 'bar',
        data: totalData,
        itemStyle: { color: '#91cc75' }
      }
    ]
  })
}

// 大厂版号占比
const loadMajorRatioChart = async () => {
  if (!majorRatioChartRef.value) return

  const chart = echarts.init(majorRatioChartRef.value)
  const years = majorYears.value.map(y => `${y}年`)
  const majorData: number[] = []
  const otherData: number[] = []
  
  for (const year of majorYears.value) {
    // 大厂版号数
    let result = await window.electronAPI.database.query(`
      SELECT COUNT(*) as count FROM game_license gl
      INNER JOIN company_unit_relation curb ON gl.publish_unit_id = curb.unit_id
      INNER JOIN company c ON curb.company_id = c.id
      WHERE c.is_major = 1 AND gl.approval_date LIKE '${year}%'
    `)
    const major = result.data?.[0]?.count || 0
    majorData.push(major)
    
    // 非大厂版号数
    result = await window.electronAPI.database.query(`
      SELECT COUNT(*) as count FROM game_license gl
      WHERE gl.approval_date LIKE '${year}%'
      AND NOT EXISTS (
        SELECT 1 FROM company_unit_relation curb
        INNER JOIN company c ON curb.company_id = c.id
        WHERE curb.unit_id = gl.publish_unit_id AND c.is_major = 1
      )
    `)
    const other = result.data?.[0]?.count || 0
    otherData.push(other)
  }

  chart.setOption({
    tooltip: {
      trigger: 'axis'
    },
    legend: {
      data: ['大厂版号', '其他版号']
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
        name: '大厂版号',
        type: 'bar',
        stack: 'total',
        data: majorData,
        itemStyle: { color: '#ee6666' }
      },
      {
        name: '其他版号',
        type: 'bar',
        stack: 'total',
        data: otherData,
        itemStyle: { color: '#91cc75' }
      }
    ]
  })
}

// 大厂排行
const loadMajorRanking = async () => {
  if (majorYears.value.length === 0) return
  
  const yearList = majorYears.value.join("','")
  
  const result = await window.electronAPI.database.query(`
    SELECT c.full_name as company_name, COUNT(*) as license_count
    FROM game_license gl
    INNER JOIN company_unit_relation curb ON gl.publish_unit_id = curb.unit_id
    INNER JOIN company c ON curb.company_id = c.id
    WHERE c.is_major = 1 AND SUBSTR(gl.approval_date, 1, 4) IN ('${yearList}')
    GROUP BY c.id, c.full_name
    ORDER BY license_count DESC
    LIMIT 10
  `)
  
  majorCompanyRanking.value = result.data || []
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

// 月份选择变化
const handleMonthChange = async () => {
  if (!selectedMonth.value) return
  await loadMonthlyData()
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

// 生成长图 - 单年份分析
const handleExportSingle = async () => {
  if (!singleCaptureRef.value) return
  await exportToImage(singleCaptureRef.value, `${selectedYear.value}年版号数据分析`)
}

// 生成长图 - 多年份比较
const handleExportCompare = async () => {
  if (selectedYears.value.length === 0) {
    ElMessage.warning('请先选择年份')
    return
  }
  // 临时切换到该标签页确保可见
  const originalTab = activeTab.value
  activeTab.value = 'compare'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  if (compareCaptureRef.value) {
    await exportToImage(compareCaptureRef.value, `${selectedYears.value.join('、')}年度版号对比分析`)
  }
  activeTab.value = originalTab
}

// 生长大厂分析
const handleExportMajor = async () => {
  if (majorYears.value.length === 0) {
    ElMessage.warning('请先选择年份')
    return
  }
  // 临时切换到该标签页确保可见
  const originalTab = activeTab.value
  activeTab.value = 'major'
  await nextTick()
  await new Promise(resolve => setTimeout(resolve, 300))
  if (majorCaptureRef.value) {
    await exportToImage(majorCaptureRef.value, `${majorYears.value.join('、')}年度大厂版号分析`)
  }
  activeTab.value = originalTab
}

// 通用导出函数
const exportToImage = async (element: HTMLElement, title: string) => {
  exportLoading.value = true
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      scale: 2,
      backgroundColor: '#ffffff',
      logging: false
    })
    const link = document.createElement('a')
    link.download = `${title}.png`
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
  
  .capture-title {
    font-size: 20px;
    font-weight: bold;
    text-align: center;
    padding: 10px 0 20px;
    color: #303133;
  }
}
</style>
