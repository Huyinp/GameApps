<template>
  <el-container class="app-layout">
    <!-- 侧边栏 -->
    <el-aside width="220px">
      <div class="logo">
        <el-icon :size="28"><Monitor /></el-icon>
        <span>游戏版号管理</span>
      </div>
      <el-menu
        :default-active="activeMenu"
        class="el-menu-vertical"
        router
      >
        <el-menu-item index="/dashboard">
          <el-icon><DataAnalysis /></el-icon>
          <span>数据概览</span>
        </el-menu-item>
        <el-menu-item index="/license">
          <el-icon><Document /></el-icon>
          <span>游戏版号管理</span>
        </el-menu-item>
        <el-menu-item index="/company">
          <el-icon><OfficeBuilding /></el-icon>
          <span>厂商管理</span>
        </el-menu-item>
        <el-menu-item index="/unit">
          <el-icon><School /></el-icon>
          <span>单位管理</span>
        </el-menu-item>
        <el-menu-item index="/analysis">
          <el-icon><PieChart /></el-icon>
          <span>数据分析</span>
        </el-menu-item>
        <el-menu-item index="/monthly">
          <el-icon><Calendar /></el-icon>
          <span>月度版号</span>
        </el-menu-item>
        <el-menu-item index="/collection">
          <el-icon><Upload /></el-icon>
          <span>数据采集</span>
        </el-menu-item>
      </el-menu>
    </el-aside>
    
    <!-- 主内容区 -->
    <el-container>
      <el-header>
        <div class="header-title">{{ pageTitle }}</div>
        <div class="header-actions">
          <el-button text @click="handleRefresh">
            <el-icon><Refresh /></el-icon>
          </el-button>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'

const route = useRoute()

const activeMenu = computed(() => route.path)
const pageTitle = computed(() => (route.meta.title as string) || '数据概览')

const handleRefresh = () => {
  window.location.reload()
}
</script>

<style lang="scss" scoped>
.app-layout {
  height: 100vh;
}

.el-aside {
  background-color: #304156;
  color: #fff;
  
  .logo {
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: #fff;
    font-size: 18px;
    font-weight: bold;
    border-bottom: 1px solid #3a4a5a;
  }
  
  .el-menu {
    border-right: none;
    background-color: #304156;
    
    .el-menu-item {
      color: #bfcbd9;
      
      &:hover {
        background-color: #263445;
        color: #409eff;
      }
      
      &.is-active {
        background-color: #409eff !important;
        color: #fff;
      }
    }
  }
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 20px;
  
  .header-title {
    font-size: 18px;
    font-weight: 500;
    color: #333;
  }
  
  .header-actions {
    display: flex;
    gap: 10px;
  }
}

.el-main {
  background-color: #f0f2f5;
  padding: 20px;
  overflow-y: auto;
}
</style>
