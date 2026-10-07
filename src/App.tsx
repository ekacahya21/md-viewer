import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { Header } from './components/Header';
import { Editor } from './components/Editor';
import { Preview } from './components/Preview';
import { TableOfContents } from './components/TableOfContents';
import { UrlModal } from './components/UrlModal';
import { DraftsDrawer } from './components/DraftsDrawer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { ShareModal } from './components/ShareModal';
import { MobileDrawer } from './components/MobileDrawer';
import { CommandPalette } from './components/CommandPalette';
import { StatusBar } from './components/StatusBar';
import { parseMarkdown } from './utils/markdownParser';
import { DEFAULT_SAMPLE_MARKDOWN } from './utils/sampleDocument';
import { extractDocumentTitle } from './utils/titleExtractor';
import {
  exportStandaloneHtml,
  printToPdf,
  downloadMarkdown,
  copyText,
} from './utils/exportUtils';
import type { ViewMode, ThemeMode, TypographyFont, DocumentDraft, ReadingStats, SharedDocMeta, SharedLinkInfo, Language } from './types';
import { translations } from './i18n/translations';
import { AlertCircle, ArrowLeft, Eye, GripVertical, Compass, ChevronRight, X, ShieldAlert } from 'lucide-react';
import { useDocumentSummary } from './hooks/useDocumentSummary';
import { ConfirmReplaceModal } from './components/ConfirmReplaceModal';

const SummaryDrawer = React.lazy(() => import('./components/SummaryDrawer'));

const STORAGE_KEYS = {
  CONTENT: 'md_viewer_content',
  TITLE: 'md_viewer_title',
  THEME: 'md_viewer_theme',
  TYPOGRAPHY: 'md_viewer_typography',
  VIEW_MODE: 'md_viewer_mode',
  DRAFTS: 'md_viewer_drafts',
  CURRENT_ID: 'md_viewer_current_id',
  SPLIT_RATIO: 'md_viewer_split_ratio',
  VISITOR_ID: 'md_viewer_visitor_id',
  AUTHOR_TOKENS: 'md_viewer_author_tokens',
  SUMMARY_OPEN: 'md_viewer_summary_open',
  LANGUAGE: 'md_viewer_lang',
};

// Anonymous visitor ID helper for view counting deduplication
function getOrCreateVisitorId(): string {
  try {
    let vid = localStorage.getItem(STORAGE_KEYS.VISITOR_ID);
    if (!vid) {
      vid = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : 'v_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
      localStorage.setItem(STORAGE_KEYS.VISITOR_ID, vid);
    }
    return vid;
  } catch {
    return '';
  }
}

// Check synchronously if initial page load is a shared document route (/s/:id)
const isInitialSharedPath = typeof window !== 'undefined' && window.location.pathname.startsWith('/s/');

// Check synchronously if initial page load is an external query document (?doc=... or ?url=...)
const isInitialQueryDoc = typeof window !== 'undefined' && (
  Boolean(new URLSearchParams(window.location.search).get('doc')) ||
  Boolean(new URLSearchParams(window.location.search).get('url'))
);

// Helper to safely load root workspace content without leaking external audit reports
function getInitialWorkspaceContent(): string {
  if (isInitialSharedPath || isInitialQueryDoc) return '';
  try {
    const saved = localStorage.getItem(STORAGE_KEYS.CONTENT);
    const savedTitle = localStorage.getItem(STORAGE_KEYS.TITLE) || '';
    // If the saved content or title is the audit report (caused by previous auto-save leak), purge it!
    if (
      saved && (
        saved.includes('LAPORAN AUDIT KOMPREHENSIF UI/UX') ||
        saved.includes('FintechPro Expense Dashboard') ||
        savedTitle.includes('Laporan Audit') ||
        savedTitle.toLowerCase() === 'audit'
      )
    ) {
      console.info('Purging stale audit report from root workspace localStorage');
      localStorage.removeItem(STORAGE_KEYS.CONTENT);
      localStorage.removeItem(STORAGE_KEYS.TITLE);
      return DEFAULT_SAMPLE_MARKDOWN;
    }
    return saved || DEFAULT_SAMPLE_MARKDOWN;
  } catch {
    return DEFAULT_SAMPLE_MARKDOWN;
  }
}

function getInitialWorkspaceTitle(): string {
  if (isInitialSharedPath || isInitialQueryDoc) return 'Memuat dokumen...';
  try {
    const savedTitle = localStorage.getItem(STORAGE_KEYS.TITLE);
    if (savedTitle && (savedTitle.includes('Laporan Audit') || savedTitle.toLowerCase() === 'audit')) {
      return 'Welcome to MD Viewer';
    }
    return savedTitle || 'Welcome to MD Viewer';
  } catch {
    return 'Welcome to MD Viewer';
  }
}

