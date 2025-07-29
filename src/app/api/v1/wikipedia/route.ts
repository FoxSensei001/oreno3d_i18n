import { NextRequest, NextResponse } from 'next/server';
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

// Defines the data structure for the API response
interface WikipediaResult {
  japanese: string;
  english: string;
  chinese: string;
  traditionalChinese: string;
}

// Defines the data structure for search results
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

// Defines the interface for proxy configuration
interface ProxyConfig {
  enableProxy: boolean;
  proxyUrl: string;
}

/**
 * Creates a configured axios instance.
 * @param proxyConfig - Optional proxy configuration.
 * @returns AxiosInstance
 */
function createAxiosInstance(proxyConfig?: ProxyConfig): AxiosInstance {
  const config: AxiosRequestConfig = {
    timeout: 10000, // Increase timeout to handle network fluctuations
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
        console.log(`[Wikipedia API] Using HTTP proxy: ${proxyUrl.hostname}:${proxyUrl.port}`);
      } else {
        console.warn(`[Wikipedia API] Unsupported proxy protocol: ${proxyUrl.protocol}`);
      }
    } catch (error) {
      console.error(`[Wikipedia API] Proxy configuration parsing failed: ${error}`);
    }
  }

  return axios.create(config);
}

/**
 * Fetch function with retry mechanism.
 * @param axiosInstance - Axios instance.
 * @param url - Request URL.
 * @param maxRetries - Maximum number of retries.
 * @param config - Optional Axios request configuration for custom headers, etc.
 * @returns Promise<string> - Returns page HTML content.
 */
