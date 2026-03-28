<template>
  <el-config-provider :locale="locale">
    <router-view />
  </el-config-provider>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import zhCn from 'element-plus/dist/locale/zh-cn.mjs'

const locale = ref(zhCn)

// 初始化数据库
onMounted(async () => {
  try {
    await window.electronAPI.database.init()
    console.log('[App] 数据库初始化完成')
  } catch (error) {
    console.error('[App] 数据库初始化失败:', error)
  }
})
</script>

<style>
#app {
  height: 100vh;
  overflow: hidden;
}
</style>
