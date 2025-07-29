import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// 定义API返回的数据结构
interface WikipediaResult {
  japanese: string;
  english: string;
  chinese: string;
  traditionalChinese: string;
}

// 定义搜索结果的数据结构
interface WikipediaSearchResult {
  id: number;
  key: string;
  title: string;
  excerpt: string;
  description: string | null;
  thumbnail: {
    url: string;
    width: number;
    height: number;
  } | null;
}

// 定义代理配置的接口
interface ProxyConfig {
  enableProxy: boolean;
  proxyUrl: string;
}

/**
 * 创建一个配置好的axios实例
 * @param proxyConfig - 可选的代理配置
 * @returns AxiosInstance
 */
function createAxiosInstance(proxyConfig?: ProxyConfig): AxiosInstance {
  const config: AxiosRequestConfig = {
    timeout: 10000, // 增加超时时间以应对网络波动
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
      'Cache-Control': 'no-cache',
    },
  };

  if (proxyConfig?.enableProxy && proxyConfig.proxyUrl) {
    try {
      const proxyUrl = new URL(proxyConfig.proxyUrl);
      
      if (proxyUrl.protocol === 'http:' || proxyUrl.protocol === 'https:') {
        config.proxy = {
          protocol: proxyUrl.protocol.slice(0, -1),
          host: proxyUrl.hostname,
          port: parseInt(proxyUrl.port) || (proxyUrl.protocol === 'http:' ? 80 : 443),
          auth: proxyUrl.username && proxyUrl.password ? {
            username: decodeURIComponent(proxyUrl.username),
            password: decodeURIComponent(proxyUrl.password)
          } : undefined
        };
        console.log(`[Wikipedia API] 使用HTTP代理: ${proxyUrl.hostname}:${proxyUrl.port}`);
      } else {
        console.warn(`[Wikipedia API] 不支持的代理协议: ${proxyUrl.protocol}`);
      }
    } catch (error) {
      console.error(`[Wikipedia API] 代理配置解析失败: ${error}`);
    }
  }

  return axios.create(config);
}

/**
 * 带有重试机制的fetch函数
 * @param axiosInstance - Axios实例
 * @param url - 请求的URL
 * @param maxRetries - 最大重试次数
 * @param config - 可选的Axios请求配置，用于传递自定义headers等
 * @returns Promise<string> - 返回页面HTML内容
 */
async function fetchWithRetry(axiosInstance: AxiosInstance, url: string, maxRetries = 2, config?: AxiosRequestConfig): Promise<string> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Wikipedia API] 请求失败 (尝试 ${i + 1}/${maxRetries + 1}): ${url}`, error.message);
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * 搜索维基百科标题
 * @param query - 搜索关键词
 * @param axiosInstance - Axios实例
 * @param limit - 返回结果数量限制，默认为10
 * @returns Promise<WikipediaSearchResult[]> - 搜索结果数组
 */
async function searchWikipediaTitle(query: string, axiosInstance: AxiosInstance, limit = 10): Promise<WikipediaSearchResult[]> {
  const encodedQuery = encodeURIComponent(query.trim());
  const searchUrl = `https://ja.wikipedia.org/w/rest.php/v1/search/title?q=${encodedQuery}&limit=${limit}&cirrusUserTesting=compfuzz-2025-01%3Acontrol`;
  
  console.log(`[Wikipedia Search] 搜索URL: ${searchUrl}`);
  
  try {
    const response = await fetchWithRetry(axiosInstance, searchUrl, 2, {
      headers: {
        'accept': 'application/json',
        'Referer': 'https://ja.wikipedia.org/wiki/%E3%83%A1%E3%82%A4%E3%83%B3%E3%83%9A%E3%83%BC%E3%82%B8',
        'sec-ch-ua-platform': '"macOS"',
        'sec-ch-ua': '"Not)A;Brand";v="8", "Chromium";v="138", "Google Chrome";v="138"',
        'sec-ch-ua-mobile': '?0'
      }
    });

    console.log('[Wikipedia Search] response:', response);
    
    console.log(`[Wikipedia Search] 响应类型: ${typeof response}`);
    console.log(`[Wikipedia Search] 响应内容:`, response);
    
    // fetchWithRetry 返回的是 axios response.data，已经是解析后的对象
    const data = response;
    
    if (!data.pages || !Array.isArray(data.pages)) {
      console.warn('[Wikipedia Search] 搜索响应格式异常:', data);
      return [];
    }
    
    const results: WikipediaSearchResult[] = data.pages.map((page: any) => ({
      id: page.id,
      key: page.key,
      title: page.title,
      excerpt: page.excerpt || '',
      description: page.description || null,
      thumbnail: page.thumbnail ? {
        url: page.thumbnail.url,
        width: page.thumbnail.width,
        height: page.thumbnail.height
      } : null
    }));
    
    console.log(`[Wikipedia Search] 找到 ${results.length} 个搜索结果`);
    return results;
    
  } catch (error: any) {
    console.error('[Wikipedia Search] 搜索失败:', error.message);
    throw new Error(`搜索维基百科失败: ${error.message}`);
  }
}

