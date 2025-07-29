import { NextRequest, NextResponse } from 'next/server';
import { runModuleScraper, runAllScrapers } from '@/lib/scraper';
import type { ApiResponse, BatchScrapeResult, ScrapeResult } from '@/lib/types';
import { isValidModule } from '../../../../../scraper-config/config';

/**
 * POST /api/v1/scrape
 * Trigger scraping task
 * 
 * Body:
 * - moduleName?: string - Specify module name, if not provided, scrape all modules
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const { moduleName } = body;

    console.log('[API] Received scraping request:', { moduleName });

    if (moduleName) {
      // Scrape specified module
      if (!isValidModule(moduleName)) {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: `Invalid module name: ${moduleName}`
        }, { status: 400 });
      }

      const result = await runModuleScraper(moduleName);
      
      if (result.success) {
        return NextResponse.json<ApiResponse<ScrapeResult>>({
          success: true,
          data: result,
          message: `Module ${moduleName} scraping completed`
        });
      } else {
        return NextResponse.json<ApiResponse>({
          success: false,
          error: result.error || 'Scraping failed',
          data: result
        }, { status: 500 });
      }
    } else {
      // Scrape all modules
      const result = await runAllScrapers();
      
      if (result.failedModules === 0) {
        return NextResponse.json<ApiResponse<BatchScrapeResult>>({
          success: true,
          data: result,
          message: `Scraping completed for all modules, processed ${result.totalModules} modules total`
        });
      } else {
        return NextResponse.json<ApiResponse<BatchScrapeResult>>({
          success: false,
          data: result,
          error: `Some modules failed to scrape, successful: ${result.successfulModules}, failed: ${result.failedModules}`,
          message: 'Batch scraping completed with errors'
        }, { status: 207 }); // 207 Multi-Status
      }
    }

  } catch (error) {
    console.error('[API] Scraping request processing failed:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}

/**
 * GET /api/v1/scrape
 * Get scraper status information (reserved interface)
 */
export async function GET() {
  return NextResponse.json<ApiResponse>({
    success: true,
    data: {
      status: 'ready',
      message: 'Scraper service is running normally'
    }
  });
}