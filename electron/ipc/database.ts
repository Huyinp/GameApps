import { ipcMain, app } from 'electron'
import { join, dirname } from 'path'
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs'

// sql.js 类型声明 - 使用 require 确保正确加载
let initSqlJs: any

// 数据库实例
let db: any = null

// 获取数据库文件路径
function getDbPath(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return join(__dirname, '..', 'database', 'game_license.db')
  }
  return join(process.resourcesPath, 'database', 'game_license.db')
}

// 获取 sql-wasm.wasm 文件路径
function getWasmPath(): string {
  const isDev = !app.isPackaged
  if (isDev) {
    return join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm')
  }
  return join(process.resourcesPath, 'sql-wasm.wasm')
}

// 初始化数据库
async function initDatabase(): Promise<any> {
  if (db) return db

  console.log('[Database] 初始化数据库...')

  // 使用 require 确保 sql.js 被正确加载为 CommonJS 模块
  const sqljs = require('sql.js')
  initSqlJs = sqljs

  const wasmPath = getWasmPath()
  console.log('[Database] WASM 路径:', wasmPath)

  const SQL = await initSqlJs({
    locateFile: () => wasmPath
  })

  const dbPath = getDbPath()
  console.log('[Database] 数据库路径:', dbPath)

  // 确保目录存在
  const dbDir = dirname(dbPath)
  if (!existsSync(dbDir)) {
    mkdirSync(dbDir, { recursive: true })
  }

  // 加载或创建数据库
  if (existsSync(dbPath)) {
    console.log('[Database] 加载已有数据库')
    const fileBuffer = readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
    // 执行迁移
    migrateDatabase()
  } else {
    console.log('[Database] 创建新数据库')
    db = new SQL.Database()
    createTables()
  }

  console.log('[Database] 初始化完成')
  return db
}

