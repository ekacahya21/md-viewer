import React, { useState, useEffect } from 'react';
import {
  X,
  Command,
  BookOpen,
  Sigma,
  Network,
  FileCode,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ShieldCheck,
} from 'lucide-react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

interface FaqItem {
  question: string;
  answer: string;
  category?: string;
}

const FAQ_LIST_EN: FaqItem[] = [
  {
    question: 'What is MD Viewer and what makes it special?',
    answer:
      'MD Viewer is a fast, distraction-free Markdown studio and reading companion built to editorial typography standards. It delivers instant local rendering with zero sign-up required. Key features include native Mermaid 11+ vector diagrams, KaTeX LaTeX math equations, instant PDF and Standalone HTML export, and one-click Short URL sharing.',
  },
  {
    question: 'How do I render Mermaid diagrams?',
    answer:
      'Write a fenced code block with the "mermaid" language tag. MD Viewer supports flowcharts, sequence diagrams, ER diagrams, class diagrams, Gantt charts, mindmaps, and git graphs. Diagrams are rendered sharp, interactive, and responsive to your chosen theme.',
  },
  {
    question: 'How do I write KaTeX / LaTeX math formulas?',
    answer:
      'Use single dollar signs ($E = mc^2$) for inline formulas within sentences, or double dollar signs ($$...$$) for centered display blocks. KaTeX renders mathematical notation with academic typography standards.',
  },
  {
    question: 'Is MD Viewer free? Does it require an account?',
    answer:
      'MD Viewer is 100% free and operates on a privacy-first model. No account creation, email, or login is needed. All your drafts are stored securely in your browser\'s local storage.',
  },
  {
    question: 'How does sharing with Short URLs work?',
    answer:
      'Click the "Share" button in the top bar to generate an instant short URL (e.g. https://md-viewer.e21.dev/s/xyz) along with a scannable QR code. Recipients open the document in a clean Read-Only view. They can also click "Fork & Edit" to clone the document into their own editor without affecting yours.',
  },
  {
    question: 'If I edit my document, how do I update the shared link?',
    answer:
      'Your work in progress is never automatically published while editing. When your revisions are ready, open the "Share" modal and click "Update Shared Link Now". The same URL will immediately reflect your latest version with an "Updated" badge for readers.',
  },
  {
    question: 'Can I publish Markdown files directly from my terminal?',
    answer:
      'Yes! You can use our official "mdv" CLI tool. Install it with: curl -fsSL https://md-viewer.e21.dev/install.sh | bash. Then run "mdv README.md" or "cat file.md | mdv" to instantly publish and get a short URL copied to your clipboard.',
  },
];