/**
 * API主处理函数
 */
export async function POST(request: NextRequest) {
  try {
    const { text, proxyConfig, action = 'lookup' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: '请提供要查询的日文文本' }, { status: 400 });
    }

    console.log(`[Wikipedia API] 开始${action === 'search' ? '搜索' : '查询'}: ${text}`);
    if (proxyConfig?.enableProxy) {
      console.log(`[Wikipedia API] 代理已启用: ${proxyConfig.proxyUrl}`);
    }

    const axiosInstance = createAxiosInstance(proxyConfig);

    // 如果是搜索请求，返回搜索结果
    if (action === 'search') {
      try {
        const searchResults = await searchWikipediaTitle(text, axiosInstance);
        console.log(`[Wikipedia API] ✅ 搜索成功，找到 ${searchResults.length} 个结果`);
        return NextResponse.json({ success: true, data: searchResults });
      } catch (error: any) {
        console.error('[Wikipedia API] ❌ 搜索过程中发生错误:', error.message);
        return NextResponse.json({ error: '搜索维基百科时发生错误: ' + error.message }, { status: 500 });
      }
    }

    // 原有的直接查询逻辑
    const encodedText = encodeURIComponent(text.trim());
    const jaWikiUrl = `https://ja.wikipedia.org/wiki/${encodedText}`;
    
    try {
      console.log(`[Wikipedia API] 1. 请求日文页面: ${jaWikiUrl}`);
      const jaHtml = await fetchWithRetry(axiosInstance, jaWikiUrl);
      console.log(`[Wikipedia API] 成功获取日文页面，长度: ${jaHtml.length}`);
      
      const result = await parseWikipediaPage(jaHtml, text, axiosInstance);
      console.log(`[Wikipedia API] ✅ 查询成功，最终结果:`, result);
      
      return NextResponse.json({ success: true, data: result });
      
    } catch (error: any) {
      console.error('[Wikipedia API] ❌ 查询过程中发生错误:', error.response?.status, error.message);
      
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: '网络请求超时，请检查网络连接或代理设置后重试' }, { status: 408 });
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return NextResponse.json({ error: '无法连接到维基百科，请检查网络连接或代理设置' }, { status: 503 });
      }
      
      // 如果是404错误，尝试使用搜索作为fallback
      if (error.response?.status === 404) {
        console.log('[Wikipedia API] 直接查询失败，尝试搜索作为fallback...');
        try {
          const searchResults = await searchWikipediaTitle(text, axiosInstance);
          console.log(`[Wikipedia API] ✅ Fallback搜索成功，找到 ${searchResults.length} 个结果`);
          return NextResponse.json({ 
            success: false, 
            fallbackSearch: true,
            searchResults,
            error: '未找到对应的日文维基百科页面，但找到了相关搜索结果，请选择合适的条目' 
          });
        } catch (searchError: any) {
          console.error('[Wikipedia API] Fallback搜索也失败:', searchError.message);
          return NextResponse.json({ error: '未找到对应的日文维基百科页面，搜索也失败了' }, { status: 404 });
        }
      }
      
      return NextResponse.json({ error: '查询维基百科时发生未知错误，请稍后重试' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Wikipedia API] ❌ API内部错误:', error);
    return NextResponse.json({ error: '服务器内部错误' }, { status: 500 });
  }
}

/**
 * 从HTML中提取页面主标题
 * @param html - 页面HTML内容
 * @returns 提取到的标题，如果未找到则返回空字符串
 */
function extractMainTitle(html: string): string {
  // 优先匹配包含 mw-page-title-main class的span，这是最准确的
  const pattern = /<h1[^>]*id="firstHeading"[^>]*>[\s\S]*?<span[^>]*class="[^"]*mw-page-title-main[^"]*"[^>]*>(.*?)<\/span>/;
  const match = html.match(pattern);
  if (match && match[1]) {
    // 移除HTML标签并去除首尾空格
    return match[1].replace(/<[^>]*>/g, '').trim();
  }
  return '';
}

