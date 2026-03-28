# 游戏版号管理系统 (Game License Manager)

基于 Electron + Vue3 + TypeScript + sql.js 开发的桌面应用程序，用于管理和分析国家新闻出版署游戏版号审批信息。

## 功能特性

### 1. 数据采集
- 自动爬取国家新闻出版署网站的游戏版号审批信息
- 区分国产网络游戏和进口网络游戏
- 支持按年份收集数据

### 2. 数据管理
- 游戏版号管理：增删改查版号信息
- 单位管理：出版单位、运营单位列表
- 厂商管理：大厂自动识别，拖拽关联单位和厂商

### 3. 数据分析
- 按年份统计分析游戏版号
- 多维度统计：月度分布、类型分布、热门单位排行
- 单击查看详情

### 4. 智能识别
- 自动识别大厂（腾讯、网易、米哈游、莉莉丝等）
- 智能关联单位和厂商关系

## 技术栈

- **前端框架**: Vue 3 + TypeScript
- **桌面框架**: Electron
- **数据库**: SQLite3 (sql.js)
- **状态管理**: Pinia
- **HTTP 客户端**: Axios
- **HTML 解析**: Cheerio
- **构建工具**: Vite + electron-builder

## 项目结构

```
game-license-manager/
├── electron/                 # Electron 主进程
│   ├── main.ts             # 主进程入口
│   ├── preload.ts          # 预加载脚本
│   └── ipc/               # IPC 处理器
│       ├── database.ts    # 数据库操作
│       ├── spider.ts      # 爬虫模块
│       └── window.ts      # 窗口管理
├── src/                    # Vue 渲染进程
│   ├── views/             # 页面组件
│   │   ├── Dashboard.vue         # 数据概览
│   │   ├── LicenseManage.vue     # 游戏版号管理
│   │   ├── CompanyManage.vue     # 厂商管理
│   │   ├── UnitManage.vue        # 单位管理
│   │   ├── DataAnalysis.vue      # 数据分析
│   │   └── DataCollection.vue    # 数据采集
│   ├── components/       # 通用组件
│   ├── stores/           # Pinia 状态管理
│   ├── services/         # API 服务
│   └── utils/            # 工具函数
├── database/             # 数据库文件目录
├── package.json
├── vite.config.ts
├── tsconfig.json
├── electron-builder.json
└── .npmrc                # NPM 镜像配置
```

## 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm >= 9.0.0
- Windows 10/11

### 安装步骤

```bash
# 1. 克隆或下载项目
cd game-license-manager

# 2. 安装依赖（自动使用 .npmrc 配置的镜像）
npm install

# 3. 启动开发模式
npm run dev
```

### 开发命令

```bash
# 安装依赖
npm install

# 启动开发服务器（同时启动 Electron 和 Vite）
npm run dev

# 构建生产版本
npm run build

# 仅构建 Vite（前端）
npm run build:renderer

# 仅构建 Electron（主进程）
npm run build:main

# 运行 lint
npm run lint

# 预览生产构建
npm run preview
```

## 功能模块说明

### 数据概览 (Dashboard)
- 显示系统关键指标
- 最近采集数据预览
- 快速统计卡片

### 游戏版号管理 (License Manage)
- 列表展示所有版号信息
- 支持搜索、筛选、排序
- 编辑、删除版号记录

### 单位管理 (Unit Manage)
- 出版单位列表
- 运营单位列表
- 单位信息维护

### 厂商管理 (Company Manage)
- 厂商列表（大厂标记）
- 拖拽方式关联单位和厂商
- 厂商简称/全称管理

### 数据分析 (Data Analysis)
- 按年份分析版号数据
- 图表展示：月度趋势、类型分布
- 单击查看详细数据

### 数据采集 (Data Collection)
- 输入年份采集数据
- 爬取国产网络游戏审批信息
- 爬取进口网络游戏审批信息
- 自动识别和关联单位

## 数据库设计

### 表结构

- **game_license**: 游戏版号表
- **unit**: 单位表（出版单位、运营单位）
- **company**: 厂商表
- **company_unit_relation**: 厂商-单位关联表

详见 [AGENT.md](./AGENT.md)

## 大厂识别列表

系统自动识别以下大厂：

- 腾讯科技（深圳）有限公司 → 腾讯
- 网易（杭州）网络有限公司 → 网易
- 完美世界（北京）网络技术有限公司 → 完美世界
- 盛趣游戏 → 盛趣游戏
- 米哈游科技（上海）有限公司 → 米哈游
- 上海莉莉丝科技股份有限公司 → 莉莉丝
- 北京字节跳动科技有限公司 → 字节跳动
- 阿里巴巴（中国）有限公司 → 阿里
- 百度在线网络技术（北京）有限公司 → 百度
- 上海游族网络科技有限公司 → 游族
- 巨人网络集团股份有限公司 → 巨人网络
- 西山居软件有限公司 → 西山居

## 注意事项

1. **爬虫频率**: 采集数据时请适当设置间隔，避免对目标网站造成压力
2. **数据清洗**: 单位名称可能存在格式不一致，系统会自动规范化处理
3. **网络问题**: 确保开发环境可以正常访问国家新闻出版署网站
4. **镜像配置**: 已配置国内 NPM 镜像，安装依赖更快

## 常见问题

### Q: 安装依赖失败？
A: 检查网络连接，或尝试手动设置镜像：`npm config set registry https://npmmirror.com/mirrors/npm/`

### Q: 开发模式启动失败？
A: 确保 Node.js 版本 >= 18，Windows 环境需要安装 Visual Studio Build Tools

### Q: 数据库文件位置？
A: 数据库文件位于 `database/game_license.db`，使用 sql.js 存储

## 后续计划

See [AGENT.md](./AGENT.md) - 研发计划章节

---

**项目维护者**: [Your Name]
**版本**: 1.0.0
**许可证**: MIT
