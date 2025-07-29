'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TooltipProvider } from '@/components/ui/tooltip';
import { useModuleData, useUpdateTranslation } from '@/hooks/use-modules';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';
import { TARGET_LANGUAGES, SOURCE_LANGUAGE, UI_CONFIG } from '../../../../scraper-config/config';
import { DataTablePagination } from '@/components/ui/data-table-pagination';
import { TableFiltersComponent } from './TableFilters';
import { TranslationTableCell } from './TableCell';
import { WikipediaDialogs } from './WikipediaDialogs';
import { useWikipedia } from './useWikipedia';
import type { ModuleTableProps, EditingCell, TableFilters, PaginationState } from './types';
import type { TranslationValue } from '@/lib/types';

export function ModuleTable({ moduleName, className }: ModuleTableProps) {
  const t = useTranslations('modules');
  const { data: moduleData, isLoading, error } = useModuleData(moduleName);
  const updateMutation = useUpdateTranslation();
  const { settings, updateSettings } = useSettings();

  // 过滤和分页状态
  const [filters, setFilters] = useState<TableFilters>({
    searchTerm: '',
    filterLang: 'all',
    filterStatus: 'all',
  });

  const [pagination, setPagination] = useState<PaginationState>({
    currentPage: 1,
    pageSize: UI_CONFIG.table.defaultPageSize,
  });

  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);

  // 维基百科功能
  const wikipedia = useWikipedia(moduleName);

  // 过滤和搜索数据
  const filteredData = useMemo(() => {
    if (!moduleData) return [];

    return moduleData.filter((item) => {
      // 搜索过滤
      if (filters.searchTerm) {
        const searchLower = filters.searchTerm.toLowerCase();
        const matchesKey = item.key.toLowerCase().includes(searchLower);
        const matchesValue = Object.values(item.translations).some(translation => {
          const value = typeof translation === 'string' ? translation : translation.value;
          return value.toLowerCase().includes(searchLower);
        });
        
        if (!matchesKey && !matchesValue) return false;
      }

      // 语言过滤
      if (filters.filterLang !== 'all') {
        const translation = item.translations[filters.filterLang];
        if (!translation) return false;
      }

      // 翻译状态过滤
      if (filters.filterStatus !== 'all') {
        const hasUntranslated = Object.entries(item.translations).some(([lang, translation]) => {
          if (lang === SOURCE_LANGUAGE) return false;
          return typeof translation === 'object' && !translation.translated;
        });

        if (filters.filterStatus === 'untranslated' && !hasUntranslated) return false;
        if (filters.filterStatus === 'translated' && hasUntranslated) return false;
      }

      return true;
    });
  }, [moduleData, filters]);

  // 分页数据
  const paginatedData = useMemo(() => {
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return filteredData.slice(startIndex, endIndex);
  }, [filteredData, pagination]);

  // 总页数
  const totalPages = Math.ceil(filteredData.length / pagination.pageSize);

  // 当过滤条件改变时重置到第一页
  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [filters]);

  // 处理过滤器变化
  const handleFiltersChange = (newFilters: Partial<TableFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  // 分页处理函数
  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, currentPage: page }));
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPagination({ currentPage: 1, pageSize: newPageSize });
  };

  // 编辑相关函数
  const getTranslationValue = (translation: TranslationValue | string): string => {
    return typeof translation === 'string' ? translation : translation.value;
  };

  const isTranslated = (translation: TranslationValue | string): boolean => {
    return typeof translation === 'string' || translation.translated;
  };

  const handleCellEdit = (key: string, lang: string, currentValue: string, originalValue: string, isTranslated: boolean) => {
    if (lang === SOURCE_LANGUAGE) {
      navigator.clipboard.writeText(currentValue).then(() => {
        toast.success(t('sourceCopied'));
      }).catch(() => {
        toast.error(t('copyFailed'));
      });
      return;
    }

    setEditingCell({ key, lang, value: currentValue, originalValue, isTranslated });
  };

  const handleSaveEdit = async () => {
    if (!editingCell) return;

    try {
      const shouldAutoUpdateStatus = settings.autoUpdateTranslationStatus;
      const finalTranslatedStatus = shouldAutoUpdateStatus ? true : editingCell.isTranslated;

      await updateMutation.mutateAsync({
        moduleName,
        key: editingCell.key,
        lang: editingCell.lang,
        value: editingCell.value,
        translated: finalTranslatedStatus,
      });

      toast.success(t('translationUpdated'));
      setEditingCell(null);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('updateFailed'));
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
  };

  const handleResetEdit = () => {
    if (!editingCell) return;
    setEditingCell({
      ...editingCell,
      value: editingCell.originalValue
    });
  };

  const handleToggleTranslated = async () => {
    if (!editingCell) return;

    const newTranslatedStatus = !editingCell.isTranslated;
    
    try {
      await updateMutation.mutateAsync({
        moduleName,
        key: editingCell.key,
        lang: editingCell.lang,
        value: editingCell.value,
        translated: newTranslatedStatus,
      });

      setEditingCell({ ...editingCell, isTranslated: newTranslatedStatus });
      toast.success(t('statusUpdated', { status: newTranslatedStatus ? t('translated') : t('untranslated') }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t('statusUpdateFailed'));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  // 维基百科相关函数
  const handleWikiLookup = async (key: string, japaneseText: string) => {
    if (!japaneseText.trim()) {
      toast.error(t('wikiSearch.japaneseEmpty'));
      return;
    }

    wikipedia.setCurrentWikiLookup({
      key,
      text: japaneseText,
      loading: true,
      progress: t('wikiSearch.queryingJapaneseWiki'),
      results: null
    });
    wikipedia.setWikiDialogOpen(true);

    try {
      const proxyConfig = settings.enableWikipediaProxy ? {
        enableProxy: true,
        proxyUrl: settings.wikipediaProxyUrl
      } : {
        enableProxy: false,
        proxyUrl: ''
      };
      
      const response = await fetch('/api/v1/wikipedia', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: japaneseText.trim(),
          proxyConfig 
        }),
      });
      
      const result = await response.json();
      
      if (result.fallbackSearch && result.searchResults) {
        wikipedia.setWikiDialogOpen(false);
        wikipedia.setApiSearchResults(result.searchResults);
        wikipedia.setCurrentSearchContext({ key });
        wikipedia.setWikiSearchDialogOpen(true);
        toast.info(t('wikiSearch.directQueryFailed', { count: result.searchResults.length }));
        return;
      }
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      wikipedia.setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryComplete'),
        results: result.data
      } : null);

      const foundCount = [result.data.english, result.data.chinese].filter(Boolean).length;
      toast.success(t('wikiSearch.wikiQueryComplete', { count: foundCount }));
      
    } catch (error) {
      console.error('维基百科查询失败:', error);
      wikipedia.setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')),
        results: null
      } : null);
      toast.error(t('wikiSearch.wikiQueryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')));
    }
  };

  const handleUpdateTranslation = async (lang: string, value: string) => {
    if (!wikipedia.currentWikiLookup) return;

    try {
      await updateMutation.mutateAsync({
        moduleName,
        key: wikipedia.currentWikiLookup.key,
        lang,
        value,
        translated: true,
      });

      toast.success(t('wikiSearch.translationUpdated', { lang }));
    } catch (error) {
      toast.error(t('wikiSearch.updateTranslationFailed', {
        lang,
        error: error instanceof Error ? error.message : t('wikiSearch.unknownError')
      }));
    }
  };

  const handleUpdateAllTranslations = async () => {
    if (!wikipedia.currentWikiLookup?.results) return;

    const { results } = wikipedia.currentWikiLookup;
    const updates: Promise<void>[] = [];

    if (results.english && TARGET_LANGUAGES.includes('en')) {
      updates.push(handleUpdateTranslation('en', results.english));
    }
    
    if (results.chinese && TARGET_LANGUAGES.includes('zh-CN')) {
      updates.push(handleUpdateTranslation('zh-CN', results.chinese));
    }
    
    if (results.traditionalChinese && TARGET_LANGUAGES.includes('zh-TW')) {
      updates.push(handleUpdateTranslation('zh-TW', results.traditionalChinese));
    }

    try {
      await Promise.all(updates);
      toast.success(t('wikiSearch.allTranslationsUpdated'));
      wikipedia.setWikiDialogOpen(false);
    } catch {
      toast.error(t('wikiSearch.batchUpdateFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <span className="ml-2">{t('loadingData')}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-red-500">
        <p>{t('loadDataFailed')}</p>
        <p className="text-sm text-muted-foreground mt-2">{error.message}</p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className={className}>
        {/* 筛选和搜索栏 */}
        <TableFiltersComponent
          filters={filters}
          onFiltersChange={handleFiltersChange}
          autoUpdateTranslationStatus={settings.autoUpdateTranslationStatus}
          onAutoUpdateToggle={(enabled) => updateSettings({ autoUpdateTranslationStatus: enabled })}
          totalRecords={filteredData.length}
        />

        {/* 数据表格 */}
        <div className="border rounded-lg overflow-hidden">
          <div className="max-h-[70vh] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-background z-10">
                <TableRow>
                  <TableHead className="w-[200px]">{t('keyName')}</TableHead>
                  {TARGET_LANGUAGES.map((lang) => (
                    <TableHead key={lang} className="min-w-[200px]">
                      <div className="flex items-center justify-between">
                        <div>
                          {lang}
                          {lang === SOURCE_LANGUAGE && (
                            <Badge variant="outline" className="ml-2 text-xs">
                              {t('source')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedData.map((item) => (
                  <TableRow key={item.key}>
                    <TableCell className="font-mono text-sm">
                      {item.key}
                    </TableCell>
                    {TARGET_LANGUAGES.map((lang) => {
                      const translation = item.translations[lang];
                      const sourceTranslation = item.translations[SOURCE_LANGUAGE];
                      const sourceValue = sourceTranslation ? getTranslationValue(sourceTranslation) : '';

                      return (
                        <TranslationTableCell
                          key={lang}
                          itemKey={item.key}
                          lang={lang}
                          translation={translation}
                          sourceValue={sourceValue}
                          editingCell={editingCell}
                          onCellEdit={handleCellEdit}
                          onEditingCellChange={setEditingCell}
                          onSaveEdit={handleSaveEdit}
                          onCancelEdit={handleCancelEdit}
                          onResetEdit={handleResetEdit}
                          onToggleTranslated={handleToggleTranslated}
                          onKeyDown={handleKeyDown}
                          onWikiLookup={handleWikiLookup}
                          onOpenWikiSearch={wikipedia.handleOpenWikiSearch}
                          isLoading={updateMutation.isPending}
                        />
                      );
                    })}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* 分页组件 */}
        {filteredData.length > 0 && (
          <div className="mt-4">
            <DataTablePagination
              currentPage={pagination.currentPage}
              totalPages={totalPages}
              pageSize={pagination.pageSize}
              totalItems={filteredData.length}
              pageSizeOptions={UI_CONFIG.table.pageSizeOptions}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          </div>
        )}

        {filteredData.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {t('noData')}
          </div>
        )}

        {/* 维基百科对话框 */}
        <WikipediaDialogs
          wikiDialogOpen={wikipedia.wikiDialogOpen}
          setWikiDialogOpen={wikipedia.setWikiDialogOpen}
          currentWikiLookup={wikipedia.currentWikiLookup}
          onUpdateTranslation={handleUpdateTranslation}
          onUpdateAllTranslations={handleUpdateAllTranslations}
          isUpdating={updateMutation.isPending}
          wikiSearchDialogOpen={wikipedia.wikiSearchDialogOpen}
          setWikiSearchDialogOpen={wikipedia.setWikiSearchDialogOpen}
          searchKeyword={wikipedia.searchKeyword}
          setSearchKeyword={wikipedia.setSearchKeyword}
          onWikiSearch={wikipedia.handleWikiSearch}
          apiSearchResults={wikipedia.apiSearchResults}
          htmlSearchResults={wikipedia.htmlSearchResults}
          apiSearchLoading={wikipedia.apiSearchLoading}
          htmlSearchLoading={wikipedia.htmlSearchLoading}
          onSearchItemSelect={wikipedia.handleSearchItemSelect}
        />
      </div>
    </TooltipProvider>
  );
}
