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

const { app, BrowserWindow, shell, session, ipcMain } = require('electron');
const http = require('node:http');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFile } = require('node:child_process');

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
      preload: path.join(__dirname, 'preload.cjs'),
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

// ============================================================================
// CẦU NỐI NHÂN NỘI BỘ MÁY TÍNH CHO ĐĂNGLOVEPDF (LibreOffice / qpdf / Ghostscript)
// ============================================================================
function execFileAsync(bin, args, timeoutMs = 90000) {
  return new Promise((resolve, reject) => {
    execFile(bin, args, { timeout: timeoutMs, windowsHide: true }, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr || err.message));
      resolve({ stdout, stderr });
    });
  });
}

async function resolveBinary(candidates) {
  for (const bin of candidates) {
    try {
      if (path.isAbsolute(bin) && fs.existsSync(bin)) return bin;
      await execFileAsync(process.platform === 'win32' ? 'where' : 'which', [bin], 4000);
      return bin;
    } catch (_e) {}
  }
  return null;
}

ipcMain.handle('danglovepdf:detect-engines', async () => {
  const soffice = await resolveBinary(['soffice', 'libreoffice', 'C:\\Program Files\\LibreOffice\\program\\soffice.exe']);
  const qpdf = await resolveBinary(['qpdf', 'C:\\Program Files\\qpdf\\bin\\qpdf.exe']);
  const gs = await resolveBinary(['gswin64c', 'gswin32c', 'gs']);
  return { libreoffice: Boolean(soffice), qpdf: Boolean(qpdf), ghostscript: Boolean(gs) };
});

ipcMain.handle('danglovepdf:run-local-tool', async (_ev, payload) => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'danglovepdf-'));
  try {
    const safeName = path.basename(String(payload?.filename || 'input.pdf')).replace(/[^a-zA-Z0-9._-]/g, '_');
    const inPath = path.join(tmpDir, safeName);
    const base = safeName.replace(/\.[^.]+$/, '');
    fs.writeFileSync(inPath, Buffer.from(payload?.bytes || []));

    if (payload?.cmd === 'office_to_pdf') {
      const soffice = await resolveBinary(['soffice', 'libreoffice', 'C:\\Program Files\\LibreOffice\\program\\soffice.exe']);
      if (!soffice) return { ok: false, error: 'Chưa phát hiện LibreOffice trên máy tính. Hãy cài LibreOffice miễn phí để chuyển đổi Office chuẩn 100%.' };
      await execFileAsync(soffice, ['--headless', '--convert-to', 'pdf', '--outdir', tmpDir, inPath]);
      const outPath = path.join(tmpDir, `${base}.pdf`);
      if (!fs.existsSync(outPath)) return { ok: false, error: 'LibreOffice không tạo được file PDF đầu ra.' };
      return { ok: true, outName: `${base}.pdf`, bytes: Array.from(fs.readFileSync(outPath)) };
    }

    if (payload?.cmd === 'qpdf_encrypt' || payload?.cmd === 'qpdf_decrypt' || payload?.cmd === 'qpdf_linearize') {
      const qpdf = await resolveBinary(['qpdf', 'C:\\Program Files\\qpdf\\bin\\qpdf.exe']);
      if (!qpdf) return { ok: false, error: 'Chưa phát hiện qpdf trên máy tính. Hãy cài qpdf để mã hóa AES-256 / tối ưu tải nhanh.' };
      const outPath = path.join(tmpDir, `${base}_qpdf.pdf`);
      let args = ['--linearize', inPath, outPath];
      if (payload.cmd === 'qpdf_encrypt') {
        const pw = String(payload.password || '123456');
        args = ['--encrypt', pw, pw, '256', ...(payload.noPrint ? ['--print=none', '--extract=n'] : []), '--', inPath, outPath];
      } else if (payload.cmd === 'qpdf_decrypt') {
        args = [`--password=${String(payload.password || '')}`, '--decrypt', inPath, outPath];
      }
      await execFileAsync(qpdf, args);
      return { ok: true, outName: `${base}_qpdf.pdf`, bytes: Array.from(fs.readFileSync(outPath)) };
    }

    if (payload?.cmd === 'gs_compress') {
      const gs = await resolveBinary(['gswin64c', 'gswin32c', 'gs']);
      if (!gs) return { ok: false, error: 'Chưa phát hiện Ghostscript trên máy tính. Hãy cài Ghostscript để nén sâu font-subsetting.' };
      const outPath = path.join(tmpDir, `${base}_gs.pdf`);
      await execFileAsync(gs, ['-sDEVICE=pdfwrite', '-dCompatibilityLevel=1.4', '-dPDFSETTINGS=/ebook', '-dNOPAUSE', '-dQUIET', '-dBATCH', `-sOutputFile=${outPath}`, inPath]);
      return { ok: true, outName: `${base}_Compressed.pdf`, bytes: Array.from(fs.readFileSync(outPath)) };
    }

    return { ok: false, error: 'Lệnh nhân máy tính không hợp lệ.' };
  } catch (err) {
    return { ok: false, error: err?.message || String(err) };
  } finally {
    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_e) {}
  }
});

