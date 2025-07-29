# Oreno3dI18n - 自动化 i18n 管理工具

[English version](../README.md)

## 📚 文档导航

- [开发指南 (Chinese)](DEVELOPMENT-zh.md)
- [代码规范 (Chinese)](CODE_STANDARDS-zh.md)

Oreno3dI18n 是一个基于 Next.js 构建的本地化 i18n 管理工具。它旨在自动化地从指定网站爬取源数据（默认为日语），并生成和维护多语言的 JSON 文件。

## 🚀 功能特性

- **模块化设计**: 可轻松添加新的数据抓取模块
- **自动化爬取**: 为每个模块配置专属的爬虫处理器
- **i18n 文件生成**: 自动创建和更新多语言 JSON 文件
- **可扩展的语言支持**: 只需修改配置文件即可增删支持的语言
- **Web 管理界面**: 直观的仪表盘和数据管理界面
- **在线编辑**: 支持在线编辑翻译内容
- **智能筛选**: 快速定位未翻译的条目
- **🌍 多语言界面**: 支持中文、英文、日文的用户界面切换
- **⌨️ 增强编辑**: 快捷键支持、重置功能、多行翻译

## 🛠️ 技术栈

- **Next.js 15** - React 全栈框架
- **TypeScript** - 类型安全
- **Tailwind CSS** - 原子化 CSS
- **shadcn/ui** - 现代化 UI 组件库
- **React Query** - 服务端状态管理
- **Axios & Cheerio** - 网页爬取
- **Sonner** - 通知提示
- **next-intl** - 国际化支持

## 📦 安装和运行

### 1. 安装依赖
```bash
npm install
```

### 2. 启动开发服务器
```bash
npm run dev
```

### 3. 访问应用
打开浏览器访问 [http://localhost:3000](http://localhost:3000)

## 📁 项目结构

```
src/
├── app/                    # Next.js App Router
│   ├── admin/             # 管理后台页面
│   └── api/v1/            # API 路由
├── components/            # React 组件
│   ├── ui/               # shadcn/ui 组件
│   └── admin/            # 管理后台组件
├── hooks/                # 自定义 React Hooks
├── lib/                  # 核心逻辑和工具
├── i18n/                 # 生成的 i18n 文件和国际化配置
└── scraper-config/       # 爬虫配置和处理器
    ├── handlers/         # 爬虫处理器
    └── config.ts         # 全局配置
├── messages/             # 界面翻译文件
│   ├── zh.json          # 简体中文
│   ├── en.json          # 英语
│   └── ja.json          # 日语
```

## 🔧 配置说明

### 语言配置
在 `scraper-config/config.ts` 中修改支持的语言：

```typescript
export const TARGET_LANGUAGES: string[] = ['ja', 'en', 'zh-CN', 'zh-TW'];
export const SOURCE_LANGUAGE: string = 'ja';
```

### 添加新模块
1. 在 `scraper-config/handlers/` 创建新的处理器文件
2. 在 `scraper-config/config.ts` 的 `MODULES` 数组中添加配置
3. 重启应用，新模块会自动出现在仪表盘

## 🌐 API 接口

### 获取所有模块
```bash
GET /api/v1/modules
```

### 获取模块数据
```bash
GET /api/v1/modules/{moduleName}
GET /api/v1/modules/{moduleName}?type=stats
```

### 更新翻译
```bash
PATCH /api/v1/modules/{moduleName}
Content-Type: application/json

{
  "key": "tag_1",
  "lang": "en",
  "value": "Video Features"
}
```

### 运行爬虫
```bash
POST /api/v1/scrape
Content-Type: application/json

{
  "moduleName": "tags"  // 可选，不提供则爬取所有模块
}
```

## 📊 使用指南

### 1. 仪表盘
- 查看所有模块的翻译进度
- 一键更新所有模块或单个模块
- 快速导航到模块详情页

### 2. 模块管理
- 查看模块的详细翻译数据
- 在线编辑翻译内容
- 筛选未翻译的条目
- 搜索特定内容

### 3. 数据更新
- 手动触发爬虫更新数据
- 自动保留已有的翻译
- 新增条目会标记为"未翻译"

## 🔍 开发说明

### 创建新的爬虫处理器
```typescript
// scraper-config/handlers/exampleHandler.ts
import type { ScrapedItem } from '@/lib/types';

export default async function exampleHandler(): Promise<ScrapedItem[]> {
  // 实现爬取逻辑
  return [
    { id: '1', name: '示例项目' }
  ];
}
```

### 数据文件格式
- **源语言文件** (`ja.json`): `{ "key": "value" }`
- **目标语言文件** (`en.json`): `{ "key": { "value": "translation", "translated": true } }`

## 🚨 注意事项

1. **爬虫频率**: 请合理设置爬虫请求间隔，避免对目标网站造成压力
2. **数据备份**: 建议定期备份 `src/i18n/` 目录下的翻译文件
3. **网络环境**: 确保能够访问目标网站

## 📝 许可证

MIT License

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

如果您想为国际化翻译做贡献：
1. 克隆项目并按照[安装和运行](#-安装和运行)指南设置项目
2. 启动开发服务器后访问 http://localhost:3000/admin/modules
3. 选择你要更新的模块
4. 对里面未翻译的选项进行翻译
5. 当翻译工作完成后，将当前的项目提交并推送即可

如果您是开发者，想要开发新的爬虫，请查阅开发指南：
- [Development Guide (English)](DEVELOPMENT-en.md)
- [开发指南 (Chinese)](DEVELOPMENT-zh.md)

---

**Oreno3dI18n** - 让 i18n 管理变得简单高效！
