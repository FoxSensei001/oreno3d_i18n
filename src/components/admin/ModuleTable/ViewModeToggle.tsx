'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, FileText, LayoutGrid } from 'lucide-react';
import type { ViewMode } from './types';

interface ViewModeToggleProps {
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  totalItems: number;
  currentIndex?: number;
}

export function ViewModeToggle({
  viewMode,
  onViewModeChange,
  totalItems,
  currentIndex,
}: ViewModeToggleProps) {
  const t = useTranslations('modules');

  return (
    <div className="flex items-center gap-4">
      <div className="flex items-center gap-1 p-1 bg-muted rounded-lg">
        <Button
          variant={viewMode === 'table' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('table')}
          className="h-8 px-3"
        >
          <Table className="h-4 w-4 mr-1" />
          {t('viewMode.table')}
        </Button>
        <Button
          variant={viewMode === 'detail' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onViewModeChange('detail')}
          className="h-8 px-3"
        >
          <FileText className="h-4 w-4 mr-1" />
          {t('viewMode.detail')}
        </Button>
      </div>

      {viewMode === 'detail' && currentIndex !== undefined && (
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            <LayoutGrid className="h-3 w-3 mr-1" />
            {currentIndex + 1} / {totalItems}
          </Badge>
        </div>
      )}
    </div>
  );
}
