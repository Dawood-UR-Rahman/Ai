import { Buffer } from 'buffer';

// Make Buffer available globally for PDF generation
if (typeof window !== 'undefined') {
  window.Buffer = Buffer;
  (window as any).global = window;
}

export { Buffer };