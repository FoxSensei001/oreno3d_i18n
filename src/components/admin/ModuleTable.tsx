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
import { Search, Filter, Save, X, RotateCcw, Languages, Settings } from 'lucide-react';
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
                  {lang}
                  {lang === SOURCE_LANGUAGE && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      {t('source')}
                    </Badge>
                  )}
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
    </div>
  );
}
