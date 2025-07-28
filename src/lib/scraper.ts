import fs from 'fs/promises';
import path from 'path';
import type {
  SourceLanguageData,
  TargetLanguageData,
  TranslationValue,
  ScrapeResult,
  BatchScrapeResult,
  ModuleData,
  TranslationUpdateRequest
} from './types';
import {
  MODULES,
  TARGET_LANGUAGES,
  SOURCE_LANGUAGE,
  PATHS,
  getModuleConfig,
} from '../../scraper-config/config';

/**
 * 确保目录存在
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * 读取 JSON 文件，如果不存在则返回空对象
 */
async function readJsonFile<T>(filePath: string): Promise<T> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {} as T;
  }
}

/**
 * 写入 JSON 文件
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * 为单个模块运行爬虫
 */
export async function runModuleScraper(moduleName: string): Promise<ScrapeResult> {
  const startTime = Date.now();
  const moduleConfig = getModuleConfig(moduleName);
  
  if (!moduleConfig) {
    throw new Error(`未找到模块配置: ${moduleName}`);
  }
  
  console.log(`[Scraper] 开始处理模块: ${moduleName}`);
  
  try {
    // 动态加载并执行 handler
    const handlerModule = await moduleConfig.handler();
    const handler = handlerModule.default;
    const scrapedItems = await handler();
    
    console.log(`[Scraper] ${moduleName} 爬取到 ${scrapedItems.length} 个项目`);
    
    // 处理每种语言的文件
    let newItems = 0;
    let updatedItems = 0;
    
    for (const language of TARGET_LANGUAGES) {
      const filePath = PATHS.getLanguageFile(moduleName, language);
      
      if (language === SOURCE_LANGUAGE) {
        // 处理源语言文件
        const existingData = await readJsonFile<SourceLanguageData>(filePath);
        const newData: SourceLanguageData = {};
        
        for (const item of scrapedItems) {
          const key = `${moduleConfig.keyPrefix}${item.id}`;
          newData[key] = item.name;
          
          if (!existingData[key]) {
            newItems++;
          } else if (existingData[key] !== item.name) {
            updatedItems++;
          }
        }
        
        await writeJsonFile(filePath, newData);
      } else {
        // 处理目标语言文件
        const existingData = await readJsonFile<TargetLanguageData>(filePath);
        const newData: TargetLanguageData = {};
        
        for (const item of scrapedItems) {
          const key = `${moduleConfig.keyPrefix}${item.id}`;
          
          if (existingData[key]) {
            // 保留现有翻译
            newData[key] = existingData[key];
          } else {
            // 新项目，使用源语言内容并标记为未翻译
            newData[key] = {
              value: item.name,
              translated: false
            };
          }
        }
        
        await writeJsonFile(filePath, newData);
      }
    }
    
    const duration = Date.now() - startTime;
    
    const result: ScrapeResult = {
      moduleName,
      itemsProcessed: scrapedItems.length,
      newItems,
      updatedItems,
      duration,
      success: true
    };
    
    console.log(`[Scraper] ${moduleName} 处理完成:`, result);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    
    console.error(`[Scraper] ${moduleName} 处理失败:`, error);
    
    return {
      moduleName,
      itemsProcessed: 0,
      newItems: 0,
      updatedItems: 0,
      duration,
      success: false,
      error: errorMessage
    };
  }
}

/**
 * 运行所有模块的爬虫
 */
export async function runAllScrapers(): Promise<BatchScrapeResult> {
  const startTime = Date.now();
  const results: ScrapeResult[] = [];
  
  console.log('[Scraper] 开始批量爬取所有模块...');
  
  for (const moduleConfig of MODULES) {
    const result = await runModuleScraper(moduleConfig.name);
    results.push(result);
  }
  
  const totalDuration = Date.now() - startTime;
  const successfulModules = results.filter(r => r.success).length;
  const failedModules = results.length - successfulModules;
  
  const batchResult: BatchScrapeResult = {
    totalModules: results.length,
    successfulModules,
    failedModules,
    results,
    totalDuration
  };
  
  console.log('[Scraper] 批量爬取完成:', batchResult);
  return batchResult;
}

/**
 * 获取模块的聚合数据（用于表格显示）
 */
