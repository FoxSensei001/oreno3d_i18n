import axios from 'axios';
import * as cheerio from 'cheerio';
import type { ScrapedItem } from '@/lib/types';
import { SCRAPER_CONFIG } from '../config';

/**
 * Characters 模块的爬虫处理器
 * 从 oreno3d.com 网站爬取角色数据
 */
export default async function charactersHandler(): Promise<ScrapedItem[]> {
  const BASE_URL = 'https://oreno3d.com/characters';
  const results: ScrapedItem[] = [];
  
  console.log('[charactersHandler] Starting to scrape character data...');
  
  try {
    let currentPage = 1;
    let hasNextPage = true;
    let maxPageNumber = 1; // 默认值，之后会更新
    
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
    
    // 第一次请求获取最大页码
    console.log('[charactersHandler] Fetching first page to determine total pages...');
    const firstResponse = await axiosInstance.get(BASE_URL);
    const $first = cheerio.load(firstResponse.data);
    
    // 查找最后一页的链接以确定最大页码
    // 注意：目标网站可能没有直接的“最后一页”按钮，但通常会有“Next”按钮的链接指向下一页。
    // 一个更可靠的方法是查找分页器中的最大数字，或者解析 "Next" 按钮前的最后一个页码链接。
    const lastPageLink = $first('.pagination .page-item:not(.disabled) a[href*="page="]').last();
    const lastPageHref = lastPageLink.attr('href');
    if (lastPageHref) {
      const lastPageMatch = lastPageHref.match(/page=(\d+)/);
      if (lastPageMatch) {
        maxPageNumber = parseInt(lastPageMatch[1], 10);
        console.log(`[charactersHandler] Found maximum page number: ${maxPageNumber}`);
      } else {
         console.log('[charactersHandler] Could not determine max page number from link, will scrape sequentially.');
         maxPageNumber = Infinity; // 如果找不到，就一直往下爬
      }
    } else {
        // 如果只有一个页面，分页器可能不存在
        maxPageNumber = 1;
        console.log('[charactersHandler] No pagination found, assuming single page.');
    }
    
    while (hasNextPage && currentPage <= maxPageNumber) {
      const url = currentPage === 1 ? BASE_URL : `${BASE_URL}?page=${currentPage}`;
      console.log(`[charactersHandler] Processing page ${currentPage}/${maxPageNumber === Infinity ? 'Unknown' : maxPageNumber}: ${url}`);
      
      try {
        const response = await axiosInstance.get(url);
        const $ = cheerio.load(response.data);
        
        // 查找角色列表项
        const characterElements = $('.group-list-li');
        
        if (characterElements.length === 0) {
          console.log(`[charactersHandler] No characters found on page ${currentPage}, stopping scrape.`);
          hasNextPage = false;
          break;
        }
        
        // 解析每个角色
        characterElements.each((index, element) => {
          const $element = $(element);
          const $link = $element.find('a');
          const href = $link.attr('href');
          
          // 选中包含角色名和出处的父元素
          const nameElement = $link.find('.group-list-li-a-chara');
          
          // 为了只获取角色名本身(不包含子元素span的文本),
          // 我们克隆 nameElement, 从克隆体中移除 origin span, 然后再获取文本。
          // 这是避免 .text() 获取所有后代文本的标准做法。
          const nameOnlyElement = nameElement.clone();
          nameOnlyElement.find('.group-list-li-a-chara-origins').remove();
          const name = nameOnlyElement.text().trim().replace(/\s+/g, ' ');

          // 获取角色出处信息
          const originElement = $link.find('.group-list-li-a-chara-origins');
          const origin = originElement.text().trim().replace(/[()]/g, '').replace(/\s+/g, ' '); // 移除括号和多余空白字符
          
          // 构造完整名称：角色名[作品出处]
          const fullName = origin ? `${name}[${origin}]` : name;
          
          if (href && name) {
            // 从 href 中提取 ID
            const id = href.split('/').pop() || '';
            if (id && !results.some(item => item.id === id)) {
              results.push({ id, name: fullName });
              console.log(`[charactersHandler] Found character: ${id} - ${fullName}`);
            }
          }
        });
        
        // 检查是否有下一页
        const nextPageLink = $('.pagination .page-item:not(.disabled) a[rel="next"]').first();
        hasNextPage = nextPageLink.length > 0;
        
        if (hasNextPage) {
          currentPage++;
          // 添加延迟以避免被封禁
          await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.requestDelay));
        } else {
          // 如果没有下一页链接，就停止
          break;
        }
        
      } catch (error) {
        console.error(`[charactersHandler] Error processing page ${currentPage}:`, error);
        
        if (axios.isAxiosError(error) && error.code === 'ECONNRESET') {
          console.log(`[charactersHandler] Network error, waiting to retry...`);
          await new Promise(resolve => setTimeout(resolve, SCRAPER_CONFIG.requestDelay * 3));
          continue; // 重试当前页面
        }
        
        // 其他错误则停止爬取
        hasNextPage = false;
      }
    }
    
    console.log(`[charactersHandler] Scraping completed, obtained ${results.length} characters.`);
    return results;
    
  } catch (error) {
    console.error('[charactersHandler] Serious error during scraping:', error);
    throw new Error(`Character scraping failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}