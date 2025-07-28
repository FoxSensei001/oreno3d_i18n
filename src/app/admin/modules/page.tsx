'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Database, ArrowRight, RefreshCw, Clock } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useModules, useScraper } from '@/hooks/use-modules';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ModulesPage() {
  const { data: modules, isLoading, error, refetch } = useModules();
  const scraperMutation = useScraper();
  const t = useTranslations('modules');
  const tCommon = useTranslations('common');
  const tScraper = useTranslations('scraper');

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      {modules && modules.length > 0 ? (
        <div className="grid gap-6">
          {modules.map((module) => (
            <Card key={module.name} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Database className="h-8 w-8 text-primary" />
                    <div>
                      <CardTitle className="text-xl">{module.displayName}</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {module.description}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="text-sm">
                    {t('priority')} {module.priority}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                  {/* 翻译进度 */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t('translationProgress')}</span>
                      <span className="font-medium">{module.progress}%</span>
                    </div>
                    <Progress value={module.progress} className="h-2" />
                  </div>

                  {/* 条目数量 */}
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('totalItems')}</p>
                      <p className="text-lg font-semibold">
                        {module.totalItems.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* 预估时间 */}
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <div>
                      <p className="text-sm text-muted-foreground">{t('estimatedUpdateTime')}</p>
                      <p className="text-lg font-semibold">{module.estimatedTime}s</p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col space-y-2">
                    <Button asChild className="w-full">
                      <Link href={`/admin/modules/${module.name}`}>
                        <ArrowRight className="h-4 w-4 mr-2" />
                        {t('viewDetails')}
                      </Link>
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handleRefreshModule(module.name)}
                      disabled={scraperMutation.isPending}
                      className="w-full"
                    >
                      <RefreshCw className={`h-4 w-4 mr-2 ${scraperMutation.isPending ? 'animate-spin' : ''}`} />
                      {t('updateData')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 text-gray-500">
          <Database className="h-12 w-12 mb-4" />
          <p>{t('noModules')}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t('checkConfig')}
          </p>
        </div>
      )}
    </div>
  );
}
