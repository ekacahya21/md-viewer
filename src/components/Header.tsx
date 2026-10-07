import React, { useState, useRef, useEffect } from 'react';
import {
  BookOpen,
  Columns2,
  FileCode,
  FolderOpen,
  History,
  Download,
  Printer,
  FileText,
  Copy,
  Check,
  List,
  Sun,
  Moon,
  Coffee,
  HelpCircle,
  Plus,
  ChevronDown,
  Share2,
  GitFork,
  MoreVertical,
  Edit3,
  Search,
  Compass,
  Globe,
} from 'lucide-react';
import type { ViewMode, ThemeMode, TypographyFont, ReadingStats, Language } from '../types';
import { translations } from '../i18n/translations';

interface HeaderProps {
  title?: string;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  typography?: TypographyFont;
  onTypographyChange?: (font: TypographyFont) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  stats: ReadingStats;
  onOpenFile: () => void;
  onOpenDraftsDrawer: () => void;
  onOpenShortcutsModal: () => void;
  onOpenCommandPalette: () => void;
  onNewDoc: () => void;
  onOpenUrlModal?: () => void;
  onExportHtml: () => void;
  onPrintPdf: () => void;
  onDownloadMd: () => void;
  onCopyMd: () => void;
  isTocOpen: boolean;
  onToggleToc: () => void;
  isSummaryOpen?: boolean;
  onToggleSummary?: () => void;
  isSaved: boolean;
  onOpenShareModal: () => void;
  isSharedView?: boolean;
  onForkEdit?: () => void;
  onOpenMobileDrawer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  viewMode,
  onViewModeChange,
  theme,
  onThemeChange,
  typography = 'sans',
  onTypographyChange,
  language,
  onLanguageChange,
  onOpenFile,
  onOpenDraftsDrawer,
  onOpenShortcutsModal,
  onOpenCommandPalette,
  onNewDoc,
  onOpenUrlModal,
  onExportHtml,
  onPrintPdf,
  onDownloadMd,
  onCopyMd,
  isTocOpen,
  onToggleToc,
  isSummaryOpen = false,
  onToggleSummary,
  onOpenShareModal,
  isSharedView = false,
  onForkEdit,
  onOpenMobileDrawer,
}) => {
  const [isFileOpen, setIsFileOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isThemeOpen, setIsThemeOpen] = useState(false);
  const [copiedMd, setCopiedMd] = useState(false);

  const fileRef = useRef<HTMLDivElement>(null);
  const exportRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const t = translations[language];

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (fileRef.current && !fileRef.current.contains(e.target as Node)) {
        setIsFileOpen(false);
      }
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setIsThemeOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleCopyMd = () => {
    onCopyMd();
    setCopiedMd(true);
    setTimeout(() => setCopiedMd(false), 2000);
  };

  const themeIcons = {
    paper: <Sun className="w-4 h-4 text-amber-600" />,
    charcoal: <Moon className="w-4 h-4 text-amber-400" />,
    sepia: <Coffee className="w-4 h-4 text-amber-700" />,
  };

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between w-full max-w-full min-w-0 flex-shrink-0 px-3.5 sm:px-6 h-14 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-md transition-colors select-none">
      {/* Left: Brand Monogram & Quick Command Trigger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-shrink-0">
        <a href="/" className="flex items-center gap-2 hover:opacity-85 transition-opacity flex-shrink-0" title="MD Viewer Home">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-[var(--accent-amber)] text-white font-serif font-bold text-xs sm:text-sm flex items-center justify-center shadow-xs tracking-wider">
            MD
          </div>
          <span className="font-semibold text-xs sm:text-sm tracking-tight text-[var(--text-primary)]">
            MD Viewer
          </span>
        </a>

        {isSharedView ? (
          <div className="hidden sm:flex items-center gap-1.5 min-w-0 pl-1">
            <div className="h-4 w-px bg-[var(--border-subtle)] flex-shrink-0" />
            <span className="font-medium text-xs sm:text-sm text-[var(--text-primary)] truncate max-w-[240px]">
              {title || t.header.sharedDoc}
            </span>
            <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[var(--accent-surface)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30 inline-flex">
              {t.common.shared}
            </span>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block flex-shrink-0" />
            {/* Command Palette Trigger */}
            <button
              type="button"
              onClick={onOpenCommandPalette}
              className="hidden md:flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)]/70 text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border-subtle)] transition-all cursor-pointer shadow-2xs"
              title="Open Command Palette (⌘K)"
            >
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              <span className="text-[11px] font-medium hidden lg:inline">{t.common.commands}</span>
              <kbd className="px-1.5 py-0.2 rounded text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
                ⌘K
              </kbd>
            </button>
          </div>
        )}
      </div>

      {/* Center: Desktop View Switcher (Clean, Centered, Distraction-Free) */}
      {!isSharedView && (
        <div className="hidden lg:flex items-center justify-center flex-1 px-4">
          <div className="flex items-center p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-secondary)] shadow-2xs">
            <button
              type="button"
              onClick={() => onViewModeChange('reader')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'reader'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'hover:text-[var(--text-primary)]'
              }`}
              title="Reader View (⌘1)"
            >
              <BookOpen className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>{t.viewMode.reader}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('split')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'split'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'hover:text-[var(--text-primary)]'
              }`}
              title="Split View (⌘2)"
            >
              <Columns2 className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>{t.viewMode.split}</span>
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('editor')}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-md transition-all cursor-pointer ${
                viewMode === 'editor'
                  ? 'bg-[var(--bg-surface)] text-[var(--text-primary)] shadow-xs font-semibold'
                  : 'hover:text-[var(--text-primary)]'
              }`}
              title="Editor View (⌘3)"
            >
              <FileCode className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>{t.viewMode.editor}</span>
            </button>
          </div>
        </div>
      )}

      {/* Right: Actions, Share, Export, Toggles */}
      <div className="flex items-center gap-2 sm:gap-2 flex-shrink-0">
        {/* Mobile 1-click Read <-> Edit toggle */}
        {!isSharedView && (
          <button
            type="button"
            onClick={() => onViewModeChange(viewMode === 'reader' ? 'editor' : 'reader')}
            className="lg:hidden px-2.5 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] active:scale-95 text-[var(--text-primary)] flex items-center gap-1 transition-all touch-manipulation cursor-pointer"
            title={viewMode === 'reader' ? 'Switch to Editor' : 'Switch to Reader'}
          >
            {viewMode === 'reader' ? (
              <>
                <Edit3 className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span className="text-[11px] font-semibold">{t.viewMode.edit}</span>
              </>
            ) : (
              <>
                <BookOpen className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span className="text-[11px] font-semibold">{t.viewMode.view}</span>
              </>
            )}
          </button>
        )}

        {isSharedView ? (
          <>
            {/* Direct 1-Click Download Button */}
            <button
              type="button"
              onClick={onDownloadMd}
              className="px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)]/70 text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer touch-manipulation"
              title="Download Markdown (.md)"
            >
              <Download className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span className="hidden sm:inline font-semibold">{t.header.downloadDirect}</span>
            </button>

            {/* Export Dropdown Menu (Secondary Button in Shared View) */}
            <div className="relative hidden sm:block" ref={exportRef}>
              <button
                type="button"
                onClick={() => {
                  setIsExportOpen(!isExportOpen);
                  setIsFileOpen(false);
                  setIsThemeOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  isExportOpen
                    ? 'bg-[var(--border-subtle)]/70 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)]/70 text-[var(--text-primary)]'
                }`}
                title="Export document"
              >
                <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{t.header.export}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl z-50 text-xs font-medium text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onExportHtml();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-semibold">{t.header.html}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.htmlSub}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onPrintPdf();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold">{t.header.pdf}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.pdfSub}</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-[var(--border-subtle)]" />

                  <button
                    type="button"
                    onClick={() => {
                      onDownloadMd();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-semibold">{t.header.downloadMd}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.downloadMdSub}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCopyMd();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    {copiedMd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[var(--text-secondary)]" />}
                    <div>
                      <div className="font-semibold">{copiedMd ? t.common.copied : t.header.copyMd}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.copyMdSub}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Primary CTA: Fork & Edit */}
            <button
              type="button"
              onClick={onForkEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-[var(--accent-amber)] text-white hover:brightness-110 active:scale-95 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer flex-shrink-0 touch-manipulation"
              title="Fork & Edit this document"
            >
              <GitFork className="w-3.5 h-3.5" />
              <span>{t.header.forkEdit}</span>
            </button>
          </>
        ) : (
          <>
            {/* Unified File Dropdown Menu */}
            <div className="relative hidden sm:block" ref={fileRef}>
              <button
                type="button"
                onClick={() => {
                  setIsFileOpen(!isFileOpen);
                  setIsExportOpen(false);
                  setIsThemeOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer ${
                  isFileOpen
                    ? 'bg-[var(--bg-subtle)] text-[var(--text-primary)]'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
                title="File options"
              >
                <FolderOpen className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>{t.header.file}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isFileOpen && (
                <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl z-50 text-xs font-medium text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onNewDoc();
                      setIsFileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <Plus className="w-4 h-4 text-[var(--accent-amber)]" />
                      <span>{t.header.newDoc}</span>
                    </div>
                    <kbd className="text-[10px] text-[var(--text-muted)] font-mono">⌘N</kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onOpenFile();
                      setIsFileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <FolderOpen className="w-4 h-4 text-sky-600" />
                      <span>{t.header.openFile}</span>
                    </div>
                    <kbd className="text-[10px] text-[var(--text-muted)] font-mono">⌘O</kbd>
                  </button>

                  {onOpenUrlModal && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenUrlModal();
                        setIsFileOpen(false);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                    >
                      <Globe className="w-4 h-4 text-emerald-600" />
                      <span>{t.header.openUrl}</span>
                    </button>
                  )}

                  <div className="my-1 border-t border-[var(--border-subtle)]" />

                  <button
                    type="button"
                    onClick={() => {
                      onOpenDraftsDrawer();
                      setIsFileOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <History className="w-4 h-4 text-purple-600" />
                      <span>{t.header.recentDrafts}</span>
                    </div>
                    <kbd className="text-[10px] text-[var(--text-muted)] font-mono">⌘D</kbd>
                  </button>
                </div>
              )}
            </div>

            {/* Export Dropdown Menu (Secondary Button) */}
            <div className="relative hidden sm:block" ref={exportRef}>
              <button
                type="button"
                onClick={() => {
                  setIsExportOpen(!isExportOpen);
                  setIsFileOpen(false);
                  setIsThemeOpen(false);
                }}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer ${
                  isExportOpen
                    ? 'bg-[var(--border-subtle)]/70 text-[var(--text-primary)]'
                    : 'bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)]/70 text-[var(--text-primary)]'
                }`}
                title="Export document"
              >
                <Download className="w-3.5 h-3.5 text-[var(--text-secondary)]" />
                <span>{t.header.export}</span>
                <ChevronDown className="w-3 h-3 opacity-60" />
              </button>

              {isExportOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-1.5 shadow-xl z-50 text-xs font-medium text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-100">
                  <button
                    type="button"
                    onClick={() => {
                      onExportHtml();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    <div>
                      <div className="font-semibold">{t.header.html}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.htmlSub}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onPrintPdf();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <Printer className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="font-semibold">{t.header.pdf}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.pdfSub}</div>
                    </div>
                  </button>

                  <div className="my-1 border-t border-[var(--border-subtle)]" />

                  <button
                    type="button"
                    onClick={() => {
                      onDownloadMd();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    <Download className="w-4 h-4 text-sky-600" />
                    <div>
                      <div className="font-semibold">{t.header.downloadMd}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.downloadMdSub}</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      handleCopyMd();
                      setIsExportOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer"
                  >
                    {copiedMd ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-[var(--text-secondary)]" />}
                    <div>
                      <div className="font-semibold">{copiedMd ? t.common.copied : t.header.copyMd}</div>
                      <div className="text-[10px] text-[var(--text-muted)]">{t.header.copyMdSub}</div>
                    </div>
                  </button>
                </div>
              )}
            </div>

            {/* Share Action Button */}
            <button
              type="button"
              onClick={onOpenShareModal}
              className="px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-medium border border-[var(--border-subtle)] bg-[var(--bg-subtle)] hover:bg-[var(--accent-surface)] hover:text-[var(--accent-amber)] hover:border-[var(--accent-amber)]/40 text-[var(--text-primary)] transition-all flex items-center gap-1.5 shadow-2xs cursor-pointer"
              title="Share document via short URL"
            >
              <Share2 className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
              <span>{t.common.share}</span>
            </button>
          </>
        )}

        {/* Subtle Vertical Divider */}
        <div className="h-4 w-px bg-[var(--border-subtle)] hidden sm:block" />

        {/* Inspector Panels (TOC Outline & Document Insights) */}
        <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
          <button
            type="button"
            onClick={onToggleToc}
            className={`p-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
              isTocOpen
                ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-2xs font-semibold'
                : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
            title={isTocOpen ? `Hide ${t.header.outline}` : t.header.outline}
          >
            <List className="w-3.5 h-3.5" />
            <span className="hidden xl:inline text-[11px]">{t.header.outline}</span>
          </button>

          {viewMode === 'reader' && onToggleSummary && (
            <button
              type="button"
              onClick={onToggleSummary}
              className={`p-1.5 rounded-md transition-all flex items-center gap-1 cursor-pointer ${
                isSummaryOpen
                  ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-2xs font-semibold'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
              title={isSummaryOpen ? `Hide ${t.header.summary}` : t.header.summary}
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden xl:inline text-[11px]">{t.header.summary}</span>
            </button>
          )}
        </div>

        {/* Utilities: Reading & Display Preferences (Theme, Typography, Language) */}
        <div className="hidden sm:flex items-center gap-0.5">
          {/* Display Preferences Dropdown */}
          <div className="relative" ref={themeRef}>
            <button
              type="button"
              onClick={() => {
                setIsThemeOpen(!isThemeOpen);
                setIsFileOpen(false);
                setIsExportOpen(false);
              }}
              className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              title={t.header.theme}
            >
              {themeIcons[theme]}
            </button>

            {isThemeOpen && (
              <div className="absolute right-0 mt-2 w-52 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-2 shadow-xl z-50 text-xs font-medium text-[var(--text-primary)] animate-in fade-in zoom-in-95 duration-100 space-y-2">
                {/* Theme Selector */}
                <div>
                  <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {language === 'id' ? 'Tema Tampilan' : 'Reading Theme'}
                  </div>
                  <div className="space-y-0.5 mt-1">
                    {(['paper', 'charcoal', 'sepia'] as ThemeMode[]).map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => {
                          onThemeChange(mode);
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer ${
                          theme === mode ? 'bg-[var(--accent-surface)] text-[var(--accent-amber)] font-semibold' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {themeIcons[mode]}
                          <span>{t.themeNames[mode]}</span>
                        </div>
                        {theme === mode && <Check className="w-3.5 h-3.5 text-[var(--accent-amber)]" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Typography Font Selector */}
                {onTypographyChange && (
                  <div className="border-t border-[var(--border-subtle)] pt-1.5">
                    <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                      {language === 'id' ? 'Gaya Tipografi' : 'Typography'}
                    </div>
                    <div className="grid grid-cols-2 gap-1 px-1 mt-1">
                      <button
                        type="button"
                        onClick={() => onTypographyChange('sans')}
                        className={`px-2 py-1 rounded-lg border text-xs font-sans text-center transition-all cursor-pointer ${
                          typography === 'sans'
                            ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)] text-[var(--accent-amber)] font-semibold shadow-2xs'
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Sans
                      </button>
                      <button
                        type="button"
                        onClick={() => onTypographyChange('serif')}
                        className={`px-2 py-1 rounded-lg border text-xs font-serif text-center transition-all cursor-pointer ${
                          typography === 'serif'
                            ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)] text-[var(--accent-amber)] font-semibold shadow-2xs'
                            : 'border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                        }`}
                      >
                        Serif (Book)
                      </button>
                    </div>
                  </div>
                )}

                {/* Language Selector */}
                <div className="border-t border-[var(--border-subtle)] pt-1.5">
                  <div className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                    {language === 'id' ? 'Bahasa' : 'Language'}
                  </div>
                  <div className="grid grid-cols-2 gap-1 px-1 mt-1">
                    <button
                      type="button"
                      onClick={() => onLanguageChange('en')}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-mono text-center transition-all cursor-pointer ${
                        language === 'en'
                          ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)] text-[var(--accent-amber)] font-bold shadow-2xs'
                          : 'border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      English
                    </button>
                    <button
                      type="button"
                      onClick={() => onLanguageChange('id')}
                      className={`px-2 py-1 rounded-lg border text-[11px] font-mono text-center transition-all cursor-pointer ${
                        language === 'id'
                          ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)] text-[var(--accent-amber)] font-bold shadow-2xs'
                          : 'border-[var(--border-subtle)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      Indonesia
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Shortcuts / Help */}
          <button
            type="button"
            onClick={onOpenShortcutsModal}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.header.shortcuts}
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile More Button (⋮) -> Opens MobileDrawer */}
        <button
          type="button"
          onClick={onOpenMobileDrawer}
          className="sm:hidden w-9 h-9 rounded-xl flex items-center justify-center text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] border border-[var(--border-subtle)] active:scale-95 active:bg-[var(--border-subtle)] transition-all cursor-pointer flex-shrink-0 touch-manipulation shadow-2xs"
          title={t.mobile.menuTitle}
          aria-label={t.mobile.menuTitle}
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
