import { NextResponse } from 'next/server';
import { getModuleStats } from '@/lib/scraper';
import type { ApiResponse, ModuleInfo } from '@/lib/types';
import { MODULES } from '../../../../../scraper-config/config';

/**
 * GET /api/v1/modules
 * Get statistics for all modules
 */
export async function GET() {
  try {
    console.log('[API] Fetching statistics for all modules');

    const moduleInfos: ModuleInfo[] = [];

    // Parallel fetch statistics for all modules
    const statsPromises = MODULES.map(async (moduleConfig) => {
      try {
        const stats = await getModuleStats(moduleConfig.name);
        return stats;
      } catch (error) {
        console.error(`[API] Failed to fetch statistics for module ${moduleConfig.name}:`, error);
        // Return default statistics
        return {
          moduleName: moduleConfig.name,
          displayName: moduleConfig.ui.displayName,
          description: moduleConfig.ui.description,
          icon: moduleConfig.ui.icon,
          priority: moduleConfig.ui.priority,
          totalItems: 0,
          progress: 0,
          estimatedTime: moduleConfig.ui.estimatedTime,
          languageStats: {}
        };
      }
    });

    const allStats = await Promise.all(statsPromises);
    
    // Convert to ModuleInfo format
    for (const stats of allStats) {
      moduleInfos.push({
        name: stats.moduleName,
        displayName: stats.displayName,
        description: stats.description,
        icon: stats.icon,
        priority: stats.priority,
        totalItems: stats.totalItems,
        progress: stats.progress,
        estimatedTime: stats.estimatedTime,
        // Can add lastUpdated field, omitted here for now
      });
    }

    // Sort by priority
    moduleInfos.sort((a, b) => a.priority - b.priority);

    return NextResponse.json<ApiResponse<ModuleInfo[]>>({
      success: true,
      data: moduleInfos,
      message: `Successfully retrieved information for ${moduleInfos.length} modules`
    });

  } catch (error) {
    console.error('[API] Failed to fetch module list:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}