export function App() {
  // Track whether current document is an external query document (must never overwrite root workspace)
  const [isExternalDoc, setIsExternalDoc] = useState<boolean>(isInitialQueryDoc);

  // Load initial states from localStorage (never leak private drafts when opening shared URL or external doc)
  const [content, setContent] = useState<string>(getInitialWorkspaceContent);

  const [title, setTitle] = useState<string>(getInitialWorkspaceTitle);

  const [theme, setTheme] = useState<ThemeMode>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.THEME) as ThemeMode;
    return saved === 'charcoal' || saved === 'sepia' || saved === 'paper' ? saved : 'paper';
  });

  const [typography, setTypography] = useState<TypographyFont>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TYPOGRAPHY) as TypographyFont;
    return saved === 'serif' || saved === 'sans' ? saved : 'sans';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-typography', typography);
    try {
      localStorage.setItem(STORAGE_KEYS.TYPOGRAPHY, typography);
    } catch {}
  }, [typography]);

  // User specifically requested: "hybrid, user bisa open editor view. tapi by default hanya view."
  // When opening a shared document or external doc, strictly lock to reader mode from frame 0
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (isInitialSharedPath || isInitialQueryDoc) return 'reader';
    const saved = localStorage.getItem(STORAGE_KEYS.VIEW_MODE) as ViewMode;
    return saved === 'split' || saved === 'editor' ? saved : 'reader';
  });

  const [currentDraftId, setCurrentDraftId] = useState<string>(() => {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_ID) || crypto.randomUUID();
  });

  const [drafts, setDrafts] = useState<DocumentDraft[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      if (!saved) return [];
      const list = JSON.parse(saved);
      if (!Array.isArray(list)) return [];
      // Clean out accidental audit report drafts that were saved to history
      const filtered = list.filter((d: DocumentDraft) =>
        !d.title?.includes('Laporan Audit') &&
        d.title?.toLowerCase() !== 'audit' &&
        !d.content?.includes('LAPORAN AUDIT KOMPREHENSIF UI/UX')
      );
      if (filtered.length !== list.length) {
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(filtered));
      }
      return filtered;
    } catch {
      return [];
    }
  });

  // Active shared link associated with current document draft
  const [currentSharedLink, setCurrentSharedLink] = useState<SharedLinkInfo | null>(() => {
    try {
      const savedDrafts = localStorage.getItem(STORAGE_KEYS.DRAFTS);
      const currentId = localStorage.getItem(STORAGE_KEYS.CURRENT_ID);
      if (savedDrafts && currentId) {
        const list = JSON.parse(savedDrafts);
        const found = list.find((d: DocumentDraft) => d.id === currentId);
        if (found?.sharedLink) return found.sharedLink;
      }
    } catch {}
    return null;
  });

  // AI features are strictly enabled only when viewing in Reader mode
  const isAiEnabled = viewMode === 'reader';

  const [isTocOpen, setIsTocOpen] = useState(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(() => {
    if (typeof window !== 'undefined' && viewMode === 'reader') {
      return window.innerWidth >= 1024;
    }
    return false;
  });

  // Automatically close summary drawer whenever leaving reader mode
  useEffect(() => {
    if (!isAiEnabled && isSummaryOpen) {
      setIsSummaryOpen(false);
    }
  }, [isAiEnabled, isSummaryOpen]);
  const [dismissedSignatures, setDismissedSignatures] = useState<Set<string>>(new Set());
  const [isUrlModalOpen, setIsUrlModalOpen] = useState(false);
  const [isDraftsDrawerOpen, setIsDraftsDrawerOpen] = useState(false);
  const [isShortcutsModalOpen, setIsShortcutsModalOpen] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isSaved, setIsSaved] = useState(true);
  const [isWindowDragging, setIsWindowDragging] = useState(false);
  const [pendingDroppedFile, setPendingDroppedFile] = useState<File | null>(null);
  const [isConfirmReplaceModalOpen, setIsConfirmReplaceModalOpen] = useState(false);
  const [importedFileName, setImportedFileName] = useState<string | null>(null);

  // Language state (default 'en' as requested)
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem(STORAGE_KEYS.LANGUAGE);
      if (saved === 'id' || saved === 'en') return saved;
    }
    return 'en';
  });

  const handleLanguageChange = useCallback((lang: Language) => {
    setLanguage(lang);
    try {
      localStorage.setItem(STORAGE_KEYS.LANGUAGE, lang);
      document.documentElement.lang = lang;
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = translations[language];

  // Background AI summarization hook (only active in Reader mode)
  const summaryState = useDocumentSummary(content, title, language, isAiEnabled);

  // Shared URL document state (synchronously initialize to true if path is /s/:id)
  const [isSharedView, setIsSharedView] = useState<boolean>(isInitialSharedPath);
  const [isLoadingShared, setIsLoadingShared] = useState<boolean>(isInitialSharedPath);
  const [sharedMeta, setSharedMeta] = useState<SharedDocMeta | null>(null);
  const [sharedError, setSharedError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);
  const mainContainerRef = useRef<HTMLElement>(null);

  // Split view ratio state (default 50%, clamped 20%-80%)
  const [splitRatio, setSplitRatio] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.SPLIT_RATIO);
      if (saved) {
        const val = parseFloat(saved);
        if (!isNaN(val) && val >= 20 && val <= 80) return val;
      }
    } catch {}
    return 50;
  });

  const [isDraggingSplitter, setIsDraggingSplitter] = useState(false);
  const lastSplitterClickRef = useRef<number>(0);

  const handleResetSplit = useCallback(() => {
    setSplitRatio(50);
    try {
      localStorage.setItem(STORAGE_KEYS.SPLIT_RATIO, '50');
    } catch {}
  }, []);

  // Splitter dragging handlers with reliable double-click detection
  const handleSplitterMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastSplitterClickRef.current < 400) {
      handleResetSplit();
      lastSplitterClickRef.current = 0;
      setIsDraggingSplitter(false);
      return;
    }
    lastSplitterClickRef.current = now;
    setIsDraggingSplitter(true);
  }, [handleResetSplit]);

  const handleSplitterTouchStart = useCallback(() => {
    const now = Date.now();
    if (now - lastSplitterClickRef.current < 400) {
      handleResetSplit();
      lastSplitterClickRef.current = 0;
      setIsDraggingSplitter(false);
      return;
    }
    lastSplitterClickRef.current = now;
    setIsDraggingSplitter(true);
  }, [handleResetSplit]);

  // Global pointer listeners during active dragging
  useEffect(() => {
    if (!isDraggingSplitter) return;

    const handlePointerMove = (clientX: number) => {
      if (!mainContainerRef.current) return;
      const rect = mainContainerRef.current.getBoundingClientRect();
      if (rect.width <= 0) return;
      const rawPercent = ((clientX - rect.left) / rect.width) * 100;
      const clamped = Math.min(80, Math.max(20, rawPercent));
      setSplitRatio(clamped);
    };

    const handleMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handlePointerMove(e.clientX);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        handlePointerMove(e.touches[0].clientX);
      }
    };

    const handlePointerUp = () => {
      setIsDraggingSplitter(false);
      setSplitRatio((current) => {
        try {
          localStorage.setItem(STORAGE_KEYS.SPLIT_RATIO, current.toFixed(2));
        } catch {}
        return current;
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handlePointerUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', handlePointerUp);
    window.addEventListener('touchcancel', handlePointerUp);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handlePointerUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handlePointerUp);
      window.removeEventListener('touchcancel', handlePointerUp);
    };
  }, [isDraggingSplitter]);

  // Global ⌘K / Ctrl+K and ⌘J / Ctrl+J keyboard shortcuts listener
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault();
        if (isAiEnabled) {
          setIsSummaryOpen((prev) => !prev);
        }
      }
      // ? opens keyboard shortcuts when not actively typing in an input or textarea
      if (e.key === '?' && !['input', 'textarea'].includes((document.activeElement?.tagName || '').toLowerCase())) {
        e.preventDefault();
        setIsShortcutsModalOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [isAiEnabled]);

  // Smart multi-tier document title autodetect (Frontmatter -> H1/Setext -> H2 -> First line -> Imported filename -> Untitled Document)
  useEffect(() => {
    if (isSharedView) return; // Immutable on shared view
    const detected = extractDocumentTitle(content, importedFileName || undefined);
    if (detected && detected !== title) {
      setTitle(detected);
    }
  }, [content, isSharedView, importedFileName, title]);

  // Sync browser tab <title>
  useEffect(() => {
    if (isSharedView) {
      document.title = title ? `${title} | MD Viewer` : 'MD Viewer';
    } else {
      const displayTitle = title && title !== 'Untitled Document'
        ? `${title} • MD Viewer`
        : 'MD Viewer | Minimalist Editorial Markdown Studio';
      document.title = displayTitle;
    }
  }, [title, isSharedView]);

  // Sync theme and language attributes on <html> element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.lang = language;
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  }, [theme, language]);

  // Save viewMode
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VIEW_MODE, viewMode);
  }, [viewMode]);

  // Check shared short URL (/s/:id) or query parameters (?doc=... or ?url=...)
  useEffect(() => {
    const pathname = window.location.pathname;

    // 1. Check Short URL path: /s/:id
    if (pathname.startsWith('/s/')) {
      const shortId = pathname.replace(/^\/s\//, '').trim();
      if (shortId) {
        setIsLoadingShared(true);
        const requestHeaders: Record<string, string> = {};
        const visitorId = getOrCreateVisitorId();
        if (visitorId) {
          requestHeaders['X-Visitor-Id'] = visitorId;
        }

        // Pass author edit token if client created or owns this document
        try {
          const authorTokens = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUTHOR_TOKENS) || '{}');
          if (authorTokens && authorTokens[shortId]) {
            requestHeaders['X-Edit-Token'] = authorTokens[shortId];
          } else {
            const savedDrafts = localStorage.getItem(STORAGE_KEYS.DRAFTS);
            if (savedDrafts) {
              const list = JSON.parse(savedDrafts);
              const found = list.find((d: DocumentDraft) => d.sharedLink?.id === shortId);
              if (found?.sharedLink?.editToken) {
                requestHeaders['X-Edit-Token'] = found.sharedLink.editToken;
              }
            }
          }
        } catch {}

        fetch(`/api/share/${shortId}`, { headers: requestHeaders })
          .then(async (res) => {
            if (!res.ok) {
              const err = await res.json().catch(() => ({}));
              throw new Error(err.error || (language === 'id' ? `HTTP ${res.status}: Dokumen tidak ditemukan.` : `HTTP ${res.status}: Document not found.`));
            }
            return res.json();
          })
          .then((data) => {
            setTitle(data.title || 'Shared Document');
            setContent(data.content);
            setIsSharedView(true);
            setSharedMeta({
              id: data.id,
              views: data.views,
              createdAt: data.createdAt,
              updatedAt: data.updatedAt,
              expiresAt: data.expiresAt,
            });
            setViewMode('reader');
          })
          .catch((err) => {
            setSharedError(err.message || (language === 'id' ? 'Link dokumen tidak ditemukan atau telah kedaluwarsa.' : 'Document link not found or has expired.'));
          })
          .finally(() => {
            setIsLoadingShared(false);
          });
        return;
      }
    }

    // 2. Query parameters fallback (?doc=... or ?url=...)
    const params = new URLSearchParams(window.location.search);
    const docParam = params.get('doc');
    const urlParam = params.get('url');

    let targetUrl = '';
    let docTitle = '';

    if (docParam) {
      targetUrl = docParam.endsWith('.md') ? `/${docParam}` : `/${docParam}.md`;
      docTitle = docParam.replace(/\.md$/i, '');
    } else if (urlParam) {
      targetUrl = urlParam.trim();
      docTitle = targetUrl.split('/').pop()?.replace(/\.(md|markdown|txt)$/i, '') || 'Imported Document';
    }

    if (targetUrl) {
      setIsExternalDoc(true);
      fetch(targetUrl)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.text();
        })
        .then((text) => {
          const newId = crypto.randomUUID();
          setCurrentDraftId(newId);
          setContent(text);
          if (docTitle) setTitle(docTitle);
          setViewMode('reader');
        })
        .catch((err) => {
          console.error('Failed to load markdown from query parameter:', err);
          setIsExternalDoc(false);
          setContent(DEFAULT_SAMPLE_MARKDOWN);
          setTitle('Welcome to MD Viewer');
        });
    }
  }, []);

  // Parse markdown content
  const parseResult = useMemo(() => {
    return parseMarkdown(content);
  }, [content]);

  const stats: ReadingStats = useMemo(() => {
    return {
      words: parseResult.wordCount,
      characters: parseResult.charCount,
      readingTimeMinutes: parseResult.readingTimeMinutes,
    };
  }, [parseResult.wordCount, parseResult.charCount, parseResult.readingTimeMinutes]);

  // Auto-save logic with debounce (only when NOT in shared view and NOT viewing an external query document)
  useEffect(() => {
    if (isSharedView || isExternalDoc) return; // do not overwrite personal drafts with shared read-only documents or external query documents

    setIsSaved(false);
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEYS.CONTENT, content);
        localStorage.setItem(STORAGE_KEYS.TITLE, title);
        localStorage.setItem(STORAGE_KEYS.CURRENT_ID, currentDraftId);

        // Update in drafts history
        setDrafts((prev) => {
          const existingIdx = prev.findIndex((d) => d.id === currentDraftId);
          const existing = existingIdx >= 0 ? prev[existingIdx] : null;
          const updatedItem: DocumentDraft = {
            id: currentDraftId,
            title,
            content,
            updatedAt: Date.now(),
            wordCount: stats.words,
            sharedLink: currentSharedLink || existing?.sharedLink,
          };

          let updatedList: DocumentDraft[];
          if (existingIdx >= 0) {
            updatedList = [...prev];
            updatedList[existingIdx] = updatedItem;
          } else {
            updatedList = [updatedItem, ...prev].slice(0, 25); // keep max 25 drafts
          }
          try {
            localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updatedList));
          } catch (e) {
            console.warn('LocalStorage quota exceeded for drafts:', e);
          }
          return updatedList;
        });
      } catch (err) {
        console.warn('LocalStorage quota exceeded for content:', err);
      }

      setIsSaved(true);
    }, 600);

    return () => clearTimeout(timer);
  }, [content, title, currentDraftId, stats.words, isSharedView, isExternalDoc, currentSharedLink]);

  // Handle content edits in the editor
  const handleEditorContentChange = (newText: string) => {
    if (isExternalDoc) {
      // If user starts editing an external document, fork it to their workspace
      setIsExternalDoc(false);
      const newId = crypto.randomUUID();
      setCurrentDraftId(newId);
      window.history.pushState({}, '', '/');
    }
    setContent(newText);
  };

  // Save or update shared link for the current draft
  const handleSaveSharedLink = (linkInfo: SharedLinkInfo) => {
    setCurrentSharedLink(linkInfo);
    setDrafts((prev) => {
      const existingIdx = prev.findIndex((d) => d.id === currentDraftId);
      let updatedList: DocumentDraft[];
      if (existingIdx >= 0) {
        updatedList = prev.map((d, i) =>
          i === existingIdx ? { ...d, sharedLink: linkInfo, updatedAt: Date.now() } : d
        );
      } else {
        const newDraft: DocumentDraft = {
          id: currentDraftId,
          title,
          content,
          updatedAt: Date.now(),
          wordCount: stats.words,
          sharedLink: linkInfo,
        };
        updatedList = [newDraft, ...prev].slice(0, 25);
      }
      try {
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updatedList));
      } catch (e) {
        console.warn('LocalStorage quota exceeded for drafts:', e);
      }
      return updatedList;
    });
  };

  // Fork and Edit: Copies shared document into personal workspace
  const handleForkEdit = () => {
    const newId = crypto.randomUUID();
    setCurrentDraftId(newId);
    setCurrentSharedLink(null);
    setIsSharedView(false);
    setIsExternalDoc(false);
    setIsLoadingShared(false);
    setSharedMeta(null);
    setImportedFileName(null);
    window.history.pushState({}, '', '/');
    setViewMode('split');
    const forkedTitle = extractDocumentTitle(content);
    setTitle(forkedTitle);
  };

  // Load a file object (.md, .txt)
  const handleFileSelected = useCallback((file: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      if (text !== undefined) {
        const fileTitle = file.name.replace(/\.(md|markdown|txt)$/i, '');
        const newId = crypto.randomUUID();
        setCurrentDraftId(newId);
        setCurrentSharedLink(null);
        setIsExternalDoc(false);
        setImportedFileName(fileTitle);
        const initialTitle = extractDocumentTitle(text, fileTitle);
        setTitle(initialTitle);
        setContent(text);
        if (isSharedView) {
          setIsSharedView(false);
          setSharedMeta(null);
        }
        window.history.pushState({}, '', '/');
      }
    };
    reader.readAsText(file);
  }, [isSharedView]);

  // Check whether current workspace has active content that would be replaced
  const isDocumentFilled = useCallback(() => {
    if (!content) return false;
    const trimmed = content.trim();
    if (trimmed === '') return false;
    if (trimmed === '# Untitled Document\n\nStart writing markdown here...') return false;
    return true;
  }, [content]);

  // Initiate file drop with confirmation check if document has content
  const handleInitiateFileDrop = useCallback((file: File) => {
    if (isDocumentFilled()) {
      setPendingDroppedFile(file);
      setIsConfirmReplaceModalOpen(true);
    } else {
      handleFileSelected(file);
    }
  }, [isDocumentFilled, handleFileSelected]);

  // Confirm replacement modal handlers
  const handleConfirmReplace = useCallback(() => {
    if (pendingDroppedFile) {
      handleFileSelected(pendingDroppedFile);
    }
    setPendingDroppedFile(null);
    setIsConfirmReplaceModalOpen(false);
  }, [pendingDroppedFile, handleFileSelected]);

  const handleCancelReplace = useCallback(() => {
    setPendingDroppedFile(null);
    setIsConfirmReplaceModalOpen(false);
  }, []);

  // Global file drag-and-drop
  const handleWindowDragOver = useCallback((e: DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer?.types.includes('Files')) {
      setIsWindowDragging(true);
    }
  }, []);

  const handleWindowDragLeave = useCallback((e: DragEvent) => {
    if (e.clientX <= 0 || e.clientY <= 0) {
      setIsWindowDragging(false);
    }
  }, []);

  const handleWindowDrop = useCallback((e: DragEvent) => {
    e.preventDefault();
    setIsWindowDragging(false);

    // Strictly disallow dropping files in read-only shared view
    if (isSharedView) {
      return;
    }

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      handleInitiateFileDrop(e.dataTransfer.files[0]);
    }
  }, [isSharedView, handleInitiateFileDrop]);

  useEffect(() => {
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);
    return () => {
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [handleWindowDragOver, handleWindowDragLeave, handleWindowDrop]);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileSelected(e.target.files[0]);
      e.target.value = ''; // reset
    }
  };

  // Create new blank document
  const handleNewDocument = () => {
    const newId = crypto.randomUUID();
    setCurrentDraftId(newId);
    setCurrentSharedLink(null);
    setIsExternalDoc(false);
    setImportedFileName(null);
    setTitle('Untitled Document');
    setContent('# Untitled Document\n\nStart writing markdown here...');
    if (isSharedView) {
      setIsSharedView(false);
      setSharedMeta(null);
    }
    window.history.pushState({}, '', '/');
    if (viewMode === 'reader') {
      setViewMode('split');
    }
  };

  // Load draft from history
  const handleSelectDraft = (draft: DocumentDraft) => {
    setCurrentDraftId(draft.id);
    setCurrentSharedLink(draft.sharedLink || null);
    setIsExternalDoc(false);
    setImportedFileName(null);
    setTitle(draft.title);
    setContent(draft.content);
    if (isSharedView) {
      setIsSharedView(false);
      setSharedMeta(null);
    }
    window.history.pushState({}, '', '/');
  };

  // Delete draft from history
  const handleDeleteDraft = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDrafts((prev) => {
      const updated = prev.filter((d) => d.id !== id);
      try {
        localStorage.setItem(STORAGE_KEYS.DRAFTS, JSON.stringify(updated));
      } catch (err) {
        console.warn('LocalStorage quota exceeded for drafts:', err);
      }
      return updated;
    });
  };

  // Export Standalone HTML
  const handleExportHtml = () => {
    exportStandaloneHtml(title, previewContainerRef.current, theme);
  };

  // Print / Save as PDF
  const handlePrintPdf = () => {
    printToPdf();
  };

  // Download Markdown file
  const handleDownloadMd = () => {
    downloadMarkdown(title, content);
  };

  // Copy Markdown
  const handleCopyMd = () => {
    copyText(content);
  };

  // Toggle Summary and TOC drawers with mutual exclusion (only active in Reader mode)
  const handleToggleSummary = useCallback(() => {
    if (!isAiEnabled) return;
    setIsSummaryOpen((prev) => {
      const next = !prev;
      if (next) setIsTocOpen(false);
      return next;
    });
  }, [isAiEnabled]);

  const handleCloseSummary = useCallback(() => {
    setIsSummaryOpen(false);
  }, []);

  const handleToggleToc = useCallback(() => {
    setIsTocOpen((prev) => {
      const next = !prev;
      if (next) setIsSummaryOpen(false);
      return next;
    });
  }, []);


  return (
    <div className="flex flex-col h-screen w-full max-w-full overflow-x-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)]">
      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".md,.markdown,.txt"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Header Bar */}
      <Header
        title={title}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onThemeChange={setTheme}
        typography={typography}
        onTypographyChange={setTypography}
        language={language}
        onLanguageChange={handleLanguageChange}
        stats={stats}
        onOpenFile={() => fileInputRef.current?.click()}
        onOpenDraftsDrawer={() => setIsDraftsDrawerOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onNewDoc={handleNewDocument}
        onOpenUrlModal={() => setIsUrlModalOpen(true)}
        onExportHtml={handleExportHtml}
        onPrintPdf={handlePrintPdf}
        onDownloadMd={handleDownloadMd}
        onCopyMd={handleCopyMd}
        isTocOpen={isTocOpen}
        onToggleToc={handleToggleToc}
        isSummaryOpen={isAiEnabled && isSummaryOpen}
        onToggleSummary={isAiEnabled ? handleToggleSummary : undefined}
        isSaved={isSaved}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isSharedView={isSharedView}
        onForkEdit={handleForkEdit}
        onOpenMobileDrawer={() => setIsMobileDrawerOpen(true)}
      />

      {/* Shared Document Banner Notification */}
      {isSharedView && (
        <div className="w-full min-w-0 flex-shrink-0 px-4 py-2 bg-[var(--accent-surface)]/70 border-b border-[var(--border-subtle)] text-xs flex items-center justify-between text-[var(--text-primary)] animate-in fade-in select-none">
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2 h-2 rounded-full bg-[var(--accent-amber)] flex-shrink-0" />
            <span className="truncate">
              {t.banner.sharedNotice}
            </span>
            {sharedMeta?.updatedAt && sharedMeta.createdAt && sharedMeta.updatedAt > sharedMeta.createdAt + 1000 && (
              <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-[var(--accent-amber)]/20 text-[var(--accent-amber)] border border-[var(--accent-amber)]/30">
                {t.banner.updatedNotice}
              </span>
            )}
          </div>
          {sharedMeta && (
            <div className="flex items-center gap-1.5 text-xs text-[var(--accent-amber)] font-medium flex-shrink-0 font-mono">
              <Eye className="w-3.5 h-3.5" />
              <span>{sharedMeta.views.toLocaleString()} {t.mobile.viewsCount}</span>
            </div>
          )}
        </div>
      )}

      {/* Mobile Document Insights Notification Banner */}
      {isAiEnabled && !isSummaryOpen && summaryState.isReady && !dismissedSignatures.has(summaryState.signature) && (
        <div
          role="status"
          aria-live="polite"
          className="lg:hidden w-full min-w-0 flex-shrink-0 px-3.5 py-2 sm:px-4 sm:py-2.5 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] backdrop-blur-md flex items-center justify-between gap-3 text-xs animate-in slide-in-from-top-2 duration-300 select-none shadow-xs"
        >
          <button
            type="button"
            onClick={() => {
              setIsSummaryOpen(true);
              setDismissedSignatures((prev) => new Set(prev).add(summaryState.signature));
            }}
            className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer group flex-1"
          >
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-surface)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/20 flex items-center justify-center flex-shrink-0 shadow-2xs group-hover:scale-105 transition-transform">
              <Compass className="w-3.5 h-3.5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 font-bold text-[var(--text-primary)] leading-tight">
                <span className="truncate">{t.banner.aiSummaryReady}</span>
              </div>
              <p className="text-[11px] text-[var(--text-secondary)] truncate leading-tight mt-0.5">
                {t.banner.aiSummaryReadySub}
              </p>
            </div>
          </button>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <button
              type="button"
              onClick={() => {
                setIsSummaryOpen(true);
                setDismissedSignatures((prev) => new Set(prev).add(summaryState.signature));
              }}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-amber)] text-white font-semibold text-xs hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer"
            >
              <span>{t.banner.viewSummary}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => {
                setDismissedSignatures((prev) => new Set(prev).add(summaryState.signature));
              }}
              className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] active:scale-95 transition-colors cursor-pointer"
              title={t.banner.dismiss}
              aria-label={t.banner.dismiss}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Shared Error Screen (if 404/expired) */}
      {sharedError ? (
        <div className="flex-1 min-w-0 w-full flex flex-col items-center justify-center p-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 text-rose-500 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t.notFound.title}</h2>
          <p className="text-sm text-[var(--text-secondary)] max-w-md mb-6 leading-relaxed">
            {sharedError}
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--accent-amber)] text-white font-semibold text-sm hover:brightness-110 transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{t.notFound.back}</span>
          </a>
        </div>
      ) : (
        /* Main Studio Viewport */
        <main
          ref={mainContainerRef}
          className={`flex-1 min-w-0 w-full flex overflow-hidden relative ${
            isDraggingSplitter ? 'select-none' : ''
          }`}
        >
          {/* Fullscreen transparent backdrop during active dragging to capture mouse movements without child iframe/selection interference */}
          {isDraggingSplitter && (
            <div className="fixed inset-0 z-50 cursor-col-resize select-none pointer-events-auto" />
          )}

          {/* Editor Pane (shown in Split or Editor mode) */}
          {(viewMode === 'split' || viewMode === 'editor') && (
            <div
              className={`h-full min-w-0 ${
                viewMode === 'editor'
                  ? 'w-full'
                  : 'w-full lg:flex-none lg:w-[var(--editor-split-width)]'
              }`}
              style={
                viewMode === 'split'
                  ? ({ '--editor-split-width': `${splitRatio}%` } as React.CSSProperties)
                  : undefined
              }
            >
              <Editor
                value={content}
                onChange={handleEditorContentChange}
                onDropFile={handleInitiateFileDrop}
                language={language}
              />
            </div>
          )}

          {/* Splitter Resizer Handle (shown only in Split mode on desktop lg: >=1024px) */}
          {viewMode === 'split' && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-valuenow={Math.round(splitRatio)}
              aria-valuemin={20}
              aria-valuemax={80}
              onMouseDown={handleSplitterMouseDown}
              onTouchStart={handleSplitterTouchStart}
              onDoubleClick={handleResetSplit}
              title={
                language === 'id'
                  ? 'Geser untuk ubah lebar (Klik dua kali untuk reset 50/50)'
                  : 'Drag to resize (Double-click to reset 50/50)'
              }
              className="hidden lg:flex relative items-center justify-center w-3 -mx-1.5 z-30 cursor-col-resize select-none group touch-none flex-shrink-0"
            >
              {/* Divider Line */}
              <div
                className={`w-[1px] h-full transition-colors duration-150 ${
                  isDraggingSplitter
                    ? 'bg-[var(--accent-amber)] w-[2px]'
                    : 'bg-[var(--border-subtle)] group-hover:bg-[var(--accent-amber)]'
                }`}
              />

              {/* Centered subtle grip pill */}
              <div
                className={`absolute top-1/2 -translate-y-1/2 w-4 h-7 rounded-full flex items-center justify-center shadow-xs transition-all duration-150 ${
                  isDraggingSplitter
                    ? 'bg-[var(--accent-amber)] text-white scale-110 opacity-100 ring-2 ring-[var(--accent-amber)]/30'
                    : 'bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 group-hover:border-[var(--accent-amber)] group-hover:text-[var(--accent-amber)]'
                }`}
              >
                <GripVertical className="w-2.5 h-2.5" />
              </div>
            </div>
          )}

          {/* Preview Pane (shown in Reader or Split mode) */}
          {(viewMode === 'reader' || viewMode === 'split') && (
            <div
              className={`h-full min-w-0 ${
                viewMode === 'split' ? 'hidden lg:flex flex-1' : 'flex flex-1 w-full'
              }`}
            >
              {isLoadingShared ? (
                /* Minimalist Editorial Skeleton (Prevents layout shift & flash of edit mode) */
                <div
                  className="w-full h-full overflow-y-auto bg-[var(--bg-canvas)] text-[var(--text-primary)]"
                  data-theme={theme}
                >
                  <div className="max-w-[760px] mx-auto w-full px-4 sm:px-8 py-10 sm:py-14 space-y-8 animate-pulse">
                    {/* Badge & Title Skeleton */}
                    <div className="space-y-3">
                      <div className="h-5 w-24 rounded-full bg-[var(--accent-amber)]/20" />
                      <div className="h-9 sm:h-11 w-4/5 rounded-xl bg-[var(--border-subtle)]" />
                      <div className="h-9 sm:h-11 w-1/2 rounded-xl bg-[var(--border-subtle)]/60" />
                    </div>

                    {/* Metadata Line */}
                    <div className="flex items-center gap-3 py-3 border-y border-[var(--border-subtle)]">
                      <div className="w-7 h-7 rounded-full bg-[var(--border-subtle)]" />
                      <div className="h-3 w-32 rounded bg-[var(--border-subtle)]/70" />
                      <div className="h-3 w-20 rounded bg-[var(--border-subtle)]/40 ml-auto" />
                    </div>

                    {/* Paragraph 1 */}
                    <div className="space-y-3 pt-2">
                      <div className="h-4 w-full rounded bg-[var(--border-subtle)]/80" />
                      <div className="h-4 w-11/12 rounded bg-[var(--border-subtle)]/70" />
                      <div className="h-4 w-4/5 rounded bg-[var(--border-subtle)]/60" />
                    </div>

                    {/* Callout Skeleton */}
                    <div className="p-4 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/60 space-y-2.5">
                      <div className="h-3.5 w-28 rounded bg-[var(--accent-amber)]/30" />
                      <div className="h-3.5 w-full rounded bg-[var(--border-subtle)]/60" />
                      <div className="h-3.5 w-5/6 rounded bg-[var(--border-subtle)]/50" />
                    </div>

                    {/* Paragraph 2 */}
                    <div className="space-y-3">
                      <div className="h-4 w-full rounded bg-[var(--border-subtle)]/80" />
                      <div className="h-4 w-5/6 rounded bg-[var(--border-subtle)]/70" />
                      <div className="h-4 w-3/4 rounded bg-[var(--border-subtle)]/60" />
                      <div className="h-4 w-2/3 rounded bg-[var(--border-subtle)]/50" />
                    </div>
                  </div>
                </div>
              ) : (
                <Preview
                  html={parseResult.html}
                  theme={theme}
                  viewMode={viewMode}
                  language={language}
                  containerRef={previewContainerRef}
                />
              )}
            </div>
          )}

          {/* Table of Contents Drawer */}
          <TableOfContents
            headings={parseResult.headings}
            isOpen={isTocOpen}
            onClose={() => setIsTocOpen(false)}
            scrollContainerRef={previewContainerRef}
            language={language}
          />

          {/* AI Executive Summary Drawer (only active in Reader mode) */}
          {isAiEnabled && (
            <React.Suspense fallback={null}>
              <SummaryDrawer
                isOpen={isSummaryOpen}
                onClose={handleCloseSummary}
                title={title}
                content={content}
                language={language}
                summaryState={summaryState}
              />
            </React.Suspense>
          )}
        </main>
      )}

      {/* Bottom Status Bar for Reading Stats & Quick Info (Desktop/Tablet) */}
      <StatusBar
        stats={stats}
        viewMode={viewMode}
        language={language}
        splitRatio={splitRatio}
        onResetSplit={handleResetSplit}
        onOpenCommandPalette={() => setIsCommandPaletteOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        isSaved={isSaved}
      />

      {/* Drag & Drop Screen Overlay */}
      {isWindowDragging && (
        <div
          className={`fixed inset-0 z-50 flex flex-col items-center justify-center backdrop-blur-xs border-4 border-dashed pointer-events-none animate-in fade-in duration-100 ${
            isSharedView
              ? 'bg-rose-500/10 border-rose-500/60'
              : 'bg-amber-500/10 border-[var(--accent-amber)]'
          }`}
        >
          <div className="p-6 rounded-2xl bg-[var(--bg-surface)] border border-[var(--border-subtle)] shadow-2xl text-center max-w-sm mx-4">
            {isSharedView ? (
              <>
                <div className="w-12 h-12 rounded-full bg-rose-500/15 text-rose-600 flex items-center justify-center mx-auto mb-3 text-xl font-bold">
                  <ShieldAlert className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-base mb-1 text-[var(--text-primary)]">
                  {t.dragOverlay.readOnlyTitle}
                </h3>
                <p className="text-xs text-[var(--text-secondary)] leading-relaxed">
                  {t.dragOverlay.readOnlySubtitle}
                </p>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-full bg-[var(--accent-surface)] text-[var(--accent-amber)] flex items-center justify-center mx-auto mb-3 text-xl font-bold font-mono">
                  ↓
                </div>
                <h3 className="font-semibold text-base mb-1">{t.dragOverlay.title}</h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {t.dragOverlay.subtitle}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Confirm Replace Document Modal */}
      <ConfirmReplaceModal
        isOpen={isConfirmReplaceModalOpen}
        file={pendingDroppedFile}
        currentTitle={title}
        onConfirm={handleConfirmReplace}
        onCancel={handleCancelReplace}
        language={language}
      />

      {/* Modals */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        title={title}
        content={content}
        sharedLink={currentSharedLink}
        onSaveSharedLink={handleSaveSharedLink}
        language={language}
      />

      <UrlModal
        isOpen={isUrlModalOpen}
        onClose={() => setIsUrlModalOpen(false)}
        language={language}
        onLoadContent={(newContent, urlTitle) => {
          const newId = crypto.randomUUID();
          setCurrentDraftId(newId);
          setCurrentSharedLink(null);
          if (urlTitle) setTitle(urlTitle);
          setContent(newContent);
          if (isSharedView) {
            setIsSharedView(false);
            setSharedMeta(null);
            window.history.pushState({}, '', '/');
          }
        }}
      />

      <DraftsDrawer
        isOpen={isDraftsDrawerOpen}
        onClose={() => setIsDraftsDrawerOpen(false)}
        drafts={drafts}
        currentId={currentDraftId}
        onSelectDraft={handleSelectDraft}
        onDeleteDraft={handleDeleteDraft}
        language={language}
      />

      <ShortcutsModal
        isOpen={isShortcutsModalOpen}
        onClose={() => setIsShortcutsModalOpen(false)}
        language={language}
      />

      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
        theme={theme}
        onThemeChange={setTheme}
        language={language}
        onLanguageChange={handleLanguageChange}
        isTocOpen={isTocOpen}
        onToggleToc={handleToggleToc}
        onToggleSummary={isAiEnabled ? handleToggleSummary : undefined}
        onExportHtml={handleExportHtml}
        onPrintPdf={handlePrintPdf}
        onDownloadMd={handleDownloadMd}
        onCopyMd={handleCopyMd}
        copiedMd={false}
        onNewDoc={handleNewDocument}
        onOpenFile={() => fileInputRef.current?.click()}
        onOpenUrlModal={() => setIsUrlModalOpen(true)}
        onOpenDraftsDrawer={() => setIsDraftsDrawerOpen(true)}
        onOpenShortcutsModal={() => setIsShortcutsModalOpen(true)}
        onOpenShareModal={() => setIsShareModalOpen(true)}
        isSharedView={isSharedView}
        sharedMeta={sharedMeta}
        onForkEdit={handleForkEdit}
      />

      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onNewDoc={handleNewDocument}
        onOpenFile={() => fileInputRef.current?.click()}
        onOpenDrafts={() => setIsDraftsDrawerOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
        onToggleToc={handleToggleToc}
        isTocOpen={isTocOpen}
        isSummaryOpen={isAiEnabled && isSummaryOpen}
        onToggleSummary={isAiEnabled ? handleToggleSummary : undefined}
        onExportHtml={handleExportHtml}
        onPrintPdf={handlePrintPdf}
        onDownloadMd={handleDownloadMd}
        onCopyMd={handleCopyMd}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        theme={theme}
        onThemeChange={setTheme}
        onResetSplit={handleResetSplit}
        language={language}
      />
    </div>
  );
}

export default App;
