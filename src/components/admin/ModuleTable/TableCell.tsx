'use client';

import { useTranslations } from 'next-intl';
import { TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Globe, Search } from 'lucide-react';
import { SOURCE_LANGUAGE } from '../../../../scraper-config/config';
import { EditingCellComponent } from './EditingCell';
import type { EditingCell } from './types';
import type { TranslationValue } from '@/lib/types';

interface TableCellProps {
  itemKey: string;
  lang: string;
  translation: TranslationValue | string | undefined;
  sourceValue: string;
  editingCell: EditingCell | null;
  onCellEdit: (key: string, lang: string, currentValue: string, originalValue: string, isTranslated: boolean) => void;
  onEditingCellChange: (editingCell: EditingCell) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onResetEdit: () => void;
  onToggleTranslated: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onWikiLookup: (key: string, japaneseText: string) => void;
  onOpenWikiSearch: (key: string, japaneseText?: string) => void;
  isLoading: boolean;
}

export function TranslationTableCell({
  itemKey,
  lang,
  translation,
  sourceValue,
  editingCell,
  onCellEdit,
  onEditingCellChange,
  onSaveEdit,
  onCancelEdit,
  onResetEdit,
  onToggleTranslated,
  onKeyDown,
  onWikiLookup,
  onOpenWikiSearch,
  isLoading,
}: TableCellProps) {
  const t = useTranslations('modules');

  const getTranslationValue = (translation: TranslationValue | string): string => {
    return typeof translation === 'string' ? translation : translation.value;
  };

  const isTranslated = (translation: TranslationValue | string): boolean => {
    return typeof translation === 'string' || translation.translated;
  };

  const value = translation ? getTranslationValue(translation) : '';
  const translated = translation ? isTranslated(translation) : false;
  const isEditing = editingCell?.key === itemKey && editingCell?.lang === lang;

  return (
    <TableCell className="relative">
      {isEditing ? (
        <EditingCellComponent
          editingCell={editingCell}
          onValueChange={(newValue) => onEditingCellChange({ ...editingCell, value: newValue })}
          onSave={onSaveEdit}
          onCancel={onCancelEdit}
          onReset={onResetEdit}
          onToggleTranslated={onToggleTranslated}
          onKeyDown={onKeyDown}
          isLoading={isLoading}
          sourceValue={sourceValue}
        />
      ) : (
        <div>
          <div
            className={`cursor-pointer p-2 rounded hover:bg-muted/50 ${
              lang !== SOURCE_LANGUAGE ? 'hover:bg-blue-50' : ''
            }`}
            onClick={() => onCellEdit(itemKey, lang, value, sourceValue, translated)}
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
                        onWikiLookup(itemKey, value);
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
                        onOpenWikiSearch(itemKey, value);
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
}
