'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
  CheckCircle, 
  AlertCircle, 
  Edit3, 
  Save, 
  X, 
  RotateCcw, 
  Languages,
  Copy
} from 'lucide-react';
import type { EditingCell } from './types';

interface TranslationDetailCardProps {
  language: string;
  value: string;
  isTranslated: boolean;
  sourceValue: string;
  itemKey: string;
  editingCell: EditingCell | null;
  onCellEdit: (key: string, lang: string, currentValue: string, originalValue: string, isTranslated: boolean) => void;
  onEditingCellChange: (editingCell: EditingCell) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onResetEdit: () => void;
  onToggleTranslated: () => void;
  isLoading: boolean;
}

export function TranslationDetailCard({
  language,
  value,
  isTranslated,
  sourceValue,
  itemKey,
  editingCell,
  onCellEdit,
  onEditingCellChange,
  onSaveEdit,
  onCancelEdit,
  onResetEdit,
  onToggleTranslated,
  isLoading,
}: TranslationDetailCardProps) {
  const t = useTranslations('modules');
  
  const isEditing = editingCell?.key === itemKey && editingCell?.lang === language;
  const isEmpty = !value || value.trim() === '';
  
  const handleCopy = () => {
    navigator.clipboard.writeText(value);
  };

  const handleEdit = () => {
    onCellEdit(itemKey, language, value, sourceValue, isTranslated);
  };

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

  return (
    <Card className={`transition-all duration-200 h-full flex flex-col hover:shadow-md ${
      isEditing
        ? 'ring-2 ring-blue-500 shadow-lg scale-[1.02] z-10'
        : isEmpty
          ? 'border-orange-200 bg-orange-50/30 hover:border-orange-300'
          : isTranslated
            ? 'border-green-200 bg-green-50/30 hover:border-green-300'
            : 'border-gray-200 hover:border-gray-300'
    }`}>
      <CardContent className="p-3 flex-1 flex flex-col">
        <div className="space-y-3 flex-1 flex flex-col">
          {/* 语言标题栏 */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <h4 className="font-medium text-sm truncate">
                {getLanguageDisplayName(language)}
              </h4>
              <Badge variant="outline" className="text-xs shrink-0">
                {language}
              </Badge>
              {isTranslated ? (
                <CheckCircle className="h-4 w-4 text-green-600 shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-orange-500 shrink-0" />
              )}
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {!isEditing && value && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCopy}
                  className="h-6 w-6 p-0"
                  title={t('detailView.copy')}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              )}
              {!isEditing && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleEdit}
                  className="h-6 w-6 p-0"
                  title={t('detailView.edit')}
                >
                  <Edit3 className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* 翻译内容 */}
          {isEditing ? (
            <div className="space-y-3 flex-1 flex flex-col">
              <Textarea
                value={editingCell.value}
                onChange={(e) => onEditingCellChange({ ...editingCell, value: e.target.value })}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                    e.preventDefault();
                    onSaveEdit();
                  } else if (e.key === 'Escape') {
                    e.preventDefault();
                    onCancelEdit();
                  }
                }}
                placeholder={t('detailView.enterTranslation')}
                className="min-h-[100px] flex-1 resize-none"
                autoFocus
              />
              
              {/* 编辑操作按钮 */}
              <div className="space-y-2">
                <div className="flex items-center gap-1 flex-wrap">
                  <Button
                    size="sm"
                    onClick={onSaveEdit}
                    disabled={isLoading}
                    className="h-7 text-xs"
                  >
                    <Save className="h-3 w-3 mr-1" />
                    {t('detailView.save')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onResetEdit}
                    disabled={isLoading}
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    {t('detailView.reset')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={onCancelEdit}
                    className="h-7 text-xs"
                  >
                    <X className="h-3 w-3 mr-1" />
                    {t('detailView.cancel')}
                  </Button>
                </div>

                <Button
                  size="sm"
                  variant={editingCell.isTranslated ? 'default' : 'secondary'}
                  onClick={onToggleTranslated}
                  disabled={isLoading}
                  className="h-7 text-xs w-full"
                >
                  <Languages className="h-3 w-3 mr-1" />
                  {editingCell.isTranslated ? t('translated') : t('untranslated')}
                </Button>
              </div>
              
              {/* 源文本参考 */}
              {sourceValue && (
                <div className="p-2 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-xs text-blue-700 mb-1 font-medium">
                    {t('detailView.sourceReference')}:
                  </p>
                  <p className="text-xs text-blue-900 break-all leading-relaxed">
                    {sourceValue}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-2 flex-1 flex flex-col">
              {isEmpty ? (
                <div className="p-4 border-2 border-dashed border-orange-300 rounded-lg text-center flex-1 flex flex-col justify-center min-h-[100px]">
                  <AlertCircle className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                  <p className="text-sm text-orange-700 font-medium">
                    {t('detailView.noTranslation')}
                  </p>
                  <p className="text-xs text-orange-600 mt-1">
                    {t('detailView.clickToAdd')}
                  </p>
                </div>
              ) : (
                <div
                  className="p-3 bg-background border rounded-md cursor-pointer hover:bg-muted/50 transition-colors flex-1 flex items-start min-h-[100px]"
                  onClick={handleEdit}
                >
                  <p className="text-sm break-all whitespace-pre-wrap leading-relaxed">
                    {value}
                  </p>
                </div>
              )}

              {/* 状态指示 */}
              <div className="flex items-center justify-between text-xs mt-auto">
                <Badge
                  variant={isTranslated ? 'default' : 'secondary'}
                  className="text-xs"
                >
                  {isTranslated ? (
                    <>
                      <CheckCircle className="h-3 w-3 mr-1" />
                      {t('translated')}
                    </>
                  ) : (
                    <>
                      <AlertCircle className="h-3 w-3 mr-1" />
                      {t('untranslated')}
                    </>
                  )}
                </Badge>

                {value && (
                  <span className="text-muted-foreground">
                    {value.length} {t('detailView.characters')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
