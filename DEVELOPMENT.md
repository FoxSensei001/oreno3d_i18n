# Oreno3dI18n 开发指南

## 🚀 快速开始

### 环境要求
- Node.js 18.0+ 
- npm 或 yarn 或 pnpm

### 安装和运行

1. **克隆项目**
```bash
git clone <repository-url>
cd oreno3d_i18n
```

2. **安装依赖**
```bash
npm install
```

3. **启动开发服务器**
```bash
npm run dev
```

4. **访问应用**
- 打开浏览器访问: http://localhost:3000
- 自动重定向到管理后台: http://localhost:3000/admin

## 📁 项目结构详解

```
oreno3d_i18n/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── admin/             # 管理后台页面
│   │   │   ├── layout.tsx     # 后台布局
│   │   │   ├── page.tsx       # 仪表盘
│   │   │   ├── modules/       # 模块管理
│   │   │   └── settings/      # 系统设置
│   │   ├── api/v1/            # API 路由
│   │   │   ├── scrape/        # 爬虫接口
│   │   │   └── modules/       # 模块数据接口
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页（重定向）
│   ├── components/            # React 组件
│   │   ├── ui/               # shadcn/ui 基础组件
│   │   └── admin/            # 管理后台组件
│   ├── hooks/                # 自定义 React Hooks
│   │   └── use-modules.ts    # 模块数据管理
│   ├── lib/                  # 核心逻辑
│   │   ├── types.ts          # TypeScript 类型定义
│   │   ├── scraper.ts        # 爬虫核心逻辑
│   │   └── utils.ts          # 工具函数
│   └── i18n/                 # 生成的 i18n 文件
│       └── tags/             # 标签模块数据
│           ├── ja.json       # 日语（源语言）
│           ├── en.json       # 英语
│           ├── zh-CN.json    # 简体中文
│           └── zh-TW.json    # 繁体中文
├── scraper-config/           # 爬虫配置
│   ├── config.ts            # 全局配置
│   └── handlers/            # 爬虫处理器
│       └── tagsHandler.ts   # 标签爬虫
├── components.json          # shadcn/ui 配置
├── tailwind.config.js       # Tailwind CSS 配置
├── tsconfig.json           # TypeScript 配置
└── package.json            # 项目依赖
```

## 🔧 开发指南

### 添加新的数据模块

1. **创建爬虫处理器**
```typescript
// scraper-config/handlers/authorsHandler.ts
import type { ScrapedItem } from '@/lib/types';

export default async function authorsHandler(): Promise<ScrapedItem[]> {
  // 实现爬取逻辑
  const results: ScrapedItem[] = [];
  
  // 示例：从网站爬取作者数据
  // const response = await axios.get('https://example.com/authors');
  // const $ = cheerio.load(response.data);
  // ... 解析逻辑
  
  return results;
}
```

2. **更新配置文件**
```typescript
// scraper-config/config.ts
export const MODULES: ModuleConfig[] = [
  // 现有模块...
  {
    name: 'authors',
    handler: () => import('./handlers/authorsHandler'),
    keyPrefix: 'author_',
    ui: {
      displayName: '作者',
      description: '内容创作者信息',
      icon: 'User',
      priority: 2,
      estimatedTime: 45
    }
  }
];
```

3. **重启应用**
```bash
npm run dev
```

新模块会自动出现在仪表盘中。

### 添加新的支持语言

1. **更新语言配置**
```typescript
// scraper-config/config.ts
export const TARGET_LANGUAGES: string[] = [
  'ja', 'en', 'zh-CN', 'zh-TW', 'ko'  // 添加韩语
];
```

2. **运行爬虫更新**
访问管理后台，点击"更新所有模块"，系统会自动为所有模块创建新语言的 JSON 文件。

### 自定义爬虫配置

```typescript
// scraper-config/config.ts
export const SCRAPER_CONFIG = {
  requestDelay: 1000,      // 请求间隔（毫秒）
  maxRetries: 3,           // 最大重试次数
  timeout: 10000,          // 请求超时（毫秒）
  concurrency: 2,          // 并发请求数
  userAgent: '...'         // User-Agent
};
```

