/**
 * ============================================================================
 * 🖥️ ELECTRON MAIN PROCESS — SỔ TAY TIỂU THUYẾT CỦA BI (WINDOWS / MAC / LINUX)
 * ============================================================================
 * Khởi chạy máy chủ tĩnh nội bộ (127.0.0.1:ephemeral) phục vụ thư mục `dist-app/`
 * hoàn toàn offline để đảm bảo IndexedDB, YouTube No-Cookie, Document PiP,
 * ĐăngLovePDF và Autotester Nội Bộ chạy chuẩn 100% như trình duyệt Desktop.
 * ============================================================================
 */
'use strict';

const { app, BrowserWindow, shell, session } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const DIST_ROOT = path.resolve(__dirname, '..', 'dist-app');
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.m4a': 'audio/mp4',
  '.mp3': 'audio/mpeg',
  '.woff2': 'font/woff2',
};

let localServer = null;
let mainWindow = null;

function startEmbeddedStaticServer() {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const cleanPath = decodeURIComponent((req.url || '/').split('?')[0]);
        const rel = cleanPath === '/' ? 'index.html' : cleanPath.replace(/^\/+/, '');
        const fullPath = path.resolve(DIST_ROOT, rel);
        if (!fullPath.toLowerCase().startsWith(DIST_ROOT.toLowerCase())) {
          res.writeHead(403);
          return res.end('Forbidden');
        }
        fs.readFile(fullPath, (err, data) => {
          if (err) {
            res.writeHead(404);
            return res.end('Not found');
          }
          const ext = path.extname(fullPath).toLowerCase();
          res.writeHead(200, {
            'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
            'Cache-Control': 'no-cache',
          });
          res.end(data);
        });
      } catch (_e) {
        res.writeHead(500);
        res.end('Internal Error');
      }
    });
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      localServer = server;
      resolve(`http://127.0.0.1:${addr.port}/index.html`);
    });
  });
}

async function createMainWindow() {
  const startUrl = await startEmbeddedStaticServer();
  const iconPath = path.join(DIST_ROOT, 'assets', 'app-icon.ico');

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 380,
    minHeight: 620,
    title: 'Sổ Tay Tiểu Thuyết Của Bi — Studio Sáng Tác Đa Nền Tảng',
    backgroundColor: '#09090b',
    icon: fs.existsSync(iconPath) ? iconPath : undefined,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  // Cho phép tải file PDF/DOCX/EPUB/ZIP xuất ra từ Mod 26 & Mod 46 ĐăngLovePDF mượt mà
  session.defaultSession.setPermissionRequestHandler((_wc, _perm, callback) => {
    callback(true);
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    // Giữ cửa sổ nổi YouTube nội bộ / about:blank mở bên trong app; mở link ngoài bằng trình duyệt mặc định
    if (/^https?:\/\/(127\.0\.0\.1|localhost)/i.test(url) || url === 'about:blank') {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  await mainWindow.loadURL(startUrl);
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createMainWindow);

app.on('window-all-closed', () => {
  if (localServer) {
    try { localServer.close(); } catch (_e) {}
    localServer = null;
  }
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createMainWindow();
});
