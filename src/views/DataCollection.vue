<template>
  <div class="data-collection">
      <el-card class="collection-form">
        <template #header>
          <div class="card-header">
            <span>数据采集配置</span>
          </div>
        </template>
        
        <el-form :model="form" label-width="100px">
          <el-form-item label="采集年份">
            <el-select v-model="form.year" placeholder="请选择年份" style="width: 200px;">
              <el-option
                v-for="y in availableYears"
                :key="y"
                :label="`${y}年`"
                :value="y"
              />
            </el-select>
          </el-form-item>
          
          <el-form-item label="采集类型">
            <el-checkbox-group v-model="form.types">
              <el-checkbox label="domestic">国产网络游戏</el-checkbox>
              <el-checkbox label="imported">进口网络游戏</el-checkbox>
            </el-checkbox-group>
          </el-form-item>
          
          <el-form-item>
            <el-button 
              type="primary" 
              @click="startCrawl" 
              :loading="loading"
              :disabled="!canStart"
            >
              {{ loading ? '采集中...' : '开始采集' }}
            </el-button>
          </el-form-item>
        </el-form>
        
        <!-- 进度条 -->
        <el-progress 
          v-if="loading || progress > 0" 
          :percentage="progress" 
          :status="progressStatus"
          :stroke-width="20"
          style="margin-top: 20px;"
        />
        <div v-if="progressMessage" class="progress-message">
          {{ progressMessage }}
        </div>
      </el-card>
      
      <!-- 采集说明 -->
      <el-card class="tips-card" style="margin-top: 20px;">
        <template #header>
          <div class="card-header">
            <span>采集说明</span>
          </div>
        </template>
        <ul>
          <li>数据来源：国家新闻出版署网站 (https://www.nppa.gov.cn)</li>
          <li>采集内容：国产网络游戏审批信息、进口网络游戏审批信息</li>
          <li>采集过程中请勿关闭程序</li>
          <li>采集完成后会自动保存到数据库</li>
          <li>大厂会自动识别并关联到厂商表</li>
        </ul>
      </el-card>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { ElMessage } from 'element-plus'

// 表单数据
const form = ref({
  year: new Date().getFullYear(),
  types: ['domestic'] as string[]
})

// 可选年份
const availableYears = computed(() => {
  const currentYear = new Date().getFullYear()
  const years: number[] = []
  for (let i = currentYear; i >= 2000; i--) {
    years.push(i)
  }
  return years
})

// 能否开始采集
const canStart = computed(() => {
  return form.value.year && form.value.types.length > 0
})

// 加载状态
const loading = ref(false)
const progress = ref(0)
const progressMessage = ref('')
const progressStatus = computed(() => {
  if (progress.value === 100) return 'success'
  if (progress.value > 0) return undefined
  return undefined
})

// 开始采集
const startCrawl = async () => {
  if (!canStart.value) {
    ElMessage.warning('请选择年份和采集类型')
    return
  }

  loading.value = true
  progress.value = 0
  progressMessage.value = '准备开始...'

  let totalImported = 0

  for (const type of form.value.types) {
    try {
      const result = await window.electronAPI.spider.crawl(form.value.year, type as 'domestic' | 'imported')
      
      if (result.success) {
        totalImported += result.count
        ElMessage.success(`${type === 'domestic' ? '国产' : '进口'}游戏版号采集完成，成功导入 ${result.count} 条数据`)
      } else {
        ElMessage.error(result.error || '采集失败')
      }
    } catch (error: any) {
      ElMessage.error(`采集出错: ${error.message}`)
    }
  }

  loading.value = false
  progress.value = 100
  progressMessage.value = `采集完成！共导入 ${totalImported} 条数据`
  
  ElMessage.success(`数据采集完成，共 ${totalImported} 条`)
}

// 监听爬虫进度
onMounted(() => {
  window.electronAPI.spider.onProgress((prog: number, message: string) => {
    progress.value = prog
    progressMessage.value = message
  })
})

onUnmounted(() => {
  window.electronAPI.spider.removeProgressListener()
})
</script>

<style lang="scss" scoped>
.data-collection {
  .collection-form {
    .progress-message {
      margin-top: 10px;
      text-align: center;
      color: #909399;
    }
  }
  
  .tips-card {
    ul {
      padding-left: 20px;
      line-height: 2;
      color: #606266;
    }
  }
}
</style>
