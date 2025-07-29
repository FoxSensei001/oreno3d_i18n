'use client';

import { useTranslations } from 'next-intl';
import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import {
  ChevronLeft,
  ChevronRight,
  Copy,
  Globe,
  Search,
  Languages,
  CheckCircle,
  Hash,
  SkipForward,
  SkipBack
} from 'lucide-react';
import { TARGET_LANGUAGES, SOURCE_LANGUAGE } from '../../../../scraper-config/config';
import { TranslationDetailCard } from './TranslationDetailCard';
import type { DetailViewState, EditingCell } from './types';
import type { TranslationValue } from '@/lib/types';
import { toast } from 'sonner';

interface DetailViewProps {
  data: Array<{
    key: string;
    translations: Record<string, TranslationValue | string>;
  }>;
  detailState: DetailViewState;
  onDetailStateChange: (state: DetailViewState) => void;
  editingCell: EditingCell | null;
  onCellEdit: (key: string, lang: string, currentValue: string, originalValue: string, isTranslated: boolean) => void;
  onEditingCellChange: (editingCell: EditingCell) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onResetEdit: () => void;
  onToggleTranslated: () => void;
  onWikiLookup: (key: string, japaneseText: string) => void;
  onOpenWikiSearch: (key: string, japaneseText?: string) => void;
  isLoading: boolean;
}

