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

export function printToPdf(): void {
  window.print();
}

export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    // Fallback for older contexts
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
