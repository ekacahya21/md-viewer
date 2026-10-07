import React, { useState, useEffect } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  ExternalLink,
  QrCode,
  Clock,
  ShieldCheck,
  Loader2,
  RefreshCw,
  PlusCircle,
  CheckCircle2,
  ArrowLeft,
} from 'lucide-react';
import QRCode from 'qrcode';
import { copyText } from '../utils/exportUtils';
import type { SharedLinkInfo, Language } from '../types';
import { translations } from '../i18n/translations';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
  sharedLink: SharedLinkInfo | null;
  onSaveSharedLink: (info: SharedLinkInfo) => void;
  language: Language;
}

export const ShareModal: React.FC<ShareModalProps> = ({
  isOpen,
  onClose,
  title,
  content,
  sharedLink,
  onSaveSharedLink,
  language,
}) => {
  const [expirationOption, setExpirationOption] = useState<'never' | '7d' | '30d' | '1y'>('never');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [isCreatingNew, setIsCreatingNew] = useState(false);

  const t = translations[language];

  // Active link state (synced with sharedLink prop)
  const [activeLink, setActiveLink] = useState<SharedLinkInfo | null>(sharedLink);

  // Reset / sync state and bind Escape key when modal opens
  useEffect(() => {
    if (isOpen) {
      setActiveLink(sharedLink);
      setIsCreatingNew(!sharedLink);
      setError(null);
      setUpdateSuccess(false);
      setCopied(false);

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, sharedLink, onClose]);

  // Generate QR Code whenever activeLink changes
  useEffect(() => {
    if (activeLink?.shortUrl) {
      QRCode.toDataURL(activeLink.shortUrl, {
        width: 220,
        margin: 1.5,
        color: {
          dark: '#262320',
          light: '#faf8f5',
        },
      })
        .then((url) => setQrDataUrl(url))
        .catch((err) => console.warn('QR code generation error:', err));
    } else {
      setQrDataUrl(null);
    }
  }, [activeLink?.shortUrl]);

  if (!isOpen) return null;

  // Generate new share link (POST /api/share)
  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);

    let expiresAt: number | null = null;
    const now = Date.now();
    if (expirationOption === '7d') {
      expiresAt = now + 7 * 24 * 60 * 60 * 1000;
    } else if (expirationOption === '30d') {
      expiresAt = now + 30 * 24 * 60 * 60 * 1000;
    } else if (expirationOption === '1y') {
      expiresAt = now + 365 * 24 * 60 * 60 * 1000;
    }

    try {
      const response = await fetch('/api/share', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          content,
          expiresAt,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const newInfo: SharedLinkInfo = {
        id: data.id,
        shortUrl: data.shortUrl,
        editToken: data.editToken,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
        expiresAt: data.expiresAt,
      };

      setActiveLink(newInfo);
      setIsCreatingNew(false);
      onSaveSharedLink(newInfo);

      // Persist author edit token so the creator's own visits do not inflate view count
      try {
        const tokens = JSON.parse(localStorage.getItem('md_viewer_author_tokens') || '{}');
        tokens[data.id] = data.editToken;
        localStorage.setItem('md_viewer_author_tokens', JSON.stringify(tokens));
      } catch {}
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (language === 'id' ? 'Gagal membuat tautan berbagi.' : 'Failed to create share link.'));
    } finally {
      setIsGenerating(false);
    }
  };

  // Update existing share link (PUT /api/share/:id with editToken)
  const handleUpdate = async () => {
    if (!activeLink) return;
    setIsUpdating(true);
    setError(null);
    setUpdateSuccess(false);

    try {
      const response = await fetch(`/api/share/${activeLink.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-Edit-Token': activeLink.editToken,
        },
        body: JSON.stringify({
          title,
          content,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error ${response.status}`);
      }

      const data = await response.json();
      const updatedInfo: SharedLinkInfo = {
        ...activeLink,
        updatedAt: data.updatedAt || Date.now(),
      };

      setActiveLink(updatedInfo);
      onSaveSharedLink(updatedInfo);
      setUpdateSuccess(true);
      setTimeout(() => setUpdateSuccess(false), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (language === 'id' ? 'Gagal memperbarui tautan bersama.' : 'Failed to update shared link.'));
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCopy = async () => {
    if (!activeLink?.shortUrl) return;
    await copyText(activeLink.shortUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatDate = (timestamp?: number | null) => {
    if (!timestamp) return null;
    return new Date(timestamp).toLocaleDateString(language === 'id' ? 'id-ID' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150">
      <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] p-5 sm:p-6 shadow-2xl text-[var(--text-primary)]">
        {/* Modal Header */}
        <div className="flex items-center justify-between mb-4 border-b border-[var(--border-subtle)] pb-3">
          <div className="flex items-center gap-2 font-semibold text-base">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-surface)] text-[var(--accent-amber)] flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <span>
              {activeLink && !isCreatingNew
                ? (language === 'id' ? 'Tautan Bersama Aktif' : 'Active Shared Link')
                : t.shareModal.title}
            </span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View 1: Active Link & Update / Re-publish Controls */}
        {activeLink && !isCreatingNew ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            {/* Short URL Bar with Copy */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-[var(--text-secondary)] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{language === 'id' ? 'Short URL Publik' : 'Public Short URL'}</span>
                </label>
                <span className="text-[11px] text-[var(--text-muted)] font-mono">
                  ID: {activeLink.id}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={activeLink.shortUrl}
                  onClick={(e) => (e.target as HTMLInputElement).select()}
                  className="flex-1 px-3 py-2 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)] font-mono text-xs sm:text-sm text-[var(--text-primary)] select-all outline-none"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-amber)] text-white hover:brightness-110 transition-all flex items-center gap-1.5 shadow-xs flex-shrink-0 cursor-pointer"
                >
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? t.common.copied : t.shareModal.copyLink}</span>
                </button>
              </div>
            </div>

            {/* Success Notification Alert */}
            {updateSuccess && (
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 text-xs text-emerald-800 dark:text-emerald-200 flex items-start gap-2 animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0" />
                <div className="space-y-0.5">
                  <p className="font-semibold">{t.shareModal.updateSuccess}</p>
                  <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                    {language === 'id'
                      ? 'Pembaca yang membuka tautan ini akan langsung membaca konten versi terbaru.'
                      : 'Readers opening this link will immediately see the updated version.'}
                  </p>
                </div>
              </div>
            )}

            {/* Error Notification Alert */}
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                {error}
              </div>
            )}

            {/* Re-publish / Update Card */}
            <div className="p-4 rounded-xl border border-[var(--accent-amber)]/40 bg-[var(--accent-surface)]/40 space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-semibold text-xs text-[var(--text-primary)]">
                    <RefreshCw className={`w-3.5 h-3.5 text-[var(--accent-amber)] ${isUpdating ? 'animate-spin' : ''}`} />
                    <span>{language === 'id' ? 'Perbarui Konten Tautan' : 'Update Shared Link Content'}</span>
                  </div>
                  <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                    {language === 'id'
                      ? 'Telah mengedit dokumen? Perbarui tautan ini agar pembaca mendapatkan revisi markdown terbaru tanpa mengubah URL.'
                      : 'Made revisions in the editor? Update this link so readers receive the latest markdown changes without altering the URL.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="text-[10px] text-[var(--text-muted)] font-mono">
                  {activeLink.updatedAt ? `${language === 'id' ? 'Terakhir diperbarui' : 'Last updated'}: ${formatDate(activeLink.updatedAt)}` : ''}
                </div>
                <button
                  type="button"
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-[var(--accent-amber)] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  {isUpdating ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <RefreshCw className="w-3.5 h-3.5" />
                  )}
                  <span>{isUpdating ? t.shareModal.updating : t.shareModal.updateBtn}</span>
                </button>
              </div>
            </div>

            {/* QR Code and Metadata Card */}
            <div className="flex flex-col sm:flex-row items-center gap-4 p-3.5 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)]">
              {qrDataUrl && (
                <div className="p-1.5 rounded-lg bg-white border border-[var(--border-subtle)] shadow-xs flex-shrink-0">
                  <img
                    src={qrDataUrl}
                    alt="QR Code"
                    className="w-24 h-24 object-contain"
                  />
                </div>
              )}
              <div className="flex-1 text-xs space-y-1 text-center sm:text-left">
                <div className="font-semibold text-[var(--text-primary)] flex items-center justify-center sm:justify-start gap-1">
                  <QrCode className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                  <span>{t.shareModal.scanQr}</span>
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                  {language === 'id'
                    ? 'Buka kamera smartphone untuk langsung membaca dokumen ini di browser HP.'
                    : 'Scan with smartphone camera to instantly open and read this document on mobile.'}
                </p>
                <div className="text-[10px] text-[var(--text-muted)] font-mono pt-1 space-y-0.5">
                  <div>
                    {language === 'id' ? 'Masa berlaku' : 'Expires'}:{' '}
                    {activeLink.expiresAt ? formatDate(activeLink.expiresAt) : (language === 'id' ? 'Permanen (Selamanya)' : 'Permanent (Never)')}
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-between pt-2 border-t border-[var(--border-subtle)] text-xs">
              <button
                type="button"
                onClick={() => setIsCreatingNew(true)}
                className="text-[var(--text-secondary)] hover:text-[var(--accent-amber)] flex items-center gap-1 transition-colors font-medium cursor-pointer"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Buat Tautan Baru yang Terpisah' : 'Create a New Separate Link'}</span>
              </button>

              <div className="flex items-center gap-3">
                <a
                  href={activeLink.shortUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[var(--accent-amber)] hover:underline flex items-center gap-1 font-medium"
                >
                  <span>{t.shareModal.viewOnline}</span>
                  <ExternalLink className="w-3 h-3" />
                </a>

                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-lg font-semibold bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] transition-colors cursor-pointer"
                >
                  {t.common.close}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* View 2: Configure & Generate New Link */
          <div className="space-y-4 animate-in fade-in duration-200">
            {activeLink && (
              <button
                type="button"
                onClick={() => setIsCreatingNew(false)}
                className="inline-flex items-center gap-1.5 text-xs text-[var(--accent-amber)] hover:underline font-medium mb-1 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{language === 'id' ? 'Kembali ke tautan aktif' : 'Back to active link'}</span>
              </button>
            )}

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                {language === 'id' ? 'Judul Dokumen' : 'Document Title'}
              </label>
              <div className="px-3 py-2 rounded-lg bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-sm font-medium text-[var(--text-primary)] truncate">
                {title || (language === 'id' ? 'Dokumen Tanpa Judul' : 'Untitled Document')}
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-[var(--accent-amber)]" />
                <span>{t.shareModal.expiration}</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { key: 'never', label: t.shareModal.never },
                  { key: '7d', label: t.shareModal.days7 },
                  { key: '30d', label: t.shareModal.days30 },
                  { key: '1y', label: t.shareModal.year1 },
                ].map((opt) => (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setExpirationOption(opt.key as typeof expirationOption)}
                    className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all cursor-pointer ${
                      expirationOption === opt.key
                        ? 'border-[var(--accent-amber)] bg-[var(--accent-surface)] text-[var(--accent-amber)] font-bold shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[var(--text-secondary)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[var(--bg-canvas)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-[var(--text-primary)]">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>{language === 'id' ? 'Perlindungan Read-Only & Fork' : 'Read-Only & Fork Protection'}</span>
              </div>
              <p className="leading-relaxed">
                {language === 'id'
                  ? 'Penerima tautan akan membuka dokumen dalam mode Read-Only yang bersih. Anda dapat memperbarui dokumen ini kapan saja dari modal ini, sementara pembaca dapat melakukan Fork & Edit untuk menyalin ke editor pribadi mereka tanpa mengubah dokumen asli Anda.'
                  : 'Recipients open the document in a clean Read-Only view. You can update this document anytime from this modal, while readers can Fork & Edit to copy it into their private editor without affecting your original.'}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200">
                {error}
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-subtle)]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-lg text-xs font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
              >
                {t.common.cancel}
              </button>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-5 py-2 rounded-lg text-xs font-semibold bg-[var(--accent-amber)] text-white hover:brightness-110 disabled:opacity-50 transition-all flex items-center gap-1.5 shadow-xs cursor-pointer"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Share2 className="w-3.5 h-3.5" />
                )}
                <span>{isGenerating ? t.shareModal.generating : t.shareModal.createBtn}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
