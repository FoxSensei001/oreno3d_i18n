import { NextRequest, NextResponse } from 'next/server';
import { runModuleScraper, runAllScrapers } from '@/lib/scraper';
import type { ApiResponse, BatchScrapeResult, ScrapeResult } from '@/lib/types';
import { isValidModule } from '../../../../../scraper-config/config';

/**
 * POST /api/v1/scrape
 * 触发爬虫任务
 * 
 * Body:
 * - moduleName?: string - 指定模块名称，如果不提供则爬取所有模块
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { moduleName } = body;

    console.log('[API] 收到爬虫请求:', { moduleName });

    if (moduleName) {
      // 爬取指定模块
      if (!isValidModule(moduleName)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `无效的模块名称: ${moduleName}`
        }, { status: 400 });
      }

      const result = await runModuleScraper(moduleName);
      
      if (result.success) {
        return NextResponse.json<ApiResponse<ScrapeResult>>({
          success: true,
          data: result,
          message: `模块 ${moduleName} 爬取完成`
        });
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: result.error || '爬取失败',
          data: result
        }, { status: 500 });
      }
    } else {
      // 爬取所有模块
      const result = await runAllScrapers();
      
      if (result.failedModules === 0) {
        return NextResponse.json<ApiResponse<BatchScrapeResult>>({
          success: true,
          data: result,
          message: `所有模块爬取完成，共处理 ${result.totalModules} 个模块`
        });
      } else {
        return NextResponse.json<ApiResponse<BatchScrapeResult>>({
          success: false,
          data: result,
          error: `部分模块爬取失败，成功: ${result.successfulModules}，失败: ${result.failedModules}`,
          message: '批量爬取完成但有错误'
        }, { status: 207 }); // 207 Multi-Status
      }
    }

  } catch (error) {
    console.error('[API] 爬虫请求处理失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/scrape
 * 获取爬虫状态信息（预留接口）
 */
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      status: 'ready',
      message: '爬虫服务正常运行'
    }
  });
}
