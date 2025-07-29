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
 * Ensure directory exists
 */
async function ensureDirectoryExists(dirPath: string): Promise<void> {
  try {
    await fs.access(dirPath);
  } catch {
    await fs.mkdir(dirPath, { recursive: true });
  }
}

/**
 * Read JSON file, return empty object if not exists
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
 * Write JSON file
 */
async function writeJsonFile(filePath: string, data: unknown): Promise<void> {
  await ensureDirectoryExists(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

/**
 * Run scraper for a single module
 */
export async function runModuleScraper(moduleName: string): Promise<ScrapeResult> {
  const startTime = Date.now();
  const moduleConfig = getModuleConfig(moduleName);
  
  if (!moduleConfig) {
    throw new Error(`Module config not found: ${moduleName}`);
  }
  
  console.log(`[Scraper] Starting to process module: ${moduleName}`);
  
  try {
    // Dynamically load and execute handler
    const handlerModule = await moduleConfig.handler();
    const handler = handlerModule.default;
    const scrapedItems = await handler();
    
    console.log(`[Scraper] ${moduleName} scraped ${scrapedItems.length} items`);
    
    // Process files for each language
    let newItems = 0;
    let updatedItems = 0;
    
    for (const language of TARGET_LANGUAGES) {
      const filePath = PATHS.getLanguageFile(moduleName, language);
      
      if (language === SOURCE_LANGUAGE) {
        // Process source language file
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
        // Process target language files
        const existingData = await readJsonFile<TargetLanguageData>(filePath);
        const newData: TargetLanguageData = {};
        
        for (const item of scrapedItems) {
          const key = `${moduleConfig.keyPrefix}${item.id}`;
          
          if (existingData[key]) {
            // Preserve existing translations
            newData[key] = existingData[key];
          } else {
            // New item, use source language content and mark as untranslated
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
    
    console.log(`[Scraper] ${moduleName} processing completed:`, result);
    return result;
    
  } catch (error) {
    const duration = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    console.error(`[Scraper] ${moduleName} processing failed:`, error);
    
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
 * Run scrapers for all modules
 */
export async function runAllScrapers(): Promise<BatchScrapeResult> {
  const startTime = Date.now();
  const results: ScrapeResult[] = [];
  
  console.log('[Scraper] Starting batch scraping of all modules...');
  
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
  
  console.log('[Scraper] Batch scraping completed:', batchResult);
  return batchResult;
}

/**
 * Get aggregated module data (for table display)
 */
export async function getModuleData(moduleName: string): Promise<ModuleData[]> {
  const moduleConfig = getModuleConfig(moduleName);
  if (!moduleConfig) {
    throw new Error(`Module config not found: ${moduleName}`);
  }

  const result: ModuleData[] = [];

  // Read source language file to get all keys
  const sourceFilePath = PATHS.getLanguageFile(moduleName, SOURCE_LANGUAGE);
  const sourceData = await readJsonFile<SourceLanguageData>(sourceFilePath);

  // Read all target language files
  const languageData: Record<string, TargetLanguageData | SourceLanguageData> = {};

  for (const language of TARGET_LANGUAGES) {
    const filePath = PATHS.getLanguageFile(moduleName, language);
    if (language === SOURCE_LANGUAGE) {
      languageData[language] = sourceData;
    } else {
      languageData[language] = await readJsonFile<TargetLanguageData>(filePath);
    }
  }

  // Merge data
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
 * Update a single translation
 */
export async function updateTranslation(
  moduleName: string,
  request: TranslationUpdateRequest
): Promise<void> {
  const { key, lang, value, translated } = request;

  if (!getModuleConfig(moduleName)) {
    throw new Error(`Module config not found: ${moduleName}`);
  }

  if (lang === SOURCE_LANGUAGE) {
    throw new Error('Cannot directly modify source language file');
  }

  const filePath = PATHS.getLanguageFile(moduleName, lang);
  const existingData = await readJsonFile<TargetLanguageData>(filePath);

  const currentEntry = existingData[key] || {};

  existingData[key] = {
    value: value,
    translated: translated === undefined ? true : translated,
  };

  await writeJsonFile(filePath, existingData);
  console.log(`[Scraper] Updated translation: ${moduleName}.${key}.${lang}, value: "${value}", translated: ${existingData[key].translated}`);
}

/**
 * Get module statistics
 */
export async function getModuleStats(moduleName: string) {
  const moduleConfig = getModuleConfig(moduleName);
  if (!moduleConfig) {
    throw new Error(`Module config not found: ${moduleName}`);
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
