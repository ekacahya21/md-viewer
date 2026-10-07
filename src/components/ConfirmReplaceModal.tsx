import React, { useEffect } from 'react';
import { AlertTriangle, FileText, ArrowRight, X, FileUp } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

interface ConfirmReplaceModalProps {
  isOpen: boolean;
  file: File | null;
  currentTitle: string;
  onConfirm: () => void;
  onCancel: () => void;
  language: Language;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export const ConfirmReplaceModal: React.FC<ConfirmReplaceModalProps> = ({
  isOpen,
  file,
  currentTitle,
  onConfirm,
  onCancel,
  language,
}) => {
  const t = translations[language];

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      } else if (e.key === 'Enter') {
        e.preventDefault();
        onConfirm();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onCancel, onConfirm]);

  if (!isOpen || !file) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl text-[var(--text-primary)]">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5 font-bold text-base text-[var(--text-primary)]">
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-[var(--accent-amber)] flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>{t.confirmReplaceModal.title}</span>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="p-1.5 rounded-lg text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-[var(--text-secondary)] mb-4 leading-relaxed">
          {t.confirmReplaceModal.description}
        </p>

        {/* Document comparison cards */}
        <div className="space-y-2.5 mb-4">
          {/* Current Document */}
          <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center flex-shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--text-muted)]">
                {t.confirmReplaceModal.currentDoc}
              </div>
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate mt-0.5">
                {currentTitle || 'Untitled Document'}
              </div>
            </div>
          </div>

          {/* Replacement Indicator Arrow */}
          <div className="flex justify-center -my-1 text-[var(--accent-amber)]">
            <ArrowRight className="w-4 h-4 rotate-90 opacity-70" />
          </div>

          {/* Incoming Dropped File */}
          <div className="p-3 rounded-xl border border-[var(--accent-amber)]/30 bg-[var(--accent-surface)]/40 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-amber)] text-white flex items-center justify-center flex-shrink-0 shadow-2xs">
              <FileUp className="w-4 h-4" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-amber)]">
                {t.confirmReplaceModal.newFile}
              </div>
              <div className="text-xs font-bold text-[var(--text-primary)] truncate mt-0.5">
                {file.name}
              </div>
              <div className="text-[10px] font-mono text-[var(--text-muted)] mt-0.5">
                {formatBytes(file.size)}
              </div>
            </div>
          </div>
        </div>

        {/* Warning Callout */}
        <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-[var(--text-secondary)] mb-5 leading-normal">
          {t.confirmReplaceModal.warning}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] border border-[var(--border-subtle)] transition-colors cursor-pointer"
          >
            {t.confirmReplaceModal.cancel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-[var(--accent-amber)] text-white hover:brightness-110 active:scale-95 transition-all shadow-xs cursor-pointer flex items-center gap-1.5"
          >
            <span>{t.confirmReplaceModal.confirm}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmReplaceModal;
