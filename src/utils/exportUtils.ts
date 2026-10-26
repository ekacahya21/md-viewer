import type { ThemeMode } from '../types';

export function downloadMarkdown(title: string, markdown: string): void {
  const cleanTitle = title.trim().replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'document';
  const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export interface PrintOptions {
  words?: number;
  readingTimeMinutes?: number;
  language?: 'en' | 'id';
}

export function printToPdf(
  title: string = 'Document',
  renderedContainer: HTMLElement | null = null,
  options: PrintOptions = {}
): void {
  const cleanTitle = title.trim().replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF\s]/g, '') || 'Document';
  
  // 1. Prepare body content from rendered container
  let bodyContent = '';
  if (renderedContainer) {
    const clone = renderedContainer.cloneNode(true) as HTMLElement;
    
    // Remove UI toolbars, buttons, and anchors
    clone.querySelectorAll('.mermaid-diagram-toolbar, .code-block-header button, .heading-anchor, .no-print').forEach(el => {
      el.remove();
    });

    // If the first H1 in the markdown matches document title, remove it to avoid duplication with editorial header
    const firstH1 = clone.querySelector('h1');
    if (firstH1 && firstH1.textContent?.replace(/\s+/g, ' ').trim().toLowerCase() === cleanTitle.replace(/\s+/g, ' ').trim().toLowerCase()) {
      firstH1.remove();
    }

    bodyContent = clone.innerHTML;
  }

  // 2. Format metadata
  const isId = options.language === 'id';
  const formattedDate = new Date().toLocaleDateString(isId ? 'id-ID' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const metaParts: string[] = [formattedDate];
  if (options.words !== undefined && options.words > 0) {
    metaParts.push(`${options.words.toLocaleString()} ${isId ? 'kata' : 'words'}`);
  }
  if (options.readingTimeMinutes !== undefined && options.readingTimeMinutes > 0) {
    metaParts.push(`${options.readingTimeMinutes} ${isId ? 'mnt baca' : 'min read'}`);
  }

  const editorialHeader = `
    <header class="editorial-header">
      <div class="editorial-badge">MD VIEWER DOCUMENT</div>
      <h1 class="editorial-title">${cleanTitle}</h1>
      <div class="editorial-meta">
        ${metaParts.map((part, idx) => idx === 0 ? `<span>${part}</span>` : `<span class="meta-dot">•</span><span>${part}</span>`).join('')}
      </div>
      <hr class="editorial-divider" />
    </header>
  `;

  // 3. Assemble complete isolated print document HTML
  const printHtml = `<!DOCTYPE html>
<html lang="${options.language || 'en'}">
<head>
  <meta charset="UTF-8">
  <title>${cleanTitle}</title>
  <style>
    @page {
      size: A4;
      margin: 18mm 20mm;
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background: #ffffff !important;
      color: #111827 !important;
      font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 11pt;
      line-height: 1.7;
      padding: 0;
      margin: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    .document-content {
      width: 100%;
      max-width: 100%;
      margin: 0 auto;
    }
    .editorial-header {
      margin-bottom: 2rem;
      padding-bottom: 1.25rem;
    }
    .editorial-badge {
      display: inline-block;
      font-size: 8pt;
      font-weight: 700;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #6b7280;
      margin-bottom: 0.5rem;
      font-family: 'JetBrains Mono', monospace;
    }
    .editorial-title {
      font-size: 24pt;
      font-weight: 800;
      line-height: 1.25;
      color: #111827;
      letter-spacing: -0.025em;
      margin-bottom: 0.75rem;
    }
    .editorial-meta {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 0.6rem;
      font-size: 9pt;
      color: #6b7280;
      font-family: 'JetBrains Mono', monospace;
      margin-bottom: 1.25rem;
    }
    .meta-dot {
      opacity: 0.5;
    }
    .editorial-divider {
      border: none;
      border-top: 1.5px solid #111827;
      margin: 0;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.35;
      color: #111827;
      margin-top: 1.6em;
      margin-bottom: 0.6em;
      page-break-after: avoid !important;
      break-after: avoid !important;
    }
    h1 { font-size: 18pt; border-bottom: 1px solid #e5e7eb; padding-bottom: 0.3em; }
    h2 { font-size: 14pt; }
    h3 { font-size: 12pt; }
    h4 { font-size: 11pt; }
    p {
      margin-bottom: 1.15em;
      color: #1f2937;
      text-align: justify;
      text-justify: inter-word;
    }
    ul, ol {
      margin-left: 1.6em;
      margin-bottom: 1.15em;
    }
    li {
      margin-bottom: 0.35em;
      color: #1f2937;
    }
    a {
      color: #1d4ed8;
      text-decoration: underline;
    }
    hr {
      border: none;
      border-top: 1px solid #e5e7eb;
      margin: 2em 0;
    }
    .mermaid-diagram-card,
    .code-block-card,
    .callout,
    blockquote,
    table {
      page-break-inside: avoid !important;
      break-inside: avoid !important;
      margin: 1.4em 0;
    }
    .mermaid-diagram-card {
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      padding: 1.25rem;
      background: #ffffff;
      text-align: center;
    }
    .mermaid-diagram-card svg {
      max-width: 100% !important;
      height: auto !important;
      margin: 0 auto;
    }
    .mermaid-diagram-card svg text {
      fill: #111827 !important;
    }
    .code-block-card {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      background: #f8f9fa;
      overflow: hidden;
    }
    .code-block-header {
      background: #f1f3f5;
      border-bottom: 1px solid #e5e7eb;
      padding: 0.4rem 0.8rem;
      font-size: 8pt;
      font-family: 'JetBrains Mono', monospace;
      font-weight: 600;
      color: #4b5563;
    }
    pre code {
      display: block;
      padding: 0.85rem;
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      line-height: 1.6;
      color: #1f2937;
      white-space: pre-wrap;
      word-break: break-word;
    }
    code {
      font-family: 'JetBrains Mono', monospace;
      font-size: 9pt;
      background: #f3f4f6;
      padding: 0.15em 0.35em;
      border-radius: 3px;
      color: #1f2937;
    }
    .callout {
      border-left: 4px solid #d97706;
      padding: 0.75rem 1rem;
      background: #fffbeb;
      border-radius: 0 6px 6px 0;
      font-size: 10pt;
    }
    blockquote {
      border-left: 3px solid #9ca3af;
      padding-left: 1rem;
      color: #4b5563;
      font-style: italic;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 9.5pt;
    }
    th, td {
      border: 1px solid #e5e7eb;
      padding: 0.55rem 0.75rem;
      text-align: left;
    }
    th {
      background: #f8f9fa;
      font-weight: 600;
      color: #111827;
    }
    .katex-display-wrapper {
      margin: 1.25em 0;
      text-align: center;
      overflow-x: auto;
    }
    .katex {
      font-size: 1.05em;
      color: #111827;
    }
  </style>
</head>
<body>
  <div class="document-content">
    ${editorialHeader}
    ${bodyContent}
  </div>
</body>
</html>`;

  // 4. Create and manage ephemeral hidden print iframe
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  iframe.style.visibility = 'hidden';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);

  const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!iframeDoc || !iframe.contentWindow) {
    // Graceful fallback to window.print if iframe context unavailable
    window.print();
    return;
  }

  iframeDoc.open();
  iframeDoc.write(printHtml);
  iframeDoc.close();

  // Copy stylesheets (KaTeX font faces and bundled Prism CSS) from main document into iframe
  document.querySelectorAll('link[rel="stylesheet"], style').forEach(el => {
    try {
      iframeDoc.head.appendChild(el.cloneNode(true));
    } catch {}
  });

  let isCleanedUp = false;
  const cleanup = () => {
    if (isCleanedUp) return;
    isCleanedUp = true;
    setTimeout(() => {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }, 1000);
  };

  iframe.contentWindow.addEventListener('afterprint', cleanup);
  setTimeout(cleanup, 60000); // 1-minute safety cleanup timer

  const triggerPrint = () => {
    try {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
    } catch (err) {
      console.error('Print iframe error:', err);
      window.print();
    }
  };

  // Wait for fonts to be ready before triggering print dialog
  if (iframeDoc.fonts && iframeDoc.fonts.ready) {
    iframeDoc.fonts.ready.then(() => {
      setTimeout(triggerPrint, 100);
    }).catch(() => {
      setTimeout(triggerPrint, 100);
    });
  } else {
    setTimeout(triggerPrint, 200);
  }
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return true;
      } catch {
        // Fallback to execCommand if clipboard writeText throws (e.g. headless/permission)
      }
    }
    // Fallback for older contexts or ungranted clipboard permissions
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.error('Failed to copy text: ', err);
    return false;
  }
}

