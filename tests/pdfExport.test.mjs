import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

test('Print Stylesheet - ensures high contrast and unconstrained pagination in index.css', () => {
  const cssContent = fs.readFileSync(path.join(rootDir, 'src', 'index.css'), 'utf-8');

  // Verify @media print exists
  assert.ok(cssContent.includes('@media print'), '@media print block must be defined in index.css');

  // Verify theme variable resets for black-on-white printing
  assert.ok(cssContent.includes('--bg-canvas: #ffffff !important;'), 'Print stylesheet must force white canvas background');
  assert.ok(cssContent.includes('--text-primary: #111827 !important;'), 'Print stylesheet must force high-contrast dark text');
  assert.ok(cssContent.includes('color-scheme: light !important;'), 'Print stylesheet must force light color scheme');

  // Verify hiding non-printable components (header, footer, editor, resizer, etc.)
  assert.ok(cssContent.includes('.editor-pane-container'), 'Editor pane container must be hidden in print');
  assert.ok(cssContent.includes('[role="separator"]'), 'Resizer separator must be hidden in print');
  assert.ok(cssContent.includes('footer'), 'Footer status bar must be hidden in print');

  // Verify unconstraining containers to prevent overflow truncation / blank pages
  assert.ok(cssContent.includes('overflow: visible !important;'), 'Ancestors must have overflow visible in print');
  assert.ok(cssContent.includes('.preview-pane-container'), 'Preview pane container must have explicit print rules');
  assert.ok(cssContent.includes('.preview-pane-scroller'), 'Preview pane scroller must have explicit print rules');

  // Verify inner container padding reset to prevent trailing blank pages
  assert.ok(cssContent.includes('.preview-pane-scroller > div'), 'Scroller child must reset padding to avoid blank trailing page');

  // Verify page break prevention on components
  assert.ok(cssContent.includes('page-break-inside: avoid !important;'), 'Cards and tables must avoid page breaks inside');
});

test('App layout - ensures editor and preview containers have proper print class hooks', () => {
  const appContent = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf-8');

  assert.ok(appContent.includes('editor-pane-container'), 'App.tsx must include editor-pane-container class');
  assert.ok(appContent.includes('preview-pane-container'), 'App.tsx must include preview-pane-container class');
  
  // Ensure Preview is always mounted (not conditionally omitted in editor mode)
  assert.ok(
    !appContent.includes("{(viewMode === 'reader' || viewMode === 'split') && (\n            <div\n              className={`h-full min-w-0"),
    'Preview pane must not be conditionally unmounted in editor mode'
  );
});

test('Preview component - includes preview-pane-scroller class', () => {
  const previewContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Preview.tsx'), 'utf-8');
  assert.ok(previewContent.includes('preview-pane-scroller'), 'Preview.tsx must include preview-pane-scroller class');
});

test('exportUtils - exports printToPdf, exportStandaloneHtml, and downloadMarkdown', async () => {
  const { printToPdf, exportStandaloneHtml, downloadMarkdown } = await import('../src/utils/exportUtils.ts');
  assert.equal(typeof printToPdf, 'function', 'printToPdf must be a function');
  assert.equal(typeof exportStandaloneHtml, 'function', 'exportStandaloneHtml must be a function');
  assert.equal(typeof downloadMarkdown, 'function', 'downloadMarkdown must be a function');

  const exportUtilsContent = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'exportUtils.ts'), 'utf-8');
  // Verify isolated iframe document template
  assert.ok(exportUtilsContent.includes('editorial-header'), 'Must generate editorial-header in print document');
  assert.ok(exportUtilsContent.includes('editorial-badge'), 'Must include editorial badge');
  assert.ok(exportUtilsContent.includes('editorial-title'), 'Must include editorial title');
  assert.ok(exportUtilsContent.includes('editorial-meta'), 'Must include editorial meta');
  assert.ok(exportUtilsContent.includes('size: A4'), 'Must set @page size to A4');
  assert.ok(exportUtilsContent.includes('margin: 18mm 20mm'), 'Must set @page margin to 18mm 20mm');
  assert.ok(exportUtilsContent.includes('document.createElement(\'iframe\')'), 'Must create hidden print iframe');
  assert.ok(exportUtilsContent.includes('afterprint'), 'Must listen to afterprint for cleanup');
});

test('App - passes title, container, and reading stats to printToPdf', () => {
  const appContent = fs.readFileSync(path.join(rootDir, 'src', 'App.tsx'), 'utf-8');
  assert.ok(
    appContent.includes('printToPdf(title, previewContainerRef.current,'),
    'App.tsx handlePrintPdf must pass title and previewContainerRef to printToPdf'
  );
});

test('Mermaid diagram - toolbar and modal provide copy source code options', () => {
  const parserContent = fs.readFileSync(path.join(rootDir, 'src', 'utils', 'markdownParser.ts'), 'utf-8');
  // Check that markdownParser renders diagram card with copy code button
  assert.ok(parserContent.includes('btn-mermaid-copy-code'), 'Diagram toolbar must contain btn-mermaid-copy-code');
  assert.ok(parserContent.includes('data-mermaid='), 'Diagram card must store encoded mermaid source');
  assert.ok(parserContent.includes('Copy Diagram Code'), 'Button must have title Copy Diagram Code');
  // Check MermaidModal component has copy code handling
  const modalContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'MermaidModal.tsx'), 'utf-8');
  assert.ok(modalContent.includes('rawCode'), 'MermaidModal must accept rawCode prop');
  assert.ok(modalContent.includes('handleCopyCode'), 'MermaidModal must define handleCopyCode');
  assert.ok(modalContent.includes('copyCode'), 'MermaidModal must render copyCode button');

  // Check Preview component binds btn-mermaid-copy-code and passes rawCode to MermaidModal
  const previewContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'Preview.tsx'), 'utf-8');
  assert.ok(previewContent.includes('.btn-mermaid-copy-code'), 'Preview must query and bind .btn-mermaid-copy-code');
  assert.ok(previewContent.includes('setInspectingCode'), 'Preview must store inspectingCode');
  assert.ok(previewContent.includes('rawCode={inspectingCode'), 'Preview must pass rawCode to MermaidModal');
});
test('Mermaid diagram - modal immediately fits diagram to screen on open and reset', () => {
  const modalContent = fs.readFileSync(path.join(rootDir, 'src', 'components', 'MermaidModal.tsx'), 'utf-8');
  assert.ok(modalContent.includes('fitDiagram'), 'MermaidModal must define fitDiagram helper');
  assert.ok(modalContent.includes('initialFitScaleRef'), 'MermaidModal must track initialFitScaleRef for fit to screen');
  assert.ok(modalContent.includes('cardRef'), 'MermaidModal must bind cardRef to measure diagram bounds');
  assert.ok(modalContent.includes('useLayoutEffect'), 'MermaidModal must use useLayoutEffect for immediate fit before paint');
  assert.ok(modalContent.includes('viewBox'), 'MermaidModal must extract natural SVG dimensions using viewBox');
  assert.ok(modalContent.includes('handleReset'), 'MermaidModal must define handleReset');
  assert.ok(
    modalContent.includes('setScale(initialFitScaleRef.current)'),
    'handleReset must reset to initialFitScaleRef'
  );
});