## 🌐 API 接口文档

### 获取所有模块信息
```http
GET /api/v1/modules
```

**响应示例:**
```json
{
  "success": true,
  "data": [
    {
      "name": "tags",
      "displayName": "标签",
      "description": "网站内容分类标签",
      "totalItems": 100,
      "progress": 75
    }
  ]
}
```

### 获取模块数据
```http
GET /api/v1/modules/{moduleName}
GET /api/v1/modules/{moduleName}?type=stats
```

### 更新翻译
```http
PATCH /api/v1/modules/{moduleName}
Content-Type: application/json

{
  "key": "tag_1",
  "lang": "en", 
  "value": "Video Features"
}
```

### 运行爬虫
```http
POST /api/v1/scrape
Content-Type: application/json

{
  "moduleName": "tags"  // 可选，不提供则爬取所有模块
}
```

## 📊 数据文件格式

### 源语言文件 (ja.json)
```json
{
  "tag_1": "動画の特徴",
  "tag_2": "キャラの特徴"
}
```

### 目标语言文件 (en.json)
```json
{
  "tag_1": {
    "value": "Video Features",
    "translated": true
  },
  "tag_2": {
    "value": "キャラの特徴",
    "translated": false
  }
}
```

## 🛠️ 常用命令

```bash
# 开发
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run start        # 启动生产服务器
npm run lint         # 代码检查

# 添加 UI 组件
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add table

# 测试 API
curl http://localhost:3000/api/v1/modules
curl -X POST http://localhost:3000/api/v1/scrape
```

## 🐛 调试技巧

### 启用详细日志
```bash
# 开发环境默认启用
NODE_ENV=development npm run dev
```

### 检查爬虫状态
查看开发服务器控制台输出，所有爬虫操作都会有详细日志。

## 🚨 注意事项

1. **爬虫频率**: 合理设置 `requestDelay`，避免对目标网站造成压力
2. **数据备份**: 定期备份 `src/i18n/` 目录
3. **网络环境**: 确保能够访问目标网站
4. **文件权限**: 确保应用有读写 `src/i18n/` 目录的权限

## 📝 贡献指南

1. Fork 项目
2. 创建功能分支: `git checkout -b feature/new-feature`
3. 提交更改: `git commit -am 'Add new feature'`
4. 推送分支: `git push origin feature/new-feature`
5. 提交 Pull Request

## ✨ 新功能特性

### 增强的编辑体验

在模块详情页的翻译编辑中，我们提供了以下增强功能：

#### 🔄 重置功能
- **重置按钮**：点击重置按钮可以将当前编辑内容重置为日文原文
- **用途**：当翻译出错或需要重新开始时，快速恢复到源语言内容

#### ⌨️ 键盘快捷键
- **Enter**：保存当前翻译并退出编辑模式
- **Ctrl/Cmd + Enter**：在当前光标位置插入换行符（支持多行翻译）
- **Esc**：取消编辑，放弃所有更改

#### 💡 用户体验优化
- **实时提示**：编辑时显示快捷键提示和日文原文参考
- **视觉反馈**：清晰的按钮图标和工具提示
- **智能布局**：编辑区域自动扩展，提供更好的编辑空间

### 使用示例

1. **开始编辑**：点击任意非源语言的单元格
2. **输入翻译**：在输入框中输入翻译内容
3. **多行支持**：使用 Ctrl/Cmd + Enter 添加换行
4. **重置内容**：点击重置按钮恢复日文原文
5. **保存翻译**：按 Enter 键或点击保存按钮
6. **取消编辑**：按 Esc 键或点击取消按钮

## 🔗 相关链接

- [Next.js 文档](https://nextjs.org/docs)
- [shadcn/ui 组件库](https://ui.shadcn.com/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Query](https://tanstack.com/query/latest)
