import React, { useState } from 'react';
import {
  Compass,
  X,
  Copy,
  Check,
  RefreshCw,
  AlertCircle,
  FileText,
  BookOpen,
} from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';
import { useDocumentSummary, type UseDocumentSummaryReturn } from '../hooks/useDocumentSummary';

export interface SummaryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  language?: Language;
  summaryState?: UseDocumentSummaryReturn;
}

export const SummaryDrawer: React.FC<SummaryDrawerProps> = ({
  isOpen,
  onClose,
  title,
  content,
  language = 'en',
  summaryState,
}) => {
  const fallbackSummary = useDocumentSummary(content, title, language);
  const activeSummary = summaryState || fallbackSummary;
  const { data, isLoading, isAnalyzing, error, refresh } = activeSummary;

  const [copied, setCopied] = useState<boolean>(false);
  const t = translations[language];

  const handleCopy = async () => {
    if (!data) return;
    const text = `Executive Summary:\n${data.tldr}\n\nKey Takeaways:\n${data.takeaways.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="lg:hidden fixed inset-0 bg-black/40 z-30 backdrop-blur-[1px] animate-in fade-in duration-200 cursor-pointer"
        onClick={onClose}
        aria-hidden="true"
      />

      <aside className="fixed lg:static right-0 top-0 bottom-0 w-80 max-w-[85vw] h-full flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] z-40 lg:z-auto shadow-2xl lg:shadow-none animate-in slide-in-from-right-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] select-none">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg bg-[var(--accent-surface)] text-[var(--accent-amber)] flex items-center justify-center flex-shrink-0">
            <Compass className="w-3.5 h-3.5" />
          </div>
          <div>
            <div className="font-bold text-xs text-[var(--text-primary)] flex items-center gap-1.5">
              <span>{t.summaryDrawer.title}</span>
            </div>
            <span className="text-[10px] text-[var(--text-muted)] block truncate max-w-[170px]">
              {isAnalyzing ? t.summaryDrawer.analyzing : (title || (language === 'id' ? 'Dokumen Aktif' : 'Active Document'))}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={handleCopy}
            disabled={!data || isLoading}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
            title={copied ? t.common.copied : t.summaryDrawer.copySummary}
          >
            {copied ? (
              <Check className="w-3.5 h-3.5 text-emerald-500" />
            ) : (
              <Copy className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            onClick={refresh}
            disabled={isLoading}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors disabled:opacity-40 cursor-pointer"
            title={t.summaryDrawer.refresh}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[var(--accent-amber)]' : ''}`} />
          </button>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Drawer Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 text-xs select-text">
        {/* Loading / Idle Delay State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center space-y-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-2xl bg-[var(--accent-surface)] text-[var(--accent-amber)] border border-[var(--accent-amber)]/30">
              <Compass className={`w-6 h-6 ${isAnalyzing ? 'animate-spin' : ''}`} />
            </div>
            <div className="space-y-1">
              <p className="font-medium text-[var(--text-primary)] text-sm">
                {isAnalyzing ? (language === 'id' ? 'Menganalisis Dokumen...' : 'Analyzing Document...') : (language === 'id' ? 'Menyiapkan Intisari Dokumen...' : 'Preparing Document Insights...')}
              </p>
              <p className="text-[11px] text-[var(--text-secondary)]">
                {isAnalyzing
                  ? (language === 'id' ? 'Menyaring poin-poin terpenting dan intisari teknis' : 'Distilling core insights and technical concepts')
                  : t.summaryDrawer.idle}
              </p>
            </div>

            {!isAnalyzing && (
              <button
                onClick={refresh}
                className="mt-1 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[var(--accent-surface)] hover:bg-[var(--border-subtle)] text-[var(--accent-amber)] font-medium text-[11px] transition-colors border border-[var(--accent-amber)]/25 cursor-pointer"
              >
                <BookOpen className="w-3 h-3" />
                <span>{t.summaryDrawer.summarizeNow}</span>
              </button>
            )}

            <div className="w-full max-w-xs space-y-2 pt-2">
              <div className="h-3 bg-[var(--border-subtle)]/70 rounded-full animate-pulse" />
              <div className="h-3 bg-[var(--border-subtle)]/50 rounded-full w-4/5 animate-pulse" />
              <div className="h-3 bg-[var(--border-subtle)]/40 rounded-full w-3/5 animate-pulse" />
            </div>
          </div>
        )}

        {/* Error State */}
        {!isLoading && error && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 space-y-2">
            <div className="flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{language === 'id' ? 'Gagal Membuat Ringkasan' : 'Failed to Generate Summary'}</span>
            </div>
            <p className="text-[11px] leading-relaxed">{error}</p>
            <button
              onClick={refresh}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-xs font-medium transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>{language === 'id' ? 'Coba Lagi' : 'Try Again'}</span>
            </button>
          </div>
        )}

        {/* Success Output */}
        {!isLoading && !error && data && (
          <div className="space-y-4 animate-in fade-in duration-150">
            {/* TL;DR Section */}
            <div className="p-3.5 rounded-xl bg-[var(--accent-surface)]/70 border border-[var(--accent-amber)]/25 space-y-1.5">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[var(--accent-amber)] tracking-wider uppercase">
                <FileText className="w-3.5 h-3.5" />
                <span>{t.summaryDrawer.tldrTitle}</span>
              </div>
              <p className="text-[var(--text-primary)] text-xs sm:text-[13px] leading-relaxed font-medium">
                {data.tldr}
              </p>
            </div>

            {/* Key Takeaways Section */}
            {data.takeaways && data.takeaways.length > 0 && (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--text-secondary)] tracking-wider uppercase">
                  <span>{t.summaryDrawer.takeawaysTitle}</span>
                  <span className="font-mono text-[10px] px-1.5 py-0.5 rounded-full bg-[var(--border-subtle)] text-[var(--text-secondary)]">
                    {data.takeaways.length} {language === 'id' ? 'poin' : 'points'}
                  </span>
                </div>

                <div className="space-y-2">
                  {data.takeaways.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs flex items-start gap-2.5 hover:border-[var(--accent-amber)]/40 transition-colors"
                    >
                      <span className="flex-shrink-0 w-4 h-4 rounded-full bg-[var(--accent-surface)] text-[var(--accent-amber)] text-[10px] font-bold flex items-center justify-center font-mono">
                        {idx + 1}
                      </span>
                      <span className="text-[var(--text-primary)] leading-relaxed">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </aside>
  </>
  );
};

export default SummaryDrawer;
