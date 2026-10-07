import React, { useState, useEffect } from 'react';
import { X, Hash } from 'lucide-react';
import type { TocHeading, Language } from '../types';
import { translations } from '../i18n/translations';

interface TableOfContentsProps {
  headings: TocHeading[];
  isOpen: boolean;
  onClose: () => void;
  scrollContainerRef?: React.RefObject<HTMLDivElement | null>;
  language?: Language;
}

export const TableOfContents: React.FC<TableOfContentsProps> = ({
  headings,
  isOpen,
  onClose,
  scrollContainerRef,
  language = 'en',
}) => {
  const [activeId, setActiveId] = useState<string>('');

  const t = translations[language];

  // Track active heading while scrolling
  useEffect(() => {
    if (!isOpen || headings.length === 0) return;

    const handleScroll = () => {
      const container = scrollContainerRef?.current;
      const scrollPos = container ? container.scrollTop : window.scrollY;

      for (let i = headings.length - 1; i >= 0; i--) {
        const el = document.getElementById(headings[i].id);
        if (el) {
          const offsetTop = el.offsetTop - 120;
          if (scrollPos >= offsetTop) {
            setActiveId(headings[i].id);
            return;
          }
        }
      }
      if (headings[0]) setActiveId(headings[0].id);
    };

    const container = scrollContainerRef?.current;
    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    } else {
      window.addEventListener('scroll', handleScroll, { passive: true });
    }

    handleScroll();

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      } else {
        window.removeEventListener('scroll', handleScroll);
      }
    };
  }, [headings, isOpen, scrollContainerRef]);

  const scrollToHeading = (id: string) => {
    const el = document.getElementById(id);
    if (!el) return;

    const container = scrollContainerRef?.current;
    if (container) {
      const targetPos = el.offsetTop - 24;
      container.scrollTo({ top: targetPos, behavior: 'smooth' });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
    setActiveId(id);
  };

  if (!isOpen) return null;

  return (
    <aside className="absolute lg:static right-0 top-0 bottom-0 w-72 max-w-[85vw] h-full flex flex-col bg-[var(--bg-surface)] border-l border-[var(--border-subtle)] text-[var(--text-primary)] z-30 shadow-2xl lg:shadow-none animate-in slide-in-from-right-4 duration-200">
      {/* TOC Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] select-none">
        <div className="flex items-center gap-2 font-semibold text-xs text-[var(--accent-amber)] uppercase tracking-wider">
          <Hash className="w-3.5 h-3.5" />
          <span>{t.header.outline}</span>
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)] transition-colors cursor-pointer"
          title={t.common.close}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Headings List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-0.5 text-xs">
        {headings.length === 0 ? (
          <div className="text-center py-10 text-[var(--text-muted)] italic">
            {language === 'id' ? 'Belum ada heading pada dokumen.' : 'No headings found in document.'}
          </div>
        ) : (
          headings.map((h) => {
            const isActive = activeId === h.id;
            const indentMap: Record<number, string> = {
              1: 'pl-2 font-semibold',
              2: 'pl-4 font-medium',
              3: 'pl-6 text-[var(--text-secondary)]',
              4: 'pl-8 text-[var(--text-muted)]',
              5: 'pl-10 text-[var(--text-muted)]',
              6: 'pl-12 text-[var(--text-muted)]',
            };
            const indentClass = indentMap[h.depth] || 'pl-2';

            return (
              <button
                key={h.id}
                onClick={() => scrollToHeading(h.id)}
                className={`w-full text-left py-1.5 pr-2 rounded-md transition-all flex items-center gap-1.5 group cursor-pointer ${indentClass} ${
                  isActive
                    ? 'bg-[var(--accent-surface)] text-[var(--accent-amber)] font-bold'
                    : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-subtle)]'
                }`}
                title={h.text}
              >
                <span className="truncate">{h.text}</span>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
