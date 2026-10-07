export const DEFAULT_SAMPLE_MARKDOWN = `# Welcome to MD Viewer

*A fast, distraction-free Markdown studio with native Mermaid diagrams, KaTeX math, and instant export. No sign-up required.*

> [!TIP]
> Press **⌘K** (or **Ctrl+K**) anywhere to open the **Command Palette**, or press **Split / Editor** in the top bar to edit this document in real time.

---

## Fast, Zero-Friction Writing

MD Viewer is designed for technical writing, architecture specs, and personal notes. Everything runs directly in your browser with zero external dependencies.

- **Drop & Read**: Drag any \`.md\` file directly into the window to read it with refined editorial typography.
- **Living Vector Diagrams**: Write Mermaid diagrams and inspect, pan, zoom, or copy them as SVG.
- **Mathematical Rigor**: Native KaTeX rendering for both inline formulas like $f(x) = \\sigma(W x + b)$ and centered equations:

$$e^{i\\pi} + 1 = 0 \\qquad \\text{and} \\qquad \\int_{-\\infty}^{\\infty} e^{-x^2} dx = \\sqrt{\\pi}$$

---

## Interactive Diagrams

Mermaid diagrams adapt automatically to your reading theme (**Paper**, **Charcoal Dark**, or **Sepia**):

\`\`\`mermaid
flowchart LR
    A[Raw Markdown] --> B[AST Parser]
    B --> C[KaTeX Math]
    B --> D[Mermaid 11]
    B --> E[Prism Syntax]
    C & D & E --> F[Editorial Canvas]

    classDef amber fill:#fef3c7,stroke:#d97706,stroke-width:2px,color:#92400e;
    classDef dark fill:#292524,stroke:#78716c,stroke-width:1.5px,color:#fafaf9;
    class A,B amber;
    class F dark;
\`\`\`

---

## Code Blocks & Developer Polish

Code blocks feature automatic language badges and one-click copy to clipboard:

\`\`\`typescript
import { parseMarkdown } from './markdownParser';

// Instant local rendering with zero network latency
const document = parseMarkdown(rawContent);
console.log(\`Parsed \${document.wordCount} words in \${document.readingTimeMinutes} min read.\`);
\`\`\`

---

## Privacy-First by Design

> [!NOTE]
> All processing happens client-side directly on your device. Your drafts are saved to browser local storage and never sent to external servers unless you explicitly generate a short URL link.

Happy writing! Start by deleting this text, dragging your own file, or pressing **⌘N** to start a clean slate.
`;
