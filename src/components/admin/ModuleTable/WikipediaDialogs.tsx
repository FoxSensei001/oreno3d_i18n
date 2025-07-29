'use client';

import { useTranslations } from 'next-intl';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Search, Globe, ExternalLink } from 'lucide-react';
import { TARGET_LANGUAGES } from '../../../../scraper-config/config';
import type { WikiSearchResult, WikiLookupResult } from './types';

interface WikipediaDialogsProps {
  // Wiki lookup dialog
  wikiDialogOpen: boolean;
  setWikiDialogOpen: (open: boolean) => void;
  currentWikiLookup: WikiLookupResult | null;
  onUpdateTranslation: (lang: string, value: string) => Promise<void>;
  onUpdateAllTranslations: () => Promise<void>;
  isUpdating: boolean;

  // Wiki search dialog
  wikiSearchDialogOpen: boolean;
  setWikiSearchDialogOpen: (open: boolean) => void;
  searchKeyword: string;
  setSearchKeyword: (keyword: string) => void;
  onWikiSearch: () => void;
  apiSearchResults: WikiSearchResult[];
  htmlSearchResults: WikiSearchResult[];
  apiSearchLoading: boolean;
  htmlSearchLoading: boolean;
  onSearchItemSelect: (item: WikiSearchResult) => void;
}

export function WikipediaDialogs({
  wikiDialogOpen,
  setWikiDialogOpen,
  currentWikiLookup,
  onUpdateTranslation,
  onUpdateAllTranslations,
  isUpdating,
  wikiSearchDialogOpen,
  setWikiSearchDialogOpen,
  searchKeyword,
  setSearchKeyword,
  onWikiSearch,
  apiSearchResults,
  htmlSearchResults,
  apiSearchLoading,
  htmlSearchLoading,
  onSearchItemSelect,
}: WikipediaDialogsProps) {
  const t = useTranslations('modules');

  return (
    <>
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
                      onClick={() => onUpdateTranslation('en', currentWikiLookup.results!.english)}
                      disabled={isUpdating}
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
                      onClick={() => onUpdateTranslation('zh-CN', currentWikiLookup.results!.chinese)}
                      disabled={isUpdating}
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
                      onClick={() => onUpdateTranslation('zh-TW', currentWikiLookup.results!.traditionalChinese)}
                      disabled={isUpdating}
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
                onClick={onUpdateAllTranslations}
                disabled={isUpdating}
              >
                {isUpdating ? t('wikiDialog.updating') : t('wikiDialog.updateAllTranslations')}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 维基百科搜索对话框 */}
      <Dialog open={wikiSearchDialogOpen} onOpenChange={setWikiSearchDialogOpen}>
        <DialogContent className="max-w-[90vw] w-full max-h-[90vh]">
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
                    onWikiSearch();
                  }
                }}
                className="flex-1"
              />
              <Button
                onClick={onWikiSearch}
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
                <SearchResultsSection
                  title={t('wikiSearchDialog.apiSearchResults')}
                  results={apiSearchResults}
                  loading={apiSearchLoading}
                  onItemSelect={onSearchItemSelect}
                  emptyMessage={t('wikiSearchDialog.noApiResults')}
                  bgColor="bg-blue-50"
                  textColor="text-blue-600"
                  iconColor="text-blue-600"
                  icon={<Search className="h-4 w-4 text-blue-600" />}
                />

                {/* HTML 搜索结果 */}
                <SearchResultsSection
                  title={t('wikiSearchDialog.fullTextSearchResults')}
                  results={htmlSearchResults}
                  loading={htmlSearchLoading}
                  onItemSelect={onSearchItemSelect}
                  emptyMessage={t('wikiSearchDialog.noHtmlResults')}
                  bgColor="bg-green-50"
                  textColor="text-green-600"
                  iconColor="text-green-600"
                  icon={<Globe className="h-4 w-4 text-green-600" />}
                />
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
    </>
  );
}

interface SearchResultsSectionProps {
  title: string;
  results: WikiSearchResult[];
  loading: boolean;
  onItemSelect: (item: WikiSearchResult) => void;
  emptyMessage: string;
  bgColor: string;
  textColor: string;
  iconColor: string;
  icon: React.ReactNode;
}

function SearchResultsSection({
  title,
  results,
  loading,
  onItemSelect,
  emptyMessage,
  bgColor,
  textColor,
  icon,
}: SearchResultsSectionProps) {
  const t = useTranslations('modules');

  return (
    <div className="border rounded-lg">
      <div className={`p-3 ${bgColor} border-b flex items-center justify-between`}>
        <div className="flex items-center gap-2">
          {icon}
          <h4 className={`font-medium ${textColor.replace('text-', 'text-').replace('-600', '-800')}`}>{title}</h4>
        </div>
        <div className="flex items-center gap-2">
          {loading && (
            <div className={`animate-spin rounded-full h-4 w-4 border-b-2 ${textColor.replace('text-', 'border-')}`}></div>
          )}
          <span className={`text-sm ${textColor}`}>
            {loading ? t('wikiSearchDialog.searching') : t('wikiSearchDialog.resultsCount', { count: results.length })}
          </span>
        </div>
      </div>
      <div className="max-h-96 overflow-y-auto">
        {results.length > 0 ? (
          <div className="space-y-2 p-3">
            {results.map((item) => (
              <SearchResultItem
                key={`${item.id}-${item.key}`}
                item={item}
                onSelect={() => onItemSelect(item)}
              />
            ))}
          </div>
        ) : !loading && (
          <div className="p-8 text-center text-muted-foreground">
            <Search className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>{emptyMessage}</p>
          </div>
        )}
      </div>
    </div>
  );
}

interface SearchResultItemProps {
  item: WikiSearchResult;
  onSelect: () => void;
}

function SearchResultItem({ item, onSelect }: SearchResultItemProps) {
  const t = useTranslations('modules');

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <div
          className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
          onClick={onSelect}
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
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
