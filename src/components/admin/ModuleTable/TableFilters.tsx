'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Settings } from 'lucide-react';
import { TARGET_LANGUAGES } from '../../../../scraper-config/config';
import type { TableFilters } from './types';

interface TableFiltersProps {
  filters: TableFilters;
  onFiltersChange: (filters: Partial<TableFilters>) => void;
  autoUpdateTranslationStatus: boolean;
  onAutoUpdateToggle: (enabled: boolean) => void;
  totalRecords: number;
}

export function TableFiltersComponent({
  filters,
  onFiltersChange,
  autoUpdateTranslationStatus,
  onAutoUpdateToggle,
  totalRecords,
}: TableFiltersProps) {
  const t = useTranslations('modules');

  return (
    <div className="flex flex-col gap-4 mb-6">
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('searchPlaceholder')}
            value={filters.searchTerm}
            onChange={(e) => onFiltersChange({ searchTerm: e.target.value })}
            className="pl-10"
          />
        </div>

        <Select 
          value={filters.filterLang} 
          onValueChange={(value) => onFiltersChange({ filterLang: value })}
        >
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue placeholder={t('selectLanguage')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allLanguages')}</SelectItem>
            {TARGET_LANGUAGES.map((lang) => (
              <SelectItem key={lang} value={lang}>
                {lang}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select 
          value={filters.filterStatus} 
          onValueChange={(value: 'all' | 'translated' | 'untranslated') => 
            onFiltersChange({ filterStatus: value })
          }
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder={t('translationStatus')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('all')}</SelectItem>
            <SelectItem value="translated">{t('translated')}</SelectItem>
            <SelectItem value="untranslated">{t('untranslated')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* 配置显示区域 */}
      <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-muted-foreground" />
          <Label htmlFor="auto-update-toggle" className="text-sm font-medium">
            {t('autoUpdateTranslationStatus')}
          </Label>
        </div>
        <Switch
          id="auto-update-toggle"
          checked={autoUpdateTranslationStatus}
          onCheckedChange={onAutoUpdateToggle}
        />
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-4">
        <Badge variant="outline">
          {t('totalRecords', { count: totalRecords })}
        </Badge>
        {filters.searchTerm && (
          <Badge variant="secondary">
            {t('searchQuery', { query: filters.searchTerm })}
          </Badge>
        )}
        {filters.filterStatus !== 'all' && (
          <Badge variant="secondary">
            {t('filterStatus', { 
              status: filters.filterStatus === 'translated' ? t('translated') : t('untranslated') 
            })}
          </Badge>
        )}
      </div>
    </div>
  );
}
