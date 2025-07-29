'use client';

import { useTranslations } from 'next-intl';
import { useState, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Filter, Save, X, RotateCcw, Languages, Settings, Globe, ExternalLink } from 'lucide-react';
import { useModuleData, useUpdateTranslation } from '@/hooks/use-modules';
import { useSettings } from '@/hooks/use-settings';
import { toast } from 'sonner';
import type { TranslationValue } from '@/lib/types';
import { TARGET_LANGUAGES, SOURCE_LANGUAGE } from '../../../scraper-config/config';

interface ModuleTableProps {
  moduleName: string;
  className?: string;
}

interface EditingCell {
  key: string;
  lang: string;
  value: string;
  originalValue: string;
  isTranslated: boolean;
}

export function ModuleTable({ moduleName, className }: ModuleTableProps) {
  const t = useTranslations('modules');
  const { data: moduleData, isLoading, error } = useModuleData(moduleName);
  const updateMutation = useUpdateTranslation();
  const { settings, updateSettings } = useSettings();

  const [searchTerm, setSearchTerm] = useState('');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'translated' | 'untranslated'>('all');
  const [editingCell, setEditingCell] = useState<EditingCell | null>(null);
  const [wikiDialogOpen, setWikiDialogOpen] = useState(false);
  const [wikiSearchDialogOpen, setWikiSearchDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<{
    id: number;
    key: string;
    title: string;
    excerpt: string;
    description: string | null;
    thumbnail: { url: string; width: number; height: number; } | null;
  }[]>([]);
  const [htmlSearchResults, setHtmlSearchResults] = useState<{
    id: number;
    key: string;
    title: string;
    excerpt: string;
    description: string | null;
    thumbnail: { url: string; width: number; height: number; } | null;
  }[]>([]);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [htmlSearchLoading, setHtmlSearchLoading] = useState(false);
  const [currentSearchContext, setCurrentSearchContext] = useState<{
    key: string;
  } | null>(null);
  const [currentWikiLookup, setCurrentWikiLookup] = useState<{
    key: string;
    text: string;
    loading: boolean;
    progress: string;
    results: {
      japanese: string;
      english: string;
      chinese: string;
      traditionalChinese: string;
    } | null;
  } | null>(null);

  // 过滤和搜索数据
  const filteredData = useMemo(() => {
    if (!moduleData) return [];

    return moduleData.filter((item) => {
      // 搜索过滤
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        const matchesKey = item.key.toLowerCase().includes(searchLower);
        const matchesValue = Object.values(item.translations).some(translation => {
          const value = typeof translation === 'string' ? translation : translation.value;
          return value.toLowerCase().includes(searchLower);
        });
        
        if (!matchesKey && !matchesValue) return false;
      }

      // 语言过滤
      if (filterLang !== 'all') {
        const translation = item.translations[filterLang];
        if (!translation) return false;
      }

      // 翻译状态过滤
      if (filterStatus !== 'all') {
        const hasUntranslated = Object.entries(item.translations).some(([lang, translation]) => {
          if (lang === SOURCE_LANGUAGE) return false;
          return typeof translation === 'object' && !translation.translated;
        });

        if (filterStatus === 'untranslated' && !hasUntranslated) return false;
        if (filterStatus === 'translated' && hasUntranslated) return false;
      }

      return true;
    });
  }, [moduleData, searchTerm, filterLang, filterStatus]);

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
      // 根据配置决定是否自动更新翻译状态
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
      // 单独 Enter: 保存
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === 'Escape') {
      // Esc: 取消编辑
      handleCancelEdit();
    }
  };

  const getTranslationValue = (translation: TranslationValue | string): string => {
    return typeof translation === 'string' ? translation : translation.value;
  };

  const isTranslated = (translation: TranslationValue | string): boolean => {
    return typeof translation === 'string' || translation.translated;
  };

  const handleWikiSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error(t('wikiSearch.enterKeyword'));
      return;
    }

    await handleWikiSearchWithKeyword(searchKeyword.trim());
  };

  const handleWikiSearchWithKeyword = async (keyword: string) => {
    // 同时启动两种搜索
    setApiSearchLoading(true);
    setHtmlSearchLoading(true);
    setApiSearchResults([]);
    setHtmlSearchResults([]);
    
    const proxyConfig = settings.enableWikipediaProxy ? {
      enableProxy: true,
      proxyUrl: settings.wikipediaProxyUrl
    } : {
      enableProxy: false,
      proxyUrl: ''
    };
    
    // 同时进行API搜索和HTML搜索
    const apiSearchPromise = fetch('/api/v1/wikipedia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: keyword,
        proxyConfig,
        action: 'search',
        searchMethod: 'api'
      }),
    }).then(async (response) => {
      const result = await response.json();
      console.log('[Frontend] API搜索结果:', result);

      if (response.ok && result.success) {
        setApiSearchResults(result.data);
        toast.success(t('wikiSearch.apiSearchResults', { count: result.data.length }));
      } else {
        throw new Error(result.error || t('wikiSearch.apiSearchFailed'));
      }
    }).catch((error) => {
      console.error('API搜索失败:', error);
      toast.error(t('wikiSearch.apiSearchFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')));
    }).finally(() => {
      setApiSearchLoading(false);
    });

    const htmlSearchPromise = fetch('/api/v1/wikipedia', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        text: keyword,
        proxyConfig,
        action: 'search',
        searchMethod: 'html'
      }),
    }).then(async (response) => {
      const result = await response.json();
      console.log('[Frontend] HTML搜索结果:', result);

      if (response.ok && result.success) {
        setHtmlSearchResults(result.data);
        toast.success(t('wikiSearch.htmlSearchResults', { count: result.data.length }));
      } else {
        throw new Error(result.error || t('wikiSearch.htmlSearchFailed'));
      }
    }).catch((error) => {
      console.error('HTML搜索失败:', error);
      toast.error(t('wikiSearch.htmlSearchFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')));
    }).finally(() => {
      setHtmlSearchLoading(false);
    });

    // 等待两个搜索都完成（不管成功还是失败）
    await Promise.allSettled([apiSearchPromise, htmlSearchPromise]);
  };

  const handleSearchItemSelect = async (selectedItem: typeof apiSearchResults[0]) => {
    if (!currentSearchContext) return;
    
    // 关闭搜索对话框
    setWikiSearchDialogOpen(false);
    
    // 设置查询状态并打开结果对话框
    setCurrentWikiLookup({
      key: currentSearchContext.key,
      text: selectedItem.title,
      loading: true,
      progress: t('wikiSearch.queryingSelectedPage', { title: selectedItem.title }),
      results: null
    });
    setWikiDialogOpen(true);
    
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: selectedItem.key,
          proxyConfig,
          action: 'lookup'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      if (!result.success) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      const { data } = result;

      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryComplete'),
        results: data
      } : null);

      const foundCount = [data.english, data.chinese].filter(Boolean).length;
      toast.success(t('wikiSearch.wikiQueryComplete', { count: foundCount }));
      
    } catch (error) {
      console.error('维基百科查询失败:', error);
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')),
        results: null
      } : null);
      toast.error(t('wikiSearch.wikiQueryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')));
    }
  };

  const handleOpenWikiSearch = (key: string, japaneseText?: string) => {
    setCurrentSearchContext({ key });
    setSearchKeyword(japaneseText || '');
    setApiSearchResults([]);
    setHtmlSearchResults([]);
    setWikiSearchDialogOpen(true);
    
    // 如果提供了日文文本，自动触发搜索
    if (japaneseText && japaneseText.trim()) {
      // 直接调用搜索函数并传入关键词，避免状态更新延迟问题
      handleWikiSearchWithKeyword(japaneseText.trim());
    }
  };

  const handleWikiLookup = async (key: string, japaneseText: string) => {
    if (!japaneseText.trim()) {
      toast.error(t('wikiSearch.japaneseEmpty'));
      return;
    }

    // 设置初始状态并打开对话框
    setCurrentWikiLookup({
      key,
      text: japaneseText,
      loading: true,
      progress: t('wikiSearch.queryingJapaneseWiki'),
      results: null
    });
    setWikiDialogOpen(true);

    try {
      // 更新进度
      setCurrentWikiLookup(prev => prev ? { ...prev, progress: t('wikiSearch.sendingRequest') } : null);
      
      // 准备代理配置
      const proxyConfig = settings.enableWikipediaProxy ? {
        enableProxy: true,
        proxyUrl: settings.wikipediaProxyUrl
      } : {
        enableProxy: false,
        proxyUrl: ''
      };
      
      // 调用我们的API
      const response = await fetch('/api/v1/wikipedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: japaneseText.trim(),
          proxyConfig 
        }),
      });
      
      const result = await response.json();
      
      // 检查是否是fallback搜索结果
      if (result.fallbackSearch && result.searchResults) {
        // 关闭当前查询对话框
        setWikiDialogOpen(false);
        
        // 设置搜索结果并打开搜索选择对话框
        setApiSearchResults(result.searchResults);
        setCurrentSearchContext({ key });
        setWikiSearchDialogOpen(true);
        
        toast.info(t('wikiSearch.directQueryFailed', { count: result.searchResults.length }));
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      if (!result.success) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      const { data } = result;

      // 更新进度显示找到的内容
      const englishPart = data.english ? t('wikiSearch.englishResult', { text: data.english }) : '';
      const chinesePart = data.chinese ? t('wikiSearch.chineseResult', { text: data.chinese }) : '';
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        progress: t('wikiSearch.queryCompleteWithResults', {
          japanese: data.japanese,
          english: englishPart,
          chinese: chinesePart
        })
      } : null);

      // 保存结果
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryComplete'),
        results: data
      } : null);

      const foundCount = [data.english, data.chinese].filter(Boolean).length;
      toast.success(t('wikiSearch.wikiQueryComplete', { count: foundCount }));
      
    } catch (error) {
      console.error('维基百科查询失败:', error);
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')),
        results: null
      } : null);
      toast.error(t('wikiSearch.wikiQueryFailed') + ': ' + (error instanceof Error ? error.message : t('wikiSearch.unknownError')));
    }
  };

  // 更新特定语言的翻译
  const handleUpdateTranslation = async (lang: string, value: string) => {
    if (!currentWikiLookup) return;

    try {
      await updateMutation.mutateAsync({
        moduleName,
        key: currentWikiLookup.key,
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

  // 更新所有翻译
  const handleUpdateAllTranslations = async () => {
    if (!currentWikiLookup?.results) return;

    const { results } = currentWikiLookup;
    const updates: Promise<void>[] = [];

    // 根据语言配置更新相应的翻译
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
      setWikiDialogOpen(false);
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
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={t('searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterLang} onValueChange={setFilterLang}>
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

          <Select value={filterStatus} onValueChange={(value: 'all' | 'translated' | 'untranslated') => setFilterStatus(value)}>
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
            checked={settings.autoUpdateTranslationStatus}
            onCheckedChange={(checked) =>
              updateSettings({ autoUpdateTranslationStatus: checked })
            }
          />
        </div>
      </div>

      {/* 统计信息 */}
      <div className="flex items-center gap-4 mb-4">
        <Badge variant="outline">
          {t('totalRecords', { count: filteredData.length })}
        </Badge>
        {searchTerm && (
          <Badge variant="secondary">
            {t('searchQuery', { query: searchTerm })}
          </Badge>
        )}
        {filterStatus !== 'all' && (
          <Badge variant="secondary">
            {t('filterStatus', { status: filterStatus === 'translated' ? t('translated') : t('untranslated') })}
          </Badge>
        )}
      </div>

      {/* 数据表格 */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
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
            {filteredData.map((item) => (
              <TableRow key={item.key}>
                <TableCell className="font-mono text-sm">
                  {item.key}
                </TableCell>
                {TARGET_LANGUAGES.map((lang) => {
                  const translation = item.translations[lang];
                  const value = translation ? getTranslationValue(translation) : '';
                  const translated = translation ? isTranslated(translation) : false;
                  const isEditing = editingCell?.key === item.key && editingCell?.lang === lang;

                  // 获取日文原文用于重置
                  const sourceTranslation = item.translations[SOURCE_LANGUAGE];
                  const sourceValue = sourceTranslation ? getTranslationValue(sourceTranslation) : '';

                  return (
                    <TableCell key={lang} className="relative">
                      {isEditing ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Input
                              value={editingCell.value}
                              onChange={(e) => setEditingCell({ ...editingCell, value: e.target.value })}
                              onKeyDown={handleKeyDown}
                              className="flex-1"
                              autoFocus
                              placeholder={t('enterTranslation')}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                           <Button
                             size="sm"
                             onClick={handleSaveEdit}
                             disabled={updateMutation.isPending}
                             title={t('saveHint')}
                           >
                             <Save className="h-4 w-4" />
                           </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={handleResetEdit}
                             disabled={updateMutation.isPending}
                             title={t('resetToJapanese')}
                           >
                             <RotateCcw className="h-4 w-4" />
                           </Button>
                            <Button
                              size="sm"
                              variant={editingCell.isTranslated ? 'default' : 'secondary'}
                              onClick={handleToggleTranslated}
                              disabled={updateMutation.isPending}
                              title={t('toggleStatus')}
                            >
                              <Languages className="h-4 w-4 mr-1" />
                              {editingCell.isTranslated ? t('translatedShort') : t('untranslatedShort')}
                            </Button>
                           <Button
                             size="sm"
                             variant="outline"
                             onClick={handleCancelEdit}
                             title={t('cancelHint')}
                           >
                             <X className="h-4 w-4" />
                           </Button>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            <p>{t('editHint')}</p>
                            {sourceValue && (
                              <p className="mt-1">
                                <span className="font-medium">{t('japaneseOriginalClickToCopy')}</span>
                                <span className="text-foreground">{sourceValue}</span>
                              </p>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div
                            className={`cursor-pointer p-2 rounded hover:bg-muted/50 ${
                             lang !== SOURCE_LANGUAGE ? 'hover:bg-blue-50' : ''
                           }`}
                            onClick={() => handleCellEdit(item.key, lang, value, sourceValue, translated)}
                          >
                            <div className="flex items-center justify-between">
                              <span className={translated ? '' : 'text-muted-foreground italic'}>
                                {value || t('untranslatedDisplay')}
                              </span>
                              <div className="flex items-center gap-2">
                                {lang === SOURCE_LANGUAGE && value && (
                                  <div className="flex items-center gap-1">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleWikiLookup(item.key, value);
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      <Globe className="h-3 w-3 mr-1" />
                                      {t('wikiSearch.tryGetWikiTranslation')}
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenWikiSearch(item.key, value);
                                      }}
                                      className="h-7 text-xs"
                                    >
                                      <Search className="h-3 w-3 mr-1" />
                                      {t('wikiSearch.searchWikiByKeyword')}
                                    </Button>
                                  </div>
                                )}
                                {lang !== SOURCE_LANGUAGE && (
                                  <Badge
                                    variant={translated ? 'default' : 'secondary'}
                                    className="ml-2 text-xs"
                                  >
                                    {translated ? t('translatedShort') : t('untranslatedShort')}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredData.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          {t('noData')}
        </div>
      )}

      {/* 维基百科查询对话框 */}
      <Dialog open={wikiDialogOpen} onOpenChange={setWikiDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('wikiDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('wikiDialog.description', { text: currentWikiLookup?.text || '' })}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 进度显示 */}
            <div className="flex items-center gap-2">
              {currentWikiLookup?.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
              )}
              <span className="text-sm text-muted-foreground">
                {currentWikiLookup?.progress}
              </span>
            </div>

            {/* 查询结果 */}
            {currentWikiLookup?.results && (
              <div className="space-y-4 border rounded-lg p-4 bg-muted/20">
                <h4 className="font-medium">{t('wikiDialog.queryResults')}</h4>

                {/* 日文原文 */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <span className="text-sm font-medium text-blue-800">{t('wikiDialog.japanese')}</span>
                    <span className="ml-2">{currentWikiLookup.results.japanese}</span>
                  </div>
                </div>

                {/* 英文翻译 */}
                {currentWikiLookup.results.english && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-green-800">{t('wikiDialog.english')}</span>
                      <span className="ml-2">{currentWikiLookup.results.english}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('en', currentWikiLookup.results!.english)}
                      disabled={updateMutation.isPending}
                    >
                      {t('wikiDialog.updateEnglish')}
                    </Button>
                  </div>
                )}

                {/* 简体中文翻译 */}
                {currentWikiLookup.results.chinese && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-yellow-800">{t('wikiDialog.simplifiedChinese')}</span>
                      <span className="ml-2">{currentWikiLookup.results.chinese}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('zh-CN', currentWikiLookup.results!.chinese)}
                      disabled={updateMutation.isPending}
                    >
                      {t('wikiDialog.updateSimplifiedChinese')}
                    </Button>
                  </div>
                )}

                {/* 繁体中文翻译 */}
                {currentWikiLookup.results.traditionalChinese && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-purple-800">{t('wikiDialog.traditionalChinese')}</span>
                      <span className="ml-2">{currentWikiLookup.results.traditionalChinese}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('zh-TW', currentWikiLookup.results!.traditionalChinese)}
                      disabled={updateMutation.isPending}
                    >
                      {t('wikiDialog.updateTraditionalChinese')}
                    </Button>
                  </div>
                )}

                {/* 没有找到翻译的提示 */}
                {!currentWikiLookup.results.english && !currentWikiLookup.results.chinese && !currentWikiLookup.results.traditionalChinese && !currentWikiLookup.loading && (
                  <div className="text-center py-4 text-muted-foreground">
                    {t('wikiDialog.noTranslationFound')}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWikiDialogOpen(false)}>
              {t('common.close')}
            </Button>
            {currentWikiLookup?.results && (
              currentWikiLookup.results.english || currentWikiLookup.results.chinese || currentWikiLookup.results.traditionalChinese
            ) && (
              <Button
                onClick={handleUpdateAllTranslations}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? t('wikiDialog.updating') : t('wikiDialog.updateAllTranslations')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 维基百科搜索对话框 */}
      <Dialog open={wikiSearchDialogOpen} onOpenChange={setWikiSearchDialogOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh]">{/* 增加对话框宽度到90%视口宽度 */}
          <DialogHeader>
            <DialogTitle>{t('wikiSearchDialog.title')}</DialogTitle>
            <DialogDescription>
              {t('wikiSearchDialog.dialogDescription')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* 搜索输入框 */}
            <div className="flex items-center gap-2">
              <Input
                placeholder={t('wikiSearchDialog.placeholder')}
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
                    handleWikiSearch();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={handleWikiSearch}
                disabled={(apiSearchLoading || htmlSearchLoading) || !searchKeyword.trim()}
              >
                {(apiSearchLoading || htmlSearchLoading) ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                {t('wikiSearchDialog.search')}
              </Button>
            </div>

            {/* 搜索结果列表 */}
            {(apiSearchResults.length > 0 || htmlSearchResults.length > 0 || apiSearchLoading || htmlSearchLoading) && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* API 搜索结果 */}
                <div className="border rounded-lg">
                  <div className="p-3 bg-blue-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Search className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-800">{t('wikiSearchDialog.apiSearchResults')}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {apiSearchLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      )}
                      <span className="text-sm text-blue-600">
                        {apiSearchLoading ? t('wikiSearchDialog.searching') : t('wikiSearchDialog.resultsCount', { count: apiSearchResults.length })}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {apiSearchResults.length > 0 ? (
                      <div className="space-y-2 p-3">
                        {apiSearchResults.map((item) => (
                          <Tooltip key={`api-${item.id}`}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-blue-50/50 cursor-pointer transition-colors"
                                onClick={() => handleSearchItemSelect(item)}
                              >
                                {item.thumbnail && (
                                  <img
                                    src={item.thumbnail.url.startsWith('//') ? `https:${item.thumbnail.url}` : item.thumbnail.url}
                                    alt={item.title}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">{item.title}</h5>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.excerpt && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {item.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://ja.wikipedia.org/wiki/${encodeURIComponent(item.key)}`, '_blank');
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      {t('wikiSearchDialog.wikiPage')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="left" className="max-w-md p-3">
                              <div className="space-y-2">
                                <h6 className="font-semibold text-sm">{item.title}</h6>
                                {item.description && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.itemDescription')}</p>
                                    <p className="text-xs">{item.description}</p>
                                  </div>
                                )}
                                {item.excerpt && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.excerpt')}</p>
                                    <p className="text-xs">{item.excerpt}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.wikipediaPage')}</p>
                                  <p className="text-xs font-mono text-blue-600 break-all">{item.key}</p>
                                </div>
                                {item.thumbnail && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.thumbnail')}</p>
                                    <p className="text-xs">{t('wikiSearchDialog.thumbnailSize', { width: item.thumbnail.width, height: item.thumbnail.height })}</p>
                                  </div>
                                )}
                                <div className="pt-1 border-t">
                                  <p className="text-xs font-medium text-blue-700">{t('wikiSearchDialog.sourceApiSearch')}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ) : !apiSearchLoading && (
                      <div className="p-8 text-center text-muted-foreground">
                        <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('wikiSearchDialog.noApiResults')}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* HTML 搜索结果 */}
                <div className="border rounded-lg">
                  <div className="p-3 bg-green-50 border-b flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4 text-green-600" />
                      <h4 className="font-medium text-green-800">{t('wikiSearchDialog.fullTextSearchResults')}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      {htmlSearchLoading && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-green-600"></div>
                      )}
                      <span className="text-sm text-green-600">
                        {htmlSearchLoading ? t('wikiSearchDialog.searching') : t('wikiSearchDialog.resultsCount', { count: htmlSearchResults.length })}
                      </span>
                    </div>
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {htmlSearchResults.length > 0 ? (
                      <div className="space-y-2 p-3">
                        {htmlSearchResults.map((item) => (
                          <Tooltip key={`html-${item.id}`}>
                            <TooltipTrigger asChild>
                              <div
                                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-green-50/50 cursor-pointer transition-colors"
                                onClick={() => handleSearchItemSelect(item)}
                              >
                                {item.thumbnail && (
                                  <img
                                    src={item.thumbnail.url.startsWith('//') ? `https:${item.thumbnail.url}` : item.thumbnail.url}
                                    alt={item.title}
                                    className="w-12 h-12 rounded object-cover flex-shrink-0"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                )}
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm truncate">{item.title}</h5>
                                  {item.description && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {item.description}
                                    </p>
                                  )}
                                  {item.excerpt && (
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                      {item.excerpt}
                                    </p>
                                  )}
                                  <div className="flex items-center justify-between mt-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        window.open(`https://ja.wikipedia.org/wiki/${encodeURIComponent(item.key)}`, '_blank');
                                      }}
                                      className="h-6 px-2 text-xs"
                                    >
                                      <ExternalLink className="h-3 w-3 mr-1" />
                                      {t('wikiSearchDialog.wikiPage')}
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-md p-3">
                              <div className="space-y-2">
                                <h6 className="font-semibold text-sm">{item.title}</h6>
                                {item.description && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.contentSummary')}</p>
                                    <p className="text-xs">{item.description}</p>
                                  </div>
                                )}
                                {item.excerpt && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.pageInfo')}</p>
                                    <p className="text-xs">{item.excerpt}</p>
                                  </div>
                                )}
                                <div>
                                  <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.wikipediaPage')}</p>
                                  <p className="text-xs font-mono text-green-600 break-all">{item.key}</p>
                                </div>
                                {item.thumbnail && (
                                  <div>
                                    <p className="text-xs font-medium text-muted-foreground mb-1">{t('wikiSearchDialog.thumbnail')}</p>
                                    <p className="text-xs">{t('wikiSearchDialog.thumbnailSize', { width: item.thumbnail.width, height: item.thumbnail.height })}</p>
                                  </div>
                                )}
                                <div className="pt-1 border-t">
                                  <p className="text-xs font-medium text-green-700">{t('wikiSearchDialog.sourceHtmlSearch')}</p>
                                </div>
                              </div>
                            </TooltipContent>
                          </Tooltip>
                        ))}
                      </div>
                    ) : !htmlSearchLoading && (
                      <div className="p-8 text-center text-muted-foreground">
                        <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p>{t('wikiSearchDialog.noHtmlResults')}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* 无搜索结果提示 */}
            {!apiSearchLoading && !htmlSearchLoading && apiSearchResults.length === 0 && htmlSearchResults.length === 0 && searchKeyword && (
              <div className="text-center py-8 text-muted-foreground">
                {t('wikiSearchDialog.noSearchResults')}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWikiSearchDialogOpen(false)}>
              {t('common.close')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </TooltipProvider>
  );
}
