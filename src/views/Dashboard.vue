<template>
  <div class="dashboard">
      <!-- 统计卡片 -->
      <el-row :gutter="20" class="stat-row">
        <el-col :span="6">
          <div class="card stat-card">
            <el-icon :size="40" color="#409eff"><Document /></el-icon>
            <div class="stat-value">{{ stats.totalLicenses }}</div>
            <div class="stat-label">游戏版号总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card stat-card">
            <el-icon :size="40" color="#67c23a"><OfficeBuilding /></el-icon>
            <div class="stat-value">{{ stats.totalCompanies }}</div>
            <div class="stat-label">厂商总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card stat-card">
            <el-icon :size="40" color="#e6a23c"><School /></el-icon>
            <div class="stat-value">{{ stats.totalUnits }}</div>
            <div class="stat-label">单位总数</div>
          </div>
        </el-col>
        <el-col :span="6">
          <div class="card stat-card">
            <el-icon :size="40" color="#f56c6c"><Star /></el-icon>
            <div class="stat-value">{{ stats.majorCompanies }}</div>
            <div class="stat-label">大厂数量</div>
          </div>
        </el-col>
      </el-row>

      <!-- 图表区域 -->
      <el-row :gutter="20">
        <el-col :span="12">
          <div class="card">
            <div class="card-title">版号类型分布</div>
            <div ref="typeChartRef" style="height: 300px;"></div>
          </div>
        </el-col>
        <el-col :span="12">
          <div class="card">
            <div class="card-title">最近采集记录</div>
            <el-table :data="recentLicenses" style="width: 100%" max-height="300">
              <el-table-column prop="game_name" label="游戏名称" show-overflow-tooltip />
              <el-table-column prop="game_type" label="类型" width="60" />
              <el-table-column prop="approval_number" label="批复文号" width="150" show-overflow-tooltip />
              <el-table-column prop="license_number" label="版号" width="130" show-overflow-tooltip />
              <el-table-column prop="approval_date" label="审批日期" width="100" />
            </el-table>
          </div>
        </el-col>
      </el-row>

      <!-- 快捷操作 -->
      <el-row :gutter="20" class="action-row">
        <el-col :span="24">
          <div class="card">
            <div class="card-title">快捷操作</div>
            <div class="quick-actions">
              <el-button type="primary" @click="$router.push('/collection')">
                <el-icon><Upload /></el-icon>
                采集新版号
              </el-button>
              <el-button type="success" @click="$router.push('/license')">
                <el-icon><Document /></el-icon>
                查看版号
              </el-button>
              <el-button type="warning" @click="$router.push('/analysis')">
                <el-icon><PieChart /></el-icon>
                数据分析
              </el-button>
              <el-button type="info" @click="$router.push('/company')">
                <el-icon><OfficeBuilding /></el-icon>
                厂商管理
              </el-button>
            </div>
          </div>
        </el-col>
      </el-row>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import * as echarts from 'echarts'

// 统计数据
const stats = ref({
  totalLicenses: 0,
  totalCompanies: 0,
  totalUnits: 0,
  majorCompanies: 0
})

// 最近版号
const recentLicenses = ref<any[]>([])

// 图表引用
const typeChartRef = ref<HTMLElement>()

// 加载统计数据
const loadStats = async () => {
  try {
    // 获取版号数量
    const licenseResult = await window.electronAPI.database.query('SELECT COUNT(*) as count FROM game_license')
    if (licenseResult.success) {
      stats.value.totalLicenses = licenseResult.data?.[0]?.count || 0
    }

    // 获取厂商数量
    const companyResult = await window.electronAPI.database.query('SELECT COUNT(*) as count FROM company')
    if (companyResult.success) {
      stats.value.totalCompanies = companyResult.data?.[0]?.count || 0
    }

    // 获取单位数量
    const unitResult = await window.electronAPI.database.query('SELECT COUNT(*) as count FROM unit')
    if (unitResult.success) {
      stats.value.totalUnits = unitResult.data?.[0]?.count || 0
    }

    // 获取大厂数量
    const majorResult = await window.electronAPI.database.query('SELECT COUNT(*) as count FROM company WHERE is_major = 1')
    if (majorResult.success) {
      stats.value.majorCompanies = majorResult.data?.[0]?.count || 0
    }
  } catch (error) {
    console.error('加载统计数据失败:', error)
  }
}

// 加载最近版号
const loadRecentLicenses = async () => {
  try {
    const result = await window.electronAPI.database.query(
      'SELECT game_name, game_type, approval_number, license_number, approval_date FROM game_license ORDER BY approval_date DESC LIMIT 10'
    )
    if (result.success) {
      recentLicenses.value = result.data || []
    }
  } catch (error) {
    console.error('加载最近版号失败:', error)
  }
}

// 初始化图表
const initChart = async () => {
  await nextTick()
  
  if (!typeChartRef.value) return
  
  const chart = echarts.init(typeChartRef.value)
  
  // 获取类型分布数据
  const typeResult = await window.electronAPI.database.query(
    'SELECT game_type, COUNT(*) as count FROM game_license GROUP BY game_type'
  )
  
  const typeData = typeResult.success ? typeResult.data || [] : []
  
  const option = {
    tooltip: {
      trigger: 'item',
      formatter: '{b}: {c} ({d}%)'
    },
    legend: {
      orient: 'vertical',
      left: 'left'
    },
    series: [
      {
        name: '版号类型',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: '#fff',
          borderWidth: 2
        },
        label: {
          show: true,
          formatter: '{b}: {c}'
        },
        data: typeData.map((item: any) => ({
          name: item.game_type || '未知',
          value: item.count || 0
        }))
      }
    ]
  }
  
  chart.setOption(option)
}

onMounted(async () => {
  await loadStats()
  await loadRecentLicenses()
  await initChart()
})
</script>

<style lang="scss" scoped>
.dashboard {
  .stat-row {
    margin-bottom: 20px;
  }
  
  .action-row {
    margin-top: 20px;
  }
  
  .card {
    .card-title {
      font-size: 16px;
      font-weight: 500;
      color: #303133;
      margin-bottom: 16px;
    }
  }
  
  .quick-actions {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }
}
</style>
