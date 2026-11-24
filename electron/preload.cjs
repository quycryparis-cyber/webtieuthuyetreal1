/**
 * ============================================================================
 * 🔌 ELECTRON PRELOAD — CẦU NỐI AN TOÀN TỚI NHÂN XỬ LÝ FILE NỘI BỘ MÁY TÍNH
 * ============================================================================
 * Phơi bày duy nhất API `window.NoirDesktopLocalEngine` với contextIsolation: true
 * để ĐăngLovePDF gọi LibreOffice / qpdf / Ghostscript cài sẵn trên máy tính.
 * ============================================================================
 */
'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('NoirDesktopLocalEngine', {
  isDesktopElectron: true,
  detectEngines: () => ipcRenderer.invoke('danglovepdf:detect-engines'),
  runLocalTool: (payload) => ipcRenderer.invoke('danglovepdf:run-local-tool', payload),
  investFetch: (payload) => ipcRenderer.invoke('invest:http-fetch', payload),
});
