/**
 * Electron Main Process
 * Handles window creation, IPC, and file system operations
 */

import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import { join } from 'path';
import { readFile, writeFile, mkdtemp, rm } from 'fs/promises';
import { tmpdir } from 'os';
import { execFile } from 'child_process';
import { promisify } from 'util';
import {
  loadPdfInfo,
  mergePdfs,
  applyAnnotations,
  reorderPages,
  extractPages,
  deletePages,
} from '@pdf-editor/shared';
import type { MergeSource, Annotation, CompressionLevel, CompressionResult } from '@pdf-editor/shared';

const execFileAsync = promisify(execFile);

declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined;
declare const MAIN_WINDOW_VITE_NAME: string;

let mainWindow: BrowserWindow | null = null;

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false, // Disabled for file system access
    },
    titleBarStyle: 'hiddenInset',
    show: false,
  });

  // Load the app
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// IPC Handlers
function setupIpcHandlers(): void {
  // Open file dialog
  ipcMain.handle('dialog:openPdf', async () => {
    const result = await dialog.showOpenDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
      properties: ['openFile', 'multiSelections'],
    });
    return result;
  });

  // Save file dialog
  ipcMain.handle('dialog:savePdf', async () => {
    const result = await dialog.showSaveDialog({
      filters: [{ name: 'PDF Files', extensions: ['pdf'] }],
    });
    return result;
  });

  // Read PDF file
  ipcMain.handle('pdf:read', async (_event, filePath: string) => {
    try {
      const bytes = await readFile(filePath);
      return { success: true, data: bytes };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to read file',
      };
    }
  });

  // Write PDF file
  ipcMain.handle(
    'pdf:write',
    async (_event, filePath: string, data: Uint8Array) => {
      try {
        await writeFile(filePath, data);
        return { success: true };
      } catch (error) {
        return {
          success: false,
          error: error instanceof Error ? error.message : 'Failed to write file',
        };
      }
    }
  );

  // Get PDF info
  ipcMain.handle('pdf:getInfo', async (_event, bytes: Uint8Array) => {
    try {
      const info = await loadPdfInfo(bytes);
      return { success: true, data: info };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to load PDF info',
      };
    }
  });

  // Merge PDFs
  ipcMain.handle('pdf:merge', async (_event, sources: MergeSource[]) => {
    try {
      const result = await mergePdfs(sources);
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to merge PDFs',
      };
    }
  });

  // Apply annotations
  ipcMain.handle(
    'pdf:applyAnnotations',
    async (_event, bytes: Uint8Array, annotations: Annotation[]) => {
      try {
        const result = await applyAnnotations(bytes, annotations);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to apply annotations',
        };
      }
    }
  );

  // Reorder pages
  ipcMain.handle(
    'pdf:reorderPages',
    async (_event, bytes: Uint8Array, newOrder: number[]) => {
      try {
        const result = await reorderPages(bytes, newOrder);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to reorder pages',
        };
      }
    }
  );

  // Extract pages
  ipcMain.handle(
    'pdf:extractPages',
    async (_event, bytes: Uint8Array, pageIndices: number[]) => {
      try {
        const result = await extractPages(bytes, pageIndices);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to extract pages',
        };
      }
    }
  );

  // Delete pages
  ipcMain.handle(
    'pdf:deletePages',
    async (_event, bytes: Uint8Array, pageIndices: number[]) => {
      try {
        const result = await deletePages(bytes, pageIndices);
        return { success: true, data: result };
      } catch (error) {
        return {
          success: false,
          error:
            error instanceof Error ? error.message : 'Failed to delete pages',
        };
      }
    }
  );

  // Compress PDF using Ghostscript directly
  ipcMain.handle(
    'pdf:compress',
    async (_event, bytes: Uint8Array, level: CompressionLevel): Promise<CompressionResult> => {
      const originalSize = bytes.length;
      let tempDir: string | null = null;
      
      try {
        // Create temp directory for the operation
        tempDir = await mkdtemp(join(tmpdir(), 'pdf-compress-'));
        const inputPath = join(tempDir, 'input.pdf');
        const outputPath = join(tempDir, 'output.pdf');
        
        // Write input PDF to temp file
        await writeFile(inputPath, bytes);
        
        // Map compression levels to Ghostscript PDFSETTINGS
        // /screen = 72 dpi, /ebook = 150 dpi, /printer = 300 dpi, /prepress = 300 dpi
        const settingsMap: Record<CompressionLevel, string> = {
          75: '/screen',   // Maximum compression - 72 dpi
          50: '/ebook',    // Medium compression - 150 dpi
          25: '/printer',  // Light compression - 300 dpi
        };
        
        const pdfsetting = settingsMap[level];
        
        // Build Ghostscript arguments
        const gsArgs = [
          '-sDEVICE=pdfwrite',
          '-dCompatibilityLevel=1.4',
          `-dPDFSETTINGS=${pdfsetting}`,
          '-dNOPAUSE',
          '-dQUIET',
          '-dBATCH',
          `-sOutputFile=${outputPath}`,
          inputPath,
        ];
        
        // Try to find Ghostscript
        const gsPaths = [
          '/opt/homebrew/bin/gs',  // Homebrew on Apple Silicon
          '/usr/local/bin/gs',      // Homebrew on Intel Mac
          '/usr/bin/gs',            // System path
          'gs',                     // PATH
        ];
        
        let gsPath = 'gs';
        for (const path of gsPaths) {
          try {
            await execFileAsync(path, ['--version']);
            gsPath = path;
            break;
          } catch {
            // Try next path
          }
        }
        
        // Run Ghostscript
        await execFileAsync(gsPath, gsArgs);
        
        // Read compressed file
        const compressedBuffer = await readFile(outputPath);
        const compressedBytes = new Uint8Array(compressedBuffer);
        const compressedSize = compressedBytes.length;
        const reductionPercent = Math.round((1 - compressedSize / originalSize) * 100);
        
        return {
          success: true,
          bytes: compressedBytes,
          originalSize,
          compressedSize,
          reductionPercent: Math.max(0, reductionPercent),
        };
      } catch (error) {
        console.error('Compression error:', error);
        return {
          success: false,
          originalSize,
          compressedSize: originalSize,
          reductionPercent: 0,
          error: error instanceof Error ? error.message : 'Failed to compress PDF. Make sure Ghostscript is installed.',
        };
      } finally {
        // Clean up temp directory
        if (tempDir) {
          try {
            await rm(tempDir, { recursive: true, force: true });
          } catch {
            // Ignore cleanup errors
          }
        }
      }
    }
  );
}

// App lifecycle
app.whenReady().then(() => {
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});