export async function getModuleData(moduleName: string): Promise<ModuleData[]> {
  const moduleConfig = getModuleConfig(moduleName);
  if (!moduleConfig) {
    throw new Error(`未找到模块配置: ${moduleName}`);
  }

  const result: ModuleData[] = [];

  // 读取源语言文件获取所有 key
  const sourceFilePath = PATHS.getLanguageFile(moduleName, SOURCE_LANGUAGE);
  const sourceData = await readJsonFile<SourceLanguageData>(sourceFilePath);

  // 读取所有目标语言文件
  const languageData: Record<string, TargetLanguageData | SourceLanguageData> = {};

  for (const language of TARGET_LANGUAGES) {
    const filePath = PATHS.getLanguageFile(moduleName, language);
    if (language === SOURCE_LANGUAGE) {
      languageData[language] = sourceData;
    } else {
      languageData[language] = await readJsonFile<TargetLanguageData>(filePath);
    }
  }

  // 合并数据
  for (const key of Object.keys(sourceData)) {
    const translations: Record<string, TranslationValue | string> = {};

    for (const language of TARGET_LANGUAGES) {
      const data = languageData[language];
      if (language === SOURCE_LANGUAGE) {
        translations[language] = data[key] || '';
      } else {
        const targetData = data as TargetLanguageData;
        translations[language] = targetData[key] || {
          value: sourceData[key] || '',
          translated: false
        };
      }
    }

    result.push({ key, translations });
  }

  return result;
}

/**
 * 更新单个翻译
 */
export async function updateTranslation(
  moduleName: string,
  request: TranslationUpdateRequest
): Promise<void> {
  const { key, lang, value, translated } = request;

  if (!getModuleConfig(moduleName)) {
    throw new Error(`未找到模块配置: ${moduleName}`);
  }

  if (lang === SOURCE_LANGUAGE) {
    throw new Error('不能直接修改源语言文件');
  }

  const filePath = PATHS.getLanguageFile(moduleName, lang);
  const existingData = await readJsonFile<TargetLanguageData>(filePath);

  const currentEntry = existingData[key] || {};

  existingData[key] = {
    value: value,
    translated: translated === undefined ? true : translated,
  };

  await writeJsonFile(filePath, existingData);
  console.log(`[Scraper] 更新翻译: ${moduleName}.${key}.${lang}, value: "${value}", translated: ${existingData[key].translated}`);
}

/**
 * 获取模块统计信息
 */
export async function getModuleStats(moduleName: string) {
  const moduleConfig = getModuleConfig(moduleName);
  if (!moduleConfig) {
    throw new Error(`未找到模块配置: ${moduleName}`);
  }

  const sourceFilePath = PATHS.getLanguageFile(moduleName, SOURCE_LANGUAGE);
  const sourceData = await readJsonFile<SourceLanguageData>(sourceFilePath);
  const totalItems = Object.keys(sourceData).length;

  const languageStats: Record<string, { total: number; translated: number; progress: number }> = {};
  let totalTranslated = 0;

  for (const language of TARGET_LANGUAGES) {
    if (language === SOURCE_LANGUAGE) {
      languageStats[language] = {
        total: totalItems,
        translated: totalItems,
        progress: 100
      };
      continue;
    }

    const filePath = PATHS.getLanguageFile(moduleName, language);
    const data = await readJsonFile<TargetLanguageData>(filePath);

    const translated = Object.values(data).filter(item =>
      typeof item === 'object' && item.translated
    ).length;

    languageStats[language] = {
      total: totalItems,
      translated,
      progress: totalItems > 0 ? Math.round((translated / totalItems) * 100) : 0
    };

    totalTranslated += translated;
  }

  const overallProgress = TARGET_LANGUAGES.length > 1
    ? Math.round((totalTranslated / (totalItems * (TARGET_LANGUAGES.length - 1))) * 100)
    : 100;

  return {
    moduleName,
    displayName: moduleConfig.ui.displayName,
    description: moduleConfig.ui.description,
    icon: moduleConfig.ui.icon,
    priority: moduleConfig.ui.priority,
    totalItems,
    progress: overallProgress,
    estimatedTime: moduleConfig.ui.estimatedTime,
    languageStats
  };
}
