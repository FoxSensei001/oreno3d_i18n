import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { toast } from 'sonner';
import { useSettings } from '@/hooks/use-settings';
import { useUpdateTranslation } from '@/hooks/use-modules';
import type { WikiSearchResult, WikiLookupResult, SearchContext } from './types';

export function useWikipedia(moduleName: string) {
  const t = useTranslations('modules');
  const { settings } = useSettings();
  const updateMutation = useUpdateTranslation();

  const [wikiDialogOpen, setWikiDialogOpen] = useState(false);
  const [wikiSearchDialogOpen, setWikiSearchDialogOpen] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [apiSearchResults, setApiSearchResults] = useState<WikiSearchResult[]>([]);
  const [htmlSearchResults, setHtmlSearchResults] = useState<WikiSearchResult[]>([]);
  const [apiSearchLoading, setApiSearchLoading] = useState(false);
  const [htmlSearchLoading, setHtmlSearchLoading] = useState(false);
  const [currentSearchContext, setCurrentSearchContext] = useState<SearchContext | null>(null);
  const [currentWikiLookup, setCurrentWikiLookup] = useState<WikiLookupResult | null>(null);

  const handleWikiSearchWithKeyword = async (keyword: string) => {
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
    
    // API搜索
    const apiSearchPromise = fetch('/api/v1/wikipedia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: keyword,
        proxyConfig,
        action: 'search',
        searchMethod: 'api'
      }),
    }).then(async (response) => {
      const result = await response.json();
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

    // HTML搜索
    const htmlSearchPromise = fetch('/api/v1/wikipedia', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        text: keyword,
        proxyConfig,
        action: 'search',
        searchMethod: 'html'
      }),
    }).then(async (response) => {
      const result = await response.json();
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

    await Promise.allSettled([apiSearchPromise, htmlSearchPromise]);
  };

  const handleWikiSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error(t('wikiSearch.enterKeyword'));
      return;
    }
    await handleWikiSearchWithKeyword(searchKeyword.trim());
  };

  const handleOpenWikiSearch = (key: string, japaneseText?: string) => {
    setCurrentSearchContext({ key });
    setSearchKeyword(japaneseText || '');
    setApiSearchResults([]);
    setHtmlSearchResults([]);
    setWikiSearchDialogOpen(true);
    
    if (japaneseText && japaneseText.trim()) {
      handleWikiSearchWithKeyword(japaneseText.trim());
    }
  };

  const handleSearchItemSelect = async (selectedItem: WikiSearchResult) => {
    if (!currentSearchContext) return;
    
    setWikiSearchDialogOpen(false);
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          text: selectedItem.key,
          proxyConfig,
          action: 'lookup'
        }),
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || t('wikiSearch.queryFailed'));
      }

      setCurrentWikiLookup(prev => prev ? {
        ...prev,
        loading: false,
        progress: t('wikiSearch.queryComplete'),
        results: result.data
      } : null);

      const foundCount = [result.data.english, result.data.chinese].filter(Boolean).length;
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

  return {
    // State
    wikiDialogOpen,
    setWikiDialogOpen,
    wikiSearchDialogOpen,
    setWikiSearchDialogOpen,
    searchKeyword,
    setSearchKeyword,
    apiSearchResults,
    setApiSearchResults,
    htmlSearchResults,
    apiSearchLoading,
    htmlSearchLoading,
    currentWikiLookup,
    setCurrentWikiLookup,
    setCurrentSearchContext,

    // Actions
    handleWikiSearch,
    handleOpenWikiSearch,
    handleSearchItemSelect,
    updateMutation,
  };
}
