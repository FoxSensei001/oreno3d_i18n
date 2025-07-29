import type { ModuleConfig, UIConfig } from '@/lib/types';

// Supported language list
export const TARGET_LANGUAGES: string[] = ['ja', 'en', 'zh-CN', 'zh-TW'];

// Source language (original language of scraped data)
export const SOURCE_LANGUAGE: string = 'ja';

// Module configuration list
export const MODULES: ModuleConfig[] = [
  {
    name: 'tags',
    handler: () => import('./handlers/tagsHandler'),
    keyPrefix: '',
    ui: {
      displayName: 'Tag Groups',
      description: 'All tag groups [https://oreno3d.com/tags]',
      icon: 'Tag',
      priority: 1,
      estimatedTime: 30
    }
  },
  {
    name: 'origins',
    handler: () => import('./handlers/originsHandler'),
    keyPrefix: 'origin_',
    ui: {
      displayName: 'Origins',
      description: 'All origins [https://oreno3d.com/origins]',
      icon: 'Globe',
      priority: 10,
      estimatedTime: 30
    }
  },
  // Tag groups modules
  ...Array.from({ length: 8 }, (_, i) => ({
    name: `tag_group_${i + 1}`,
    handler: () => import('./handlers/tagGroupsHandler').then(module => ({
      default: () => module.default(i + 1)
    })),
    keyPrefix: `tag_group_${i + 1}_`,
    ui: {
      displayName: `Tag Group ${i + 1}`,
      description: `Tags in group ${i + 1} [https://oreno3d.com/tag-groups/${i + 1}]`,
      icon: 'Tag',
      priority: 2 + i,
      estimatedTime: 15
    }
  })),
  // More modules can be added in the future
  // {
  //   name: 'authors',
  //   handler: () => import('./handlers/authorsHandler'),
  //   keyPrefix: 'author_',
  //   ui: {
  //     displayName: 'Authors',
  //     description: 'Content creator information',
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
  //     displayName: 'Series',
  //     description: 'Work series information',
  //     icon: 'BookOpen',
  //     priority: 3,
  //     estimatedTime: 60
  //   }
  // }
];

// UI configuration
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

// Scraper configuration
export const SCRAPER_CONFIG = {
  // Request interval (milliseconds)
  requestDelay: 1000,
  // Maximum retry attempts
  maxRetries: 3,
  // Request timeout (milliseconds)
  timeout: 10000,
  // Concurrent request limit
  concurrency: 2,
  // User-Agent
  userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
};

// File path configuration
export const PATHS = {
  i18nRoot: 'src/i18n',
  getModulePath: (moduleName: string) => `src/i18n/${moduleName}`,
  getLanguageFile: (moduleName: string, language: string) => 
    `src/i18n/${moduleName}/${language}.json`
};

// Get module configuration
export function getModuleConfig(moduleName: string): ModuleConfig | undefined {
  return MODULES.find(module => module.name === moduleName);
}

// Get all module names
export function getAllModuleNames(): string[] {
  return MODULES.map(module => module.name);
}

// Get modules sorted by priority
export function getModulesByPriority(): ModuleConfig[] {
  return [...MODULES].sort((a, b) => a.ui.priority - b.ui.priority);
}

// Validate language code
export function isValidLanguage(language: string): boolean {
  return TARGET_LANGUAGES.includes(language);
}

// Validate module name
export function isValidModule(moduleName: string): boolean {
  return MODULES.some(module => module.name === moduleName);
}

// Get estimated total time
export function getTotalEstimatedTime(): number {
  return MODULES.reduce((total, module) => total + module.ui.estimatedTime, 0);
}

// Development environment configuration
export const DEV_CONFIG = {
  // Whether to enable verbose logging
  enableVerboseLogging: process.env.NODE_ENV === 'development',
  // API base path
  apiBasePath: '/api/v1'
};