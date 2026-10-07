import { Marked } from 'marked';
import DOMPurify from 'dompurify';
import katex from 'katex';
import { highlightCode } from './prismLanguages';
import type { TocHeading } from '../types';

export interface ParseResult {
  html: string;
  headings: TocHeading[];
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
}

// Generate URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/<[^>]*>/g, '') // remove html tags
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

export function parseMarkdown(markdown: string): ParseResult {
  const headings: TocHeading[] = [];
  const headingIdCounts: Record<string, number> = {};

  // Calculate statistics
  const plainText = markdown.replace(/[#*`_~\[\]()$]/g, '').trim();
  const words = plainText.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = plainText.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  const markedInstance = new Marked();

  // Custom Inline Math: $ ... $
  const inlineMath = {
    name: 'inlineMath',
    level: 'inline' as const,
    start(src: string) {
      return src.indexOf('$');
    },
    tokenizer(src: string) {
      // Must not start or end with space, must be on single line, not $$
      const match = src.match(/^\$((?!\$)[^\n$]+?(?<!\$))\$/);
      if (match) {
        return {
          type: 'inlineMath',
          raw: match[0],
          text: match[1].trim(),
        };
      }
      return undefined;
    },
    renderer(token: { text: string; raw: string }) {
      try {
        return katex.renderToString(token.text, {
          displayMode: false,
          throwOnError: false,
        });
      } catch {
        return token.raw;
      }
    },
  };

  // Custom Block Math: $$ ... $$
  const blockMath = {
    name: 'blockMath',
    level: 'block' as const,
    start(src: string) {
      return src.indexOf('$$');
    },
    tokenizer(src: string) {
      const match = src.match(/^\$\$([\s\S]+?)\$\$/);
      if (match) {
        return {
          type: 'blockMath',
          raw: match[0],
          text: match[1].trim(),
        };
      }
      return undefined;
    },
    renderer(token: { text: string; raw: string }) {
      try {
        const mathHtml = katex.renderToString(token.text, {
          displayMode: true,
          throwOnError: false,
        });
        return `<div class="katex-display-wrapper my-6 overflow-x-auto py-2 text-center select-text">${mathHtml}</div>`;
      } catch {
        return `<pre class="math-error p-3 bg-red-50 text-red-700 rounded">${token.raw}</pre>`;
      }
    },
  };

  markedInstance.use({
    extensions: [blockMath, inlineMath],
    gfm: true,
    breaks: false,
    renderer: {
      heading(token) {
        const text = token.text;
        const depth = token.depth;
        let id = slugify(text);
        if (!id) id = `section-${headings.length + 1}`;

        // Ensure unique IDs
        if (headingIdCounts[id]) {
          headingIdCounts[id]++;
          id = `${id}-${headingIdCounts[id]}`;
        } else {
          headingIdCounts[id] = 1;
        }

        headings.push({ id, text: text.replace(/<[^>]*>/g, ''), depth });

        const headingClasses: Record<number, string> = {
          1: 'text-2xl sm:text-4xl font-bold tracking-tight mt-6 sm:mt-10 mb-3 sm:mb-4 pb-2 border-b border-[var(--border-subtle)] text-[var(--text-primary)] break-words leading-tight',
          2: 'text-xl sm:text-3xl font-semibold tracking-tight mt-6 sm:mt-8 mb-2 sm:mb-3 text-[var(--text-primary)] break-words leading-snug',
          3: 'text-lg sm:text-2xl font-semibold mt-5 sm:mt-6 mb-2 text-[var(--text-primary)] break-words',
          4: 'text-base sm:text-xl font-medium mt-4 mb-2 text-[var(--text-primary)] break-words',
          5: 'text-sm sm:text-lg font-medium mt-3 mb-1 text-[var(--text-primary)] break-words',
          6: 'text-xs sm:text-base font-medium mt-2 mb-1 text-[var(--text-secondary)] break-words',
        };

        const className = headingClasses[depth] || headingClasses[6];

        return `
          <h${depth} id="${id}" class="group relative scroll-mt-24 ${className}">
            <a href="#${id}" class="heading-anchor hidden sm:inline-block absolute -left-6 opacity-0 group-hover:opacity-100 text-[var(--accent-amber)] transition-opacity no-underline pr-2" title="Direct link to this section" aria-label="Link to section">#</a>
            <span>${this.parser.parseInline(token.tokens)}</span>
          </h${depth}>
        `;
      },

      blockquote(token) {
        const rawText = token.text || '';
        // Check for GitHub Alerts: [!NOTE], [!TIP], [!IMPORTANT], [!WARNING], [!CAUTION]
        const alertMatch = rawText.match(/^\s*\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*\n)?([\s\S]*)$/i);

        if (alertMatch) {
          const type = alertMatch[1].toUpperCase();
          const bodyTokens = token.tokens.slice();
          // Remove the alert marker from the first paragraph
          const renderedInner = this.parser.parse(bodyTokens)
            .replace(/\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\](?:\s*<br>|\n)?/i, '')
            .trim();

          const alertStyles: Record<string, { title: string; icon: string; border: string; bg: string; text: string }> = {
            NOTE: {
              title: 'Note',
              icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 16v-4m0-4h.01"/></svg>',
              border: 'border-l-4 border-sky-500',
              bg: 'bg-sky-50/70 dark:bg-sky-950/30',
              text: 'text-sky-900 dark:text-sky-200',
            },
            TIP: {
              title: 'Tip',
              icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>',
              border: 'border-l-4 border-emerald-500',
              bg: 'bg-emerald-50/70 dark:bg-emerald-950/30',
              text: 'text-emerald-900 dark:text-emerald-200',
            },
            IMPORTANT: {
              title: 'Important',
              icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01"/></svg>',
              border: 'border-l-4 border-purple-500',
              bg: 'bg-purple-50/70 dark:bg-purple-950/30',
              text: 'text-purple-900 dark:text-purple-200',
            },
            WARNING: {
              title: 'Warning',
              icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>',
              border: 'border-l-4 border-amber-500',
              bg: 'bg-amber-50/70 dark:bg-amber-950/30',
              text: 'text-amber-900 dark:text-amber-200',
            },
            CAUTION: {
              title: 'Caution',
              icon: '<svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/></svg>',
              border: 'border-l-4 border-rose-500',
              bg: 'bg-rose-50/70 dark:bg-rose-950/30',
              text: 'text-rose-900 dark:text-rose-200',
            },
          };

          const style = alertStyles[type] || alertStyles.NOTE;

          return `
            <div class="callout my-6 rounded-r-lg p-4 transition-all min-w-0 max-w-full overflow-hidden break-words ${style.border} ${style.bg}">
              <div class="flex items-center gap-2 font-semibold text-sm mb-2 ${style.text}">
                ${style.icon}
                <span>${style.title}</span>
              </div>
              <div class="callout-content text-sm leading-relaxed text-[var(--text-primary)] break-words">
                ${renderedInner}
              </div>
            </div>
          `;
        }

        return `
          <blockquote class="my-6 pl-4 border-l-4 border-[var(--accent-amber)] italic text-[var(--text-secondary)] bg-[var(--bg-subtle)]/30 py-2 pr-3 rounded-r min-w-0 max-w-full break-words">
            ${this.parser.parse(token.tokens)}
          </blockquote>
        `;
      },

      code(token) {
        const lang = (token.lang || '').trim().toLowerCase();
        const rawCode = token.text;

        // Mermaid diagrams
        if (lang === 'mermaid') {
          const encoded = encodeURIComponent(rawCode);
          return `
            <div class="mermaid-diagram-card my-8 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-sm overflow-hidden" data-mermaid="${encoded}">
              <div class="mermaid-diagram-toolbar flex items-center justify-between px-3 sm:px-4 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] text-xs font-mono text-[var(--text-secondary)] select-none">
                <span class="flex items-center gap-1.5 font-medium whitespace-nowrap">
                  <svg class="w-3.5 h-3.5 text-[var(--accent-amber)] flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" stroke-width="2"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6l4 2"/></svg>
                  <span><span class="hidden sm:inline">MERMAID </span>DIAGRAM</span>
                </span>
                <div class="flex items-center gap-1">
                  <button type="button" class="btn-mermaid-zoom px-2 py-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0" title="Interactive Pan & Zoom">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v6m3-3H7"/></svg>
                    <span class="hidden sm:inline">Inspect</span>
                  </button>
                  <button type="button" class="btn-mermaid-copy-svg px-2 py-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0" title="Copy SVG Vector">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                    <span class="hidden sm:inline">SVG</span>
                  </button>
                  <button type="button" class="btn-mermaid-download px-2 py-1 rounded hover:bg-[var(--border-subtle)] text-[var(--text-secondary)] transition-colors flex items-center gap-1 whitespace-nowrap flex-shrink-0" title="Download SVG">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/></svg>
                    <span class="hidden sm:inline">Save</span>
                  </button>
                </div>
              </div>
              <div class="mermaid-target flex items-center justify-center p-4 sm:p-6 min-h-[140px] overflow-x-auto">
                <div class="text-xs text-[var(--text-muted)] animate-pulse flex items-center gap-2">
                  <svg class="w-4 h-4 animate-spin text-[var(--accent-amber)]" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  Rendering diagram...
                </div>
              </div>
            </div>
          `;
        }

        // Standard Code Block
        const displayLang = lang ? lang.toUpperCase() : 'CODE';
        const highlighted = highlightCode(rawCode, lang);
        const encodedCode = encodeURIComponent(rawCode);

        // Compute line numbers
        const lines = rawCode.split('\n');
        const lineCount = lines.length;
        const lineNumbersHtml = Array.from({ length: lineCount }, (_, i) => `<span>${i + 1}</span>`).join('');

        return `
          <div class="code-block-card my-6 rounded-xl border border-[var(--border-subtle)] bg-[var(--code-bg)] shadow-sm overflow-hidden text-sm" data-code="${encodedCode}">
            <div class="code-block-header flex items-center justify-between px-4 py-2 bg-[var(--bg-subtle)] border-b border-[var(--border-subtle)] font-mono text-xs text-[var(--text-secondary)]">
              <span class="font-semibold text-[var(--accent-amber)] tracking-wider">${displayLang}</span>
              <button type="button" class="btn-code-copy flex items-center gap-1.5 px-2.5 py-1 rounded hover:bg-[var(--border-subtle)] transition-colors text-[var(--text-secondary)]" title="Copy code">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
                <span class="copy-label">Copy</span>
              </button>
            </div>
            <div class="code-block-body flex overflow-x-auto text-[13px] leading-relaxed">
              <div class="line-numbers py-3.5 pl-3.5 pr-2 select-none text-[var(--text-muted)] text-right font-mono flex flex-col opacity-60 text-xs border-r border-[var(--border-subtle)]/50">
                ${lineNumbersHtml}
              </div>
              <pre class="flex-1 py-3.5 px-4 overflow-x-auto font-mono text-[var(--text-primary)]"><code class="language-${lang}">${highlighted}</code></pre>
            </div>
          </div>
        `;
      },

      table(token) {
        let headerRow = '';
        token.header.forEach((cell) => {
          const align = cell.align ? `text-${cell.align}` : 'text-left';
          headerRow += `<th class="px-4 py-2.5 border-b-2 border-[var(--border-subtle)] font-semibold text-sm text-[var(--text-primary)] whitespace-nowrap ${align}">${this.parser.parseInline(cell.tokens)}</th>`;
        });

        let bodyRows = '';
        token.rows.forEach((row, rIdx) => {
          const rowBg = rIdx % 2 === 1 ? 'bg-[var(--bg-subtle)]/40' : '';
          let rowCells = '';
          row.forEach((cell) => {
            const align = cell.align ? `text-${cell.align}` : 'text-left';
            rowCells += `<td class="px-4 py-2.5 border-b border-[var(--border-subtle)] text-sm text-[var(--text-secondary)] ${align}">${this.parser.parseInline(cell.tokens)}</td>`;
          });
          bodyRows += `<tr class="${rowBg} hover:bg-[var(--bg-subtle)]/70 transition-colors">${rowCells}</tr>`;
        });

        return `
          <div class="table-wrapper my-6 overflow-x-auto rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-surface)] shadow-xs">
            <table class="w-full min-w-[520px] sm:min-w-full border-collapse text-left">
              <thead class="bg-[var(--bg-subtle)]">
                <tr>${headerRow}</tr>
              </thead>
              <tbody>${bodyRows}</tbody>
            </table>
          </div>
        `;
      },

      list(token) {
        const tag = token.ordered ? 'ol' : 'ul';
        const listClasses = token.ordered
          ? 'list-decimal list-outside ml-6 my-4 space-y-1.5 text-[var(--text-primary)]'
          : 'list-disc list-outside ml-6 my-4 space-y-1.5 text-[var(--text-primary)]';

        let body = '';
        token.items.forEach((item) => {
          if (item.task) {
            const checkedAttr = item.checked ? 'checked' : '';
            const checkedClass = item.checked ? 'line-through opacity-70' : '';
            const inner = this.parser.parse(item.tokens).replace(/^<p>/, '').replace(/<\/p>$/, '');
            body += `
              <li class="flex items-start gap-2.5 my-1.5 list-none ${checkedClass}">
                <input type="checkbox" disabled ${checkedAttr} class="mt-1 h-4 w-4 rounded accent-[var(--accent-amber)] border-[var(--border-subtle)] cursor-default" />
                <div class="flex-1">${inner}</div>
              </li>
            `;
          } else {
            body += `<li class="leading-relaxed">${this.parser.parse(item.tokens)}</li>`;
          }
        });

        return `<${tag} class="${listClasses}">${body}</${tag}>`;
      },

      paragraph(token) {
        return `<p class="my-4 leading-relaxed text-[var(--text-primary)] text-base break-words">${this.parser.parseInline(token.tokens)}</p>`;
      },

      hr() {
        return `<hr class="my-8 border-t border-[var(--border-subtle)]" />`;
      },

      link(token) {
        const href = token.href;
        const title = token.title ? `title="${token.title}"` : '';
        const isExternal = href.startsWith('http://') || href.startsWith('https://');
        const target = isExternal ? 'target="_blank" rel="noopener noreferrer"' : '';
        return `<a href="${href}" ${title} ${target} class="text-[var(--accent-amber)] hover:underline underline-offset-4 decoration-amber-400 font-medium transition-colors">${this.parser.parseInline(token.tokens)}</a>`;
      },
    },
  });

  const rawHtml = markedInstance.parse(markdown) as string;

  // Sanitize HTML with DOMPurify to prevent XSS while preserving KaTeX, SVG diagrams, and interactive elements
  const cleanHtml = typeof DOMPurify?.sanitize === 'function'
    ? (DOMPurify.sanitize(rawHtml, {
        USE_PROFILES: { html: true, svg: true, mathMl: true },
        ADD_TAGS: [
          'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'annotation', 'mtext', 'msup', 'msub',
          'input', 'button', 'svg', 'path', 'circle', 'line', 'rect', 'g',
        ],
        ADD_ATTR: [
          'target', 'rel', 'checked', 'disabled', 'class', 'style', 'data-theme', 'display',
          'data-mermaid', 'data-code', 'viewBox', 'fill', 'stroke', 'stroke-width', 'stroke-linecap',
          'stroke-linejoin', 'd', 'cx', 'cy', 'r', 'x', 'y', 'width', 'height', 'xmlns',
        ],
      }) as string)
    : rawHtml;

  return {
    html: cleanHtml,
    headings,
    wordCount,
    charCount,
    readingTimeMinutes,
  };
}
