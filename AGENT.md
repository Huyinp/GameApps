# 游戏版号管理系统 - Agent 开发指南

## 项目概述

**项目名称**: 游戏版号管理系统 (Game License Manager)
**技术栈**: Electron + Vue3 + TypeScript + sql.js
**开发环境**: Windows
**目标**: 爬取国家新闻出版署游戏版号审批信息，进行数据管理和分析

---

## 一、项目架构

### 1.1 技术架构

```
┌─────────────────────────────────────────────────────────┐
│                    Electron 主进程                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐  │
│  │  窗口管理    │  │  系统托盘    │  │  IPC 处理器     │  │
│  └─────────────┘  └─────────────┘  └─────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐│
│  │              sql.js 数据库操作层                     ││
│  └─────────────────────────────────────────────────────┘│
│  ┌─────────────────────────────────────────────────────┐│
│  │              爬虫模块 (cheerio + axios)             ││
│  └─────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
                          │ IPC
┌─────────────────────────────────────────────────────────┐
│                   Vue3 渲染进程                          │
│  ┌─────────────────────────────────────────────────────┐│
│  │                 Vue Router                          ││
│  └─────────────────────────────────────────────────────┘│
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ │
│  │ 数据概览  │ │ 版号管理  │ │ 厂商管理  │ │ 单位管理   │ │
│  └──────────┘ └──────────┘ └──────────┘ └────────────┘ │
│  ┌──────────┐ ┌──────────────────────────────────────┐  │
│  │ 数据分析 │ │           数据采集                    │  │
│  └──────────┘ └──────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

### 1.2 目录结构

```
game-license-manager/
├── electron/
│   ├── main.ts                 # Electron主进程入口
│   ├── preload.ts              # 预加载脚本（暴露API）
│   └── ipc/
│       ├── database.ts         # 数据库IPC处理
│       ├── spider.ts           # 爬虫IPC处理
│       └── window.ts           # 窗口管理IPC
├── src/
│   ├── main.ts                 # Vue主入口
│   ├── App.vue
│   ├── router/
│   │   └── index.ts            # 路由配置
│   ├── views/
│   │   ├── Dashboard.vue       # 数据概览
│   │   ├── LicenseManage.vue   # 游戏版号管理
│   │   ├── CompanyManage.vue   # 厂商管理
│   │   ├── UnitManage.vue      # 单位管理
│   │   ├── DataAnalysis.vue    # 数据分析
│   │   └── DataCollection.vue  # 数据采集
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.vue   # 主布局
│   │   │   └── Sidebar.vue     # 侧边栏
│   │   ├── common/
│   │   │   ├── DataTable.vue   # 数据表格组件
│   │   │   ├── SearchBar.vue   # 搜索栏
│   │   │   └── Pagination.vue  # 分页组件
│   │   ├── company/
│   │   │   ├── CompanyTree.vue       # 厂商树（拖拽）
│   │   │   └── CompanyRelation.vue   # 关联配置
│   │   └── analysis/
│   │       ├── ChartCard.vue         # 图表卡片
│   │       └── DetailModal.vue       # 详情弹窗
│   ├── stores/
│   │   ├── license.ts          # 版号状态管理
│   │   ├── company.ts          # 厂商状态管理
│   │   ├── unit.ts             # 单位状态管理
│   │   └── analysis.ts         # 分析状态管理
│   ├── services/
│   │   └── api.ts              # API调用封装
│   ├── utils/
│   │   ├── companyRecognize.ts # 厂商智能识别
│   │   └── format.ts           # 格式化工具
│   └── styles/
│       └── main.scss           # 全局样式
├── database/
│   └── game_license.db         # sql.js数据库文件
├── public/
│   └── favicon.ico
├── resources/
│   └── icon.ico                # 应用图标
├── package.json
├── electron-builder.json       # 构建配置
├── vite.config.ts
├── tsconfig.json
├── .npmrc                      # NPM镜像配置
└── README.md
```

---

## 二、数据库设计

### 2.1 表结构

```sql
-- 游戏版号表
CREATE TABLE game_license (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    license_number VARCHAR(50) NOT NULL,      -- 版号
    game_name VARCHAR(255) NOT NULL,           -- 游戏名称
    game_type VARCHAR(20) NOT NULL,            -- 类型: 国产/进口
    publish_unit_id INTEGER,                   -- 出版单位ID
    operate_unit_id INTEGER,                   -- 运营单位ID
    approval_date DATE,                        -- 审批日期
    approval_number VARCHAR(50),               -- 审批文号
    category VARCHAR(50),                      -- 类别
    source_url VARCHAR(500),                   -- 来源URL
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (publish_unit_id) REFERENCES unit(id),
    FOREIGN KEY (operate_unit_id) REFERENCES unit(id)
);

