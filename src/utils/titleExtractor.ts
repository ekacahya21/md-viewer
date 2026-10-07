/**
 * Smart Document Title Extraction Utility
 * 
 * Heuristic priority:
 * 1. YAML Frontmatter: `title: "..."` or `title: ...` at top of file
 * 2. ATX H1: `# Heading 1`
 * 3. Setext H1: `Heading 1 \n ====`
 * 4. ATX H2: `## Heading 2` (fallback if no H1)
 * 5. First meaningful non-empty text line (cleaned, max 60 chars)
 * 6. Fallback file name (e.g. imported .md filename without extension)
 * 7. Default: 'Untitled Document'
 */

export function cleanMarkdownFormatting(text: string): string {
  if (!text) return '';
  return text
    // Replace markdown links [label](url) with label
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove inline code backticks
    .replace(/`([^`]+)`/g, '$1')
    // Remove bold and italics (**, *, __, _)
    .replace(/(\*\*|__)(.*?)\1/g, '$2')
    .replace(/(\*|_)(.*?)\1/g, '$2')
    // Remove strikethrough (~~)
    .replace(/~~(.*?)~~/g, '$1')
    // Remove KaTeX math symbols $...$ or $$...$$
    .replace(/\$\$?[^$]+\$\$?/g, '')
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Remove leading list markers, blockquotes, or checkboxes
    .replace(/^(\s*[-*+]\s*(\[[ xX]\]\s*)?|\s*>\s*|\s*\d+\.\s*)/, '')
    // Clean remaining markup characters
    .replace(/[#*`_~\[\]$]/g, '')
    .trim();
}

export function extractDocumentTitle(
  content: string,
  fallbackFileName?: string
): string {
  if (!content || !content.trim()) {
    return fallbackFileName?.trim() || 'Untitled Document';
  }

  const trimmed = content.trim();

  // 1. YAML Frontmatter at the beginning of the document
  const frontmatterMatch = trimmed.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/);
  if (frontmatterMatch && frontmatterMatch[1]) {
    const yamlBody = frontmatterMatch[1];
    const titleMatch = yamlBody.match(/^title:\s*(?:["'](.*?)["']|(.*))$/m);
    if (titleMatch) {
      const rawTitle = (titleMatch[1] || titleMatch[2] || '').trim();
      const clean = cleanMarkdownFormatting(rawTitle);
      if (clean) return clean;
    }
  }

  // Content without frontmatter to avoid false matches inside YAML
  const bodyContent = frontmatterMatch ? trimmed.slice(frontmatterMatch[0].length) : trimmed;

  // 2. ATX H1 Heading: `# Heading`
  const h1Match = bodyContent.match(/^#\s+(.+)$/m);
  if (h1Match && h1Match[1]) {
    const clean = cleanMarkdownFormatting(h1Match[1]);
    if (clean) return clean;
  }

  // 3. Setext H1 Heading: `Heading \n ====`
  const setextMatch = bodyContent.match(/^([^\r\n#\-`][^\r\n]*)\r?\n={3,}\s*$/m);
  if (setextMatch && setextMatch[1]) {
    const clean = cleanMarkdownFormatting(setextMatch[1]);
    if (clean) return clean;
  }

  // 4. ATX H2 Heading: `## Heading`
  const h2Match = bodyContent.match(/^##\s+(.+)$/m);
  if (h2Match && h2Match[1]) {
    const clean = cleanMarkdownFormatting(h2Match[1]);
    if (clean) return clean;
  }

  // 5. First meaningful line of text (skipping code blocks, thematic breaks, html comments)
  const lines = bodyContent.split(/\r?\n/);
  let insideCodeBlock = false;

  for (const line of lines) {
    const lineTrimmed = line.trim();
    if (!lineTrimmed) continue;

    // Toggle code block
    if (lineTrimmed.startsWith('```') || lineTrimmed.startsWith('~~~')) {
      insideCodeBlock = !insideCodeBlock;
      continue;
    }
    if (insideCodeBlock) continue;

    // Skip horizontal rules, comments, or block elements
    if (/^([-*_]){3,}\s*$/.test(lineTrimmed)) continue;
    if (lineTrimmed.startsWith('<!--')) continue;

    const clean = cleanMarkdownFormatting(lineTrimmed);
    if (clean && clean.length > 0) {
      // Truncate to reasonable length if it's a long sentence
      return clean.length > 60 ? `${clean.slice(0, 57).trim()}...` : clean;
    }
  }

  // 6. Fallback to imported file name if available
  if (fallbackFileName && fallbackFileName.trim()) {
    return fallbackFileName.trim();
  }

  return 'Untitled Document';
}