export function exportStandaloneHtml(
  title: string,
  renderedContainer: HTMLElement | null,
  theme: ThemeMode
): void {
  const cleanTitle = title.trim().replace(/[^a-zA-Z0-9_\-\u00C0-\u024F\u1E00-\u1EFF]/g, '_') || 'document';
  
  let bodyContent = '';
  if (renderedContainer) {
    // Clone to manipulate safely
    const clone = renderedContainer.cloneNode(true) as HTMLElement;
    
    // Remove UI toolbars and buttons from export
    clone.querySelectorAll('.mermaid-diagram-toolbar, .code-block-header button, .heading-anchor').forEach(el => {
      el.remove();
    });

    bodyContent = clone.innerHTML;
  }

  const themeColors = {
    paper: {
      bg: '#faf8f5',
      surface: '#ffffff',
      border: '#e7e3dc',
      text: '#262320',
      textSecondary: '#635c55',
      codeBg: '#f3efea',
      accent: '#d97706',
    },
    charcoal: {
      bg: '#181716',
      surface: '#22201e',
      border: '#36332e',
      text: '#ede8e1',
      textSecondary: '#a39b92',
      codeBg: '#272422',
      accent: '#f59e0b',
    },
    sepia: {
      bg: '#f4ecd8',
      surface: '#fdf8ed',
      border: '#dfd4b8',
      text: '#332a20',
      textSecondary: '#6d5e4e',
      codeBg: '#ede0c7',
      accent: '#b45309',
    },
  }[theme];

  const htmlDocument = `<!DOCTYPE html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css" integrity="sha384-nB0miv6/jRmo5UMMR1wu3Gz6NLsoTkbqJghGIsx//Rlm+ZU03BU6SQNC66uf4l5+" crossorigin="anonymous">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
  <style>
    :root {
      --bg: ${themeColors.bg};
      --surface: ${themeColors.surface};
      --border: ${themeColors.border};
      --text: ${themeColors.text};
      --text-secondary: ${themeColors.textSecondary};
      --code-bg: ${themeColors.codeBg};
      --accent: ${themeColors.accent};
    }
    *, *::before, *::after {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }
    body {
      background-color: var(--bg);
      color: var(--text);
      font-family: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;
      line-height: 1.75;
      font-size: 17px;
      padding: 40px 20px;
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
    }
    .document-container {
      max-width: 820px;
      margin: 0 auto;
    }
    h1, h2, h3, h4, h5, h6 {
      font-weight: 700;
      line-height: 1.3;
      margin-top: 1.8em;
      margin-bottom: 0.6em;
      color: var(--text);
    }
    h1 { font-size: 2.2rem; border-bottom: 1px solid var(--border); padding-bottom: 0.4em; }
    h2 { font-size: 1.7rem; }
    h3 { font-size: 1.3rem; }
    p { margin-bottom: 1.3em; }
    a { color: var(--accent); text-decoration: underline; text-underline-offset: 4px; }
    hr { border: none; border-top: 1px solid var(--border); margin: 2.5em 0; }
    blockquote {
      border-left: 4px solid var(--accent);
      padding: 0.8em 1.2em;
      margin: 1.5em 0;
      background: var(--code-bg);
      border-radius: 0 8px 8px 0;
      font-style: italic;
    }
    /* Callouts */
    .callout {
      border-left: 4px solid var(--accent);
      padding: 1em 1.2em;
      margin: 1.5em 0;
      border-radius: 0 8px 8px 0;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left-width: 4px;
    }
    /* Tables */
    .table-wrapper {
      overflow-x: auto;
      margin: 1.5em 0;
      border-radius: 8px;
      border: 1px solid var(--border);
      background: var(--surface);
      -webkit-overflow-scrolling: touch;
      touch-action: pan-x;
    }
    table {
      width: 100%;
      min-width: 520px;
      border-collapse: collapse;
      font-size: 0.95rem;
      word-break: normal;
    }
    @media (min-width: 640px) {
      table {
        min-width: 100%;
      }
    }
    th, td {
      padding: 10px 16px;
      border-bottom: 1px solid var(--border);
    }
    th {
      background: var(--code-bg);
      font-weight: 600;
      white-space: nowrap;
    }
    td {
      word-break: normal;
      overflow-wrap: break-word;
    }
    /* Code Blocks */
    .code-block-card {
      margin: 1.5em 0;
      border-radius: 10px;
      border: 1px solid var(--border);
      background: var(--code-bg);
      overflow: hidden;
    }
    .code-block-header {
      padding: 6px 14px;
      background: var(--surface);
      border-bottom: 1px solid var(--border);
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.75rem;
      font-weight: 600;
      color: var(--accent);
    }
    pre {
      padding: 14px 18px;
      overflow-x: auto;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88rem;
      line-height: 1.6;
    }
    code:not(pre code) {
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.88em;
      padding: 2px 6px;
      background: var(--code-bg);
      border-radius: 4px;
    }
    /* Mermaid Containers */
    .mermaid-diagram-card {
      margin: 2em 0;
      border-radius: 12px;
      border: 1px solid var(--border);
      background: var(--surface);
      overflow: hidden;
      text-align: center;
      padding: 20px;
    }
    .mermaid-target svg {
      max-width: 100%;
      height: auto;
      margin: 0 auto;
      display: block;
    }
    /* Math Display */
    .katex-display-wrapper {
      margin: 1.5em 0;
      overflow-x: auto;
      text-align: center;
    }
    /* Task Lists */
    ul, ol { margin: 1em 0 1em 1.5em; }
    li { margin-bottom: 0.4em; }
    footer {
      margin-top: 4em;
      padding-top: 1.5em;
      border-top: 1px solid var(--border);
      font-size: 0.85rem;
      color: var(--text-secondary);
      text-align: center;
    }
    @media print {
      body { background: #fff !important; color: #000 !important; padding: 0 !important; }
      .document-container { max-width: 100% !important; }
      .mermaid-diagram-card, .code-block-card, blockquote { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="document-container">
    ${bodyContent}
    <footer>
      Exported from <strong>md-viewer.e21.dev</strong> on ${new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}
    </footer>
  </div>
</body>
</html>`;

  const blob = new Blob([htmlDocument], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${cleanTitle}.html`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
