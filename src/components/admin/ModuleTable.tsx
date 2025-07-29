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
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Search, Filter, Save, X, RotateCcw, Languages, Settings, Globe } from 'lucide-react';
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
  const [searchResults, setSearchResults] = useState<{
    id: number;
    key: string;
    title: string;
    excerpt: string;
    description: string | null;
    thumbnail: { url: string; width: number; height: number; } | null;
  }[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
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
      toast.error('请输入搜索关键词');
      return;
    }

    setSearchLoading(true);
    setSearchResults([]);
    
    try {
      const proxyConfig = settings.enableWikipediaProxy ? {
        enableProxy: true,
        proxyUrl: settings.wikipediaProxyUrl
      } : {
        enableProxy: false,
        proxyUrl: ''
      };
      
      console.log('[Frontend] 发送搜索请求:', { 
        keyword: searchKeyword.trim(),
        proxyConfig,
        action: 'search'
      });
      
      const response = await fetch('/api/v1/wikipedia', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          text: searchKeyword.trim(),
          proxyConfig,
          action: 'search'
        }),
      });
      
      console.log('[Frontend] 响应状态:', response.status, response.statusText);
      console.log('[Frontend] 响应头:', Object.fromEntries(response.headers.entries()));
      
      const result = await response.json();
      console.log('[Frontend] 解析后的结果:', result);
      
      if (!response.ok) {
        throw new Error(result.error || '搜索失败');
      }
      
      if (!result.success) {
        throw new Error(result.error || '搜索失败');
      }
      
      setSearchResults(result.data);
      toast.success(`找到 ${result.data.length} 个搜索结果`);
      
    } catch (error) {
      console.error('维基百科搜索失败:', error);
      toast.error('搜索失败: ' + (error instanceof Error ? error.message : '未知错误'));
    } finally {
      setSearchLoading(false);
    }
  };

  const handleSearchItemSelect = async (selectedItem: typeof searchResults[0]) => {
    if (!currentSearchContext) return;
    
    // 关闭搜索对话框
    setWikiSearchDialogOpen(false);
    
    // 使用选中的key进行维基百科查询
    const wikiUrl = `https://ja.wikipedia.org/wiki/${selectedItem.key}`;
    
    // 设置查询状态并打开结果对话框
    setCurrentWikiLookup({
      key: currentSearchContext.key,
      text: selectedItem.title,
      loading: true,
      progress: `正在查询选中页面: ${selectedItem.title}...`,
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
        throw new Error(result.error || '查询失败');
      }
      
      if (!result.success) {
        throw new Error(result.error || '查询失败');
      }
      
      const { data } = result;
      
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: '查询完成！',
        results: data
      } : null);
      
      const foundCount = [data.english, data.chinese].filter(Boolean).length;
      toast.success(`维基百科查询完成！找到 ${foundCount} 个翻译`);
      
    } catch (error) {
      console.error('维基百科查询失败:', error);
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: '查询失败: ' + (error instanceof Error ? error.message : '未知错误'),
        results: null
      } : null);
      toast.error('维基百科查询失败: ' + (error instanceof Error ? error.message : '未知错误'));
    }
  };

  const handleOpenWikiSearch = (key: string, japaneseText?: string) => {
    setCurrentSearchContext({ key });
    setSearchKeyword(japaneseText || '');
    setSearchResults([]);
    setWikiSearchDialogOpen(true);
    
    // 如果提供了日文文本，自动触发搜索
    if (japaneseText && japaneseText.trim()) {
      setTimeout(() => {
        handleWikiSearch();
      }, 100);
    }
  };

  const handleWikiLookup = async (key: string, japaneseText: string) => {
    if (!japaneseText.trim()) {
      toast.error('日文内容为空');
      return;
    }

    // 设置初始状态并打开对话框
    setCurrentWikiLookup({
      key,
      text: japaneseText,
      loading: true,
      progress: '正在查询日文维基百科...',
      results: null
    });
    setWikiDialogOpen(true);

    try {
      // 更新进度
      setCurrentWikiLookup(prev => prev ? { ...prev, progress: '正在发送查询请求...' } : null);
      
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
        setSearchResults(result.searchResults);
        setCurrentSearchContext({ key });
        setWikiSearchDialogOpen(true);
        
        toast.info(`直接查询失败，找到 ${result.searchResults.length} 个相关搜索结果，请选择合适的条目`);
        return;
      }
      
      if (!response.ok) {
        throw new Error(result.error || '查询失败');
      }
      
      if (!result.success) {
        throw new Error(result.error || '查询失败');
      }
      
      const { data } = result;
      
      // 更新进度显示找到的内容
      setCurrentWikiLookup(prev => prev ? { 
        ...prev, 
        progress: `查询完成！找到日文: ${data.japanese}${data.english ? ', 英文: ' + data.english : ''}${data.chinese ? ', 中文: ' + data.chinese : ''}` 
      } : null);
      
      // 保存结果
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: '查询完成！',
        results: data
      } : null);
      
      const foundCount = [data.english, data.chinese].filter(Boolean).length;
      toast.success(`维基百科查询完成！找到 ${foundCount} 个翻译`);
      
    } catch (error) {
      console.error('维基百科查询失败:', error);
      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: '查询失败: ' + (error instanceof Error ? error.message : '未知错误'),
        results: null
      } : null);
      toast.error('维基百科查询失败: ' + (error instanceof Error ? error.message : '未知错误'));
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

      toast.success(`${lang} 翻译已更新`);
    } catch (error) {
      toast.error(`更新 ${lang} 翻译失败: ${error instanceof Error ? error.message : '未知错误'}`);
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
      toast.success('所有翻译已更新完成');
      setWikiDialogOpen(false);
    } catch (error) {
      toast.error('批量更新失败，请检查单个更新结果');
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
                                      尝试通过 wiki 获取翻译
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
                                      通过关键词查找 Wiki
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
            <DialogTitle>维基百科翻译查询</DialogTitle>
            <DialogDescription>
              正在为 "{currentWikiLookup?.text}" 查询维基百科翻译
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
                <h4 className="font-medium">查询结果：</h4>
                
                {/* 日文原文 */}
                <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                  <div>
                    <span className="text-sm font-medium text-blue-800">日文：</span>
                    <span className="ml-2">{currentWikiLookup.results.japanese}</span>
                  </div>
                </div>

                {/* 英文翻译 */}
                {currentWikiLookup.results.english && (
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-green-800">英文：</span>
                      <span className="ml-2">{currentWikiLookup.results.english}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('en', currentWikiLookup.results!.english)}
                      disabled={updateMutation.isPending}
                    >
                      更新英文
                    </Button>
                  </div>
                )}

                {/* 简体中文翻译 */}
                {currentWikiLookup.results.chinese && (
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-yellow-800">简中：</span>
                      <span className="ml-2">{currentWikiLookup.results.chinese}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('zh-CN', currentWikiLookup.results!.chinese)}
                      disabled={updateMutation.isPending}
                    >
                      更新简中
                    </Button>
                  </div>
                )}

                {/* 繁体中文翻译 */}
                {currentWikiLookup.results.traditionalChinese && (
                  <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                    <div>
                      <span className="text-sm font-medium text-purple-800">繁中：</span>
                      <span className="ml-2">{currentWikiLookup.results.traditionalChinese}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleUpdateTranslation('zh-TW', currentWikiLookup.results!.traditionalChinese)}
                      disabled={updateMutation.isPending}
                    >
                      更新繁中
                    </Button>
                  </div>
                )}

                {/* 没有找到翻译的提示 */}
                {!currentWikiLookup.results.english && !currentWikiLookup.results.chinese && !currentWikiLookup.results.traditionalChinese && !currentWikiLookup.loading && (
                  <div className="text-center py-4 text-muted-foreground">
                    未找到相关翻译，可能该条目在维基百科中没有对应的多语言版本。
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWikiDialogOpen(false)}>
              关闭
            </Button>
            {currentWikiLookup?.results && (
              currentWikiLookup.results.english || currentWikiLookup.results.chinese || currentWikiLookup.results.traditionalChinese
            ) && (
              <Button 
                onClick={handleUpdateAllTranslations}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? '更新中...' : '更新全部翻译'}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 维基百科搜索对话框 */}
      <Dialog open={wikiSearchDialogOpen} onOpenChange={setWikiSearchDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>通过搜索关键词查找维基百科</DialogTitle>
            <DialogDescription>
              输入搜索关键词来查找相关的维基百科页面
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4">
            {/* 搜索输入框 */}
            <div className="flex items-center gap-2">
              <Input
                placeholder="请输入搜索关键词（日文）"
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
                disabled={searchLoading || !searchKeyword.trim()}
              >
                {searchLoading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Search className="h-4 w-4 mr-2" />
                )}
                搜索
              </Button>
            </div>

            {/* 搜索结果列表 */}
            {searchResults.length > 0 && (
              <div className="space-y-3 max-h-96 overflow-y-auto border rounded-lg p-4">
                <h4 className="font-medium">搜索结果 ({searchResults.length})：</h4>
                {searchResults.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
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
                      <p className="text-xs text-blue-600 mt-1">点击选择此条目</p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 无搜索结果提示 */}
            {!searchLoading && searchResults.length === 0 && searchKeyword && (
              <div className="text-center py-8 text-muted-foreground">
                未找到相关搜索结果，请尝试其他关键词
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setWikiSearchDialogOpen(false)}>
              关闭
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
