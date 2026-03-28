import { ipcMain, BrowserWindow } from 'electron'
import axios from 'axios'
import * as cheerio from 'cheerio'
import { db, saveDatabase } from './database'

// 大厂识别规则 - 至少30个
const MAJOR_COMPANIES = [
  // 头部大厂
  { fullName: '腾讯科技（深圳）有限公司', shortName: '腾讯', isMajor: true },
  { fullName: '腾讯游戏', shortName: '腾讯', isMajor: true },
  { fullName: '网易（杭州）网络有限公司', shortName: '网易', isMajor: true },
  { fullName: '网易游戏', shortName: '网易', isMajor: true },
  { fullName: '完美世界（北京）网络技术有限公司', shortName: '完美世界', isMajor: true },
  { fullName: '完美世界', shortName: '完美世界', isMajor: true },
  { fullName: '盛趣游戏', shortName: '盛趣游戏', isMajor: true },
  { fullName: '米哈游科技（上海）有限公司', shortName: '米哈游', isMajor: true },
  { fullName: '米哈游', shortName: '米哈游', isMajor: true },
  { fullName: '上海莉莉丝科技股份有限公司', shortName: '莉莉丝', isMajor: true },
  { fullName: '莉莉丝', shortName: '莉莉丝', isMajor: true },
  { fullName: '北京字节跳动科技有限公司', shortName: '字节跳动', isMajor: true },
  { fullName: '字节跳动', shortName: '字节跳动', isMajor: true },
  { fullName: '阿里巴巴（中国）有限公司', shortName: '阿里', isMajor: true },
  { fullName: '百度在线网络技术（北京）有限公司', shortName: '百度', isMajor: true },
  { fullName: '百度', shortName: '百度', isMajor: true },
  { fullName: '上海游族网络科技有限公司', shortName: '游族', isMajor: true },
  { fullName: '游族网络', shortName: '游族', isMajor: true },
  { fullName: '巨人网络集团股份有限公司', shortName: '巨人网络', isMajor: true },
  { fullName: '巨人网络', shortName: '巨人网络', isMajor: true },
  { fullName: '西山居软件有限公司', shortName: '西山居', isMajor: true },
  { fullName: '金山软件', shortName: '金山', isMajor: true },
  // 二线大厂
  { fullName: '上海三七互娱科技有限公司', shortName: '三七互娱', isMajor: true },
  { fullName: '三七互娱', shortName: '三七互娱', isMajor: true },
  { fullName: '上海心动网络科技有限公司', shortName: '心动网络', isMajor: true },
  { fullName: '心动网络', shortName: '心动', isMajor: true },
  { fullName: '上海哔哩哔哩科技有限公司', shortName: 'B站', isMajor: true },
  { fullName: '哔哩哔哩', shortName: 'B站', isMajor: true },
  { fullName: '英雄互娱科技股份有限公司', shortName: '英雄互娱', isMajor: true },
  { fullName: '英雄互娱', shortName: '英雄互娱', isMajor: true },
  { fullName: '广州多益网络股份有限公司', shortName: '多益网络', isMajor: true },
  { fullName: '多益网络', shortName: '多益网络', isMajor: true },
  { fullName: 'IGG', shortName: 'IGG', isMajor: true },
  { fullName: '福建网龙计算机网络信息技术有限公司', shortName: '网龙', isMajor: true },
  { fullName: '网龙', shortName: '网龙', isMajor: true },
  { fullName: '龙图游戏', shortName: '龙图游戏', isMajor: true },
  { fullName: '上海恺英网络科技有限公司', shortName: '恺英网络', isMajor: true },
  { fullName: '恺英网络', shortName: '恺英', isMajor: true },
  { fullName: '中手游', shortName: '中手游', isMajor: true },
  { fullName: '深圳中手游网络科技有限公司', shortName: '中手游', isMajor: true },
  { fullName: '盛天网络', shortName: '盛天网络', isMajor: true },
  { fullName: '天神娱乐', shortName: '天神娱乐', isMajor: true },
  { fullName: '北京玩蟹科技有限公司', shortName: '玩蟹科技', isMajor: true },
  { fullName: '祖龙娱乐', shortName: '祖龙娱乐', isMajor: true },
  { fullName: '乐元素', shortName: '乐元素', isMajor: true },
  { fullName: '竞技世界', shortName: '竞技世界', isMajor: true },
  { fullName: '蓝港互动', shortName: '蓝港互动', isMajor: true },
  { fullName: '蜗牛游戏', shortName: '蜗牛游戏', isMajor: true },
  { fullName: '波克城市', shortName: '波克城市', isMajor: true },
  { fullName: '姚记科技', shortName: '姚记科技', isMajor: true },
  { fullName: '家乡互动', shortName: '家乡互动', isMajor: true },
  { fullName: '厦门游族', shortName: '游族', isMajor: true },
  { fullName: '广州百田', shortName: '百田', isMajor: true },
  { fullName: '七道科技', shortName: '七道科技', isMajor: true },
  { fullName: '乐港科技', shortName: '乐港', isMajor: true },
  { fullName: '上海乐港', shortName: '乐港', isMajor: true },
  { fullName: '益田网络', shortName: '益田', isMajor: true },
  { fullName: '广州谷得', shortName: '谷得', isMajor: true },
  { fullName: '谷得网络', shortName: '谷得', isMajor: true },
  { fullName: '广州灵犀', shortName: '灵犀', isMajor: true },
  { fullName: '广州银汉', shortName: '银汉', isMajor: true },
  { fullName: '深圳完美', shortName: '完美世界', isMajor: true },
  { fullName: '网易雷火', shortName: '雷火', isMajor: true },
  { fullName: '广州网易', shortName: '网易', isMajor: true },
]

