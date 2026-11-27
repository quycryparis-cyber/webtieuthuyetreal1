#!/usr/bin/env node
/**
 * ============================================================================
 * ☁️ 3-WAY SMART BIDIRECTIONAL SYNC: PC WORKSPACE <-> GOOGLE DRIVE
 * ============================================================================
 * Cơ chế đồng bộ 2 chiều chuẩn công nghiệp (3-Way Diff: Local <-> Base <-> Drive):
 *   1. Chiều xuôi (PC sửa, Drive giữ nguyên)       -> Tự động PUSH (cập nhật đè đúng Drive File ID)
 *   2. Chiều ngược (Drive sửa/tạo mới từ ĐT/máy xa) -> Tự động PULL về đúng thư mục gốc máy tính
 *   3. Không đổi cả 2 bên                          -> Bỏ qua tức thì (0 KB)
 *   4. Cả 2 bên cùng sửa 1 tệp (Xung đột thật)    -> KHÔNG ghi đè mất bài! Lưu bản Drive cạnh bên
 *                                                     dạng `<ten>.drive-conflict-<timestamp><ext>`
 *   5. Bảo vệ tuyệt đối kho Git (.git/ & node_modules/ luôn loại trừ) để VS Code commit &
 *      `git push --force` lên GitHub mượt 100% không bao giờ lỗi index.lock!
 *
 * Cách dùng:
 *   node scripts/sync-to-gdrive.mjs              # Đồng bộ 2 chiều thông minh (mặc định)
 *   node scripts/sync-to-gdrive.mjs --push-only  # Chỉ đẩy chiều xuôi (PC -> Drive)
 *   node scripts/sync-to-gdrive.mjs --pull-only  # Chỉ kéo chiều ngược (Drive -> PC)
 *   node scripts/sync-to-gdrive.mjs --dry-run    # Mô phỏng 3-way diff không sửa dữ liệu
 *   node scripts/sync-to-gdrive.mjs --watch      # Chạy nền tự động (5s local debounce + 60s poll Drive)
 *   node scripts/sync-to-gdrive.mjs --status     # Xem link Drive & thống kê manifest
 * ============================================================================
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFile, execFileSync } from 'node:child_process';
import { promisify } from 'node:util';
import { fileURLToPath } from 'node:url';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CODE_ROOT = path.resolve(__dirname, '..');
const WORKSPACE_ROOT = path.resolve(CODE_ROOT, '..', '..');
const MANIFEST_PATH = path.join(WORKSPACE_ROOT, '.gdrive-sync-manifest.json');
const LOCK_PATH = path.join(WORKSPACE_ROOT, '.gdrive-sync.lock');
const DRIVE_ROOT_NAME = '1. VƯỢT KHÓ LIGHT NOVEL (Workspace Sync)';

const ACTIVE_TARGETS = [
  'AGENTS.md',
  '.agents',
  '.vscode',
  '01_Chuong_Goc_Chua_Duyet',
  '02_Chuong_Da_Duyet',
  '03_Story_Bible_Local',
  '04_Chi_Muc_Chong_Quen',
  '05_Bang_Trang_Y_Tuong',
  '06_Sao_Luu_Code_Va_Ban_Thao',
  path.join('Code', 'Code true'),
];

const EXCLUDE_SEGMENTS = new Set([
  '.git',
  'node_modules',
  'release',
  'android',
  'ios',
]);

const EXCLUDE_FILENAMES = new Set([
  '.gdrive-sync-manifest.json',
  '.gdrive-sync.lock',
  '_studio_workspace_state.json',
  'Thumbs.db',
  '.DS_Store',
]);

function resolveGdriveBin() {
  if (process.env.GDRIVE_BIN && fs.existsSync(process.env.GDRIVE_BIN)) {
    return { bin: process.env.GDRIVE_BIN, isExe: /\.exe$/i.test(process.env.GDRIVE_BIN) };
  }
  // Ưu tiên tìm thẳng native binary gdrive-*.exe (chạy trực tiếp không qua cmd shell -> 100% an toàn dấu tiếng Việt & dấu cách!)
  const appDataRoot = process.env.ANTIGRAVITY_APP_DATA_DIR || path.join(os.homedir(), '.gemini', 'antigravity');
  const binDir = path.join(appDataRoot, 'plugin_data', 'gdrive', 'bin');
  if (fs.existsSync(binDir)) {
    try {
      const exes = fs.readdirSync(binDir).filter((f) => /^gdrive.*\.exe$/i.test(f)).sort().reverse();
      if (exes.length) {
        return { bin: path.join(binDir, exes[0]), isExe: true };
      }
    } catch (_eDir) {}
  }

  const fallbackCmd = path.join(
    os.homedir(),
    '.gemini',
    'config',
    'plugins',
    'gdrive',
    'skills',
    'gdrive',
    'scripts',
    process.platform === 'win32' ? 'gdrive.cmd' : 'gdrive'
  );
  if (fs.existsSync(fallbackCmd)) {
    return { bin: fallbackCmd, isExe: process.platform !== 'win32' };
  }
  return { bin: 'gdrive', isExe: process.platform !== 'win32' };
}

const GDRIVE_INFO = resolveGdriveBin();
const GDRIVE_BIN = GDRIVE_INFO.bin;

function sha256AndMd5File(filePath) {
  const buf = fs.readFileSync(filePath);
  const sha256 = crypto.createHash('sha256').update(buf).digest('hex');
  const md5 = crypto.createHash('md5').update(buf).digest('hex');
  return { sha256, md5, size: buf.byteLength };
}

function isExcludedPath(relPath, baseName) {
  if (EXCLUDE_FILENAMES.has(baseName)) return true;
  if (/\.drive-conflict-/i.test(baseName)) return true;
  if (/\.(tmp|log)$/i.test(baseName)) return true;
  const segs = relPath.split('/');
  return segs.some((s) => EXCLUDE_SEGMENTS.has(s));
}

function loadManifest() {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      const parsed = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));
      return {
        version: 2,
        rootFolderName: DRIVE_ROOT_NAME,
        rootFolderId: parsed.rootFolderId || '',
        rootFolderUrl: parsed.rootFolderUrl || '',
        folders: parsed.folders || {},
        files: parsed.files || {},
        lastSyncedAt: parsed.lastSyncedAt || null,
      };
    } catch (_e) {}
  }
  return {
    version: 2,
    rootFolderName: DRIVE_ROOT_NAME,
    rootFolderId: '',
    rootFolderUrl: '',
    folders: {},
    files: {},
    lastSyncedAt: null,
  };
}

function saveManifest(manifest) {
  manifest.lastSyncedAt = new Date().toISOString();
  const tmp = `${MANIFEST_PATH}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(manifest, null, 2), 'utf8');
  fs.renameSync(tmp, MANIFEST_PATH);
}

function acquireLock() {
  if (fs.existsSync(LOCK_PATH)) {
    try {
      const st = fs.statSync(LOCK_PATH);
      const ageMs = Date.now() - st.mtimeMs;
      if (ageMs < 15 * 60 * 1000) {
        const info = fs.readFileSync(LOCK_PATH, 'utf8').trim();
        throw new Error(`Đang có phiên đồng bộ khác chạy (${info}). Đợi phiên đó xong hoặc xóa ${LOCK_PATH}.`);
      }
    } catch (err) {
      if (err?.message?.includes('Đang có phiên đồng bộ khác')) throw err;
    }
  }
  fs.writeFileSync(LOCK_PATH, `pid=${process.pid} started=${new Date().toISOString()}`, 'utf8');
}

function releaseLock() {
  try {
    if (fs.existsSync(LOCK_PATH)) fs.unlinkSync(LOCK_PATH);
  } catch (_e) {}
}

function parseJsonLoose(stdout) {
  const txt = String(stdout || '').trim();
  if (!txt) return null;
  try {
    return JSON.parse(txt);
  } catch (_e) {
    const mObj = txt.match(/(\{[\s\S]*\}|\[[\s\S]*\])/);
    if (mObj) {
      try { return JSON.parse(mObj[1]); } catch (_e2) {}
    }
    return null;
  }
}

async function runGdrive(args, retries = 6) {
  let lastErr = null;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const fullArgs = [...args, '--json'];
      const { stdout, stderr } = GDRIVE_INFO.isExe
        ? await execFileAsync(GDRIVE_BIN, fullArgs, {
            shell: false,
            maxBuffer: 24 * 1024 * 1024,
            windowsHide: true,
          })
        : await execFileAsync('cmd.exe', ['/d', '/c', GDRIVE_BIN, ...fullArgs], {
            shell: false,
            maxBuffer: 24 * 1024 * 1024,
            windowsHide: true,
          });
      return { stdout, stderr, json: parseJsonLoose(stdout) };
    } catch (err) {
      lastErr = err;
      const msg = `${err?.stderr || ''}\n${err?.stdout || ''}\n${err?.message || ''}`;
      if (/no credentials found|needs authentication|auth login/i.test(msg)) {
        throw new Error(`GDRIVE_AUTH_REQUIRED: Chưa đăng nhập Google Drive CLI. Hãy chạy "gdrive auth login" để xác thực.\n${msg.trim()}`);
      }
      if (attempt < retries) {
        const isRateLimit = /RATE_LIMIT_EXCEEDED|rateLimitExceeded|userRateLimitExceeded|Quota exceeded|429/i.test(msg);
        const waitMs = isRateLimit ? Math.min(60000, 12000 * attempt) : 1200 * attempt;
        if (isRateLimit) {
          console.log(`   ⏳ Google Drive tạm giới hạn tốc độ phút — tự chờ ${Math.round(waitMs / 1000)}s rồi tiếp tục (lần ${attempt}/${retries - 1})...`);
        }
        await new Promise((r) => setTimeout(r, waitMs));
      }
    }
  }
  throw lastErr;
}

function extractDriveId(json, stdout) {
  if (json) {
    if (typeof json.id === 'string' && json.id) return json.id;
    if (json.file?.id) return json.file.id;
    if (json.folder?.id) return json.folder.id;
    if (Array.isArray(json) && json[0]?.id) return json[0].id;
    if (Array.isArray(json.files) && json.files[0]?.id) return json.files[0].id;
  }
  const m = String(stdout || '').match(/\b([A-Za-z0-9_-]{22,})\b/);
  return m ? m[1] : '';
}

function extractItemMeta(json) {
  if (!json || typeof json !== 'object') return {};
  const obj = json.file || json.folder || json;
  return {
    id: obj.id || '',
    name: obj.name || '',
    mimeType: obj.mimeType || obj.type || '',
    md5Checksum: obj.md5Checksum || obj.md5 || '',
    modifiedTime: obj.modifiedTime || obj.modified_time || obj.updatedAt || '',
    size: obj.size !== undefined ? Number(obj.size) : undefined,
    trashed: Boolean(obj.trashed),
  };
}

function isFolderItem(it) {
  const mt = String(it?.mimeType || it?.type || '');
  return /vnd\.google-apps\.folder|^folder$/i.test(mt);
}

function isGoogleNativeDoc(it) {
  const mt = String(it?.mimeType || '');
  return mt.startsWith('application/vnd.google-apps.') && !isFolderItem(it);
}

function walkLocalActiveFiles() {
  const dirs = new Set();
  const files = new Map();

  const scanDir = (absDir, relDir) => {
    if (relDir) dirs.add(relDir);
    const entries = fs.readdirSync(absDir, { withFileTypes: true });
    for (const ent of entries) {
      const absChild = path.join(absDir, ent.name);
      const relChild = relDir ? `${relDir}/${ent.name}` : ent.name;
      if (isExcludedPath(relChild, ent.name)) continue;
      if (ent.isDirectory()) {
        scanDir(absChild, relChild);
      } else if (ent.isFile()) {
        const hashes = sha256AndMd5File(absChild);
        files.set(relChild, { absPath: absChild, relPath: relChild, relDir, ...hashes });
      }
    }
  };

  for (const target of ACTIVE_TARGETS) {
    const absTarget = path.join(WORKSPACE_ROOT, target);
    if (!fs.existsSync(absTarget)) continue;
    const relTarget = target.split(path.sep).join('/');
    const st = fs.statSync(absTarget);
    if (st.isFile()) {
      const hashes = sha256AndMd5File(absTarget);
      files.set(relTarget, { absPath: absTarget, relPath: relTarget, relDir: '', ...hashes });
    } else if (st.isDirectory()) {
      const parts = relTarget.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirs.add(parts.slice(0, i).join('/'));
      }
      scanDir(absTarget, relTarget);
    }
  }

  const sortedDirs = Array.from(dirs).sort((a, b) => a.split('/').length - b.split('/').length || a.localeCompare(b));
  return { dirs: sortedDirs, files };
}

async function listRemoteFolderChildren(folderId) {
  const ls = await runGdrive(['readonly', 'ls', folderId, '--max', '500'], 3);
  const raw = Array.isArray(ls.json) ? ls.json : (ls.json?.files || ls.json?.items || []);
  return raw.map(extractItemMeta).filter((it) => it.id && it.name && !it.trashed);
}

async function scanRemoteDriveTree(rootFolderId) {
  const remoteFolders = new Map(); // relDir -> folderId
  const remoteFiles = new Map();   // relPath -> meta

  const walk = async (folderId, relDir) => {
    const children = await listRemoteFolderChildren(folderId);
    const subFolders = [];
    for (const ch of children) {
      const relChild = relDir ? `${relDir}/${ch.name}` : ch.name;
      if (isExcludedPath(relChild, ch.name)) continue;
      if (isFolderItem(ch)) {
        remoteFolders.set(relChild, ch.id);
        subFolders.push({ id: ch.id, relDir: relChild });
      } else if (!isGoogleNativeDoc(ch)) {
        // Nếu có trùng tên trên Drive, ưu tiên bản sửa mới nhất
        const prev = remoteFiles.get(relChild);
        if (!prev || String(ch.modifiedTime) > String(prev.modifiedTime)) {
          remoteFiles.set(relChild, { ...ch, relPath: relChild, relDir, parentId: folderId });
        }
      }
    }
    await runPool(subFolders, 2, async (sf) => {
      await walk(sf.id, sf.relDir);
    });
  };

  await walk(rootFolderId, '');
  return { remoteFolders, remoteFiles };
}

async function ensureRootFolder(manifest) {
  if (manifest.rootFolderId) {
    try {
      const chk = await runGdrive(['readonly', 'info', manifest.rootFolderId], 2);
      const m = extractItemMeta(chk.json);
      if (m.id && !m.trashed) {
        manifest.rootFolderUrl = `https://drive.google.com/drive/folders/${m.id}`;
        return m.id;
      }
    } catch (_e) {}
  }

  try {
    const found = await runGdrive(['readonly', 'search', '--name-contains', DRIVE_ROOT_NAME, '--type', 'folder'], 2);
    const list = Array.isArray(found.json) ? found.json : (found.json?.files || []);
    const exact = list.map(extractItemMeta).find((it) => it.id && !it.trashed && it.name === DRIVE_ROOT_NAME);
    if (exact?.id) {
      manifest.rootFolderId = exact.id;
      manifest.rootFolderUrl = `https://drive.google.com/drive/folders/${exact.id}`;
      saveManifest(manifest);
      return exact.id;
    }
  } catch (_eSearch) {}

  const created = await runGdrive(['mutate', 'mkdir', DRIVE_ROOT_NAME]);
  const id = extractDriveId(created.json, created.stdout);
  if (!id) throw new Error(`Không lấy được Folder ID sau khi tạo thư mục gốc: ${created.stdout}`);
  manifest.rootFolderId = id;
  manifest.rootFolderUrl = `https://drive.google.com/drive/folders/${id}`;
  saveManifest(manifest);
  return id;
}

async function ensureRemoteFolder(relDir, manifest, remoteFolders) {
  if (!relDir) return manifest.rootFolderId;
  if (remoteFolders.has(relDir)) {
    const id = remoteFolders.get(relDir);
    manifest.folders[relDir] = id;
    return id;
  }
  const parts = relDir.split('/');
  const folderName = parts[parts.length - 1];
  const parentRel = parts.slice(0, -1).join('/');
  const parentId = parentRel ? await ensureRemoteFolder(parentRel, manifest, remoteFolders) : manifest.rootFolderId;

  const res = await runGdrive(['mutate', 'mkdir', folderName, '--parent', parentId]);
  const id = extractDriveId(res.json, res.stdout);
  if (!id) throw new Error(`Không tạo được thư mục Drive "${relDir}": ${res.stdout}`);
  remoteFolders.set(relDir, id);
  manifest.folders[relDir] = id;
  return id;
}

async function fetchRemoteFileMeta(fileId) {
  try {
    const info = await runGdrive(['readonly', 'info', fileId], 2);
    return extractItemMeta(info.json);
  } catch (_e) {
    return { id: fileId };
  }
}

async function runPool(items, concurrency, worker) {
  let cursor = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (cursor < items.length) {
      const idx = cursor++;
      await worker(items[idx], idx);
    }
  });
  await Promise.all(workers);
}

function makeConflictCopyPath(absPath) {
  const dir = path.dirname(absPath);
  const ext = path.extname(absPath);
  const base = path.basename(absPath, ext);
  const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  return path.join(dir, `${base}.drive-conflict-${ts}${ext}`);
}

function hasRemoteChangedSinceBase(remote, base, local) {
  if (!remote) return false;
  // Nếu Google Drive trả về md5Checksum, đối chiếu chính xác tuyệt đối 100% nội dung!
  if (remote.md5Checksum && local?.md5 && remote.md5Checksum === local.md5) {
    return false;
  }
  if (!base) return true;
  if (remote.md5Checksum && base.remoteMd5) {
    return remote.md5Checksum !== base.remoteMd5;
  }
  const sizeDiff = remote.size !== undefined && base.size !== undefined && Number(remote.size) !== Number(base.size);
  if (sizeDiff) return true;
  // Nếu vừa upload hàng loạt chưa chốt Google Server modifiedTime -> chỉ chốt mốc, không kéo lại file giống hệt!
  if (base.pendingRemoteMetaLatch) {
    return false;
  }
  if (remote.modifiedTime && base.remoteModifiedTime) {
    if (remote.modifiedTime === base.remoteModifiedTime) return false;
    const rMs = Date.parse(remote.modifiedTime);
    const bMs = Date.parse(base.remoteModifiedTime);
    if (Number.isFinite(rMs) && Number.isFinite(bMs)) {
      // Mốc thời gian trên Google Server chỉ tiến về phía trước khi file thật sự được sửa từ xa
      return rMs > bMs;
    }
    return true;
  }
  return false;
}

async function performSyncPass({ dryRun = false, pushOnly = false, pullOnly = false } = {}) {
  const manifest = loadManifest();
  const { dirs: localDirs, files: localFiles } = walkLocalActiveFiles();

  let rootId = manifest.rootFolderId;
  let remoteFolders = new Map();
  let remoteFiles = new Map();

  if (dryRun && !rootId) {
    console.log(`📦 [Dry-Run Chưa khởi tạo Drive] Kiểm kê nội bộ: ${localFiles.size} tệp · ${localDirs.length} thư mục sẵn sàng đồng bộ.`);
    return { pushed: 0, uploaded: localFiles.size, pulled: 0, conflicts: 0, unchanged: 0 };
  }

  rootId = await ensureRootFolder(manifest);
  const remoteTree = await scanRemoteDriveTree(rootId);
  remoteFolders = remoteTree.remoteFolders;
  remoteFiles = remoteTree.remoteFiles;

  // Hợp nhất mọi đường dẫn tồn tại ở Local hoặc Remote
  const allPaths = new Set([...localFiles.keys(), ...remoteFiles.keys()]);
  const actions = [];

  for (const relPath of Array.from(allPaths).sort()) {
    const local = localFiles.get(relPath) || null;
    const remote = remoteFiles.get(relPath) || null;
    const base = manifest.files[relPath] || null;

    if (local && !remote) {
      // File chỉ có ở PC -> PUSH lên Drive (trừ khi chế độ --pull-only)
      if (!pullOnly) {
        actions.push({ kind: 'UPLOAD_NEW', relPath, local });
      }
      continue;
    }

    if (!local && remote) {
      // File mới được tạo từ điện thoại / máy khác trên Drive -> PULL về PC (trừ khi --push-only)
      if (!pushOnly) {
        actions.push({ kind: 'PULL_NEW', relPath, remote });
      }
      continue;
    }

    // Cả 2 bên đều tồn tại: chạy 3-Way Diff chuẩn!
    // Nhanh nhất: nếu Drive trả MD5 trùng khớp 100% MD5 nội bộ -> giống nhau hoàn toàn!
    if (remote.md5Checksum && local.md5 && remote.md5Checksum === local.md5) {
      actions.push({ kind: 'REFRESH_META', relPath, local, remote });
      continue;
    }

    const localChanged = !base || base.sha256 !== local.sha256;
    const remoteChanged = hasRemoteChangedSinceBase(remote, base, local);

    if (!localChanged && !remoteChanged) {
      // Nếu Google modifiedTime chưa chốt (hoặc vừa upload hàng loạt), chốt đúng mốc Google Server UTC vào manifest!
      if (base && (base.pendingRemoteMetaLatch || (remote.modifiedTime && base.remoteModifiedTime !== remote.modifiedTime))) {
        actions.push({ kind: 'REFRESH_META', relPath, local, remote });
      } else {
        actions.push({ kind: 'UNCHANGED', relPath });
      }
    } else if (localChanged && !remoteChanged) {
      if (!pullOnly) actions.push({ kind: 'PUSH_UPDATE', relPath, local, remote });
    } else if (!localChanged && remoteChanged) {
      if (!pushOnly) actions.push({ kind: 'PULL_UPDATE', relPath, local, remote });
    } else {
      // CẢ 2 BÊN CÙNG THAY ĐỔI -> Xung đột thực sự (hoặc lần đầu link khi chưa có base manifest)
      if (pushOnly) {
        actions.push({ kind: 'PUSH_UPDATE', relPath, local, remote });
      } else if (pullOnly) {
        actions.push({ kind: 'PULL_UPDATE', relPath, local, remote });
      } else {
        actions.push({ kind: 'CONFLICT_CHECK', relPath, local, remote });
      }
    }
  }

  const uploads = actions.filter((a) => a.kind === 'UPLOAD_NEW');
  const pushes = actions.filter((a) => a.kind === 'PUSH_UPDATE');
  const pulls = actions.filter((a) => a.kind === 'PULL_NEW' || a.kind === 'PULL_UPDATE');
  const conflicts = actions.filter((a) => a.kind === 'CONFLICT_CHECK');
  const unchanged = actions.filter((a) => a.kind === 'UNCHANGED' || a.kind === 'REFRESH_META');

  console.log(`☁️ [3-Way Sync] Kho Drive: ${manifest.rootFolderUrl}`);
  console.log(`   • ⬆️  Tải mới (PC → Drive):      ${uploads.length}`);
  console.log(`   • 🔁 Cập nhật xuôi (PC → Drive): ${pushes.length}`);
  console.log(`   • ⬇️  Kéo ngược (Drive → PC):    ${pulls.length}`);
  console.log(`   • ⚠️  Cần kiểm tra xung đột:     ${conflicts.length}`);
  console.log(`   • ✅ Giữ nguyên (0 KB):          ${unchanged.length}`);

  if (dryRun) {
    console.log('ℹ️ Chế độ --dry-run: chưa thay đổi tệp nào.');
    return { uploaded: uploads.length, pushed: pushes.length, pulled: pulls.length, conflicts: conflicts.length, unchanged: unchanged.length };
  }

  // Cập nhật manifest metadata cho các tệp trùng khớp MD5
  for (const a of actions) {
    if (a.kind === 'REFRESH_META') {
      manifest.files[a.relPath] = {
        id: a.remote.id,
        sha256: a.local.sha256,
        md5: a.local.md5,
        size: a.local.size,
        remoteMd5: a.remote.md5Checksum || '',
        remoteModifiedTime: a.remote.modifiedTime || '',
        pendingRemoteMetaLatch: false,
        syncedAt: new Date().toISOString(),
      };
    }
  }

  // Tạo đủ cây thư mục trên Drive trước khi upload song song
  if (uploads.length > 0) {
    for (const d of localDirs) {
      await ensureRemoteFolder(d, manifest, remoteFolders);
    }
    saveManifest(manifest);
  }

  const workQueue = [...uploads, ...pushes, ...pulls, ...conflicts];
  let done = 0;
  let actualConflicts = 0;
  const conflictList = [];

  await runPool(workQueue, 2, async (act) => {
    const fetchExactServerMeta = workQueue.length <= 25;
    if (act.kind === 'UPLOAD_NEW') {
      const parentId = act.local.relDir ? await ensureRemoteFolder(act.local.relDir, manifest, remoteFolders) : rootId;
      const res = await runGdrive(['mutate', 'upload', act.local.absPath, '--parent', parentId]);
      let meta = extractItemMeta(res.json);
      const newId = meta.id || extractDriveId(res.json, res.stdout);
      if (!meta.modifiedTime && newId && fetchExactServerMeta) {
        meta = await fetchRemoteFileMeta(newId);
      }
      manifest.files[act.relPath] = {
        id: newId,
        sha256: act.local.sha256,
        md5: act.local.md5,
        size: act.local.size,
        remoteMd5: meta.md5Checksum || '',
        remoteModifiedTime: meta.modifiedTime || '',
        pendingRemoteMetaLatch: !meta.modifiedTime,
        syncedAt: new Date().toISOString(),
      };
    } else if (act.kind === 'PUSH_UPDATE') {
      const res = await runGdrive(['mutate', 'update', act.remote.id, act.local.absPath]);
      let meta = extractItemMeta(res.json);
      if (!meta.modifiedTime && fetchExactServerMeta) {
        meta = await fetchRemoteFileMeta(act.remote.id);
      }
      manifest.files[act.relPath] = {
        id: act.remote.id,
        sha256: act.local.sha256,
        md5: act.local.md5,
        size: act.local.size,
        remoteMd5: meta.md5Checksum || '',
        remoteModifiedTime: meta.modifiedTime || '',
        pendingRemoteMetaLatch: !meta.modifiedTime,
        syncedAt: new Date().toISOString(),
      };
    } else if (act.kind === 'PULL_NEW' || act.kind === 'PULL_UPDATE') {
      const absOut = path.join(WORKSPACE_ROOT, act.relPath.split('/').join(path.sep));
      fs.mkdirSync(path.dirname(absOut), { recursive: true });
      await runGdrive(['readonly', 'download', act.remote.id, '--out', absOut]);
      const h = sha256AndMd5File(absOut);
      manifest.files[act.relPath] = {
        id: act.remote.id,
        sha256: h.sha256,
        md5: h.md5,
        size: h.size,
        remoteMd5: act.remote.md5Checksum || h.md5,
        remoteModifiedTime: act.remote.modifiedTime || '',
        syncedAt: new Date().toISOString(),
      };
      console.log(`   ⬇️  [Drive → PC] ${act.relPath}`);
    } else if (act.kind === 'CONFLICT_CHECK') {
      // Tải bản Drive ra file tạm để so sánh SHA-256 thật sự — nếu giống nhau thì không phải xung đột!
      const tmpPath = path.join(os.tmpdir(), `gdrive_cmp_${crypto.randomBytes(6).toString('hex')}`);
      try {
        await runGdrive(['readonly', 'download', act.remote.id, '--out', tmpPath]);
        const remoteHashes = sha256AndMd5File(tmpPath);
        if (remoteHashes.sha256 === act.local.sha256) {
          manifest.files[act.relPath] = {
            id: act.remote.id,
            sha256: act.local.sha256,
            md5: act.local.md5,
            size: act.local.size,
            remoteMd5: act.remote.md5Checksum || remoteHashes.md5,
            remoteModifiedTime: act.remote.modifiedTime || '',
            syncedAt: new Date().toISOString(),
          };
        } else {
          // Xung đột thật -> lưu bản Drive cạnh bên, KHÔNG bao giờ ghi đè mất dữ liệu!
          const conflictPath = makeConflictCopyPath(act.local.absPath);
          fs.copyFileSync(tmpPath, conflictPath);
          actualConflicts += 1;
          conflictList.push({ relPath: act.relPath, conflictFile: path.relative(WORKSPACE_ROOT, conflictPath) });
          console.warn(`   ⚠️  XUNG ĐỘT: "${act.relPath}" đổi ở cả PC & Drive -> Đã giữ bản PC và lưu bản Drive tại "${path.relative(WORKSPACE_ROOT, conflictPath)}"`);
        }
      } finally {
        try { if (fs.existsSync(tmpPath)) fs.unlinkSync(tmpPath); } catch (_eTmp) {}
      }
    }

    done += 1;
    if (done % 10 === 0 || done === workQueue.length) {
      saveManifest(manifest);
      console.log(`   🔄 Tiến độ 3-Way Sync: ${done}/${workQueue.length} tệp...`);
    }
    if (workQueue.length > 20) {
      await new Promise((r) => setTimeout(r, 220));
    }
  });

  saveManifest(manifest);
  console.log(`✅ ĐỒNG BỘ 2 CHIỀU HOÀN TẤT (Tải mới: ${uploads.length} | Xuôi PC→Drive: ${pushes.length} | Ngược Drive→PC: ${pulls.length} | Xung đột bảo vệ: ${actualConflicts} | Giữ nguyên: ${unchanged.length})`);
  if (conflictList.length) {
    console.log('⚠️ Danh sách tệp xung đột cần bạn mở VS Code Diff đối chiếu:');
    conflictList.forEach((c) => console.log(`   - ${c.relPath}  <-->  ${c.conflictFile}`));
  }
  console.log(`🔗 Link thư mục Google Drive: ${manifest.rootFolderUrl}`);
  return { uploaded: uploads.length, pushed: pushes.length, pulled: pulls.length, conflicts: actualConflicts, unchanged: unchanged.length };
}

async function runWatchLoop() {
  console.log('👁️ Đang bật chế độ Đồng bộ 2 Chiều Liên Tục (Local debounce 5s + Quét chiều ngược Drive mỗi 60s)...');
  let syncing = false;
  let pendingTrigger = false;

  const triggerSync = async (reason) => {
    if (syncing) {
      pendingTrigger = true;
      return;
    }
    syncing = true;
    try {
      console.log(`\n⏱️ [${new Date().toLocaleTimeString('vi-VN')}] Kích hoạt 3-Way Sync (${reason})...`);
      acquireLock();
      await performSyncPass();
    } catch (err) {
      console.error(`⚠️ Lỗi nhịp sync (${reason}): ${err?.message || err}`);
    } finally {
      releaseLock();
      syncing = false;
      if (pendingTrigger) {
        pendingTrigger = false;
        setTimeout(() => triggerSync('thay đổi chờ'), 2000);
      }
    }
  };

  await triggerSync('khởi động');

  let debounceTimer = null;
  for (const t of ACTIVE_TARGETS) {
    const abs = path.join(WORKSPACE_ROOT, t);
    if (!fs.existsSync(abs) || !fs.statSync(abs).isDirectory()) continue;
    try {
      fs.watch(abs, { recursive: true }, (_ev, fname) => {
        if (!fname) return;
        const rel = `${t}/${fname}`.replace(/\\/g, '/');
        if (isExcludedPath(rel, path.basename(fname))) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => triggerSync(`sửa tệp nội bộ: ${rel}`), 5000);
      });
    } catch (_eWatch) {}
  }

  setInterval(() => triggerSync('kiểm tra chiều ngược từ Drive định kỳ 60s'), 60000);
}

async function main() {
  const argv = new Set(process.argv.slice(2));
  const dryRun = argv.has('--dry-run');
  const pushOnly = argv.has('--push-only');
  const pullOnly = argv.has('--pull-only');
  const statusOnly = argv.has('--status');
  const watchMode = argv.has('--watch');

  if (statusOnly) {
    const manifest = loadManifest();
    console.log(JSON.stringify({
      gdriveBin: GDRIVE_BIN,
      workspaceRoot: WORKSPACE_ROOT,
      manifestPath: MANIFEST_PATH,
      rootFolderId: manifest.rootFolderId,
      rootFolderUrl: manifest.rootFolderUrl,
      trackedFolders: Object.keys(manifest.folders).length,
      trackedFiles: Object.keys(manifest.files).length,
      lastSyncedAt: manifest.lastSyncedAt,
    }, null, 2));
    return;
  }

  if (watchMode) {
    await runWatchLoop();
    return;
  }

  acquireLock();
  try {
    await performSyncPass({ dryRun, pushOnly, pullOnly });
  } finally {
    releaseLock();
  }
}

main().catch((err) => {
  releaseLock();
  console.error(`❌ Lỗi đồng bộ Google Drive: ${err?.message || err}`);
  process.exit(1);
});
