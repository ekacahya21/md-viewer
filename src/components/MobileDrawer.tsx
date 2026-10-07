import React from 'react';
import {
  X,
  List,
  Sun,
  Moon,
  Coffee,
  Download,
  Printer,
  FileText,
  Copy,
  Check,
  Plus,
  FolderOpen,
  Globe,
  History,
  HelpCircle,
  Share2,
  GitFork,
  Eye,
  Compass,
  ChevronRight,
} from 'lucide-react';
import type { ThemeMode, SharedDocMeta, Language } from '../types';
import { translations } from '../i18n/translations';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onThemeChange: (mode: ThemeMode) => void;
  language: Language;
  onLanguageChange: (lang: Language) => void;
  isTocOpen: boolean;
  onToggleToc: () => void;
  onToggleSummary?: () => void;
  onExportHtml: () => void;
  onPrintPdf: () => void;
  onDownloadMd: () => void;
  onCopyMd: () => void;
  copiedMd: boolean;
  onNewDoc: () => void;
  onOpenFile: () => void;
  onOpenUrlModal: () => void;
  onOpenDraftsDrawer: () => void;
  onOpenShortcutsModal: () => void;
  onOpenShareModal: () => void;
  isSharedView?: boolean;
  sharedMeta?: SharedDocMeta | null;
  onForkEdit?: () => void;
}

