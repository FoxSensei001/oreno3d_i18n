'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Globe, Database } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSettings } from '@/hooks/use-settings';
import { TARGET_LANGUAGES, SOURCE_LANGUAGE, SCRAPER_CONFIG } from '../../../../scraper-config/config';

export default function SettingsPage() {
  const t = useTranslations('settings');
  const { settings, updateSettings, isLoaded } = useSettings();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">
          {t('description')}
        </p>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="general">
            <Settings className="h-4 w-4 mr-2" />
            {t('general')}
          </TabsTrigger>
          <TabsTrigger value="languages">
            <Globe className="h-4 w-4 mr-2" />
            {t('languages')}
          </TabsTrigger>
          <TabsTrigger value="scraper">
            <Database className="h-4 w-4 mr-2" />
            {t('scraper')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('editorSettings')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('editorSettingsDesc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="auto-update-status">{t('autoUpdateTranslationStatus')}</Label>
                  <p className="text-sm text-muted-foreground">
                    {t('autoUpdateTranslationStatusDesc')}
                  </p>
                </div>
                <Switch
                  id="auto-update-status"
                  checked={settings.autoUpdateTranslationStatus}
                  onCheckedChange={(checked) =>
                    updateSettings({ autoUpdateTranslationStatus: checked })
                  }
                  disabled={!isLoaded}
                />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>{t('appInfo')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('appName')}</label>
                  <p className="text-lg">Oreno3dI18n</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('version')}</label>
                  <p className="text-lg">v1.0.0</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('environment')}</label>
                  <Badge variant="outline">
                    {process.env.NODE_ENV || 'development'}
                  </Badge>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('currentTime')}</label>
                  <p className="text-sm text-muted-foreground">
                    {new Intl.DateTimeFormat('zh-CN', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: 'numeric',
                      second: 'numeric',
                      hour12: false
                    }).format(new Date())}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

        </TabsContent>

        <TabsContent value="languages" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('supportedLanguages')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('configNote')}
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">{t('sourceLanguage')}</label>
                  <div className="mt-2">
                    <Badge variant="default" className="text-sm">
                      {SOURCE_LANGUAGE}
                    </Badge>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('targetLanguages')}</label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {TARGET_LANGUAGES.map((lang) => (
                      <Badge
                        key={lang}
                        variant={lang === SOURCE_LANGUAGE ? "default" : "secondary"}
                        className="text-sm"
                      >
                        {lang}
                        {lang === SOURCE_LANGUAGE && ` (${t('sourceLanguage')})`}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>{t('editConfigNote')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="scraper" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('scraperConfig')}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {t('scraperConfigDesc')}
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">{t('requestInterval')}</label>
                  <p className="text-lg">{SCRAPER_CONFIG.requestDelay} {t('milliseconds')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('maxRetries')}</label>
                  <p className="text-lg">{SCRAPER_CONFIG.maxRetries} {t('times')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('requestTimeout')}</label>
                  <p className="text-lg">{SCRAPER_CONFIG.timeout} {t('milliseconds')}</p>
                </div>
                <div>
                  <label className="text-sm font-medium">{t('concurrentRequests')}</label>
                  <p className="text-lg">{SCRAPER_CONFIG.concurrency} {t('requests')}</p>
                </div>
              </div>
              <div className="mt-6 p-4 bg-muted rounded-lg">
                <p className="text-sm text-muted-foreground">
                  {t('editConfigNote')}
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>
    </div>
  );
}
