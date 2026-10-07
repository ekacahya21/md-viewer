import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  Search,
  Plus,
  FolderOpen,
  History,
  Share2,
  ListTree,
  FileCode,
  Printer,
  Download,
  Copy,
  BookOpen,
  Columns,
  PenLine,
  Sun,
  Moon,
  Coffee,
  Check,
  X,
  Compass,
} from 'lucide-react';
import type { ViewMode, ThemeMode, Language } from '../types';

export interface CommandItem {
  id: string;
  category: string;
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  shortcut?: string;
  action: () => void;
  active?: boolean;
}

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onNewDoc: () => void;
  onOpenFile: () => void;
  onOpenDrafts: () => void;
  onOpenShare: () => void;
  onToggleToc: () => void;
  isTocOpen: boolean;
  isSummaryOpen?: boolean;
  onToggleSummary?: () => void;
  onExportHtml: () => void;
  onPrintPdf: () => void;
  onDownloadMd: () => void;
  onCopyMd: () => void;
  viewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  theme: ThemeMode;
  onThemeChange: (theme: ThemeMode) => void;
  onResetSplit?: () => void;
  language?: Language;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onNewDoc,
  onOpenFile,
  onOpenDrafts,
  onOpenShare,
  onToggleToc,
  isTocOpen,
  isSummaryOpen = false,
  onToggleSummary,
  onExportHtml,
  onPrintPdf,
  onDownloadMd,
  onCopyMd,
  viewMode,
  onViewModeChange,
  theme,
  onThemeChange,
  onResetSplit,
  language = 'en',
}) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const isMac = useMemo(() => {
    return typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform);
  }, []);

  const modKey = isMac ? '⌘' : 'Ctrl+';

  const commands: CommandItem[] = useMemo(() => {
    const isId = language === 'id';
    return [
      // Actions
      {
        id: 'new-doc',
        category: isId ? 'Aksi Dokumen' : 'Actions',
        title: isId ? 'Dokumen Baru' : 'New Blank Document',
        subtitle: isId ? 'Buat lembar draf markdown baru' : 'Create a fresh markdown draft',
        icon: <Plus className="w-4 h-4 text-[var(--accent-amber)]" />,
        shortcut: `${modKey}N`,
        action: onNewDoc,
      },
      {
        id: 'open-file',
        category: isId ? 'Aksi Dokumen' : 'Actions',
        title: isId ? 'Buka File Markdown...' : 'Open Markdown File...',
        subtitle: isId ? 'Buka file .md, .markdown, atau .txt dari perangkat' : 'Import .md, .markdown, or .txt from your computer',
        icon: <FolderOpen className="w-4 h-4" />,
        shortcut: `${modKey}O`,
        action: onOpenFile,
      },
      {
        id: 'recent-drafts',
        category: isId ? 'Aksi Dokumen' : 'Actions',
        title: isId ? 'Riwayat Draft Tersimpan' : 'Recent Drafts & History',
        subtitle: isId ? 'Lihat daftar draf tersimpan di browser ini' : 'Browse autosaved versions on this device',
        icon: <History className="w-4 h-4" />,
        shortcut: `${modKey}D`,
        action: onOpenDrafts,
      },
      {
        id: 'share-url',
        category: isId ? 'Aksi Dokumen' : 'Actions',
        title: isId ? 'Bagikan Dokumen via URL' : 'Share via Short URL',
        subtitle: isId ? 'Buat atau perbarui tautan bersama publik' : 'Generate or update a clean read-only short link',
        icon: <Share2 className="w-4 h-4 text-[var(--accent-amber)]" />,
        shortcut: `${modKey}S`,
        action: onOpenShare,
      },
      {
        id: 'toggle-toc',
        category: isId ? 'Aksi Dokumen' : 'Actions',
        title: isId ? 'Buka / Tutup Daftar Isi' : 'Toggle Table of Contents (Outline)',
        subtitle: isId ? 'Buka navigasi struktur judul dan bab' : 'Show or hide the document outline sidebar',
        icon: <ListTree className="w-4 h-4 text-sky-600" />,
        action: onToggleToc,
        active: isTocOpen,
      },
      ...(onToggleSummary
        ? [
            {
              id: 'toggle-summary',
              category: isId ? 'Aksi Dokumen' : 'Actions',
              title: isId ? 'Buka / Tutup Intisari Dokumen' : 'Toggle Document Insights',
              subtitle: isId ? 'Lihat intisari eksekutif & poin penting' : 'Show or hide the executive brief & key takeaways',
              icon: <Compass className="w-4 h-4 text-[var(--accent-amber)]" />,
              action: onToggleSummary,
              active: isSummaryOpen,
            },
          ]
        : []),

      // Export
      {
        id: 'export-html',
        category: 'Export',
        title: isId ? 'Export Standalone HTML' : 'Export Standalone HTML',
        subtitle: isId ? 'Unduh satu file HTML lengkap beserta rumus & diagram' : 'Single portable HTML file with inlined math & diagrams',
        icon: <FileCode className="w-4 h-4 text-amber-600" />,
        action: onExportHtml,
      },
      {
        id: 'export-pdf',
        category: 'Export',
        title: isId ? 'Cetak / Simpan sebagai PDF' : 'Print / Save as PDF',
        subtitle: isId ? 'Buka dialog cetak browser dengan tata letak dokumen bersih' : 'Clean document print stylesheet',
        icon: <Printer className="w-4 h-4 text-emerald-600" />,
        shortcut: `${modKey}P`,
        action: onPrintPdf,
      },
      {
        id: 'download-md',
        category: 'Export',
        title: isId ? 'Download File Markdown (.md)' : 'Download Markdown (.md)',
        subtitle: isId ? 'Simpan file teks mentah markdown' : 'Save raw markdown source file',
        icon: <Download className="w-4 h-4 text-sky-600" />,
        action: onDownloadMd,
      },
      {
        id: 'copy-md',
        category: 'Export',
        title: isId ? 'Salin Markdown ke Clipboard' : 'Copy Markdown to Clipboard',
        subtitle: isId ? 'Salin seluruh teks markdown saat ini' : 'Copy full markdown content to clipboard',
        icon: <Copy className="w-4 h-4 text-[var(--text-secondary)]" />,
        action: onCopyMd,
      },

      // View
      {
        id: 'view-reader',
        category: isId ? 'Tampilan' : 'View',
        title: isId ? 'Mode Reader (Baca Saja)' : 'Reader Mode',
        subtitle: isId ? 'Tampilan membaca penuh tanpa editor' : 'Distraction-free reading view',
        icon: <BookOpen className="w-4 h-4 text-[var(--accent-amber)]" />,
        shortcut: `${modKey}1`,
        action: () => onViewModeChange('reader'),
        active: viewMode === 'reader',
      },
      {
        id: 'view-split',
        category: isId ? 'Tampilan' : 'View',
        title: isId ? 'Mode Split (Editor & Preview)' : 'Split Mode (Side by Side)',
        subtitle: isId ? 'Tampilan berdampingan editor dan pratinjau' : 'Editor and live reader view side by side',
        icon: <Columns className="w-4 h-4 text-[var(--accent-amber)]" />,
        shortcut: `${modKey}2`,
        action: () => onViewModeChange('split'),
        active: viewMode === 'split',
      },
      {
        id: 'view-editor',
        category: isId ? 'Tampilan' : 'View',
        title: isId ? 'Mode Editor (Fokus Menulis)' : 'Editor Mode (Raw Code)',
        subtitle: isId ? 'Tampilan editor penuh untuk menulis' : 'Full width editor view',
        icon: <PenLine className="w-4 h-4 text-[var(--accent-amber)]" />,
        shortcut: `${modKey}3`,
        action: () => onViewModeChange('editor'),
        active: viewMode === 'editor',
      },
      ...(onResetSplit && viewMode === 'split'
        ? [
            {
              id: 'reset-split',
              category: isId ? 'Tampilan' : 'View',
              title: isId ? 'Reset Pembagian Split 50/50' : 'Reset Split to 50/50',
              subtitle: isId ? 'Kembalikan lebar editor dan preview ke ukuran seimbang' : 'Restore equal split width ratio',
              icon: <Columns className="w-4 h-4 text-[var(--accent-amber)]" />,
              action: onResetSplit,
            },
          ]
        : []),

      // Theme
      {
        id: 'theme-paper',
        category: isId ? 'Tema' : 'Theme',
        title: isId ? 'Tema Paper (Terang)' : 'Paper Theme (Light)',
        subtitle: isId ? 'Latar belakang putih bersih khas kertas' : 'Editorial crisp light background',
        icon: <Sun className="w-4 h-4 text-amber-600" />,
        action: () => onThemeChange('paper'),
        active: theme === 'paper',
      },
      {
        id: 'theme-charcoal',
        category: isId ? 'Tema' : 'Theme',
        title: isId ? 'Tema Charcoal (Gelap)' : 'Charcoal Theme (Dark)',
        subtitle: isId ? 'Mode gelap nyaman untuk mata' : 'Deep dark theme for low light environments',
        icon: <Moon className="w-4 h-4 text-amber-400" />,
        action: () => onThemeChange('charcoal'),
        active: theme === 'charcoal',
      },
      {
        id: 'theme-sepia',
        category: isId ? 'Tema' : 'Theme',
        title: isId ? 'Tema Sepia (Buku)' : 'Sepia Theme (Book Warm)',
        subtitle: isId ? 'Nuansa hangat seperti buku cetak' : 'Warm cream tones for prolonged reading comfort',
        icon: <Coffee className="w-4 h-4 text-amber-700" />,
        action: () => onThemeChange('sepia'),
        active: theme === 'sepia',
      },
    ];
  }, [
    language,
    modKey,
    onNewDoc,
    onOpenFile,
    onOpenDrafts,
    onOpenShare,
    onToggleToc,
    isTocOpen,
    onToggleSummary,
    isSummaryOpen,
    onExportHtml,
    onPrintPdf,
    onDownloadMd,
    onCopyMd,
    onViewModeChange,
    viewMode,
    onResetSplit,
    onThemeChange,
    theme,
  ]);

  // Filter commands by search query
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        (c.subtitle && c.subtitle.toLowerCase().includes(q)) ||
        c.category.toLowerCase().includes(q)
    );
  }, [commands, query]);

  // Focus input and reset query on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keep selected index in bounds when list changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll active item into view
  useEffect(() => {
    if (listRef.current) {
      const activeEl = listRef.current.children[selectedIndex] as HTMLElement | undefined;
      if (activeEl) {
        activeEl.scrollIntoView({ block: 'nearest' });
      }
    }
  }, [selectedIndex]);

  // Keyboard navigation inside palette
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(1, filteredCommands.length));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev === 0 ? Math.max(0, filteredCommands.length - 1) : prev - 1
      );
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const selected = filteredCommands[selectedIndex];
      if (selected) {
        selected.action();
        onClose();
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] sm:pt-[15vh] p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-100"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl text-[var(--text-primary)] overflow-hidden flex flex-col max-h-[70vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input Bar */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-surface)]">
          <Search className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={language === 'id' ? 'Cari perintah, aksi dokumen, atau navigasi...' : 'Search commands, actions, or tools...'}
            className="flex-1 bg-transparent text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          ) : (
            <span className="hidden sm:inline-block px-1.5 py-0.5 rounded text-[10px] font-mono font-medium text-[var(--text-muted)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)]">
              ESC to exit
            </span>
          )}
        </div>

        {/* Command List */}
        <div ref={listRef} className="flex-1 overflow-y-auto p-2 space-y-1">
          {filteredCommands.length === 0 ? (
            <div className="py-8 text-center text-xs text-[var(--text-muted)]">
              {language === 'id' ? 'Tidak ada perintah yang cocok.' : 'No matching commands found.'}
            </div>
          ) : (
            filteredCommands.map((cmd, idx) => {
              const isSelected = idx === selectedIndex;
              return (
                <button
                  key={cmd.id}
                  onClick={() => {
                    cmd.action();
                    onClose();
                  }}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-[var(--accent-surface)] text-[var(--text-primary)]'
                      : 'hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                        isSelected
                          ? 'bg-[var(--accent-amber)] text-white shadow-xs'
                          : 'bg-[var(--bg-subtle)] text-[var(--text-secondary)]'
                      }`}
                    >
                      {cmd.icon}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-semibold truncate ${isSelected ? 'text-[var(--text-primary)]' : ''}`}>
                          {cmd.title}
                        </span>
                        {cmd.active && (
                          <Check className="w-3.5 h-3.5 text-[var(--accent-amber)] flex-shrink-0" />
                        )}
                      </div>
                      {cmd.subtitle && (
                        <p className="text-[11px] text-[var(--text-muted)] truncate mt-0.5">
                          {cmd.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  {cmd.shortcut && (
                    <kbd className="hidden sm:inline-block px-2 py-0.5 rounded text-[10px] font-mono text-[var(--text-muted)] bg-[var(--bg-canvas)] border border-[var(--border-subtle)] ml-3 flex-shrink-0">
                      {cmd.shortcut}
                    </kbd>
                  )}
                </button>
              );
            })
          )}
        </div>

        {/* Footer info bar */}
        <div className="px-4 py-2 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)]/50 text-[11px] text-[var(--text-muted)] flex items-center justify-between select-none">
          <div className="flex items-center gap-3">
            <span>↑↓ {language === 'id' ? 'Navigasi' : 'Navigate'}</span>
            <span>↵ {language === 'id' ? 'Pilih' : 'Select'}</span>
          </div>
          <span className="font-mono text-[10px]">MD Viewer Studio</span>
        </div>
      </div>
    </div>
  );
};
