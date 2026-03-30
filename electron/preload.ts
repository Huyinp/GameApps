import { contextBridge, ipcRenderer } from 'electron'

// 暴露给渲染进程的 API
const api = {
  // 数据库操作
  database: {
    // 初始化数据库
    init: () => ipcRenderer.invoke('db:init'),
    // 执行 SQL
    execute: (sql: string, params?: any[]) => ipcRenderer.invoke('db:execute', sql, params),
    // 查询
    query: (sql: string, params?: any[]) => ipcRenderer.invoke('db:query', sql, params),
    // 获取所有数据
    getAll: (table: string) => ipcRenderer.invoke('db:getAll', table),
    // 插入数据
    insert: (table: string, data: any) => ipcRenderer.invoke('db:insert', table, data),
    // 更新数据
    update: (table: string, id: number, data: any) => ipcRenderer.invoke('db:update', table, id, data),
    // 删除数据
    delete: (table: string, id: number) => ipcRenderer.invoke('db:delete', table, id),
    // 获取数据库路径
    getPath: () => ipcRenderer.invoke('db:getPath'),
    // 导出大厂关联数据备份
    exportMajorCompanyBackup: () => ipcRenderer.invoke('db:exportMajorCompanyBackup')
  },
  // 爬虫操作
  spider: {
    // 爬取数据
    crawl: (year: number, type: 'domestic' | 'imported') => ipcRenderer.invoke('spider:crawl', year, type),
    // 爬取进度
    onProgress: (callback: (progress: number, message: string) => void) => {
      ipcRenderer.on('spider:progress', (_event, progress, message) => callback(progress, message))
    },
    // 移除进度监听
    removeProgressListener: () => {
      ipcRenderer.removeAllListeners('spider:progress')
    }
  },
  // 窗口操作
  window: {
    minimize: () => ipcRenderer.invoke('window:minimize'),
    maximize: () => ipcRenderer.invoke('window:maximize'),
    close: () => ipcRenderer.invoke('window:close'),
    isMaximized: () => ipcRenderer.invoke('window:isMaximized')
  },
  // 菜单事件
  menu: {
    onRefresh: (callback: () => void) => {
      ipcRenderer.on('menu:refresh', () => callback())
    },
    onAbout: (callback: () => void) => {
      ipcRenderer.on('menu:about', () => callback())
    },
    removeAllListeners: () => {
      ipcRenderer.removeAllListeners('menu:refresh')
      ipcRenderer.removeAllListeners('menu:about')
    }
  },
  // 应用信息
  app: {
    getVersion: () => ipcRenderer.invoke('app:getVersion'),
    getPlatform: () => process.platform
  }
}

// 暴露 API
contextBridge.exposeInMainWorld('electronAPI', api)

// 类型声明
export type ElectronAPI = typeof api
