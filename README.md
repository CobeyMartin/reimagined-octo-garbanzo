# PDF Editor Suite

A powerful desktop PDF editor built with Electron, React, and TypeScript. Edit, merge, compress, and annotate PDF documents with ease.

## Features

- 📄 **PDF Viewing** - Open and view PDF documents with smooth rendering
- ✏️ **Annotations** - Add highlights, text notes, and freehand drawings
- 🔀 **Merge PDFs** - Combine multiple PDF files into one
- 📑 **Page Management** - Reorder, extract, or delete pages
- 📦 **Compression** - Reduce PDF file size with 3 compression levels (25%, 50%, 75%)
- 💾 **Save & Export** - Save edited PDFs to disk

## Prerequisites

Before building the app, ensure you have the following installed:

- **Node.js** v18 or later
- **pnpm** v8 or later
- **Ghostscript** (required for PDF compression)

### Installing Ghostscript

**macOS (Homebrew):**
```bash
brew install ghostscript
```

**Ubuntu/Debian:**
```bash
sudo apt-get install ghostscript
```

**Windows:**
Download from [Ghostscript official site](https://www.ghostscript.com/releases/gsdnld.html)

## Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/CobeyMartin/reimagined-octo-garbanzo.git
   cd reimagined-octo-garbanzo
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Build the shared package:**
   ```bash
   pnpm build:shared
   ```

## Development

Run the app in development mode with hot reload:

```bash
cd packages/electron-app
pnpm dev
```

Or from the root directory:

```bash
pnpm --filter @pdf-editor/electron-app start
```

## Building for Production

### Package the App

To create a packaged application:

```bash
cd packages/electron-app
pnpm run package
```

The packaged app will be in `packages/electron-app/out/`.

### Create Distributable

To create a distributable (ZIP, DMG, etc.):

```bash
cd packages/electron-app
pnpm run make
```

### Platform-Specific Builds

The default configuration targets **macOS ARM64** (Apple Silicon). To build for other platforms, modify `forge.config.js`:

```javascript
// For Intel Mac
arch: 'x64',
platform: 'darwin',

// For Windows
arch: 'x64',
platform: 'win32',

// For Linux
arch: 'x64',
platform: 'linux',
```

## Project Structure

```
pdf-editor-suite/
├── packages/
│   ├── electron-app/          # Main Electron application
│   │   ├── src/
│   │   │   ├── main/          # Electron main process
│   │   │   ├── preload/       # Preload scripts (IPC bridge)
│   │   │   └── renderer/      # React UI components
│   │   ├── assets/            # App icons
│   │   └── forge.config.js    # Electron Forge config
│   └── shared/                # Shared utilities & types
│       └── src/
│           ├── pdf-operations.ts  # PDF manipulation logic
│           └── types.ts           # TypeScript types
├── pnpm-workspace.yaml
└── tsconfig.base.json
```

## Tech Stack

- **Electron** - Desktop application framework
- **React 18** - UI library
- **TypeScript** - Type-safe JavaScript
- **Vite** - Fast build tool
- **Electron Forge** - Packaging & distribution
- **pdf-lib** - PDF manipulation
- **pdfjs-dist** - PDF rendering
- **Zustand** - State management
- **Ghostscript** - PDF compression

## Troubleshooting

### PDF previews not loading
Ensure `pdfjs-dist` is properly installed and the worker is configured correctly.

### Compression not working
Verify Ghostscript is installed:
```bash
gs --version
```

### App shows blank screen after packaging
Make sure all Vite configs output to the correct directories and preload scripts are bundled.

## License

MIT
