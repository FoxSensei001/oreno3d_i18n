import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { ModuleInfo, ModuleData, TranslationUpdateRequest, ScrapeResult, BatchScrapeResult } from '@/lib/types';

const API_BASE = '/api/v1';

/**
 * 获取所有模块信息
 */
export function useModules() {
  return useQuery<ModuleInfo[]>({
    queryKey: ['modules'],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取模块列表失败');
      }
      
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5分钟内不重新获取
  });
}

/**
 * 获取单个模块的数据
 */
export function useModuleData(moduleName: string) {
  return useQuery<ModuleData[]>({
    queryKey: ['module-data', moduleName],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules/${moduleName}`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取模块数据失败');
      }
      
      return result.data;
    },
    enabled: !!moduleName,
    staleTime: 2 * 60 * 1000, // 2分钟内不重新获取
  });
}

/**
 * 获取模块统计信息
 */
export function useModuleStats(moduleName: string) {
  return useQuery({
    queryKey: ['module-stats', moduleName],
    queryFn: async () => {
      const response = await fetch(`${API_BASE}/modules/${moduleName}?type=stats`);
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '获取模块统计失败');
      }
      
      return result.data;
    },
    enabled: !!moduleName,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * 更新翻译
 */
export function useUpdateTranslation() {
  const queryClient = useQueryClient();
  
  return useMutation<ApiResponse, Error, TranslationUpdateRequest & { moduleName: string }>({
    mutationFn: async ({ moduleName, ...request }) => {
      const response = await fetch(`${API_BASE}/modules/${moduleName}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '更新翻译失败');
      }
      
      return result;
    },
    onSuccess: (_, variables) => {
      // 更新相关缓存
      queryClient.invalidateQueries({ queryKey: ['module-data', variables.moduleName] });
      queryClient.invalidateQueries({ queryKey: ['module-stats', variables.moduleName] });
      queryClient.invalidateQueries({ queryKey: ['modules'] });
    },
  });
}

/**
 * 运行爬虫
 */
export function useScraper() {
  const queryClient = useQueryClient();
  
  return useMutation<ScrapeResult | BatchScrapeResult, Error, { moduleName?: string }>({
    mutationFn: async ({ moduleName }) => {
      const response = await fetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ moduleName }),
      });
      
      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.error || '爬虫运行失败');
      }
      
      return result.data;
    },
    onSuccess: () => {
      // 爬虫完成后刷新所有相关数据
      queryClient.invalidateQueries({ queryKey: ['modules'] });
      queryClient.invalidateQueries({ queryKey: ['module-data'] });
      queryClient.invalidateQueries({ queryKey: ['module-stats'] });
    },
  });
}