// 发送进度消息
function sendProgress(mainWindow: BrowserWindow | null, progress: number, message: string) {
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.webContents.send('spider:progress', progress, message)
  }
}

// 智能识别厂商
function recognizeCompany(unitName: string): { companyFullName: string; companyShortName: string; isMajor: boolean } | null {
  if (!unitName) return null
  for (const company of MAJOR_COMPANIES) {
    if (unitName.includes(company.fullName) || unitName.includes(company.shortName)) {
      return {
        companyFullName: company.fullName,
        companyShortName: company.shortName,
        isMajor: company.isMajor
      }
    }
  }
  return null
}

// 获取或创建单位
async function getOrCreateUnit(name: string, type: string): Promise<number | null> {
  if (!name || !db) return null
  const safeName = name.replace(/'/g, "''").trim()
  if (!safeName) return null

  const result = db.exec(`SELECT id FROM unit WHERE name = '${safeName}'`)
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number
  }

  db.run(`INSERT INTO unit (name, type) VALUES (?, ?)`, [safeName, type])
  const insertResult = db.exec('SELECT last_insert_rowid() as id')
  return insertResult[0].values[0][0] as number
}

// 获取或创建厂商
async function getOrCreateCompany(companyInfo: { companyFullName: string; companyShortName: string; isMajor: boolean }): Promise<number | null> {
  if (!db || !companyInfo) return null
  const safeName = companyInfo.companyFullName.replace(/'/g, "''").trim()

  const result = db.exec(`SELECT id FROM company WHERE full_name = '${safeName}'`)
  if (result.length > 0 && result[0].values.length > 0) {
    return result[0].values[0][0] as number
  }

  db.run(`INSERT INTO company (full_name, short_name, is_major) VALUES (?, ?, ?)`,
    [safeName, companyInfo.companyShortName, companyInfo.isMajor ? 1 : 0])
  const insertResult = db.exec('SELECT last_insert_rowid() as id')
  return insertResult[0].values[0][0] as number
}

// 获取月份页面URL列表
async function getMonthUrls(year: number, type: 'domestic' | 'imported'): Promise<string[]> {
  const basePath = type === 'domestic' ? 'gcwlyxspxx' : 'jkwlyxspxx'
  const baseUrl = `https://www.nppa.gov.cn/bsfw/jggs/yxspjg/${basePath}/`
  
  const headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    'Accept': 'text/html,application/xhtml+xml',
    'Referer': 'https://www.nppa.gov.cn/'
  }

  const urls: string[] = []
  const yearStr = year.toString()

  // 获取分页总数
  let pageCount = 1
  try {
    const response = await axios.get(baseUrl, { headers, timeout: 15000 })
    // 从JavaScript中提取_pageCount值
    const pageCountMatch = response.data.match(/_pageCount\s*=\s*(\d+)/)
    if (pageCountMatch) {
      pageCount = parseInt(pageCountMatch[1])
    }
    console.log(`[Spider] 分页总数: ${pageCount}`)
  } catch (error) {
    console.error('[Spider] 获取分页信息失败:', error)
    return []
  }

  // 生成所有分页URL并获取
  for (let page = 0; page < pageCount; page++) {
    const pageUrl = page === 0 
      ? baseUrl + 'index.html' 
      : baseUrl + `index_${page}.html`
    
    try {
      console.log(`[Spider] 获取分页 ${page + 1}/${pageCount}: ${pageUrl}`)
      const response = await axios.get(pageUrl, { headers, timeout: 15000 })
      const $ = cheerio.load(response.data)

      // 查找所有链接，找到匹配年份的
      $('a[href*=".html"]').each((_i, elem) => {
        const href = $(elem).attr('href') || ''
        const text = $(elem).text().trim()
        
        // 只匹配目标年份
        const hrefMatchesYear = href.includes(`/${yearStr}`)
        const textMatchesYear = text.includes(`${year}年`)
        
        if ((hrefMatchesYear || textMatchesYear) && href.includes('.html')) {
          let fullUrl = href
          if (href.startsWith('./')) {
            fullUrl = baseUrl + href.replace('./', '')
          } else if (href.startsWith('/')) {
            fullUrl = 'https://www.nppa.gov.cn' + href
          }
          
          if (fullUrl.includes(`/${yearStr}`)) {
            if (!urls.includes(fullUrl)) {
              urls.push(fullUrl)
            }
          }
        }
      })
    } catch (error) {
      console.error(`[Spider] 获取分页失败 ${pageUrl}:`, error)
    }
  }

  console.log(`[Spider] 找到 ${urls.length} 个${year}年相关页面`)
  return urls
}