export function DetailView({
  data,
  detailState,
  onDetailStateChange,
  editingCell,
  onCellEdit,
  onEditingCellChange,
  onSaveEdit,
  onCancelEdit,
  onResetEdit,
  onToggleTranslated,
  onWikiLookup,
  onOpenWikiSearch,
  isLoading,
}: DetailViewProps) {
  const t = useTranslations('modules');
  const [showAllLanguages, setShowAllLanguages] = useState(false);
  const [selectedLanguageForNavigation, setSelectedLanguageForNavigation] = useState<string>('');
  const [jumpToPageInput, setJumpToPageInput] = useState<string>('');

  const handlePrevious = useCallback(() => {
    if (detailState.currentIndex > 0) {
      onDetailStateChange({
        ...detailState,
        currentIndex: detailState.currentIndex - 1
      });
    }
  }, [detailState, onDetailStateChange]);

  const handleNext = useCallback(() => {
    if (detailState.currentIndex < detailState.totalItems - 1) {
      onDetailStateChange({
        ...detailState,
        currentIndex: detailState.currentIndex + 1
      });
    }
  }, [detailState, onDetailStateChange]);

  // 查找下一个未翻译的项目
  const findNextUntranslated = useCallback((direction: 'next' | 'prev', language: string) => {
    if (!language) return;

    const currentIndex = detailState.currentIndex;
    const totalItems = data.length;
    let searchIndex = currentIndex;

    for (let i = 0; i < totalItems - 1; i++) {
      if (direction === 'next') {
        searchIndex = (searchIndex + 1) % totalItems;
      } else {
        searchIndex = searchIndex === 0 ? totalItems - 1 : searchIndex - 1;
      }

      const item = data[searchIndex];
      const translation = item.translations[language];

      // 检查是否未翻译
      const isUntranslated = !translation ||
        (typeof translation === 'object' && !translation.translated) ||
        (typeof translation === 'string' && translation.trim() === '');

      if (isUntranslated) {
        onDetailStateChange({
          ...detailState,
          currentIndex: searchIndex
        });
        return;
      }
    }

    // 如果没有找到未翻译的项目，显示提示
    toast.info(t('detailView.noMoreUntranslated', { language: getLanguageDisplayName(language) }));
  }, [data, detailState, onDetailStateChange, t]);

  const handlePreviousUntranslated = useCallback(() => {
    findNextUntranslated('prev', selectedLanguageForNavigation);
  }, [findNextUntranslated, selectedLanguageForNavigation]);

  const handleNextUntranslated = useCallback(() => {
    findNextUntranslated('next', selectedLanguageForNavigation);
  }, [findNextUntranslated, selectedLanguageForNavigation]);

  // 页码跳转处理
  const handleJumpToPage = useCallback((pageNumber: number) => {
    const targetIndex = pageNumber - 1; // 转换为0基索引
    if (targetIndex >= 0 && targetIndex < detailState.totalItems) {
      onDetailStateChange({
        ...detailState,
        currentIndex: targetIndex
      });
      setJumpToPageInput(''); // 清空输入框
    } else {
      toast.error(t('detailView.invalidPageNumber', {
        min: 1,
        max: detailState.totalItems
      }));
    }
  }, [detailState, onDetailStateChange, t]);

  const handleJumpInputKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const pageNumber = parseInt(jumpToPageInput);
      if (!isNaN(pageNumber)) {
        handleJumpToPage(pageNumber);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      setJumpToPageInput('');
      (e.target as HTMLInputElement).blur();
    }
  }, [jumpToPageInput, handleJumpToPage]);

  const handleJumpInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // 只允许数字输入
    if (value === '' || /^\d+$/.test(value)) {
      setJumpToPageInput(value);
    }
  }, []);

  const getLanguageDisplayName = (lang: string) => {
    const languageNames: Record<string, string> = {
      'en': 'English',
      'zh-CN': '简体中文',
      'zh-TW': '繁體中文',
      'ja': '日本語',
      'ko': '한국어',
      'fr': 'Français',
      'de': 'Deutsch',
      'es': 'Español',
      'pt': 'Português',
      'ru': 'Русский',
      'it': 'Italiano',
      'ar': 'العربية',
      'hi': 'हिन्दी',
      'th': 'ไทย',
      'vi': 'Tiếng Việt',
    };
    return languageNames[lang] || lang;
  };

  // 键盘导航功能
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // 如果正在编辑，不处理导航键
      if (editingCell) return;

      // 如果焦点在输入框或文本区域，不处理导航键
      const activeElement = document.activeElement as HTMLElement;
      if (activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.contentEditable === 'true'
      )) {
        return;
      }

      switch (e.key) {
        case 'ArrowLeft':
          if (e.shiftKey && selectedLanguageForNavigation) {
            // Shift + ← : 上一项未翻译
            e.preventDefault();
            handlePreviousUntranslated();
          } else if (!e.shiftKey) {
            // ← : 上一项
            e.preventDefault();
            handlePrevious();
          }
          break;
        case 'ArrowRight':
          if (e.shiftKey && selectedLanguageForNavigation) {
            // Shift + → : 下一项未翻译
            e.preventDefault();
            handleNextUntranslated();
          } else if (!e.shiftKey) {
            // → : 下一项
            e.preventDefault();
            handleNext();
          }
          break;
        case 'l':
        case 'L':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + L : 聚焦到语言选择器
            e.preventDefault();
            const languageSelect = document.querySelector('[data-testid="language-selector"]') as HTMLElement;
            if (languageSelect) {
              languageSelect.focus();
            }
          }
          break;
        case 'g':
        case 'G':
          if (e.ctrlKey || e.metaKey) {
            // Ctrl/Cmd + G : 聚焦到页码跳转输入框
            e.preventDefault();
            const jumpInput = document.querySelector('[data-testid="jump-to-page-input"]') as HTMLInputElement;
            if (jumpInput) {
              jumpInput.focus();
              jumpInput.select();
            }
          }
          break;
        case 'Escape':
          if (editingCell) {
            e.preventDefault();
            onCancelEdit();
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [
    detailState.currentIndex,
    detailState.totalItems,
    editingCell,
    onCancelEdit,
    handlePrevious,
    handleNext,
    handlePreviousUntranslated,
    handleNextUntranslated,
    selectedLanguageForNavigation
  ]);

  const currentItem = data[detailState.currentIndex];
  if (!currentItem) return null;

  const getTranslationValue = (translation: TranslationValue | string): string => {
    return typeof translation === 'string' ? translation : translation.value;
  };

  const isTranslated = (translation: TranslationValue | string): boolean => {
    return typeof translation === 'string' || translation.translated;
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentItem.key);
  };

  // 计算翻译进度
  const targetLanguages = TARGET_LANGUAGES.filter(lang => lang !== SOURCE_LANGUAGE);
  const translatedCount = targetLanguages.filter(lang => {
    const translation = currentItem.translations[lang];
    return translation && isTranslated(translation);
  }).length;
  const progressPercentage = (translatedCount / targetLanguages.length) * 100;

  // 获取源语言内容
  const sourceTranslation = currentItem.translations[SOURCE_LANGUAGE];
  const sourceValue = sourceTranslation ? getTranslationValue(sourceTranslation) : '';

  // 语言优先级排序 - 常用语言优先显示
  const languagePriority = ['en', 'zh-CN', 'zh-TW', 'ja', 'ko', 'fr', 'de', 'es', 'pt', 'ru'];
  const sortedLanguages = [...TARGET_LANGUAGES].sort((a, b) => {
    const priorityA = languagePriority.indexOf(a);
    const priorityB = languagePriority.indexOf(b);
    if (priorityA === -1 && priorityB === -1) return a.localeCompare(b);
    if (priorityA === -1) return 1;
    if (priorityB === -1) return -1;
    return priorityA - priorityB;
  });

  // 显示的语言列表 - 宽屏下默认显示更多语言
  const displayLanguages = showAllLanguages
    ? sortedLanguages
    : sortedLanguages.slice(0, 6);

  return (
    <div className="space-y-6">
      {/* 导航栏 */}
      <div className="space-y-4">
        {/* 基本导航 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={detailState.currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              {t('detailView.previous')}
            </Button>

            {/* 页码跳转输入框 */}
            <div className="flex items-center gap-2 text-sm">
              <Input
                type="text"
                value={jumpToPageInput}
                onChange={handleJumpInputChange}
                onKeyDown={handleJumpInputKeyDown}
                placeholder={String(detailState.currentIndex + 1)}
                className="w-16 h-8 text-center text-sm"
                data-testid="jump-to-page-input"
              />
              <span className="text-muted-foreground">/</span>
              <span className="text-muted-foreground font-medium">{detailState.totalItems}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  const pageNumber = parseInt(jumpToPageInput);
                  if (!isNaN(pageNumber)) {
                    handleJumpToPage(pageNumber);
                  }
                }}
                disabled={!jumpToPageInput || isNaN(parseInt(jumpToPageInput))}
                className="h-8 px-2 text-xs"
              >
                {t('detailView.jumpTo')}
              </Button>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={detailState.currentIndex === detailState.totalItems - 1}
            >
              {t('detailView.next')}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={progressPercentage === 100 ? 'default' : 'secondary'}>
              <CheckCircle className="h-3 w-3 mr-1" />
              {translatedCount}/{targetLanguages.length} {t('detailView.completed')}
            </Badge>
          </div>
        </div>

        {/* 未翻译导航 */}
        <div className="flex items-center gap-4 p-3 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2">
            <Languages className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">{t('detailView.untranslatedNavigation')}:</span>
          </div>

          <Select value={selectedLanguageForNavigation} onValueChange={setSelectedLanguageForNavigation}>
            <SelectTrigger className="w-[180px] h-8" data-testid="language-selector">
              <SelectValue placeholder={t('detailView.selectLanguage')} />
            </SelectTrigger>
            <SelectContent>
              {sortedLanguages
                .filter(lang => lang !== SOURCE_LANGUAGE)
                .map((lang) => (
                  <SelectItem key={lang} value={lang}>
                    {getLanguageDisplayName(lang)} ({lang})
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePreviousUntranslated}
              disabled={!selectedLanguageForNavigation}
              className="h-8"
            >
              <SkipBack className="h-3 w-3 mr-1" />
              {t('detailView.previousUntranslated')}
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextUntranslated}
              disabled={!selectedLanguageForNavigation}
              className="h-8"
            >
              {t('detailView.nextUntranslated')}
              <SkipForward className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* 主卡片 */}
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-lg font-mono break-all">
                  {currentItem.key}
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopyKey}
                  className="h-6 w-6 p-0"
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
              
              {/* 翻译进度 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{t('detailView.translationProgress')}</span>
                  <span className="font-medium">{Math.round(progressPercentage)}%</span>
                </div>
                <Progress value={progressPercentage} className="h-2" />
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* 源语言 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Languages className="h-4 w-4 text-blue-600" />
              <h3 className="font-semibold text-blue-800">
                {t('detailView.sourceLanguage')} ({SOURCE_LANGUAGE})
              </h3>
              <Badge variant="outline" className="text-xs">
                {t('source')}
              </Badge>
            </div>
            
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <p className="text-blue-900 font-medium break-all flex-1">
                    {sourceValue || t('detailView.noSourceText')}
                  </p>
                  {sourceValue && (
                    <div className="flex gap-1 ml-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onWikiLookup(currentItem.key, sourceValue)}
                        className="h-7 text-xs"
                      >
                        <Globe className="h-3 w-3 mr-1" />
                        {t('wikiSearch.tryGetWikiTranslation')}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => onOpenWikiSearch(currentItem.key, sourceValue)}
                        className="h-7 text-xs"
                      >
                        <Search className="h-3 w-3 mr-1" />
                        {t('wikiSearch.searchWikiByKeyword')}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* 目标语言翻译 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold flex items-center gap-2">
                <Globe className="h-4 w-4 text-green-600" />
                {t('detailView.translations')}
              </h3>
              {sortedLanguages.length > 6 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllLanguages(!showAllLanguages)}
                >
                  {showAllLanguages ? t('detailView.showLess') : t('detailView.showAll')}
                </Button>
              )}
            </div>

            {/* 响应式网格布局 - 充分利用宽屏空间 */}
            <div className="grid gap-4 auto-rows-fr grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {/* 当编辑时，被编辑的卡片会突出显示 */}
              {displayLanguages
                .filter(lang => lang !== SOURCE_LANGUAGE)
                .map((lang) => {
                  const translation = currentItem.translations[lang];
                  const value = translation ? getTranslationValue(translation) : '';
                  const translated = translation ? isTranslated(translation) : false;

                  return (
                    <div key={lang} className="min-h-[200px]">
                      <TranslationDetailCard
                        language={lang}
                        value={value}
                        isTranslated={translated}
                        sourceValue={sourceValue}
                        itemKey={currentItem.key}
                        editingCell={editingCell}
                        onCellEdit={onCellEdit}
                        onEditingCellChange={onEditingCellChange}
                        onSaveEdit={onSaveEdit}
                        onCancelEdit={onCancelEdit}
                        onResetEdit={onResetEdit}
                        onToggleTranslated={onToggleTranslated}
                        isLoading={isLoading}
                      />
                    </div>
                  );
                })}
            </div>

            {!showAllLanguages && sortedLanguages.length > 6 && (
              <div className="text-center pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAllLanguages(true)}
                  className="min-w-[200px]"
                >
                  {t('detailView.showMoreLanguages', {
                    count: sortedLanguages.length - 6
                  })}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 快捷键提示 */}
      <Card className="bg-muted/30">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* 基本导航快捷键 */}
            <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">←</kbd>
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">→</kbd>
                <span>{t('detailView.navigate')}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Enter</kbd>
                <span>{t('detailView.saveInEdit')}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Shift</kbd>
                <span>+</span>
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Enter</kbd>
                <span>{t('detailView.newLine')}</span>
              </div>
              <div className="flex items-center gap-1">
                <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Esc</kbd>
                <span>{t('detailView.cancelEdit')}</span>
              </div>
            </div>

            {/* 未翻译导航快捷键 */}
            <div className="border-t pt-3">
              <div className="flex items-center gap-6 text-xs text-muted-foreground flex-wrap">
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Shift</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">←</kbd>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">→</kbd>
                  <span>{t('detailView.navigateUntranslated')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">L</kbd>
                  <span>{t('detailView.focusLanguageSelector')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">Ctrl</kbd>
                  <span>+</span>
                  <kbd className="px-1.5 py-0.5 bg-background border rounded text-xs">G</kbd>
                  <span>{t('detailView.jumpToPage')}</span>
                </div>
                {selectedLanguageForNavigation && (
                  <div className="flex items-center gap-1 text-blue-600">
                    <Languages className="h-3 w-3" />
                    <span>{t('detailView.currentLanguage')}: {getLanguageDisplayName(selectedLanguageForNavigation)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
