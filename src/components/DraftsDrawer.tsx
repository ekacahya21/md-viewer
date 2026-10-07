import React from 'react';
import { X, History, Trash2, FileText, ArrowRight } from 'lucide-react';
import type { DocumentDraft, Language } from '../types';
import { translations } from '../i18n/translations';

interface DraftsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  drafts: DocumentDraft[];
  currentId: string;
  onSelectDraft: (draft: DocumentDraft) => void;
  onDeleteDraft: (id: string, e: React.MouseEvent) => void;
  language: Language;
}

export const DraftsDrawer: React.FC<DraftsDrawerProps> = ({
  isOpen,
  onClose,
  drafts,
  currentId,
  onSelectDraft,
  onDeleteDraft,
  language,
}) => {
  if (!isOpen) return null;

  const t = translations[language];

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm h-full flex flex-col bg-[var(--bg-canvas)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xl animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
          <div className="flex items-center gap-2 font-semibold text-sm">
            <History className="w-4 h-4 text-[var(--accent-amber)]" />
            <span>{t.draftsDrawer.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Drafts List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          {drafts.length === 0 ? (
            <div className="text-center py-16 text-[var(--text-muted)] text-xs italic">
              {t.draftsDrawer.empty}
            </div>
          ) : (
            drafts.map((d) => {
              const isCurrent = d.id === currentId;
              const dateStr = new Date(d.updatedAt).toLocaleString(language === 'id' ? 'id-ID' : 'en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              });

              return (
                <div
                  key={d.id}
                  onClick={() => {
                    onSelectDraft(d);
                    onClose();
                  }}
                  className={`group relative p-3 rounded-xl border transition-all cursor-pointer ${
                    isCurrent
                      ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)]/20'
                      : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 font-semibold text-xs truncate text-[var(--text-primary)]">
                      <FileText className="w-3.5 h-3.5 text-[var(--accent-amber)] flex-shrink-0" />
                      <span className="truncate">{d.title || (language === 'id' ? 'Tanpa Judul' : 'Untitled')}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isCurrent && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-[var(--accent-amber)] text-white">
                          {t.common.current}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={(e) => onDeleteDraft(d.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-rose-500/20 hover:text-rose-500 text-[var(--text-muted)] transition-opacity"
                        title={t.draftsDrawer.deleteTitle}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <p className="text-[11px] text-[var(--text-secondary)] line-clamp-2 leading-relaxed mb-2 font-mono">
                    {d.content.replace(/[#*`_~\[\]()$]/g, '').trim().slice(0, 100) || (language === 'id' ? 'Dokumen kosong...' : 'Empty document...')}
                  </p>

                  <div className="flex items-center justify-between text-[10px] text-[var(--text-muted)] font-mono">
                    <span>{dateStr}</span>
                    <span className="flex items-center gap-1">
                      {d.wordCount} {t.common.words}
                      <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-[var(--accent-amber)]" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
