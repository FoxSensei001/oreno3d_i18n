import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedItem } from '@/lib/types';
import { SCRAPER_CONFIG } from '../config';

/**
 * Tag Groups 模块的爬虫处理器
 * 从 oreno3d.com 网站爬取标签组数据
 * 处理 tag-group/1 到 tag-group/8 的数据
 */
export default async function tagGroupsHandler(groupNumber: number): Promise<ScrapedItem[]> {
  const BASE_URL = `https://oreno3d.com/tag-groups/${groupNumber}`;
  const results: ScrapedItem[] = [];
  
  console.log(`[tagGroupsHandler] Starting to scrape tag group ${groupNumber} data...`);
  
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
      console.log(`[tagGroupsHandler] Processing page ${currentPage} of group ${groupNumber}: ${url}`);
      
      try {
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        
        // 查找标签列表项
        const tagElements = $('.group-list-li');
        
        if (tagElements.length === 0) {
          console.log(`[tagGroupsHandler] No tags found on page ${currentPage} of group ${groupNumber}, stopping scrape`);
          hasNextPage = false;
          break;
        }
        
        // 解析每个标签
        tagElements.each((index, element) => {
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
              console.log(`[tagGroupsHandler] Found tag in group ${groupNumber}: ${id} - ${name}`);
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
        console.error(`[tagGroupsHandler] Error processing page ${currentPage} of group ${groupNumber}:`, error);
        
        // 如果是网络错误，尝试重试
        if (axios.isAxiosError(error) && error.code === 'ECONNRESET') {
          console.log(`[tagGroupsHandler] Network error, waiting to retry...`);
          await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.requestDelay * 3));
          continue;
        }
        
        // 其他错误则停止爬取
        hasNextPage = false;
      }
    }
    
    console.log(`[tagGroupsHandler] Scraping completed for group ${groupNumber}, obtained ${results.length} tags`);
    return results;
    
  } catch (error) {
    console.error(`[tagGroupsHandler] Serious error during scraping group ${groupNumber}:`, error);
    throw new Error(`Tag group ${groupNumber} scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}