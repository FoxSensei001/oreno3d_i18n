// 核心数据类型定义

// 爬取的原始数据项
export interface ScrapedItem {
  id: string;
  name: string;
}

// 翻译条目的值结构
export interface TranslationValue {
  value: string;
  translated: boolean;
}

// 源语言文件结构 (ja.json)
export type SourceLanguageData = Record<string, string>;

// 目标语言文件结构 (en.json, zh-CN.json 等)
export type TargetLanguageData = Record<string, TranslationValue>;

// 模块配置接口
export interface ModuleConfig {
  name: string;
  handler: () => Promise<{ default: ModuleHandler }>;
  keyPrefix: string;
  ui: {
    displayName: string;
    description: string;
    icon: string;
    priority: number;
    estimatedTime: number;
  };
}

// 模块处理器函数类型
export type ModuleHandler = () => Promise<ScrapedItem[]>;

// 模块信息（用于仪表盘显示）
export interface ModuleInfo {
  name: string;
  displayName: string;
  description: string;
  icon: string;
  priority: number;
  totalItems: number;
  progress: number;
  lastUpdated?: string;
  estimatedTime: number;
}

// 聚合的模块数据（用于表格显示）
export interface ModuleData {
  key: string;
  translations: Record<string, TranslationValue | string>;
}

// API 响应类型
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// 爬虫运行结果
export interface ScrapeResult {
  moduleName: string;
  itemsProcessed: number;
  newItems: number;
  updatedItems: number;
  duration: number;
  success: boolean;
  error?: string;
}

// 批量爬虫结果
export interface BatchScrapeResult {
  totalModules: number;
  successfulModules: number;
  failedModules: number;
  results: ScrapeResult[];
  totalDuration: number;
}

// 翻译更新请求
export interface TranslationUpdateRequest {
  key: string;
  lang: string;
  value: string;
  translated?: boolean;
}

// UI 配置类型
export interface UIConfig {
  table: {
    defaultPageSize: number;
    pageSizeOptions: number[];
    enableVirtualization: boolean;
  };
  progress: {
    showPercentage: boolean;
    colorScheme: {
      completed: string;
      inProgress: string;
      notStarted: string;
    };
  };
  theme: {
    defaultTheme: 'light' | 'dark';
    enableThemeToggle: boolean;
  };
}

// 筛选选项
export interface FilterOptions {
  translationStatus: 'all' | 'translated' | 'untranslated';
  language?: string;
  searchTerm?: string;
  dateRange?: {
    from: Date;
    to: Date;
  };
}

// 表格列定义
export interface TableColumn {
  key: string;
  label: string;
  sortable: boolean;
  filterable: boolean;
  width?: number;
}

// 爬虫进度状态
export interface ScrapeProgress {
  currentModule: string;
  currentModuleIndex: number;
  totalModules: number;
  currentOperation: string;
  progress: number;
  estimatedTimeRemaining?: number;
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
  timestamp: string;
}

// 统计信息
export interface Statistics {
  totalModules: number;
  totalItems: number;
  totalTranslated: number;
  translationProgress: number;
  languageStats: Record<string, {
    total: number;
    translated: number;
    progress: number;
  }>;
}