// 解析月度页面
async function parseMonthPage(html: string, gameType: string): Promise<any[]> {
  const $ = cheerio.load(html)
  const data: any[] = []


  
  // 调试：打印页面中表格的数量
  const tableCount = $('table').length

  
  // 查找表格行 - 使用更精确的选择器
  let tableRows = $('table.trStyle tr')
  
  // 过滤掉表头行，只保留数据行
  const validRows: any[] = []
  tableRows.each((_i, row) => {
    const tds = $(row).find('td')
    
    // 必须有足够的单元格
    if (tds.length < 7) return
    
    const firstCell = $(tds[0]).text().trim()
    const secondCell = $(tds[1]).text().trim()
    
    // 跳过表头行：第一个单元格是"序号"或不是数字
    if (firstCell === '序号' || !/^\d+$/.test(firstCell)) return
    
    // 跳过没有游戏名称的行
    if (!secondCell || secondCell.length === 0) return
    
    validRows.push(row)
  })
  
  console.log(`[Spider] 找到 ${validRows.length} 个有效数据行`)
  

  
  // 从HTML中提取script变量 _sblb 的值
  function extractCategoryFromRow(rowHtml: string): string {
    const match = rowHtml.match(/var\s+_sblb\s*=\s*['"]([^'"]+)['"]/)
    if (match && match[1]) {
      return match[1]
    }
    return ''
  }
  
  // 解析每一行数据
  for (let i = 0; i < validRows.length; i++) {
    const row = validRows[i]
    const rowHtml = $(row).html() || ''
    const cells = $(row).find('td')
    const cellCount = cells.length
    
    if (cellCount < 7) continue
    
    // 从script中提取申报类别
    const category = extractCategoryFromRow(rowHtml)
    
    let gameName = '', publishUnit = '', operateUnit = '', approvalNumber = '', licenseNumber = '', approvalDate = ''
    
    // 8列：序号(0), 名称(1), 申报类别(2), 出版单位(3), 运营单位(4), 批复文号(5), 出版物号(6), 批准时间(7)
    // 7列：序号(0), 名称(1), 出版单位(2), 运营单位(3), 批复文号(4), 出版物号(5), 批准时间(6)
    
    if (cellCount === 8) {
      // 有申报类别列，cells[2]是script输出的
      gameName = $(cells[1]).text().trim()
      publishUnit = $(cells[3]).text().trim()
      operateUnit = $(cells[4]).text().trim()
      approvalNumber = $(cells[5]).text().trim()
      licenseNumber = $(cells[6]).text().trim()
      approvalDate = $(cells[7]).text().trim()
    } else if (cellCount === 7) {
      // 7列，没有申报类别
      gameName = $(cells[1]).text().trim()
      publishUnit = $(cells[2]).text().trim()
      operateUnit = $(cells[3]).text().trim()
      approvalNumber = $(cells[4]).text().trim()
      licenseNumber = $(cells[5]).text().trim()
      approvalDate = $(cells[6]).text().trim()
    }

    if (gameName && gameName.length > 0) {
      data.push({
        gameName,
        category: category || '',
        publishUnit: publishUnit || '',
        operateUnit: operateUnit || '',
        approvalNumber: approvalNumber || '',
        licenseNumber: licenseNumber || '',
        approvalDate: approvalDate || '',
        gameType
      })
      

    }
  }

  console.log(`[Spider] 解析完成，共 ${data.length} 条数据`)
  return data
}

