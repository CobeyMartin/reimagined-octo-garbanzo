/// <reference types="vite/client" />

// Allow importing worker files as URLs
declare module '*?url' {
  const url: string;
  export default url;
}

// Specifically for pdfjs-dist worker
declare module 'pdfjs-dist/build/pdf.worker.min.mjs?url' {
  const url: string;
  export default url;
}