async function fetchWithRetry(axiosInstance: AxiosInstance, url: string, maxRetries = 2, config?: AxiosRequestConfig): Promise<string> {
  let lastError: any;
  
  for (let i = 0; i <= maxRetries; i++) {
    try {
      const response = await axiosInstance.get(url, config);
      return response.data;
    } catch (error: any) {
      lastError = error;
      console.warn(`[Wikipedia API] Request failed (Attempt ${i + 1}/${maxRetries + 1}): ${url}`, error.message);
      if (i < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
  }
  
  throw lastError;
}

/**
 * Searches Wikipedia by parsing HTML pages (full-text search).
 * @param query - Search keyword.
 * @param axiosInstance - Axios instance.
 * @param limit - Limit on the number of results to return, defaults to 20.
 * @returns Promise<WikipediaSearchResult[]> - Array of search results.
 */
async function searchWikipediaByHtml(query: string, axiosInstance: AxiosInstance, limit = 20): Promise<WikipediaSearchResult[]> {
  const encodedQuery = encodeURIComponent(query.trim());
  const searchUrl = `https://ja.wikipedia.org/w/index.php?fulltext=1&search=${encodedQuery}&ns0=1&limit=${limit}`;
  
  console.log(`[Wikipedia HTML Search] Search URL: ${searchUrl}`);
  
  try {
    const html = await fetchWithRetry(axiosInstance, searchUrl, 2);
    console.log(`[Wikipedia HTML Search] Successfully fetched HTML page, length: ${html.length}`);
    
    // Parse HTML search results
    const results = parseWikipediaSearchHtml(html);
    console.log(`[Wikipedia HTML Search] Parsed ${results.length} search results`);
    
    return results;
    
  } catch (error: any) {
    console.error('[Wikipedia HTML Search] Search failed:', error.message);
    throw new Error(`Failed to search Wikipedia HTML page: ${error.message}`);
  }
}

/**
 * Parses the Wikipedia search results HTML page.
 * @param html - HTML content of the search results page.
 * @returns WikipediaSearchResult[] - Array of parsed search results.
 */
function parseWikipediaSearchHtml(html: string): WikipediaSearchResult[] {
  const results: WikipediaSearchResult[] = [];
  
  try {
    // Use regex to match search result items
    const resultPattern = /<li class="mw-search-result mw-search-result-ns-0"[^>]*>([\s\S]*?)<\/li>/g;
    let match;
    let id = 0;
    
    while ((match = resultPattern.exec(html)) !== null && results.length < 50) {
      const resultHtml = match[1];
      
      // Extract title and link
      const titleMatch = resultHtml.match(/<a href="([^"]+)" title="([^"]+)"[^>]*data-serp-pos="[^"]*"[^>]*>([\s\S]*?)<\/a>/);
      if (!titleMatch) continue;
      
      const href = titleMatch[1];
      const title = titleMatch[2];
      const titleWithHighlight = titleMatch[3];
      
      // Extract key from href (remove /wiki/ prefix)
      const key = href.replace(/^\/wiki\//, '').replace(/^https?:\/\/[^\/]+\/wiki\//, '');
      
      // Extract description content
      const descriptionMatch = resultHtml.match(/<div class="searchresult"[^>]*>([\s\S]*?)<\/div>/);
      let description = '';
      if (descriptionMatch) {
        // Remove HTML tags and clean text
        description = descriptionMatch[1]
          .replace(/<[^>]*>/g, '')
          .replace(/\s+/g, ' ')
          .trim()
          .substring(0, 200); // Limit length
      }
      
      // Extract thumbnail
      let thumbnail: { url: string; width: number; height: number; } | null = null;
      const thumbnailMatch = resultHtml.match(/<img[^>]+src="([^"]+)"[^>]*width="(\d+)"[^>]*height="(\d+)"/);
      if (thumbnailMatch) {
        let thumbnailUrl = thumbnailMatch[1];
        // Ensure URL is complete
        if (thumbnailUrl.startsWith('//')) {
          thumbnailUrl = 'https:' + thumbnailUrl;
        }
        thumbnail = {
          url: thumbnailUrl,
          width: parseInt(thumbnailMatch[2]),
          height: parseInt(thumbnailMatch[3])
        };
      }
      
      // Extract file size and date information as excerpt
      const dataMatch = resultHtml.match(/<div class='mw-search-result-data'[^>]*>([\s\S]*?)<\/div>/);
      let excerpt = '';
      if (dataMatch) {
        excerpt = dataMatch[1].replace(/<[^>]*>/g, '').trim();
      }
      
      results.push({
        id: id++,
        key: decodeURIComponent(key),
        title: title,
        excerpt: excerpt,
        description: description || null,
        thumbnail: thumbnail
      });
    }
    
    console.log(`[Wikipedia HTML Parser] Successfully parsed ${results.length} search results`);
    return results;
    
  } catch (error: any) {
    console.error('[Wikipedia HTML Parser] Failed to parse HTML:', error);
    return [];
  }
}

/**
 * Searches Wikipedia titles.
 * @param query - Search keyword.
 * @param axiosInstance - Axios instance.
 * @param limit - Limit on the number of results to return, defaults to 10.
 * @returns Promise<WikipediaSearchResult[]> - Array of search results.
 */
async function searchWikipediaTitle(query: string, axiosInstance: AxiosInstance, limit = 10): Promise<WikipediaSearchResult[]> {
  const encodedQuery = encodeURIComponent(query.trim());
  const searchUrl = `https://ja.wikipedia.org/w/rest.php/v1/search/title?q=${encodedQuery}&limit=${limit}&cirrusUserTesting=compfuzz-2025-01%3Acontrol`;
  
  console.log(`[Wikipedia Search] Search URL: ${searchUrl}`);
  
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
    
    console.log(`[Wikipedia Search] Response type: ${typeof response}`);
    console.log(`[Wikipedia Search] Response content:`, response);
    
    // fetchWithRetry returns axios response.data, which is already a parsed object
    const data = response;
    
    if (!data.pages || !Array.isArray(data.pages)) {
      console.warn('[Wikipedia Search] Unexpected search response format:', data);
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
    
    console.log(`[Wikipedia Search] Found ${results.length} search results`);
    return results;
    
  } catch (error: any) {
    console.error('[Wikipedia Search] Search failed:', error.message);
    throw new Error(`Wikipedia search failed: ${error.message}`);
  }
}

/**
 * Main API handler function.
 */
export async function POST(request: NextRequest) {
  try {
    const { text, proxyConfig, action = 'lookup', searchMethod = 'api' } = await request.json();
    
    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Please provide the Japanese text to query.' }, { status: 400 });
    }

    console.log(`[Wikipedia API] Starting ${action === 'search' ? 'search' : 'lookup'}: ${text}${action === 'search' ? ` (Method: ${searchMethod})` : ''}`);
    if (proxyConfig?.enableProxy) {
      console.log(`[Wikipedia API] Proxy enabled: ${proxyConfig.proxyUrl}`);
    }

    const axiosInstance = createAxiosInstance(proxyConfig);

    // If it's a search request, return search results
    if (action === 'search') {
      try {
        let searchResults: WikipediaSearchResult[]; // Explicitly type searchResults
        
        if (searchMethod === 'html') {
          // Use HTML parsing for search
          searchResults = await searchWikipediaByHtml(text, axiosInstance);
          console.log(`[Wikipedia API] ✅ HTML search successful, found ${searchResults.length} results`);
        } else {
          // Use API search (default)
          searchResults = await searchWikipediaTitle(text, axiosInstance);
          console.log(`[Wikipedia API] ✅ API search successful, found ${searchResults.length} results`);
        }
        
        return NextResponse.json({ 
          success: true, 
          data: searchResults,
          searchMethod: searchMethod
        });
      } catch (error: any) {
        console.error(`[Wikipedia API] ❌ Error during ${searchMethod === 'html' ? 'HTML' : 'API'} search:`, error.message);
        return NextResponse.json({ error: `Error during Wikipedia search: ${error.message}` }, { status: 500 });
      }
    }

    // Original direct lookup logic
    const encodedText = encodeURIComponent(text.trim());
    const jaWikiUrl = `https://ja.wikipedia.org/wiki/${encodedText}`;
    
    try {
      console.log(`[Wikipedia API] 1. Requesting Japanese page: ${jaWikiUrl}`);
      const jaHtml = await fetchWithRetry(axiosInstance, jaWikiUrl);
      console.log(`[Wikipedia API] Successfully fetched Japanese page, length: ${jaHtml.length}`);
      
      const result = await parseWikipediaPage(jaHtml, text, axiosInstance);
      console.log(`[Wikipedia API] ✅ Lookup successful, final result:`, result);
      
      return NextResponse.json({ success: true, data: result });
      
    } catch (error: any) {
      console.error('[Wikipedia API] ❌ Error during lookup:', error.response?.status, error.message);
      
      if (error.code === 'ECONNABORTED') {
        return NextResponse.json({ error: 'Network request timed out. Please check your network connection or proxy settings and try again.' }, { status: 408 });
      }
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return NextResponse.json({ error: 'Could not connect to Wikipedia. Please check your network connection or proxy settings.' }, { status: 503 });
      }
      
      // If it's a 404 error, try using search as a fallback
      if (error.response?.status === 404) {
        console.log('[Wikipedia API] Direct lookup failed, attempting search as fallback...');
        try {
          const searchResults = await searchWikipediaTitle(text, axiosInstance);
          console.log(`[Wikipedia API] ✅ Fallback search successful, found ${searchResults.length} results`);
          return NextResponse.json({ 
            success: false, 
            fallbackSearch: true,
            searchResults,
            error: 'No corresponding Japanese Wikipedia page found, but related search results were found. Please select an appropriate entry.' 
          });
        } catch (searchError: any) {
          console.error('[Wikipedia API] Fallback search also failed:', searchError.message);
          return NextResponse.json({ error: 'No corresponding Japanese Wikipedia page found, and search also failed.' }, { status: 404 });
        }
      }
      
      return NextResponse.json({ error: 'An unknown error occurred while querying Wikipedia. Please try again later.' }, { status: 500 });
    }
    
  } catch (error) {
    console.error('[Wikipedia API] ❌ Internal API error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

/**
 * Extracts the main title from the page HTML.
 * @param html - Page HTML content.
 * @returns Extracted title, or an empty string if not found.
 */
function extractMainTitle(html: string): string {
  // Prioritize matching the span with mw-page-title-main class, which is the most accurate
  const pattern = /<h1[^>]*id="firstHeading"[^>]*>[\s\S]*?<span[^>]*class="[^"]*mw-page-title-main[^"]*"[^>]*>(.*?)<\/span>/;
  const match = html.match(pattern);
  if (match && match[1]) {
    // Remove HTML tags and trim whitespace
    return match[1].replace(/<[^>]*>/g, '').trim();
  }
  return '';
}

/**
 * Extracts interlanguage link information from the Japanese page's HTML.
 * @param html - HTML content of the Japanese page.
 * @returns Object containing English, Traditional Chinese titles, and Chinese page URL.
 */
function extractInterlanguageLinks(html: string): { english: string; traditionalChinese: string; chineseUrl: string; } {
  let english = '';
  let traditionalChinese = '';
  let chineseUrl = '';

  // Regex to match <li> elements containing language links
  // Use the g flag to match all qualifying language links
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
        console.log(`[Wikipedia API] Extracted English title: ${english}`);
      } else if (lang === 'zh' && !traditionalChinese) {
        traditionalChinese = dataTitle;
        console.log(`[Wikipedia API] Extracted Traditional Chinese title: ${traditionalChinese}`);

        const hrefMatch = linkHtml.match(/href="([^"]+)"/);
        if (hrefMatch && hrefMatch[1]) {
          let url = hrefMatch[1];
          // Ensure URL is complete
          if (!url.startsWith('http')) {
             url = new URL(url, 'https://ja.wikipedia.org').href;
          }
          chineseUrl = url;
          console.log(`[Wikipedia API] Extracted Chinese page URL: ${chineseUrl}`);
        }
      }
    }

    // If both languages are found, exit the loop early
    if (english && traditionalChinese && chineseUrl) {
      break;
    }
  }

  return { english, traditionalChinese, chineseUrl };
}

