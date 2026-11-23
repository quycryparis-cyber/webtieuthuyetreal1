/**
 * ============================================================================
 * 📦 SCRIPT ĐÓNG GÓI TÀI NGUYÊN SẠCH: scripts/prepare-dist.mjs
 * ============================================================================
 * Gom toàn bộ file runtime từ thư mục gốc `Code true/` sang `dist-app/`,
 * tự động loại trừ tuyệt đối `.git`, `.github`, `.bat`, `node_modules`,
 * `_studio_workspace_state.json`, `dist-app`, `release`, `android`, `ios`,
 * `electron`, `scripts` và các file cấu hình build.
 * ============================================================================
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist-app');

const EXCLUDED_DIRS = new Set([
  '.git',
  '.github',
  '.vscode',
  'node_modules',
  'dist-app',
  'release',
  'android',
  'ios',
  'electron',
  'scripts',
]);

const EXCLUDED_FILES = new Set([
  '_studio_workspace_state.json',
  'package.json',
  'package-lock.json',
  'capacitor.config.json',
  '.gitignore',
]);

const EXCLUDED_EXTS = new Set(['.bat', '.cmd', '.ps1', '.tmp', '.log', '.bak']);

function shouldInclude(entryName, isDir) {
  if (isDir) return !EXCLUDED_DIRS.has(entryName);
  if (EXCLUDED_FILES.has(entryName)) return false;
  const ext = path.extname(entryName).toLowerCase();
  if (EXCLUDED_EXTS.has(ext)) return false;
  if (entryName.startsWith('.')) return false;
  return true;
}

function copyRecursive(srcDir, dstDir) {
  fs.mkdirSync(dstDir, { recursive: true });
  let count = 0;
  for (const entry of fs.readdirSync(srcDir, { withFileTypes: true })) {
    const isDir = entry.isDirectory();
    if (!shouldInclude(entry.name, isDir)) continue;
    const srcPath = path.join(srcDir, entry.name);
    const dstPath = path.join(dstDir, entry.name);
    if (isDir) {
      count += copyRecursive(srcPath, dstPath);
    } else {
      fs.copyFileSync(srcPath, dstPath);
      count += 1;
    }
  }
  return count;
}

fs.rmSync(DIST_DIR, { recursive: true, force: true });
const copiedFiles = copyRecursive(ROOT_DIR, DIST_DIR);
console.log(`✅ [prepare-dist] Đã đóng gói sạch ${copiedFiles} tệp runtime vào: ${DIST_DIR}`);
