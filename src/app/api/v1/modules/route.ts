import { NextResponse } from 'next/server';
import { getModuleStats } from '@/lib/scraper';
import type { ApiResponse, ModuleInfo } from '@/lib/types';
import { MODULES } from '../../../../../scraper-config/config';

/**
 * GET /api/v1/modules
 * 获取所有模块的统计信息
 */
export async function GET() {
  try {
    console.log('[API] 获取所有模块统计信息');

    const moduleInfos: ModuleInfo[] = [];

    // 并行获取所有模块的统计信息
    const statsPromises = MODULES.map(async (moduleConfig) => {
      try {
        const stats = await getModuleStats(moduleConfig.name);
        return stats;
      } catch (error) {
        console.error(`[API] 获取模块 ${moduleConfig.name} 统计信息失败:`, error);
        // 返回默认统计信息
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
    
    // 转换为 ModuleInfo 格式
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
        // 可以添加 lastUpdated 字段，这里暂时省略
      });
    }

    // 按优先级排序
    moduleInfos.sort((a, b) => a.priority - b.priority);

    return NextResponse.json<ApiResponse<ModuleInfo[]>>({
      success: true,
      data: moduleInfos,
      message: `获取 ${moduleInfos.length} 个模块信息成功`
    });

  } catch (error) {
    console.error('[API] 获取模块列表失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}
