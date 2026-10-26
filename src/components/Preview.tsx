import React, { useEffect, useRef, useState } from 'react';
import mermaid from 'mermaid';
import { copyText } from '../utils/exportUtils';
import { MermaidModal } from './MermaidModal';
import type { ThemeMode, ViewMode, Language } from '../types';

interface PreviewProps {
  html: string;
  theme: ThemeMode;
  viewMode: ViewMode;
  language?: Language;
  onScroll?: (scrollTop: number, scrollHeight: number, clientHeight: number) => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
}

export const Preview: React.FC<PreviewProps> = ({
  html,
  theme,
  viewMode,
  language = 'en',
  onScroll,
  containerRef: externalRef,
}) => {
  const internalRef = useRef<HTMLDivElement>(null);
  const containerRef = externalRef || internalRef;
  const [inspectingSvg, setInspectingSvg] = useState<string | null>(null);
  const [inspectingCode, setInspectingCode] = useState<string | null>(null);
  // Initialize and render Mermaid diagrams whenever HTML or theme changes
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let isCancelled = false;

    // Configure Mermaid
    const mermaidTheme = theme === 'charcoal' ? 'dark' : (theme === 'sepia' ? 'neutral' : 'default');
    
    try {
      mermaid.initialize({
        startOnLoad: false,
        theme: mermaidTheme,
        securityLevel: 'loose',
        fontFamily: "'JetBrains Mono', monospace",
        themeVariables: {
          primaryColor: theme === 'charcoal' ? '#3b3834' : (theme === 'sepia' ? '#eedfc4' : '#fef3c7'),
          primaryTextColor: theme === 'charcoal' ? '#ede8e1' : (theme === 'sepia' ? '#332a20' : '#78350f'),
          primaryBorderColor: '#d97706',
          lineColor: theme === 'charcoal' ? '#a39b92' : '#786f66',
          secondaryColor: theme === 'charcoal' ? '#262320' : '#faf8f5',
          tertiaryColor: theme === 'charcoal' ? '#1f1c1a' : '#f5efe6',
        },
      });
    } catch (e) {
      console.warn('Mermaid initialize error:', e);
    }

    // Process all diagram cards
    const diagramCards = container.querySelectorAll<HTMLElement>('.mermaid-diagram-card');

    diagramCards.forEach(async (card, idx) => {
      const encodedCode = card.getAttribute('data-mermaid');
      if (!encodedCode) return;

      const rawCode = decodeURIComponent(encodedCode);
      const target = card.querySelector<HTMLElement>('.mermaid-target');
      if (!target) return;

      const diagramId = `mermaid-render-${idx}-${Date.now()}`;

      try {
        const { svg } = await mermaid.render(diagramId, rawCode);
        if (isCancelled) return;

        target.innerHTML = svg;
        target.classList.remove('min-h-[140px]');

        // Ensure the SVG respects its natural viewBox width as max-width
        // so narrow diagrams never stretch larger than their intended dimensions
        const svgEl = target.querySelector<SVGElement>('svg');
        if (svgEl) {
          const viewBox = svgEl.getAttribute('viewBox');
          if (viewBox) {
            const parts = viewBox.trim().split(/\s+/).map(Number);
            if (parts.length >= 4 && !isNaN(parts[2]) && parts[2] > 0) {
              const naturalWidth = Math.ceil(parts[2]);
              svgEl.style.maxWidth = `${naturalWidth}px`;
              svgEl.style.width = '100%';
              svgEl.style.height = 'auto';
            }
          }
        }

      } catch (err: unknown) {
        if (isCancelled) return;
        console.error('Mermaid render error:', err);
        target.innerHTML = `
          <div class="p-4 rounded-lg bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900 text-xs text-rose-800 dark:text-rose-200 text-left w-full font-mono">
            <div class="font-bold flex items-center gap-1.5 mb-1.5">
              <span>⚠️ Mermaid Diagram Error</span>
            </div>
            <div class="opacity-90 mb-2">${err instanceof Error ? err.message : String(err)}</div>
            <pre class="p-2 bg-black/10 dark:bg-black/30 rounded text-[11px] overflow-x-auto">${rawCode}</pre>
          </div>
        `;
      }
    });

    return () => {
      isCancelled = true;
    };
  }, [html, theme]);

  const handleScroll = () => {
    if (containerRef.current && onScroll) {
      onScroll(
        containerRef.current.scrollTop,
        containerRef.current.scrollHeight,
        containerRef.current.clientHeight
      );
    }
  };
  const isReader = viewMode === 'reader';

  const handleContainerClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;

    // 1. Copy Diagram Source Code (.btn-mermaid-copy-code)
    const btnCopyCode = target.closest<HTMLButtonElement>('.btn-mermaid-copy-code');
    if (btnCopyCode) {
      const card = btnCopyCode.closest<HTMLElement>('.mermaid-diagram-card');
      const encoded = card?.getAttribute('data-mermaid');
      if (encoded) {
        const rawCode = decodeURIComponent(encoded);
        await copyText(rawCode);
        const label = btnCopyCode.querySelector('.copy-code-label');
        const originalText = label ? label.textContent : btnCopyCode.innerHTML;
        if (label) {
          label.textContent = 'Copied!';
        } else {
          btnCopyCode.innerHTML = `<span class="text-emerald-500 font-semibold">Copied!</span>`;
        }
        btnCopyCode.classList.add('text-emerald-500');
        setTimeout(() => {
          if (label) {
            label.textContent = originalText;
          } else {
            btnCopyCode.innerHTML = originalText;
          }
          btnCopyCode.classList.remove('text-emerald-500');
        }, 2000);
      }
      return;
    }

    // 2. Inspect Diagram Modal (.btn-mermaid-zoom)
    const btnZoom = target.closest<HTMLButtonElement>('.btn-mermaid-zoom');
    if (btnZoom) {
      const card = btnZoom.closest<HTMLElement>('.mermaid-diagram-card');
      const svgEl = card?.querySelector<SVGElement>('.mermaid-target svg');
      const encoded = card?.getAttribute('data-mermaid');
      const rawCode = encoded ? decodeURIComponent(encoded) : '';
      if (svgEl) {
        setInspectingSvg(svgEl.outerHTML);
        setInspectingCode(rawCode);
      }
      return;
    }

    // 3. Copy SVG (.btn-mermaid-copy-svg)
    const btnCopySvg = target.closest<HTMLButtonElement>('.btn-mermaid-copy-svg');
    if (btnCopySvg) {
      const card = btnCopySvg.closest<HTMLElement>('.mermaid-diagram-card');
      const svgEl = card?.querySelector<SVGElement>('.mermaid-target svg');
      if (svgEl) {
        await copyText(svgEl.outerHTML);
        const originalText = btnCopySvg.innerHTML;
        btnCopySvg.innerHTML = `<span class="text-emerald-500 font-semibold">Copied!</span>`;
        setTimeout(() => {
          btnCopySvg.innerHTML = originalText;
        }, 2000);
      }
      return;
    }

    // 4. Download SVG (.btn-mermaid-download)
    const btnDownload = target.closest<HTMLButtonElement>('.btn-mermaid-download');
    if (btnDownload) {
      const card = btnDownload.closest<HTMLElement>('.mermaid-diagram-card');
      const svgEl = card?.querySelector<SVGElement>('.mermaid-target svg');
      if (svgEl) {
        const blob = new Blob([svgEl.outerHTML], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `mermaid-diagram-${Date.now()}.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      return;
    }

    // 5. Code Block Copy (.btn-code-copy)
    const btnCodeCopy = target.closest<HTMLButtonElement>('.btn-code-copy');
    if (btnCodeCopy) {
      const card = btnCodeCopy.closest<HTMLElement>('.code-block-card');
      const encoded = card?.getAttribute('data-code');
      if (encoded) {
        const rawCode = decodeURIComponent(encoded);
        await copyText(rawCode);
        const label = btnCodeCopy.querySelector('.copy-label');
        if (label) {
          label.textContent = 'Copied!';
          btnCodeCopy.classList.add('text-emerald-500');
          setTimeout(() => {
            label.textContent = 'Copy';
            btnCodeCopy.classList.remove('text-emerald-500');
          }, 2000);
        }
      }
      return;
    }
  };

  return (
    <>
      <div
        ref={containerRef}
        onScroll={handleScroll}
        onClick={handleContainerClick}
        className="preview-pane-scroller flex-1 min-w-0 w-full h-full overflow-y-auto overflow-x-hidden bg-[var(--bg-canvas)] transition-colors selection:bg-[var(--accent-amber)]/20"
      >
        <div
          className={`transition-all duration-200 min-w-0 max-w-full ${
            isReader
              ? 'max-w-4xl mx-auto px-4 sm:px-12 py-6 sm:py-16'
              : 'w-full px-4 lg:px-10 py-6'
          }`}
        >
          <div
            className="prose-container min-w-0 max-w-full leading-relaxed text-[var(--text-primary)]"
            dangerouslySetInnerHTML={{ __html: html }}
          />
        </div>
      </div>

      {/* Fullscreen Pan & Zoom Inspector Modal */}
      {inspectingSvg && (
        <MermaidModal
          svgContent={inspectingSvg}
          rawCode={inspectingCode || undefined}
          onClose={() => {
            setInspectingSvg(null);
            setInspectingCode(null);
          }}
          language={language}
        />
      )}
    </>
  );
};