// 爬取数据
async function crawlData(year: number, type: 'domestic' | 'imported'): Promise<{ success: boolean; count: number; error?: string }> {
  console.log(`[Spider] 开始爬取 ${year} 年 ${type === 'domestic' ? '国产' : '进口'}网络游戏`)

  const mainWindow = BrowserWindow.getAllWindows()[0]
  const gameTypeLabel = type === 'domestic' ? '国产' : '进口'

  try {
    sendProgress(mainWindow, 10, '正在获取页面列表...')

    const urls = await getMonthUrls(year, type)
    
    if (urls.length === 0) {
      sendProgress(mainWindow, 0, `未找到${year}年的数据页面`)
      return { success: false, count: 0, error: `未找到${year}年的数据页面` }
    }

    sendProgress(mainWindow, 30, `找到 ${urls.length} 个页面，开始采集...`)

    const headers = {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      'Accept': 'text/html,application/xhtml+xml',
      'Referer': 'https://www.nppa.gov.cn/'
    }

    let allData: any[] = []
    let processedCount = 0

    for (const url of urls) {
      try {
        console.log(`[Spider] 获取页面: ${url}`)
        const response = await axios.get(url, { headers, timeout: 15000 })
        const monthData = await parseMonthPage(response.data, gameTypeLabel)
        
        monthData.forEach(item => {
          item.sourceUrl = url
        })
        
        allData = allData.concat(monthData)
        processedCount++
        
        const progress = 30 + Math.floor((processedCount / urls.length) * 40)
        sendProgress(mainWindow, progress, `已处理 ${processedCount}/${urls.length} 个页面...`)
      } catch (e) {
        console.error(`[Spider] 获取页面失败 ${url}:`, e)
      }
    }

    if (allData.length === 0) {
      sendProgress(mainWindow, 0, '未能解析到任何数据')
      return { success: false, count: 0, error: '未能解析到任何数据' }
    }

    sendProgress(mainWindow, 70, `共 ${allData.length} 条数据，正在保存...`)

    let successCount = 0
    // 用于去重：已处理的批复文号
    const processedApprovalNumbers = new Set<string>()
    
    for (const item of allData) {
      try {
        // 至少要有游戏名称和批复文号（或版号）之一
        if (!item.gameName || (!item.approvalNumber && !item.licenseNumber)) {
          console.log(`[Spider] 跳过: ${item.gameName} - 缺少必要字段`)
          continue
        }
        
        // 去重：基于批复文号或版号
        const uniqueKey = item.approvalNumber || item.licenseNumber
        if (processedApprovalNumbers.has(uniqueKey)) {
          console.log(`[Spider] 跳过重复: ${item.gameName} - ${uniqueKey}`)
          continue
        }
        processedApprovalNumbers.add(uniqueKey)
        
        // 检查数据库是否已存在
        const checkSql = `SELECT id FROM game_license WHERE approval_number = '${item.approvalNumber.replace(/'/g, "''")}' OR license_number = '${item.licenseNumber.replace(/'/g, "''")}'`
        const existing = db.exec(checkSql)
        if (existing.length > 0 && existing[0].values.length > 0) {
          continue
        }
        
        // 转换日期格式: "2026年03月24日" -> "2026-03-24"
        let approvalDate = item.approvalDate
        if (approvalDate) {
          approvalDate = approvalDate.replace(/年/g, '-').replace(/月/g, '-').replace('日', '')
        }
        
        const publishUnitId = await getOrCreateUnit(item.publishUnit, '出版')
        const operateUnitId = await getOrCreateUnit(item.operateUnit, '运营')

        let companyId = null
        if (item.publishUnit) {
          const companyInfo = recognizeCompany(item.publishUnit)
          if (companyInfo) {
            companyId = await getOrCreateCompany(companyInfo)
            
            if (companyId && publishUnitId) {
              try {
                db.run(`INSERT OR IGNORE INTO company_unit_relation (company_id, unit_id, relation_type) VALUES (?, ?, ?)`,
                  [companyId, publishUnitId, '出版'])
              } catch (e) {
                // 忽略
              }
            }
          }
        }

        db.run(`
          INSERT INTO game_license 
          (license_number, approval_number, game_name, category, game_type, publish_unit_id, operate_unit_id, approval_date, source_url)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          item.licenseNumber || item.approvalNumber,  // 版号优先用出版物号(ISBN)
          item.approvalNumber,                         // 批复文号
          item.gameName,
          item.category,                               // 申报类别
          item.gameType,
          publishUnitId,
          operateUnitId,
          approvalDate,  // 使用转换后的日期格式
          item.sourceUrl || ''
        ])

        successCount++
      } catch (e) {
        console.error('[Spider] 保存数据失败:', e)
      }
    }

    saveDatabase()

    sendProgress(mainWindow, 100, `完成！成功导入 ${successCount} 条数据`)
    console.log(`[Spider] 爬取完成，成功导入 ${successCount} 条数据`)

    return { success: true, count: successCount }
  } catch (error: any) {
    console.error('[Spider] 爬取失败:', error)
    sendProgress(mainWindow, 0, `爬取失败: ${error.message}`)
    return { success: false, count: 0, error: error.message }
  }
}

// 注册 IPC 处理器
export function registerSpiderIpc() {
  ipcMain.handle('spider:crawl', async (_event, year: number, type: 'domestic' | 'imported') => {
    return await crawlData(year, type)
  })

  console.log('[Spider] IPC 处理器注册完成')
}