/**
 * 从日文页面的HTML中提取其他语言的链接信息
 * @param html - 日文页面的HTML内容
 * @returns 包含英文、繁体中文标题和中文页面URL的对象
 */
function extractInterlanguageLinks(html: string): { english: string; traditionalChinese: string; chineseUrl: string; } {
  let english = '';
  let traditionalChinese = '';
  let chineseUrl = '';

  // 正则表达式匹配包含语言链接的<li>元素
  // 使用g标志来匹配所有符合条件的语言链接
  const linkPattern = /<li class="interlanguage-link interwiki-(en|zh)[^"]*"[\s\S]*?<a[^>]+>/g;
  const links = html.match(linkPattern) || [];

  for (const linkHtml of links) {
    const langMatch = linkHtml.match(/lang="([^"]+)"/);
    const dataTitleMatch = linkHtml.match(/data-title="([^"]+)"/);
    
    if (langMatch && dataTitleMatch) {
      const lang = langMatch[1];
      const dataTitle = dataTitleMatch[1].trim();

      if (lang === 'en' && !english) {
        english = dataTitle;
        console.log(`[Wikipedia API] 提取到英文标题: ${english}`);
      } else if (lang === 'zh' && !traditionalChinese) {
        traditionalChinese = dataTitle;
        console.log(`[Wikipedia API] 提取到繁体中文标题: ${traditionalChinese}`);

        const hrefMatch = linkHtml.match(/href="([^"]+)"/);
        if (hrefMatch && hrefMatch[1]) {
          let url = hrefMatch[1];
          // 确保URL是完整的
          if (!url.startsWith('http')) {
             url = new URL(url, 'https://ja.wikipedia.org').href;
          }
          chineseUrl = url;
          console.log(`[Wikipedia API] 提取到中文页面URL: ${chineseUrl}`);
        }
      }
    }

    // 如果两种语言都找到了，就提前结束循环
    if (english && traditionalChinese && chineseUrl) {
      break;
    }
  }

  return { english, traditionalChinese, chineseUrl };
}

/**
 * 解析维基百科页面，提取多语言标题
 * @param jaHtml - 日文维基页面的HTML内容
 * @param originalText - 用户输入的原始日文文本
 * @param axiosInstance - 用于网络请求的Axios实例
 * @returns Promise<WikipediaResult> - 包含各语言标题的结果对象
 */
async function parseWikipediaPage(jaHtml: string, originalText: string, axiosInstance: AxiosInstance): Promise<WikipediaResult> {
  // 1. 从日文页面提取日文标题和多语言链接
  console.log('[Wikipedia API] 2. 解析日文页面HTML');
  const japaneseTitle = extractMainTitle(jaHtml) || originalText;
  console.log(`[Wikipedia API] 提取到日文标题: ${japaneseTitle}`);
  
  const { english, traditionalChinese, chineseUrl } = extractInterlanguageLinks(jaHtml);

  let chineseTitle = '';

  // 2. 如果找到了中文页面的URL，则请求该页面以获取简体中文标题
  if (chineseUrl) {
    try {
      console.log(`[Wikipedia API] 3. 请求中文页面以获取简体标题: ${chineseUrl}`);
      // 请求时携带Accept-Language头，优先获取简体中文内容
      const zhHtml = await fetchWithRetry(axiosInstance, chineseUrl, 2, {
        headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
      });
      console.log(`[Wikipedia API] 成功获取中文页面, 长度: ${zhHtml.length}`);
      
      // 3. 从中文页面提取简体中文标题
      chineseTitle = extractMainTitle(zhHtml);
      if (chineseTitle) {
        console.log(`[Wikipedia API] 提取到简体中文标题: ${chineseTitle}`);
      } else {
        console.warn('[Wikipedia API] 未能在中文页面中提取到简体中文标题，将使用繁体中文作为替代。');
        chineseTitle = traditionalChinese;
      }
    } catch (error: any) {
      console.warn(`[Wikipedia API] 获取简体中文页面失败，将使用繁体中文作为简体中文标题。错误: ${error.message}`);
      chineseTitle = traditionalChinese; // 获取失败时，用繁体作为备用
    }
  } else if (traditionalChinese) {
      console.log('[Wikipedia API] 未找到中文页面URL，但找到了繁体标题，将使用繁体中文作为简体中文标题。');
      chineseTitle = traditionalChinese; // 如果没有URL但有繁体标题，也用繁体作为备用
  }

  return {
    japanese: japaneseTitle,
    english: english,
    chinese: chineseTitle,
    traditionalChinese: traditionalChinese,
  };
}