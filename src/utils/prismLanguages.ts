import Prism from './prism-init';

// Load common language definitions
import 'prismjs/components/prism-clike';
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-bash';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-rust';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-c';
import 'prismjs/components/prism-cpp';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-docker';

export function highlightCode(code: string, language?: string): string {
  if (!code) return '';
  const lang = (language || 'text').toLowerCase();
  
  // Normalize language aliases
  const aliasMap: Record<string, string> = {
    js: 'javascript',
    ts: 'typescript',
    py: 'python',
    sh: 'bash',
    shell: 'bash',
    yml: 'yaml',
    md: 'markdown',
    dockerfile: 'docker',
  };
  
  const targetLang = aliasMap[lang] || lang;
  
  if (Prism.languages[targetLang]) {
    try {
      return Prism.highlight(code, Prism.languages[targetLang], targetLang);
    } catch (e) {
      console.warn(`Prism highlight error for ${targetLang}:`, e);
    }
  }
  
  // Fallback HTML escape
  return code
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default Prism;
