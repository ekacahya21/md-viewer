export type ThemeMode = 'paper' | 'charcoal' | 'sepia';

export type ViewMode = 'reader' | 'split' | 'editor';

export type TypographyFont = 'sans' | 'serif';

export type Language = 'en' | 'id';

export interface TocHeading {
  id: string;
  text: string;
  depth: number;
}

export interface SharedLinkInfo {
  id: string;
  shortUrl: string;
  editToken: string;
  createdAt?: number;
  updatedAt?: number;
  expiresAt?: number | null;
  isProtected?: boolean;
  isBurnAfterRead?: boolean;
  isBurned?: boolean;
}

export interface DocumentDraft {
  id: string;
  title: string;
  content: string;
  updatedAt: number;
  wordCount: number;
  sharedLink?: SharedLinkInfo;
}

export interface ReadingStats {
  words: number;
  characters: number;
  readingTimeMinutes: number;
}

export interface SharedDocMeta {
  id: string;
  views: number;
  createdAt: number;
  updatedAt?: number;
  expiresAt: number | null;
  isProtected?: boolean;
  isBurnAfterRead?: boolean;
  isBurned?: boolean;
}

export interface SummaryData {
  tldr: string;
  takeaways: string[];
}
