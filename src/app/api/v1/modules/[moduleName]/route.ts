import { NextRequest, NextResponse } from 'next/server';
import { getModuleData, updateTranslation, getModuleStats } from '@/lib/scraper';
import type { ApiResponse, ModuleData, TranslationUpdateRequest } from '@/lib/types';
import { isValidModule, isValidLanguage } from '../../../../../../scraper-config/config';

interface RouteParams {
  params: Promise<{
    moduleName: string;
  }>;
}

/**
 * GET /api/v1/modules/[moduleName]
 * 获取模块数据
 * 
 * Query params:
 * - type?: 'data' | 'stats' - 返回数据类型，默认为 'data'
 */
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { moduleName } = await params;
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'data';

    if (!isValidModule(moduleName)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `无效的模块名称: ${moduleName}`
      }, { status: 400 });
    }

    console.log(`[API] 获取模块数据: ${moduleName}, type: ${type}`);

    if (type === 'stats') {
      // 返回统计信息
      const stats = await getModuleStats(moduleName);
      return NextResponse.json<ApiResponse>({
        success: true,
        data: stats
      });
    } else {
      // 返回完整数据
      const data = await getModuleData(moduleName);
      return NextResponse.json<ApiResponse<ModuleData[]>>({
        success: true,
        data,
        message: `获取模块 ${moduleName} 数据成功，共 ${data.length} 条记录`
      });
    }

  } catch (error) {
    console.error('[API] 获取模块数据失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}

/**
 * PATCH /api/v1/modules/[moduleName]
 * 更新模块中的翻译
 * 
 * Body: TranslationUpdateRequest
 * - key: string - 要更新的键
 * - lang: string - 语言代码
 * - value: string - 新的翻译值
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { moduleName } = await params;
    const body: TranslationUpdateRequest = await request.json();
    const { key, lang, value, translated } = body;

    // 验证参数
    if (!isValidModule(moduleName)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `无效的模块名称: ${moduleName}`
      }, { status: 400 });
    }

    if (!isValidLanguage(lang)) {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: `无效的语言代码: ${lang}`
      }, { status: 400 });
    }

    if (!key || typeof key !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少有效的 key 参数'
      }, { status: 400 });
    }

    if (typeof value !== 'string') {
      return NextResponse.json<ApiResponse>({
        success: false,
        error: '缺少有效的 value 参数'
      }, { status: 400 });
    }

    console.log(`[API] 更新翻译: ${moduleName}.${key}.${lang} = "${value}", translated: ${translated}`);

    await updateTranslation(moduleName, { key, lang, value, translated });

    return NextResponse.json<ApiResponse>({
      success: true,
      message: `翻译更新成功: ${key} (${lang})`
    });

  } catch (error) {
    console.error('[API] 更新翻译失败:', error);
    
    return NextResponse.json<ApiResponse>({
      success: false,
      error: error instanceof Error ? error.message : '服务器内部错误'
    }, { status: 500 });
  }
}