const FAQ_LIST_ID: FaqItem[] = [
  {
    question: 'Apa itu MD Viewer dan apa saja keunggulannya?',
    answer:
      'MD Viewer adalah aplikasi web Markdown Studio dan Reader minimalis berstandar editorial. Didesain dengan prinsip Google Stitch: tanpa distraksi, ringan, dan fokus pada kenyamanan membaca. Keunggulan utamanya meliputi rendering diagram Mermaid 11+, formula matematika KaTeX LaTeX, ekspor instan ke PDF dan Standalone HTML, serta tautan bersama (Short URL) instan tanpa perlu mendaftar akun.',
  },
  {
    question: 'Apakah bisa mengunggah file Markdown langsung dari terminal / command line?',
    answer:
      'Ya! MD Viewer menyediakan CLI tool resmi "mdv". Pasang dengan perintah: curl -fsSL https://md-viewer.e21.dev/install.sh | bash. Selanjutnya jalankan "mdv README.md" atau "cat file.md | mdv" untuk mempublikasikan dan langsung menyalin Short URL ke clipboard.',
  },
  {
    question: 'Bagaimana cara menampilkan diagram Mermaid?',
    answer:
      'Gunakan blok kode dengan penanda bahasa "mermaid". MD Viewer mendukung flowchart, sequence diagram, ER diagram, class diagram, gantt chart, mindmap, dan git graph. Diagram akan dirender otomatis, tajam, dan responsif sesuai tema yang dipilih.',
  },
  {
    question: 'Bagaimana cara menulis rumus matematika KaTeX / LaTeX?',
    answer:
      'Gunakan tanda dolar tunggal ($E = mc^2$) untuk rumus sebaris di tengah teks, atau tanda dolar ganda ($$...$$) untuk rumus matematika di baris terpisah. KaTeX merender persamaan dengan standar tipografi ilmiah yang tajam.',
  },
  {
    question: 'Apakah MD Viewer gratis dan memerlukan login akun?',
    answer:
      'MD Viewer 100% gratis digunakan dan beroperasi dengan prinsip privacy-first. Anda tidak perlu membuat akun atau login. Seluruh draf tersimpan secara lokal di browser Anda.',
  },
  {
    question: 'Bagaimana cara membagikan dokumen dengan Short URL?',
    answer:
      'Klik tombol "Share" di bilah atas untuk membuat tautan pendek publik (contoh: https://md-viewer.e21.dev/s/xyz) beserta QR code siap pindai. Penerima akan membuka dokumen dalam tampilan Read-Only yang rapi dan dapat menekan "Fork & Edit" untuk menyalin ke editor pribadi mereka.',
  },
  {
    question: 'Jika saya mengedit dokumen, bagaimana cara memperbarui tautan?',
    answer:
      'Draf Anda tidak otomatis terpublikasikan saat Anda mengetik. Saat revisi selesai, buka menu "Share" dan klik "Perbarui Tautan Sekarang". Tautan yang sama akan langsung menampilkan isi terbaru dengan tanda "Telah diperbarui".',
  },
  {
    question: 'Bagaimana cara mengekspor dokumen ke PDF atau HTML mandiri?',
    answer:
      'Buka menu dropdown "Export" di bilah atas: pilih "Cetak / Simpan PDF" untuk mencetak dokumen dalam format rapi, atau pilih "Standalone HTML" untuk mengunduh satu file HTML mandiri yang sudah menyertakan diagram dan rumus tanpa bergantung pada koneksi internet.',
  },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose, language }) => {
  const [activeTab, setActiveTab] = useState<'faq' | 'shortcuts'>('faq');
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const t = translations[language];
  const faqList = language === 'id' ? FAQ_LIST_ID : FAQ_LIST_EN;

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs select-none animate-in fade-in duration-150"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl max-h-[88vh] flex flex-col rounded-2xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-2xl text-[var(--text-primary)] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3.5 border-b border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
          <div className="flex items-center gap-2 font-semibold text-base">
            <div className="w-7 h-7 rounded-lg bg-[var(--accent-surface)] text-[var(--accent-amber)] flex items-center justify-center">
              <HelpCircle className="w-4 h-4" />
            </div>
            <span>{t.shortcutsModal.title}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
            title={t.common.close}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex border-b border-[var(--border-subtle)] bg-[var(--bg-subtle)]/40 px-5 sm:px-6 pt-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab('faq')}
            className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'faq'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-semibold bg-[var(--bg-surface)] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{t.shortcutsModal.faqTab}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('shortcuts')}
            className={`flex items-center gap-1.5 px-3 py-2 font-medium border-b-2 transition-all cursor-pointer ${
              activeTab === 'shortcuts'
                ? 'border-[var(--accent-amber)] text-[var(--accent-amber)] font-semibold bg-[var(--bg-surface)] rounded-t-lg shadow-2xs'
                : 'border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>{t.shortcutsModal.shortcutsTab}</span>
          </button>
        </div>

        {/* Tab 1: FAQ & Documentation */}
        {activeTab === 'faq' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4 text-xs animate-in fade-in duration-150">
            <div className="p-3.5 rounded-xl border border-[var(--accent-amber)]/20 bg-[var(--accent-surface)]/30 text-[var(--text-secondary)] space-y-1">
              <div className="flex items-center gap-2 font-semibold text-xs text-[var(--accent-amber)]">
                <ShieldCheck className="w-4 h-4" />
                <span>{language === 'id' ? 'Studio Markdown Editorial & Privacy-First' : 'Editorial Markdown Studio & Privacy-First'}</span>
              </div>
              <p className="leading-relaxed text-[11px]">
                {language === 'id'
                  ? 'Pertanyaan umum mengenai fitur, diagram, rumus matematika, dan ekspor di MD Viewer.'
                  : 'Frequently asked questions regarding features, diagrams, math rendering, and export options in MD Viewer.'}
              </p>
            </div>

            <div className="space-y-2">
              {faqList.map((faq, idx) => {
                const isOpen = openFaqIndex === idx;
                return (
                  <div
                    key={idx}
                    className={`rounded-xl border transition-all ${
                      isOpen
                        ? 'border-[var(--accent-amber)]/40 bg-[var(--bg-canvas)] shadow-xs'
                        : 'border-[var(--border-subtle)] bg-[var(--bg-surface)] hover:border-[var(--border-strong)]'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => toggleFaq(idx)}
                      className="w-full flex items-center justify-between p-3.5 text-left font-medium text-xs text-[var(--text-primary)] gap-3 cursor-pointer"
                    >
                      <span className="font-semibold text-xs leading-snug">{faq.question}</span>
                      <div className="p-1 rounded-md text-[var(--text-muted)] flex-shrink-0">
                        {isOpen ? (
                          <ChevronUp className="w-4 h-4 text-[var(--accent-amber)]" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-3.5 pb-3.5 pt-0 text-[11px] leading-relaxed text-[var(--text-secondary)] border-t border-[var(--border-subtle)]/50 mt-1">
                        <div className="pt-2">{faq.answer}</div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab 2: Shortcuts & Syntax Reference */}
        {activeTab === 'shortcuts' && (
          <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 text-xs animate-in fade-in duration-150">
            {/* Quick Syntax */}
            <div>
              <h4 className="font-semibold text-sm text-[var(--accent-amber)] flex items-center gap-1.5 mb-3">
                <FileCode className="w-4 h-4" />
                <span>{language === 'id' ? 'Dukungan Sintaks Spesial' : 'Special Syntax Support'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                    <Sigma className="w-3.5 h-3.5 text-amber-600" />
                    <span>KaTeX Mathematics</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-secondary)] space-y-1">
                    <div><code>$E = mc^2$</code> (Inline)</div>
                    <div><code>$$\int_0^1 x dx$$</code> (Display block)</div>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)]">
                  <div className="font-semibold flex items-center gap-1.5 text-[var(--text-primary)] mb-1">
                    <Network className="w-3.5 h-3.5 text-amber-600" />
                    <span>Mermaid Diagrams</span>
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-secondary)]">
                    <code>```mermaid</code>
                    <div>flowchart TD</div>
                    <div>  A --&gt; B</div>
                    <code>```</code>
                  </div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-canvas)] sm:col-span-2">
                  <div className="font-semibold text-[var(--text-primary)] mb-1">
                    GitHub Flavored Callouts (Alerts)
                  </div>
                  <div className="font-mono text-[11px] text-[var(--text-secondary)] space-y-0.5">
                    <div><code>&gt; [!NOTE]</code> — {language === 'id' ? 'Info / Catatan' : 'Info alert'}</div>
                    <div><code>&gt; [!TIP]</code> — {language === 'id' ? 'Tips & Rekomendasi' : 'Tips & Best Practice'}</div>
                    <div><code>&gt; [!IMPORTANT]</code> — {language === 'id' ? 'Catatan Penting' : 'Important note'}</div>
                    <div><code>&gt; [!WARNING]</code> — {language === 'id' ? 'Peringatan' : 'Warning'}</div>
                    <div><code>&gt; [!CAUTION]</code> — {language === 'id' ? 'Tindakan Berisiko' : 'High-risk action'}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Keyboard Shortcuts */}
            <div>
              <h4 className="font-semibold text-sm text-[var(--accent-amber)] flex items-center gap-1.5 mb-3">
                <Command className="w-4 h-4" />
                <span>{language === 'id' ? 'Pintasan Keyboard' : 'Keyboard Shortcuts'}</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { key: '⌘K / Ctrl+K', desc: language === 'id' ? 'Buka Command Palette' : 'Open Command Palette' },
                  { key: '⌘1', desc: language === 'id' ? 'Beralih ke mode Reader' : 'Switch to Reader view' },
                  { key: '⌘2', desc: language === 'id' ? 'Beralih ke mode Split' : 'Switch to Split view' },
                  { key: '⌘3', desc: language === 'id' ? 'Beralih ke mode Editor' : 'Switch to Editor view' },
                  { key: '⌘B / Ctrl+B', desc: language === 'id' ? 'Format teks tebal (bold)' : 'Format bold text' },
                  { key: '⌘I / Ctrl+I', desc: language === 'id' ? 'Format teks miring (italic)' : 'Format italic text' },
                  { key: '⌘E / Ctrl+E', desc: language === 'id' ? 'Format kode sebaris (inline code)' : 'Format inline code' },
                  { key: 'Tab', desc: language === 'id' ? 'Indentasi 2 spasi' : 'Indent 2 spaces' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2.5 rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-canvas)]"
                  >
                    <span className="text-[var(--text-secondary)]">{s.desc}</span>
                    <kbd className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[var(--text-primary)] shadow-2xs">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-3 border-t border-[var(--border-subtle)] bg-[var(--bg-canvas)] text-[11px] text-[var(--text-muted)]">
          <span>MD Viewer • Editorial Studio</span>
          <button
            onClick={onClose}
            className="px-3 py-1 rounded-lg bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-primary)] font-medium transition-colors cursor-pointer"
          >
            {t.common.close}
          </button>
        </div>
      </div>
    </div>
  );
};
