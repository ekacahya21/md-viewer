import React, { useState } from 'react';
import { X, Globe, AlertCircle, Loader2 } from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

interface UrlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadContent: (content: string, urlTitle?: string) => void;
  language: Language;
}

export const UrlModal: React.FC<UrlModalProps> = ({
  isOpen,
  onClose,
  onLoadContent,
  language,
}) => {
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const t = translations[language];

  const handleFetch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;

    setIsLoading(true);
    setError(null);

    let targetUrl = url.trim();

    // Convert github blob URL to raw
    if (targetUrl.includes('github.com') && targetUrl.includes('/blob/')) {
      targetUrl = targetUrl
        .replace('github.com', 'raw.githubusercontent.com')
        .replace('/blob/', '/');
    }

    try {
      const response = await fetch(targetUrl);
      if (!response.ok) {
        throw new Error(`HTTP Error ${response.status}: ${response.statusText}`);
      }
      const text = await response.text();

      // Extract filename from URL as title
      const filename = targetUrl.split('/').pop()?.replace(/\.(md|markdown|txt)$/i, '') || (language === 'id' ? 'Dokumen Impor' : 'Imported Document');

      onLoadContent(text, filename);
      onClose();
    } catch (err: unknown) {
      console.error('Fetch error:', err);
      setError(
        err instanceof Error
          ? err.message
          : (language === 'id' ? 'Gagal mengambil file markdown dari URL.' : 'Failed to fetch markdown file from URL.')
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-6 shadow-2xl text-[var(--text-primary)]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 font-semibold text-base">
            <Globe className="w-5 h-5 text-[var(--accent-amber)]" />
            <span>{t.urlModal.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleFetch} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
              {t.urlModal.inputLabel}
            </label>
            <input
              type="url"
              required
              placeholder={t.urlModal.placeholder}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:border-[var(--accent-amber)] outline-none transition-colors"
            />
            <p className="text-[11px] text-[var(--text-muted)] mt-1.5">
              {language === 'id'
                ? 'Tips: URL file GitHub standar otomatis dikonversi ke format raw.'
                : 'Tip: Standard GitHub file URLs are automatically converted to raw format.'}
            </p>
          </div>

          {error && (
            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            >
              {t.common.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading || !url.trim()}
              className="px-4 py-2 rounded-lg text-xs font-medium bg-[var(--accent-amber)] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{isLoading ? t.urlModal.loading : t.urlModal.loadBtn}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
