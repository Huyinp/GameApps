import { ipcMain, BrowserWindow, app } from 'electron'

// 注册窗口管理 IPC
export function registerWindowIpc() {
  // 最小化
  ipcMain.handle('window:minimize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.minimize()
    }
  })

  // 最大化/还原
  ipcMain.handle('window:maximize', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      if (win.isMaximized()) {
        win.unmaximize()
      } else {
        win.maximize()
      }
    }
  })

  // 关闭
  ipcMain.handle('window:close', () => {
    const win = BrowserWindow.getFocusedWindow()
    if (win) {
      win.close()
    }
  })

  // 是否最大化
  ipcMain.handle('window:isMaximized', () => {
    const win = BrowserWindow.getFocusedWindow()
    return win ? win.isMaximized() : false
  })

  // 获取应用版本
  ipcMain.handle('app:getVersion', () => {
    return app.getVersion()
  })

  console.log('[Window] IPC 处理器注册完成')
}