-- 单位表
CREATE TABLE unit (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name VARCHAR(255) NOT NULL UNIQUE,         -- 单位名称
    type VARCHAR(20),                          -- 类型: 出版/运营
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 厂商表
CREATE TABLE company (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name VARCHAR(255) NOT NULL,           -- 厂商全称
    short_name VARCHAR(100),                   -- 厂商简称
    is_major BOOLEAN DEFAULT 0,                -- 是否大厂
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 厂商-单位关联表
CREATE TABLE company_unit_relation (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    company_id INTEGER NOT NULL,
    unit_id INTEGER NOT NULL,
    relation_type VARCHAR(20),                 -- 关联类型: 出版/运营
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES company(id),
    FOREIGN KEY (unit_id) REFERENCES unit(id),
    UNIQUE(company_id, unit_id, relation_type)
);
```

---

## 三、功能模块详解

### 3.1 数据采集模块

**功能**: 爬取国家新闻出版署网站版号信息

**爬取页面**:
- 国产网络游戏: `https://www.nppa.gov.cn/bsfw/jggs/yxspjg/`
- 进口网络游戏: 同上（需要区分类型）

**数据字段**:
- 版号、 游戏名称、 类型（国产/进口）
- 出版单位、 运营单位
- 审批日期、 审批文号、 类别

**处理逻辑**:
1. 爬取网页表格数据
2. 解析HTML提取数据
3. 区分国产/进口类型
4. 存储到数据库

### 3.2 厂商智能识别

**大厂识别规则**:
```typescript
const MAJOR_COMPANIES = [
  { fullName: '腾讯科技（深圳）有限公司', shortName: '腾讯' },
  { fullName: '网易（杭州）网络有限公司', shortName: '网易' },
  { fullName: '完美世界（北京）网络技术有限公司', shortName: '完美世界' },
  { fullName: '盛趣游戏', shortName: '盛趣游戏' },
  { fullName: '米哈游科技（上海）有限公司', shortName: '米哈游' },
  { fullName: '上海莉莉丝科技股份有限公司', shortName: '莉莉丝' },
  { fullName: '北京字节跳动科技有限公司', shortName: '字节跳动' },
  { fullName: '阿里巴巴（中国）有限公司', shortName: '阿里' },
  { fullName: '百度在线网络技术（北京）有限公司', shortName: '百度' },
  { fullName: '上海游族网络科技有限公司', shortName: '游族' },
  { fullName: '巨人网络集团股份有限公司', shortName: '巨人网络' },
  { fullName: '西山居软件有限公司', shortName: '西山居' },
  { fullName: '龙图游戏', shortName: '龙图游戏' },
  { fullName: '叠纸科技', shortName: '叠纸' },
  { fullName: '鹰角网络', shortName: '鹰角网络' },
];
```

**匹配逻辑**:
1. 模糊匹配单位名称
2. 匹配成功后自动创建/关联厂商
3. 大厂标记 `is_major = true`

### 3.3 单位-厂商关联配置

**交互方式**: 拖拽操作
- 左侧：未关联单位列表
- 右侧：厂商列表
- 拖拽单位到厂商卡片上进行关联

### 3.4 数据分析

**统计维度**:
1. 按月份统计版号数量
2. 按类型（国产/进口）统计
3. 热门出版/运营单位排行
4. 大厂商版号占比

---

## 四、研发计划

### Phase 1: 项目初始化
- [ ] 初始化 Electron + Vue3 + TS 项目
- [ ] 配置 NPM 镜像
- [ ] 搭建项目目录结构
- [ ] 配置 Vite 和 Electron 集成

### Phase 2: 基础功能
- [ ] 实现 sql.js 数据库初始化
- [ ] 创建数据库表结构
- [ ] 实现基础的 CRUD 操作
- [ ] 搭建 Vue 路由和布局

### Phase 3: 数据采集
- [ ] 爬虫模块开发
- [ ] 解析网页数据
- [ ] 数据存储逻辑
- [ ] 厂商智能识别

### Phase 4: 核心功能
- [ ] 数据概览页面
- [ ] 游戏版号管理页面
- [ ] 单位管理页面
- [ ] 厂商管理页面（含拖拽关联）

### Phase 5: 数据分析
- [ ] 数据分析页面
- [ ] 图表展示
- [ ] 详情查看功能

### Phase 6: 优化
- [ ] 样式优化
- [ ] 性能优化
- [ ] 测试运行

---

## 五、开发规范

### 5.1 代码规范
- 使用 TypeScript 严格模式
- 组件采用 Composition API
- 使用 Pinia 进行状态管理
- CSS 使用 SCSS

### 5.2 命名规范
- 组件名: 大驼峰 (e.g., `CompanyManage.vue`)
- 变量/函数: 小驼峰 (e.g., `getCompanyList`)
- 常量: 全大写下划线 (e.g., `MAJOR_COMPANIES`)
- 文件名: 小写下划线 (e.g., `company_recognize.ts`)

### 5.3 Electron 安全
- 使用 contextBridge 暴露 API
- 禁用 nodeIntegration
- 启用 contextIsolation

---

## 六、运行命令

### 开发模式
```bash
# 安装依赖
npm install

# 运行开发服务器
npm run dev
```

### 生产构建
```bash
# 构建
npm run build
```

---

## 八、NPM 镜像配置

项目使用国内镜像加速，配置如下：

### .npmrc 文件内容
```ini
electron_mirror=https://npmmirror.com/mirrors/electron/
registry=https://npmmirror.com/mirrors/npm/
```

### 常用命令
```bash
# 查看当前镜像配置
npm config list

# 临时使用官方镜像
npm install --registry=https://registry.npmjs.org/

# 切换回国内镜像
npm config set registry https://npmmirror.com/mirrors/npm/
```

---

## 七、注意事项

1. **爬虫频率**: 需要添加适当的延迟，避免对目标网站造成压力
2. **数据清洗**: 单位名称可能存在格式不一致，需要规范化处理
3. **错误处理**: 网络请求需要完善的错误捕获和重试机制
4. **镜像配置**: 确保 .npmrc 配置正确，使用国内镜像