export const MobileDrawer: React.FC<MobileDrawerProps> = ({
  isOpen,
  onClose,
  theme,
  onThemeChange,
  language,
  onLanguageChange,
  isTocOpen,
  onToggleToc,
  onToggleSummary,
  onExportHtml,
  onPrintPdf,
  onDownloadMd,
  onCopyMd,
  copiedMd,
  onNewDoc,
  onOpenFile,
  onOpenUrlModal,
  onOpenDraftsDrawer,
  onOpenShortcutsModal,
  onOpenShareModal,
  isSharedView = false,
  sharedMeta,
  onForkEdit,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 sm:hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Slide-up Bottom Sheet */}
      <div className="fixed inset-x-0 bottom-0 max-h-[88vh] overflow-y-auto rounded-t-3xl bg-[var(--bg-surface)] border-t border-[var(--border-subtle)] shadow-2xl z-10 p-5 flex flex-col gap-4 animate-in slide-in-from-bottom duration-200">
        {/* Handle Bar */}
        <div className="w-10 h-1 rounded-full bg-[var(--border-strong)] opacity-60 mx-auto -mt-1" />

        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-2 border-b border-[var(--border-subtle)]">
          <div>
            <h3 className="font-bold text-sm text-[var(--text-primary)]">{t.mobile.menuTitle}</h3>
            <p className="text-[11px] text-[var(--text-muted)]">
              {isSharedView ? t.mobile.sharedSubtitle : t.mobile.studioSubtitle}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--bg-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Shared Document Metadata Box (if shared) */}
        {isSharedView && (
          <div className="p-3 rounded-2xl bg-[var(--accent-surface)]/60 border border-[var(--accent-amber)]/20 text-xs flex items-center justify-between text-[var(--text-primary)]">
            <div className="flex items-center gap-1.5 font-medium text-[var(--accent-amber)]">
              <Eye className="w-4 h-4" />
              <span>{sharedMeta ? `${sharedMeta.views.toLocaleString()} ${t.mobile.viewsCount}` : t.header.sharedDoc}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onClose();
                  onOpenShareModal();
                }}
                className="px-2.5 py-1 rounded-lg border border-[var(--accent-amber)]/30 text-[var(--accent-amber)] text-xs font-semibold hover:bg-[var(--accent-surface)] flex items-center gap-1"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>{t.mobile.link}</span>
              </button>
              {onForkEdit && (
                <button
                  onClick={() => {
                    onClose();
                    onForkEdit();
                  }}
                  className="px-2.5 py-1 rounded-lg bg-[var(--accent-amber)] text-white text-xs font-semibold hover:brightness-110 flex items-center gap-1 shadow-xs"
                >
                  <GitFork className="w-3.5 h-3.5" />
                  <span>{t.mobile.fork}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Priority 1: Top Navigation & Reading Tools (Grouped Row Style) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {t.mobile.navSection}
          </div>

          <div className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 divide-y divide-[var(--border-subtle)]/60 overflow-hidden">
            {/* Document Insights */}
            {onToggleSummary && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onToggleSummary();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-surface)] border border-[var(--accent-amber)]/25 text-[var(--accent-amber)] flex items-center justify-center flex-shrink-0">
                    <Compass className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-[var(--text-primary)]">
                      {t.mobile.aiSummaryTitle}
                    </div>
                    <div className="text-[11px] text-[var(--text-secondary)] truncate">
                      {t.mobile.aiSummarySub}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </button>
            )}

            {/* Table of Contents */}
            <button
              type="button"
              onClick={() => {
                onClose();
                onToggleToc();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 transition-colors text-left cursor-pointer group ${
                isTocOpen ? 'bg-[var(--accent-surface)]/40' : 'hover:bg-[var(--bg-subtle)]'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-[var(--bg-surface)] border border-[var(--border-subtle)] text-[var(--text-primary)] flex items-center justify-center flex-shrink-0">
                  <List className="w-4 h-4 text-[var(--accent-amber)]" />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-[var(--text-primary)]">
                    {t.mobile.tocTitle}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] truncate">
                    {t.mobile.tocSub}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {isTocOpen && (
                  <span className="text-[10px] font-medium text-[var(--accent-amber)]">{t.common.opened}</span>
                )}
                <ChevronRight className="w-4 h-4 text-[var(--text-muted)] group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          </div>
        </div>

        {/* Priority 2: Document Management (Studio Mode Only) */}
        {!isSharedView && (
          <div className="space-y-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t.mobile.docSection}
            </div>

            <div className="flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/30 divide-y divide-[var(--border-subtle)]/60 overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onNewDoc();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Plus className="w-4 h-4 text-[var(--accent-amber)]" />
                  <span>{t.mobile.newDoc}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenFile();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <FolderOpen className="w-4 h-4 text-sky-600" />
                  <span>{t.mobile.openDevice}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenUrlModal();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-emerald-600" />
                  <span>{t.mobile.loadUrl}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDraftsDrawer();
                }}
                className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] text-left cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <History className="w-4 h-4 text-purple-600" />
                  <span>{t.mobile.draftsHistory}</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-[var(--text-muted)]" />
              </button>
            </div>
          </div>
        )}

        {/* Priority 3: Export & Copy (Quick-Action Compact Pills) */}
        <div className="space-y-1.5">
          <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
            {t.mobile.exportSection}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onExportHtml();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
              <span>{t.mobile.htmlStandalone}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onPrintPdf();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
              <span>{t.mobile.pdfPrint}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onDownloadMd();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-sky-600 flex-shrink-0" />
              <span>{t.mobile.downloadFile}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onCopyMd();
              }}
              className="flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 hover:bg-[var(--bg-subtle)] transition-colors text-xs font-medium text-[var(--text-primary)] cursor-pointer"
            >
              {copiedMd ? (
                <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-[var(--accent-amber)] flex-shrink-0" />
              )}
              <span>{copiedMd ? t.common.copied : t.mobile.copyText}</span>
            </button>
          </div>
        </div>

        {/* Priority 4: Language Switcher & Theme Selector */}
        <div className="pt-2 border-t border-[var(--border-subtle)] space-y-3">
          {/* Language Switcher */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
              {t.mobile.languageSection}
            </span>
            <div className="grid grid-cols-2 gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => onLanguageChange('en')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg font-medium transition-all cursor-pointer ${
                  language === 'en'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>English (EN)</span>
              </button>
              <button
                type="button"
                onClick={() => onLanguageChange('id')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg font-medium transition-all cursor-pointer ${
                  language === 'id'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-xs font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <span>Indonesia (ID)</span>
              </button>
            </div>
          </div>

          {/* Theme Selector & Help */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.mobile.themeSection}
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenShortcutsModal();
                }}
                className="text-[11px] font-medium text-[var(--accent-amber)] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span>{t.mobile.helpFaq}</span>
              </button>
            </div>

            {/* Theme Selector Segmented Bar */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={() => onThemeChange('paper')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  theme === 'paper'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-xs font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-600" />
                <span>Paper</span>
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('charcoal')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  theme === 'charcoal'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-xs font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-amber-400" />
                <span>Dark</span>
              </button>
              <button
                type="button"
                onClick={() => onThemeChange('sepia')}
                className={`flex items-center justify-center gap-1.5 py-1.5 px-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                  theme === 'sepia'
                    ? 'bg-[var(--bg-surface)] text-[var(--accent-amber)] shadow-xs font-semibold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                <Coffee className="w-3.5 h-3.5 text-amber-700" />
                <span>Sepia</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
