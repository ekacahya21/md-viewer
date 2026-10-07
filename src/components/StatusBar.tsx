import React from 'react';
import type { ReadingStats, ViewMode, Language } from '../types';
import { translations } from '../i18n/translations';

interface StatusBarProps {
  stats: ReadingStats;
  viewMode: ViewMode;
  language: Language;
  splitRatio?: number;
  onResetSplit?: () => void;
  onOpenCommandPalette: () => void;
  onOpenShortcutsModal: () => void;
  isSaved: boolean;
}

export const StatusBar: React.FC<StatusBarProps> = ({
  stats,
  viewMode,
  language,
  splitRatio = 50,
  onResetSplit,
  onOpenCommandPalette,
  onOpenShortcutsModal,
  isSaved,
}) => {
  const t = translations[language];

  return (
    <footer className="hidden sm:flex items-center justify-between w-full h-7 px-4 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/95 backdrop-blur-md text-[11px] font-mono text-[var(--text-muted)] select-none flex-shrink-0 z-20">
      {/* Left: Document Reading Stats */}
      <div className="flex items-center gap-2.5">
        <span className="text-[var(--text-secondary)] font-medium">
          {stats.words.toLocaleString()} {t.common.words}
        </span>
        <span className="opacity-40">•</span>
        <span>{stats.readingTimeMinutes} {t.common.minRead}</span>
        <span className="hidden md:inline opacity-40">•</span>
        <span className="hidden md:inline">{stats.characters.toLocaleString()} {t.common.chars}</span>
      </div>

      {/* Center: Split Ratio info if in Split Mode */}
      {viewMode === 'split' && (
        <button
          type="button"
          onClick={onResetSplit}
          className="hidden md:flex items-center gap-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer px-2 py-0.5 rounded hover:bg-[var(--bg-subtle)]"
          title="Reset 50/50 split"
        >
          <span>Split: {Math.round(splitRatio)}%</span>
          <span className="text-[9px] opacity-60">{t.statusBar.splitReset}</span>
        </button>
      )}

      {/* Right: Auto-saved indicator & shortcuts hint */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              isSaved ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'
            }`}
          />
          <span className="text-[10px] text-[var(--text-secondary)]">
            {isSaved ? t.common.allSaved : t.common.saving}
          </span>
        </div>

        <span className="hidden lg:inline text-[var(--border-subtle)]">|</span>

        <button
          type="button"
          onClick={onOpenCommandPalette}
          className="hidden lg:flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Open Command Palette (⌘K)"
        >
          <kbd className="px-1 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[9px]">
            ⌘K
          </kbd>
          <span className="text-[10px]">{t.statusBar.commands}</span>
        </button>

        <button
          type="button"
          onClick={onOpenShortcutsModal}
          className="hidden xl:flex items-center gap-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors cursor-pointer"
          title="Keyboard shortcuts & FAQ (?)"
        >
          <kbd className="px-1 py-0.2 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[9px]">
            ?
          </kbd>
          <span className="text-[10px]">{t.statusBar.shortcuts}</span>
        </button>
      </div>
    </footer>
  );
};