// 创建表结构
function createTables() {
  console.log('[Database] 创建表结构...')

  // 游戏版号表
  db.run(`
    CREATE TABLE IF NOT EXISTS game_license (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      license_number VARCHAR(50) NOT NULL,
      game_name VARCHAR(255) NOT NULL,
      game_type VARCHAR(20) NOT NULL,
      publish_unit_id INTEGER,
      operate_unit_id INTEGER,
      approval_date DATE,
      approval_number VARCHAR(50),
      category VARCHAR(50),
      source_url VARCHAR(500),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 单位表
  db.run(`
    CREATE TABLE IF NOT EXISTS unit (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name VARCHAR(255) NOT NULL UNIQUE,
      type VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 厂商表
  db.run(`
    CREATE TABLE IF NOT EXISTS company (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      full_name VARCHAR(255) NOT NULL,
      short_name VARCHAR(100),
      is_major BOOLEAN DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  // 厂商-单位关联表
  db.run(`
    CREATE TABLE IF NOT EXISTS company_unit_relation (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      company_id INTEGER NOT NULL,
      unit_id INTEGER NOT NULL,
      relation_type VARCHAR(20),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(company_id, unit_id, relation_type)
    )
  `)

  saveDatabase()
  console.log('[Database] 表创建完成')
}

// 数据库迁移 - 添加缺失的列
function migrateDatabase() {
  if (!db) return
  
  try {
    // 检查 game_license 表是否有 updated_at 列
    const result = db.exec("PRAGMA table_info(game_license)")
    const columns = result[0]?.values?.map((row: any) => row[1]) || []
    
    if (!columns.includes('updated_at')) {
      db.run('ALTER TABLE game_license ADD COLUMN updated_at DATETIME')
      console.log('[Database] 迁移: 已添加 updated_at 列')
    }
    
    // 检查 unit 表是否有 updated_at 列
    const unitResult = db.exec("PRAGMA table_info(unit)")
    const unitColumns = unitResult[0]?.values?.map((row: any) => row[1]) || []
    
    if (!unitColumns.includes('updated_at')) {
      db.run('ALTER TABLE unit ADD COLUMN updated_at DATETIME')
      console.log('[Database] 迁移: 已添加 unit.updated_at 列')
    }
    
    // 检查 company 表是否有 updated_at 列
    const companyResult = db.exec("PRAGMA table_info(company)")
    const companyColumns = companyResult[0]?.values?.map((row: any) => row[1]) || []
    
    if (!companyColumns.includes('updated_at')) {
      db.run('ALTER TABLE company ADD COLUMN updated_at DATETIME')
      console.log('[Database] 迁移: 已添加 company.updated_at 列')
    }
    
    // 检查 company_unit_relation 表是否有 updated_at 列
    const relationResult = db.exec("PRAGMA table_info(company_unit_relation)")
    const relationColumns = relationResult[0]?.values?.map((row: any) => row[1]) || []
    
    if (!relationColumns.includes('updated_at')) {
      db.run('ALTER TABLE company_unit_relation ADD COLUMN updated_at DATETIME')
      console.log('[Database] 迁移: 已添加 company_unit_relation.updated_at 列')
    }
    
    saveDatabase()
  } catch (error) {
    console.error('[Database] 迁移失败:', error)
  }
}

// 保存数据库到文件
function saveDatabase() {
  if (!db) return
  
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(getDbPath(), buffer)
  console.log('[Database] 数据库已保存')
}

// 注册 IPC 处理器
export function registerDatabaseIpc() {
  // 初始化
  ipcMain.handle('db:init', async () => {
    try {
      await initDatabase()
      return { success: true }
    } catch (error: any) {
      console.error('[Database] 初始化失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 执行 SQL
  ipcMain.handle('db:execute', async (_event, sql: string, params?: any[]) => {
    try {
      if (!db) await initDatabase()
      db.run(sql, params || [])
      saveDatabase()
      return { success: true }
    } catch (error: any) {
      console.error('[Database] 执行失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 查询
  ipcMain.handle('db:query', async (_event, sql: string, params?: any[]) => {
    try {
      if (!db) await initDatabase()
      const stmt = db.prepare(sql)
      if (params) stmt.bind(params)
      
      const results: any[] = []
      while (stmt.step()) {
        results.push(stmt.getAsObject())
      }
      stmt.free()
      return { success: true, data: results }
    } catch (error: any) {
      console.error('[Database] 查询失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取所有数据
  ipcMain.handle('db:getAll', async (_event, table: string) => {
    try {
      if (!db) await initDatabase()
      const results = db.exec(`SELECT * FROM ${table}`)
      if (results.length === 0) return { success: true, data: [] }
      
      const columns = results[0].columns
      const values = results[0].values
      const data = values.map((row: any[]) => {
        const obj: any = {}
        columns.forEach((col: string, idx: number) => {
          obj[col] = row[idx]
        })
        return obj
      })
      
      return { success: true, data }
    } catch (error: any) {
      console.error('[Database] 获取失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 插入数据
  ipcMain.handle('db:insert', async (_event, table: string, data: any) => {
    try {
      if (!db) await initDatabase()
      
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map(() => '?').join(', ')
      
      const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`
      db.run(sql, values)
      saveDatabase()
      
      // 获取插入的ID
      const result = db.exec('SELECT last_insert_rowid() as id')
      const id = result[0].values[0][0]
      
      return { success: true, id }
    } catch (error: any) {
      console.error('[Database] 插入失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 更新数据
  ipcMain.handle('db:update', async (_event, table: string, id: number, data: any) => {
    try {
      if (!db) await initDatabase()
      
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map(k => `${k} = ?`).join(', ')
      
      const sql = `UPDATE ${table} SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      db.run(sql, [...values, id])
      saveDatabase()
      
      return { success: true }
    } catch (error: any) {
      console.error('[Database] 更新失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 删除数据
  ipcMain.handle('db:delete', async (_event, table: string, id: number) => {
    try {
      if (!db) await initDatabase()
      
      db.run(`DELETE FROM ${table} WHERE id = ?`, [id])
      saveDatabase()
      
      return { success: true }
    } catch (error: any) {
      console.error('[Database] 删除失败:', error)
      return { success: false, error: error.message }
    }
  })

  // 获取数据库路径
  ipcMain.handle('db:getPath', () => {
    return getDbPath()
  })

  // 导出大厂关联数据备份
  ipcMain.handle('db:exportMajorCompanyBackup', async () => {
    try {
      if (!db) await initDatabase()
      
      // 获取所有大厂
      const companies = db.exec(`SELECT * FROM company WHERE is_major = 1`)
      const companyColumns = companies[0]?.columns || []
      const companyData = (companies[0]?.values || []).map((row: any[]) => {
        const obj: any = {}
        companyColumns.forEach((col: string, idx: number) => {
          obj[col] = row[idx]
        })
        return obj
      })

      // 获取所有大厂关联的单位
      const relations = db.exec(`
        SELECT curb.*, c.full_name as company_name, c.short_name as company_short_name, u.name as unit_name
        FROM company_unit_relation curb
        INNER JOIN company c ON curb.company_id = c.id
        INNER JOIN unit u ON curb.unit_id = u.id
        WHERE c.is_major = 1
      `)
      const relationColumns = relations[0]?.columns || []
      const relationData = (relations[0]?.values || []).map((row: any[]) => {
        const obj: any = {}
        relationColumns.forEach((col: string, idx: number) => {
          obj[col] = row[idx]
        })
        return obj
      })

      const backupData = {
        exportTime: new Date().toISOString(),
        companies: companyData,
        relations: relationData
      }

      return { success: true, data: backupData }
    } catch (error: any) {
      console.error('[Database] 导出失败:', error)
      return { success: false, error: error.message }
    }
  })

  console.log('[Database] IPC 处理器注册完成')
}

export { db, initDatabase, saveDatabase }
