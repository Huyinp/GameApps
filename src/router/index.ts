import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('@/components/layout/AppLayout.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: '/dashboard',
        name: 'Dashboard',
        component: () => import('@/views/Dashboard.vue'),
        meta: { title: '数据概览' }
      },
      {
        path: '/license',
        name: 'LicenseManage',
        component: () => import('@/views/LicenseManage.vue'),
        meta: { title: '游戏版号管理' }
      },
      {
        path: '/company',
        name: 'CompanyManage',
        component: () => import('@/views/CompanyManage.vue'),
        meta: { title: '厂商管理' }
      },
      {
        path: '/unit',
        name: 'UnitManage',
        component: () => import('@/views/UnitManage.vue'),
        meta: { title: '单位管理' }
      },
      {
        path: '/analysis',
        name: 'DataAnalysis',
        component: () => import('@/views/DataAnalysis.vue'),
        meta: { title: '数据分析' }
      },
      {
        path: '/collection',
        name: 'DataCollection',
        component: () => import('@/views/DataCollection.vue'),
        meta: { title: '数据采集' }
      }
    ]
  }
]

const router = createRouter({
  history: createWebHashHistory(),
  routes
})

// 更新页面标题
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '游戏版号管理系统'} - 游戏版号管理系统`
  next()
})

export default router
