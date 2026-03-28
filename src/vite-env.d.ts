/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

// Electron API 类型声明
interface ElectronAPI {
  database: {
    init: () => Promise<{ success: boolean; error?: string }>
    execute: (sql: string, params?: any[]) => Promise<{ success: boolean; error?: string }>
    query: (sql: string, params?: any[]) => Promise<{ success: boolean; data?: any[]; error?: string }>
    getAll: (table: string) => Promise<{ success: boolean; data?: any[]; error?: string }>
    insert: (table: string, data: any) => Promise<{ success: boolean; id?: number; error?: string }>
    update: (table: string, id: number, data: any) => Promise<{ success: boolean; error?: string }>
    delete: (table: string, id: number) => Promise<{ success: boolean; error?: string }>
    getPath: () => Promise<string>
  }
  spider: {
    crawl: (year: number, type: 'domestic' | 'imported') => Promise<{ success: boolean; count: number; error?: string }>
    onProgress: (callback: (progress: number, message: string) => void) => void
    removeProgressListener: () => void
  }
  window: {
    minimize: () => Promise<void>
    maximize: () => Promise<void>
    close: () => Promise<void>
    isMaximized: () => Promise<boolean>
  }
  menu: {
    onRefresh: (callback: () => void) => void
    onAbout: (callback: () => void) => void
    removeAllListeners: () => void
  }
  app: {
    getVersion: () => Promise<string>
    getPlatform: () => string
  }
}

declare global {
  interface Window {
    electronAPI: ElectronAPI
  }
}
