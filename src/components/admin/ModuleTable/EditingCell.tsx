'use client';

import { useTranslations } from 'next-intl';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Save, X, RotateCcw, Languages } from 'lucide-react';
import type { EditingCell } from './types';

interface EditingCellProps {
  editingCell: EditingCell;
  onValueChange: (value: string) => void;
  onSave: () => void;
  onCancel: () => void;
  onReset: () => void;
  onToggleTranslated: () => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  isLoading: boolean;
  sourceValue: string;
}

export function EditingCellComponent({
  editingCell,
  onValueChange,
  onSave,
  onCancel,
  onReset,
  onToggleTranslated,
  onKeyDown,
  isLoading,
  sourceValue,
}: EditingCellProps) {
  const t = useTranslations('modules');

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Input
          value={editingCell.value}
          onChange={(e) => onValueChange(e.target.value)}
          onKeyDown={onKeyDown}
          className="flex-1"
          autoFocus
          placeholder={t('enterTranslation')}
        />
      </div>
      <div className="flex items-center gap-2">
        <Button
          size="sm"
          onClick={onSave}
          disabled={isLoading}
          title={t('saveHint')}
        >
          <Save className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onReset}
          disabled={isLoading}
          title={t('resetToJapanese')}
        >
          <RotateCcw className="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant={editingCell.isTranslated ? 'default' : 'secondary'}
          onClick={onToggleTranslated}
          disabled={isLoading}
          title={t('toggleStatus')}
        >
          <Languages className="h-4 w-4 mr-1" />
          {editingCell.isTranslated ? t('translatedShort') : t('untranslatedShort')}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onCancel}
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
  );
}
