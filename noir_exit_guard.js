/**
 * ============================================================================
 * 🚪 NOIR EXIT GUARD — POP-UP XÁC NHẬN THOÁT KHỎI WEB / ỨNG DỤNG (v140)
 * ============================================================================
 * Hiển thị đúng thông điệp:
 *   "Bạn muốn thoát khỏi sự kiểm soát của Đăng chứ ( ͡° ͜ʖ ͡°)"
 * Với 2 lựa chọn rõ ràng: "Có" hoặc "Không".
 * - Trên App Desktop (Electron): Chặn nút đóng X / Alt+F4 để hiện pop-up custom đẹp mắt.
 * - Trên Mobile & Trình duyệt Web: Bảo vệ nút Back (popstate sentinel) + Nút Thoát + beforeunload.
 * ============================================================================
 */
(function initNoirExitGuard(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});
  const MODAL_ID = 'modal-noir-exit-guard';
  const EXIT_PROMPT_TEXT = 'Bạn muốn thoát khỏi sự kiểm soát của Đăng chứ ( ͡° ͜ʖ ͡°)';

  let userInteracted = false;
  let exitConfirmed = false;
  let sentinelArmed = false;

  function removeModal() {
    if (typeof document === 'undefined') return;
    document.getElementById(MODAL_ID)?.remove();
  }

  function showExitConfirmModal(onConfirm, onCancel) {
    if (typeof document === 'undefined') return false;
    removeModal();

    const modal = document.createElement('div');
    modal.id = MODAL_ID;
    modal.className = 'fixed inset-0 z-[2147483647] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 text-zinc-100';
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');
    modal.setAttribute('aria-labelledby', 'noir-exit-guard-title');
    modal.innerHTML = `
      <div class="w-full max-w-md rounded-3xl border-2 border-amber-400/70 bg-gradient-to-b from-zinc-900 to-zinc-950 shadow-[0_24px_70px_rgba(0,0,0,0.85)] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div class="px-5 py-4 border-b border-zinc-800 bg-gradient-to-r from-rose-950/60 via-zinc-900 to-amber-950/60 flex items-center gap-3">
          <img src="assets/app-icon-192.png" alt="Mai Hải Đăng" class="w-12 h-12 rounded-2xl object-cover border-2 border-amber-300 shadow-lg shrink-0" onerror="this.style.display='none'" />
          <div class="min-w-0">
            <div class="text-[11px] font-black uppercase tracking-wider text-amber-300">🚪 Xác nhận rời ứng dụng</div>
            <div class="text-xs text-zinc-400">ĐăngLovePDF · Studio của Bi</div>
          </div>
        </div>
        <div class="p-6 text-center space-y-5">
          <h3 id="noir-exit-guard-title" class="text-base sm:text-lg font-black text-white leading-snug">
            ${EXIT_PROMPT_TEXT}
          </h3>
          <div class="grid grid-cols-2 gap-3 pt-1">
            <button type="button" id="btn-noir-exit-yes" class="py-3 px-4 rounded-2xl border border-rose-500/70 bg-rose-600/90 hover:bg-rose-500 text-white font-black text-sm shadow-lg transition cursor-pointer">
              Có
            </button>
            <button type="button" id="btn-noir-exit-no" class="py-3 px-4 rounded-2xl border-2 border-emerald-400/80 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg transition cursor-pointer">
              Không
            </button>
          </div>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    try { NS.i18n?.translateElement?.(modal); } catch (_eTrExit) {}

    const handleNo = () => {
      removeModal();
      armBackSentinel();
      if (typeof onCancel === 'function') onCancel();
    };

    const handleYes = () => {
      exitConfirmed = true;
      global.__NOIR_EXIT_CONFIRMED__ = true;
      global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
      removeModal();
      if (typeof onConfirm === 'function') {
        onConfirm();
        return;
      }
      if (global.NoirDesktopLocalEngine?.approveExitClose) {
        global.NoirDesktopLocalEngine.approveExitClose();
        return;
      }
      try { global.close(); } catch (_e) {}
      setTimeout(() => {
        try {
          if (global.history?.length > 1) global.history.back();
        } catch (_e2) {}
      }, 60);
    };

    modal.querySelector('#btn-noir-exit-yes')?.addEventListener('click', handleYes);
    modal.querySelector('#btn-noir-exit-no')?.addEventListener('click', handleNo);
    modal.addEventListener('click', (ev) => {
      if (ev.target === modal) handleNo();
    });
    modal.querySelector('#btn-noir-exit-no')?.focus?.();
    return true;
  }

  function armBackSentinel() {
    if (typeof global.history?.pushState !== 'function') return;
    if (global.__NOIR_DISABLE_EXIT_SENTINEL__ || exitConfirmed) return;
    try {
      const curState = global.history.state;
      if (!curState || !curState.__noirExitSentinel) {
        global.history.pushState({ ...(curState && typeof curState === 'object' ? curState : {}), __noirExitSentinel: true }, '');
      }
      sentinelArmed = true;
    } catch (_e) {}
  }

  function install() {
    if (global.__noirExitGuardInstalled) return;
    global.__noirExitGuardInstalled = true;

    if (typeof document !== 'undefined') {
      const markActive = () => {
        if (!userInteracted) {
          userInteracted = true;
          armBackSentinel();
        }
      };
      document.addEventListener('pointerdown', markActive, { once: true, capture: true });
      document.addEventListener('keydown', markActive, { once: true, capture: true });

      document.addEventListener('click', (ev) => {
        const internalLink = ev.target?.closest?.('a[data-noir-internal-nav], [data-noir-internal-nav]');
        if (internalLink && !ev.ctrlKey && !ev.metaKey && !internalLink.getAttribute('target')) {
          global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
          return;
        }
        const trigger = ev.target?.closest?.('[data-noir-exit-trigger]');
        if (!trigger) return;
        ev.preventDefault();
        ev.stopPropagation();
        const targetHref = trigger.getAttribute('data-noir-exit-href') || '';
        showExitConfirmModal(() => {
          if (targetHref) {
            global.location.href = targetHref;
          } else if (global.NoirDesktopLocalEngine?.approveExitClose) {
            global.NoirDesktopLocalEngine.approveExitClose();
          } else {
            try { global.close(); } catch (_e) {}
            try {
              if (global.history?.length > 1) global.history.back();
            } catch (_e2) {}
          }
        });
      });
    }

    // Electron window close confirmation
    try {
      if (global.NoirDesktopLocalEngine?.onExitConfirmRequest) {
        global.NoirDesktopLocalEngine.onExitConfirmRequest(() => {
          showExitConfirmModal(() => {
            global.NoirDesktopLocalEngine.approveExitClose();
          });
        });
      }
    } catch (_eElectron) {}

    // Browser / Android Back button intercept
    global.addEventListener('popstate', () => {
      if (exitConfirmed || global.__NOIR_DISABLE_EXIT_SENTINEL__ || global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__) return;
      if (!sentinelArmed || !userInteracted) return;
      // Chi chan neu user vua quay lai tu trang thai chinh (khong phai khi dong hash nho)
      sentinelArmed = false;
      showExitConfirmModal(
        () => {
          exitConfirmed = true;
          global.__NOIR_EXIT_CONFIRMED__ = true;
          global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
          try { global.history.back(); } catch (_e) {}
        },
        () => {
          armBackSentinel();
        }
      );
    });

    // Native browser close-tab guard
    global.addEventListener('beforeunload', (ev) => {
      if (exitConfirmed || global.__NOIR_EXIT_CONFIRMED__ || global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__) return;
      if (!userInteracted) return;
      ev.preventDefault();
      ev.returnValue = EXIT_PROMPT_TEXT;
      return EXIT_PROMPT_TEXT;
    });
  }

  NS.exitGuard = {
    PROMPT_TEXT: EXIT_PROMPT_TEXT,
    confirmExit: showExitConfirmModal,
    allowExitNow: () => {
      exitConfirmed = true;
      global.__NOIR_EXIT_CONFIRMED__ = true;
      global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
    },
    install,
  };

  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', install);
    } else {
      install();
    }
  } else {
    install();
  }
})(typeof window !== 'undefined' ? window : globalThis);
