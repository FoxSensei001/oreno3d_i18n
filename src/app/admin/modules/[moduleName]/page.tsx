'use client';

import { use } from 'react';
import { useTranslations } from 'next-intl';
import { ModuleTable } from '@/components/admin/ModuleTable';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RefreshCw, Database, TrendingUp } from 'lucide-react';
import { useModuleStats, useScraper } from '@/hooks/use-modules';
import { toast } from 'sonner';
import Link from 'next/link';
import { getModuleConfig } from '../../../../../scraper-config/config';

interface ModulePageProps {
  params: Promise<{
    moduleName: string;
  }>;
}

export default function ModulePage({ params }: ModulePageProps) {
  const { moduleName } = use(params);
  const t = useTranslations('modules');
  const tScraper = useTranslations('scraper');
  const tCommon = useTranslations('common');
  const { data: stats, isLoading: statsLoading, refetch: refetchStats } = useModuleStats(moduleName);
  const scraperMutation = useScraper();

  const moduleConfig = getModuleConfig(moduleName);

  const handleRefresh = async () => {
    try {
      toast.loading(tScraper('updating', { moduleName }), { id: 'scraper' });
      
      await scraperMutation.mutateAsync({ moduleName });
      
      toast.success(tScraper('moduleUpdateComplete', { moduleName }), { id: 'scraper' });
      refetchStats();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : tScraper('updateFailed'),
        { id: 'scraper' }
      );
    }
  };

  if (!moduleConfig) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Database className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">{t('moduleNotFound')}</h2>
        <p className="text-muted-foreground mb-4">{t('moduleNotFoundDesc', { moduleName })}</p>
        <Button asChild variant="outline">
          <Link href="/admin">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('returnToDashboard')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 页面头部 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button asChild variant="outline" size="sm">
            <Link href="/admin">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {tCommon('back')}
            </Link>
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              {moduleConfig.ui.displayName}
            </h1>
            <p className="text-muted-foreground">
              {moduleConfig.ui.description}
            </p>
          </div>
        </div>
        
        <Button
          onClick={handleRefresh}
          disabled={scraperMutation.isPending}
          size="lg"
        >
          <RefreshCw className={`h-4 w-4 mr-2 ${scraperMutation.isPending ? 'animate-spin' : ''}`} />
          {t('updateData')}
        </Button>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('totalItems')}</CardTitle>
              <Database className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalItems.toLocaleString()}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('translationProgress')}</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.progress}%</div>
              <Progress value={stats.progress} className="mt-2" />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('languages')}</CardTitle>
              <Badge variant="outline" className="text-xs">
                {Object.keys(stats.languageStats).length}
              </Badge>
            </CardHeader>
            <CardContent>
              <div className="space-y-1">
                {Object.entries(stats.languageStats).map(([lang, langStats]) => (
                  <div key={lang} className="flex justify-between text-sm">
                    <span>{lang}</span>
                    <span>{(langStats as { progress: number }).progress}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('moduleInfo')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>{t('keyPrefix')}:</span>
                  <code className="text-xs bg-muted px-1 rounded">
                    {moduleConfig.keyPrefix}
                  </code>
                </div>
                <div className="flex justify-between">
                  <span>{t('priority')}:</span>
                  <Badge variant="secondary" className="text-xs">
                    {moduleConfig.ui.priority}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>{t('estimatedUpdateTime')}:</span>
                  <span>{moduleConfig.ui.estimatedTime}s</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 数据表格 */}
      <Card>
        <CardHeader>
          <CardTitle>{t('translationData')}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {t('editHint')}
          </p>
        </CardHeader>
        <CardContent>
          <ModuleTable moduleName={moduleName} />
        </CardContent>
      </Card>
    </div>
  );
}
