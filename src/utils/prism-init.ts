import Prism from 'prismjs';

if (typeof globalThis !== 'undefined') {
  (globalThis as unknown as { Prism: typeof Prism }).Prism = Prism;
}
if (typeof window !== 'undefined') {
  (window as unknown as { Prism: typeof Prism }).Prism = Prism;
}

export default Prism;
