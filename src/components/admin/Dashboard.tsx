'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Database, Clock, TrendingUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useModules, useScraper } from '@/hooks/use-modules';
import { toast } from 'sonner';
import Link from 'next/link';
import type { ModuleInfo } from '@/lib/types';

interface DashboardProps {
  className?: string;
}

export function Dashboard({ className }: DashboardProps) {
  const { data: modules, isLoading, error, refetch } = useModules();
  const scraperMutation = useScraper();
  const t = useTranslations('dashboard');
  const tScraper = useTranslations('scraper');
  const tCommon = useTranslations('common');

  const handleRefreshAll = async () => {
    try {
      toast.loading(tScraper('updating') + '...', { id: 'scraper' });

      const result = await scraperMutation.mutateAsync({});

      if ('totalModules' in result) {
        // 批量结果
        toast.success(
          tScraper('batchUpdateComplete', {
            successful: result.successfulModules,
            failed: result.failedModules
          }),
          { id: 'scraper' }
        );
      } else {
        // 单个模块结果
        toast.success(tScraper('moduleUpdateComplete'), { id: 'scraper' });
      }

      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tScraper('updateFailed'),
        { id: 'scraper' }
      );
    }
  };

  const handleRefreshModule = async (moduleName: string) => {
    try {
      toast.loading(`${tScraper('updating')} ${moduleName}...`, { id: `scraper-${moduleName}` });

      await scraperMutation.mutateAsync({ moduleName });

      toast.success(tScraper('moduleUpdateComplete'), { id: `scraper-${moduleName}` });
      refetch();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tScraper('updateFailed'),
        { id: `scraper-${moduleName}` }
      );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <RefreshCw className="h-8 w-8 animate-spin" />
        <span className="ml-2">{tCommon('loading')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <Database className="h-12 w-12 mb-4" />
        <p>{t('loadFailed')}</p>
        <Button onClick={() => refetch()} variant="outline" className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          {tCommon('retry')}
        </Button>
      </div>
    );
  }

  if (!modules || modules.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <Database className="h-12 w-12 mb-4" />
        <p>{t('noModules')}</p>
      </div>
    );
  }

  // 计算总体统计
  const totalItems = modules.reduce((sum, module) => sum + module.totalItems, 0);
  const averageProgress = modules.length > 0 
    ? Math.round(modules.reduce((sum, module) => sum + module.progress, 0) / modules.length)
    : 0;
  const totalEstimatedTime = modules.reduce((sum, module) => sum + module.estimatedTime, 0);

  return (
    <div className={className}>
      {/* 总体统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalModules')}</CardTitle>
            <Database className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{modules.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('totalItems')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalItems.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('averageProgress')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageProgress}%</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('estimatedTime')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEstimatedTime}s</div>
          </CardContent>
        </Card>
      </div>

      {/* 全局操作 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">{t('moduleManagement')}</h2>
        <Button
          onClick={handleRefreshAll}
          disabled={scraperMutation.isPending}
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${scraperMutation.isPending ? 'animate-spin' : ''}`} />
          {t('updateAllModules')}
        </Button>
      </div>

      {/* 模块卡片网格 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {modules.map((module) => (
          <ModuleCard
            key={module.name}
            module={module}
            onRefresh={() => handleRefreshModule(module.name)}
            isRefreshing={scraperMutation.isPending}
          />
        ))}
      </div>
    </div>
  );
}

interface ModuleCardProps {
  module: ModuleInfo;
  onRefresh: () => void;
  isRefreshing: boolean;
}

function ModuleCard({ module, onRefresh, isRefreshing }: ModuleCardProps) {
  const t = useTranslations('dashboard');

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          {module.displayName}
        </CardTitle>
        <p className="text-sm text-muted-foreground">{module.description}</p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>{t('progress')}</span>
              <span>{module.progress}%</span>
            </div>
            <Progress value={module.progress} className="h-2" />
          </div>

          <div className="flex justify-between items-center">
            <Badge variant="secondary">
              {module.totalItems.toLocaleString()} {t('items')}
            </Badge>
            <Badge variant="outline">
              <Clock className="h-3 w-3 mr-1" />
              {module.estimatedTime}s
            </Badge>
          </div>

          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm" className="flex-1">
              <Link href={`/admin/modules/${module.name}`}>
                {t('viewDetails')}
              </Link>
            </Button>
            <Button
              onClick={onRefresh}
              disabled={isRefreshing}
              size="sm"
              variant="default"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