// ============================================================================
// CẦU NỐI HTTP TRỰC TIẾP (KHÔNG BỊ CORS) CHO PHÂN HỆ "ĐẦU TƯ HÔM NAY" (MOD 49)
// ============================================================================
ipcMain.handle('invest:http-fetch', async (_ev, payload) => {
  const rawUrl = String(payload?.url || '').trim();
  const timeoutMs = Math.min(20000, Math.max(2000, Number(payload?.timeoutMs) || 10000));
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (_e) {
    return { ok: false, status: 400, error: 'URL không hợp lệ.' };
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return { ok: false, status: 403, error: 'Chỉ cho phép giao thức http/https.' };
  }
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const resp = await fetch(parsed.toString(), {
      signal: ctrl.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) BiNovelStudio-InvestToday/2.0',
        Accept: 'application/json, application/xml, text/xml, text/plain, */*',
      },
    });
    const text = (await resp.text()).slice(0, 2 * 1024 * 1024);
    return { ok: resp.ok, status: resp.status, text };
  } catch (err) {
    return { ok: false, status: 0, error: err?.message || String(err) };
  } finally {
    clearTimeout(timer);
  }
});

// ============================================================================
// CẦU NỐI FONT HỆ THỐNG CỤC BỘ CHO ĐĂNGLOVEPDF (ĐỒNG BỘ FONT THẬT 100% OFFLINE)
// ============================================================================
ipcMain.handle('fonts:resolveSystemFont', async (_ev, payload) => {
  const fam = String(payload?.family || '').toLowerCase().trim();
  const bold = Boolean(payload?.isBold);
  const italic = Boolean(payload?.isItalic);
  const fontDirs = process.platform === 'win32'
    ? [path.join(process.env.WINDIR || 'C:\\Windows', 'Fonts')]
    : process.platform === 'darwin'
    ? ['/System/Library/Fonts', '/Library/Fonts']
    : ['/usr/share/fonts', '/usr/local/share/fonts'];

  const winFileMap = {
    'times new roman': bold && italic ? ['timesbi.ttf'] : bold ? ['timesbd.ttf'] : italic ? ['timesi.ttf'] : ['times.ttf'],
    arial: bold && italic ? ['arialbi.ttf'] : bold ? ['arialbd.ttf'] : italic ? ['ariali.ttf'] : ['arial.ttf'],
    calibri: bold && italic ? ['calibriz.ttf'] : bold ? ['calibrib.ttf'] : italic ? ['calibrii.ttf'] : ['calibri.ttf'],
    cambria: bold && italic ? ['cambriaz.ttf'] : bold ? ['cambriab.ttf'] : italic ? ['cambriai.ttf'] : ['cambria.ttc', 'cambria.ttf'],
    tahoma: bold ? ['tahomabd.ttf'] : ['tahoma.ttf'],
    verdana: bold && italic ? ['verdanaz.ttf'] : bold ? ['verdanab.ttf'] : italic ? ['verdanai.ttf'] : ['verdana.ttf'],
    georgia: bold && italic ? ['georgiaz.ttf'] : bold ? ['georgiab.ttf'] : italic ? ['georgiai.ttf'] : ['georgia.ttf'],
    'courier new': bold && italic ? ['courbi.ttf'] : bold ? ['courbd.ttf'] : italic ? ['couri.ttf'] : ['cour.ttf'],
    'segoe ui': bold && italic ? ['segoeuiz.ttf'] : bold ? ['segoeuib.ttf'] : italic ? ['segoeuii.ttf'] : ['segoeui.ttf'],
  };

  let candidates = [];
  for (const [key, files] of Object.entries(winFileMap)) {
    if (fam.includes(key)) {
      candidates = files;
      break;
    }
  }
  if (!candidates.length) return { ok: false };

  for (const dir of fontDirs) {
    if (!fs.existsSync(dir)) continue;
    for (const fileName of candidates) {
      const full = path.join(dir, fileName);
      if (fs.existsSync(full) && /\.ttf|\.otf$/i.test(fileName)) {
        try {
          const buf = fs.readFileSync(full);
          return { ok: true, fileName, base64: buf.toString('base64') };
        } catch (_eRead) {}
      }
    }
  }
  return { ok: false };
});

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
