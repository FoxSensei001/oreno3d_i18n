import type { ModuleConfig, UIConfig } from '@/lib/types';

// 支持的语言列表
export const TARGET_LANGUAGES: string[] = ['ja', 'en', 'zh-CN', 'zh-TW'];

// 源语言（爬取数据的原始语言）
export const SOURCE_LANGUAGE: string = 'ja';

// 模块配置列表
export const MODULES: ModuleConfig[] = [
  {
    name: 'tags',
    handler: () => import('./handlers/tagsHandler'),
    keyPrefix: 'tag_',
    ui: {
      displayName: 'Tag Groups',
      description: 'All tag groups [https://oreno3d.com/tags]',
      icon: 'Tag',
      priority: 1,
      estimatedTime: 30
    }
  },
  // 未来可以添加更多模块
  // {
  //   name: 'authors',
  //   handler: () => import('./handlers/authorsHandler'),
  //   keyPrefix: 'author_',
  //   ui: {
  //     displayName: '作者',
  //     description: '内容创作者信息',
  //     icon: 'User',
  //     priority: 2,
  //     estimatedTime: 45
  //   }
  // },
  // {
  //   name: 'series',
  //   handler: () => import('./handlers/seriesHandler'),
  //   keyPrefix: 'series_',
  //   ui: {
  //     displayName: '系列',
  //     description: '作品系列信息',
  //     icon: 'BookOpen',
  //     priority: 3,
  //     estimatedTime: 60
  //   }
  // }
];

// UI 配置
export const UI_CONFIG: UIConfig = {
  table: {
    defaultPageSize: 50,
    pageSizeOptions: [25, 50, 100, 200],
    enableVirtualization: true
  },
  progress: {
    showPercentage: true,
    colorScheme: {
      completed: 'hsl(142 76% 36%)',     // green-600
      inProgress: 'hsl(43 89% 38%)',     // yellow-600  
      notStarted: 'hsl(0 84% 60%)'       // red-500
    }
  },
  theme: {
    defaultTheme: 'light',
    enableThemeToggle: true
  }
};

// 爬虫配置
export const SCRAPER_CONFIG = {
  // 请求间隔（毫秒）
  requestDelay: 1000,
  // 最大重试次数
  maxRetries: 3,
  // 请求超时时间（毫秒）
  timeout: 10000,
  // 并发请求数限制
  concurrency: 2,
  // User-Agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// 文件路径配置
export const PATHS = {
  i18nRoot: 'src/i18n',
  getModulePath: (moduleName: string) => `src/i18n/${moduleName}`,
  getLanguageFile: (moduleName: string, language: string) => 
    `src/i18n/${moduleName}/${language}.json`
};

// 获取模块配置
export function getModuleConfig(moduleName: string): ModuleConfig | undefined {
  return MODULES.find(module => module.name === moduleName);
}

// 获取所有模块名称
export function getAllModuleNames(): string[] {
  return MODULES.map(module => module.name);
}

// 按优先级排序的模块
export function getModulesByPriority(): ModuleConfig[] {
  return [...MODULES].sort((a, b) => a.ui.priority - b.ui.priority);
}

// 验证语言代码
export function isValidLanguage(language: string): boolean {
  return TARGET_LANGUAGES.includes(language);
}

// 验证模块名称
export function isValidModule(moduleName: string): boolean {
  return MODULES.some(module => module.name === moduleName);
}

// 获取预估总时间
export function getTotalEstimatedTime(): number {
  return MODULES.reduce((total, module) => total + module.ui.estimatedTime, 0);
}

// 开发环境配置
export const DEV_CONFIG = {
  // 是否启用详细日志
  enableVerboseLogging: process.env.NODE_ENV === 'development',
  // API 基础路径
  apiBasePath: '/api/v1'
};
