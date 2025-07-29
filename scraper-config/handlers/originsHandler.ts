import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedItem } from '@/lib/types';
import { SCRAPER_CONFIG } from '../config';

/**
 * Origins 模块的爬虫处理器
 * 从 oreno3d.com 网站爬取来源数据
 */
export default async function originsHandler(): Promise<ScrapedItem[]> {
  const BASE_URL = 'https://oreno3d.com/origins';
  const results: ScrapedItem[] = [];
  
  console.log('[originsHandler] Starting to scrape origin data...');
  
  try {
    let currentPage = 1;
    let hasNextPage = true;
    
    // 配置 axios 实例
    const axiosInstance = axios.create({
      timeout: SCRAPER_CONFIG.timeout,
      headers: {
        'User-Agent': SCRAPER_CONFIG.userAgent,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ja,en-US;q=0.7,en;q=0.3',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });
    
    while (hasNextPage) {
      const url = currentPage === 1 ? BASE_URL : `${BASE_URL}?page=${currentPage}`;
      console.log(`[originsHandler] Processing page ${currentPage}: ${url}`);
      
      try {
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        
        // 查找来源列表项
        const originElements = $('.group-list-li');
        
        if (originElements.length === 0) {
          console.log(`[originsHandler] No origins found on page ${currentPage}, stopping scrape`);
          hasNextPage = false;
          break;
        }
        
        // 解析每个来源
        originElements.each((index, element) => {
          const $element = $(element);
          const $link = $element.find('a');
          const href = $link.attr('href');
          const nameElement = $link.find('.group-list-li-a-chara2');
          const name = nameElement.text().trim();
          
          if (href && name) {
            // 从 href 中提取 ID
            const id = href.split('/').pop() || '';
            if (id && !results.some(item => item.id === id)) {
              results.push({ id, name });
              console.log(`[originsHandler] Found origin: ${id} - ${name}`);
            }
          }
        });
        
        // 检查是否有下一页
        const nextPageLink = $('.pagination .next');
        hasNextPage = nextPageLink.length > 0 && !nextPageLink.hasClass('disabled');
        
        if (hasNextPage) {
          currentPage++;
          // 添加延迟以避免被封禁
          await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.requestDelay));
        }
        
      } catch (error) {
        console.error(`[originsHandler] Error processing page ${currentPage}:`, error);
        
        // 如果是网络错误，尝试重试
        if (axios.isAxiosError(error) && error.code === 'ECONNRESET') {
          console.log(`[originsHandler] Network error, waiting to retry...`);
          await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.requestDelay * 3));
          continue;
        }
        
        // 其他错误则停止爬取
        hasNextPage = false;
      }
    }
    
    console.log(`[originsHandler] Scraping completed, obtained ${results.length} origins`);
    return results;
    
  } catch (error) {
    console.error('[originsHandler] Serious error during scraping:', error);
    throw new Error(`Origin scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}