/**
 * Parses a Wikipedia page to extract multi-language titles.
 * @param jaHtml - HTML content of the Japanese Wikipedia page.
 * @param originalText - The original Japanese text input by the user.
 * @param axiosInstance - Axios instance for network requests.
 * @returns Promise<WikipediaResult> - Result object containing titles in various languages.
 */
async function parseWikipediaPage(jaHtml: string, originalText: string, axiosInstance: AxiosInstance): Promise<WikipediaResult> {
  // 1. Extract Japanese title and interlanguage links from the Japanese page
  console.log('[Wikipedia API] 2. Parsing Japanese page HTML');
  const japaneseTitle = extractMainTitle(jaHtml) || originalText;
  console.log(`[Wikipedia API] Extracted Japanese title: ${japaneseTitle}`);
  
  const { english, traditionalChinese, chineseUrl } = extractInterlanguageLinks(jaHtml);

  let chineseTitle = '';

  // 2. If a Chinese page URL is found, request that page to get the Simplified Chinese title
  if (chineseUrl) {
    try {
      console.log(`[Wikipedia API] 3. Requesting Chinese page to get Simplified title: ${chineseUrl}`);
      // Send Accept-Language header with preference for Simplified Chinese content
      const zhHtml = await fetchWithRetry(axiosInstance, chineseUrl, 2, {
        headers: { 'Accept-Language': 'zh-CN,zh;q=0.9' }
      });
      console.log(`[Wikipedia API] Successfully fetched Chinese page, length: ${zhHtml.length}`);
      
      // 3. Extract Simplified Chinese title from the Chinese page
      chineseTitle = extractMainTitle(zhHtml);
      if (chineseTitle) {
        console.log(`[Wikipedia API] Extracted Simplified Chinese title: ${chineseTitle}`);
      } else {
        console.warn('[Wikipedia API] Failed to extract Simplified Chinese title from the Chinese page, will use Traditional Chinese as fallback.');
        chineseTitle = traditionalChinese;
      }
    } catch (error: any) {
      console.warn(`[Wikipedia API] Failed to fetch Simplified Chinese page, will use Traditional Chinese as Simplified Chinese title. Error: ${error.message}`);
      chineseTitle = traditionalChinese; // Use Traditional as fallback if fetching fails
    }
  } else if (traditionalChinese) {
      console.log('[Wikipedia API] No Chinese page URL found, but Traditional Chinese title was found. Will use Traditional Chinese as Simplified Chinese title.');
      chineseTitle = traditionalChinese; // If no URL but Traditional title exists, use Traditional as fallback
  }

  return {
    japanese: japaneseTitle,
    english: english,
    chinese: chineseTitle,
    traditionalChinese: traditionalChinese,
  };
}