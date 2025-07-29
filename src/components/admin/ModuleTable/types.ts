export interface ModuleTableProps {
  moduleName: string;
  className?: string;
}

export interface EditingCell {
  key: string;
  lang: string;
  value: string;
  originalValue: string;
  isTranslated: boolean;
}

export interface WikiSearchResult {
  id: number;
  key: string;
  title: string;
  excerpt: string;
  description: string | null;
  thumbnail: { url: string; width: number; height: number; } | null;
}

export interface WikiLookupResult {
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
}

export interface SearchContext {
  key: string;
}

export interface TableFilters {
  searchTerm: string;
  filterLang: string;
  filterStatus: 'all' | 'translated' | 'untranslated';
}

export interface PaginationState {
  currentPage: number;
  pageSize: number;
}

export type ViewMode = 'table' | 'detail';

export interface DetailViewState {
  currentIndex: number;
  totalItems: number;
}

export interface UntranslatedNavigationState {
  selectedLanguage: string;
}
