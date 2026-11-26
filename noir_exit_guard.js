/**
 * ============================================================================
 * 🚪 NOIR EXIT GUARD — POP-UP XÁC NHẬN THOÁT KHỎI WEB / ỨNG DỤNG (v143)
 * ============================================================================
 * Hiển thị đúng thông điệp:
 *   "Bạn muốn thoát khỏi sự kiểm soát của Đăng ( ͡° ͜ʖ ͡°) chứ?"
 * Với 2 lựa chọn rõ ràng: "Có" hoặc "Không".
 * - Trên App Desktop (Electron): Chặn nút đóng X / Alt+F4 để hiện pop-up custom đẹp mắt.
 * - Trên Mobile (Capacitor / PWA / Trình duyệt): Bảo vệ nút Back & vuốt mép rời app
 *   (popstate sentinel + Capacitor backButton + edge-swipe fallback) + Nút Thoát.
 * - Trên Trình duyệt Web: Kích hoạt cảnh báo Leave site (beforeunload) + popstate Back + Nút Thoát.
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
  let lastPopstateAt = 0;
  let capacitorBound = false;

  function isDesktopElectron() {
    return Boolean(
      global.NoirDesktopLocalEngine?.isDesktopElectron ||
        global.NoirDesktopLocalEngine?.isDesktopApp ||
        global.NoirDesktopLocalEngine?.onExitConfirmRequest
    );
  }

  function removeModal() {
    if (typeof document === 'undefined') return;
    document.getElementById(MODAL_ID)?.remove();
  }

  function showExitConfirmModal(onConfirm, onCancel) {
    if (typeof document === 'undefined') return false;
    const existing = document.getElementById(MODAL_ID);
    if (existing) {
      existing.querySelector('#btn-noir-exit-no')?.focus?.();
      return true;
    }

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

    let closed = false;
    const onKeyDownEsc = (ev) => {
      if (ev.key === 'Escape') {
        ev.preventDefault();
        handleNo();
      }
    };

    const handleNo = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDownEsc, true);
      removeModal();
      armBackSentinel();
      if (typeof onCancel === 'function') onCancel();
    };

    const handleYes = () => {
      if (closed) return;
      closed = true;
      document.removeEventListener('keydown', onKeyDownEsc, true);
      exitConfirmed = true;
      global.__NOIR_EXIT_CONFIRMED__ = true;
      global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
      removeModal();
      if (typeof onConfirm === 'function') {
        onConfirm();
        return;
      }
      if (global.Capacitor?.Plugins?.App?.exitApp) {
        try { global.Capacitor.Plugins.App.exitApp(); } catch (_eCap) {}
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

    document.addEventListener('keydown', onKeyDownEsc, true);
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
    if (global.__NOIR_DISABLE_EXIT_SENTINEL__ || exitConfirmed || global.__NOIR_EXIT_CONFIRMED__) return;
    if (isDesktopElectron()) return;
    try {
      const curState = global.history.state;
      if (!curState || !curState.__noirExitSentinel) {
        if (!curState || (!curState.__noirExitBase && !curState.__noirExitSentinel)) {
          try {
            global.history.replaceState(
              { ...(curState && typeof curState === 'object' ? curState : {}), __noirExitBase: true },
              ''
            );
          } catch (_eRep) {}
        }
        global.history.pushState({ __noirExitSentinel: true }, '');
      }
      sentinelArmed = true;
    } catch (_e) {}
  }

  function bindCapacitorBackButton() {
    if (capacitorBound) return;
    try {
      const appPlugin = global.Capacitor?.Plugins?.App;
      if (appPlugin && typeof appPlugin.addListener === 'function') {
        capacitorBound = true;
        appPlugin.addListener('backButton', () => {
          if (exitConfirmed || global.__NOIR_EXIT_CONFIRMED__) return;
          if (document.getElementById(MODAL_ID)) {
            document.getElementById('btn-noir-exit-no')?.click();
            return;
          }
          showExitConfirmModal(
            () => {
              try { appPlugin.exitApp?.(); } catch (_eCapExit) {}
            },
            () => {}
          );
        });
      }
    } catch (_eCapBind) {}
  }

  function install() {
    if (global.__noirExitGuardInstalled) return;
    global.__noirExitGuardInstalled = true;

    armBackSentinel();
    bindCapacitorBackButton();

    if (typeof document !== 'undefined') {
      const markActive = () => {
        if (!userInteracted) {
          userInteracted = true;
        }
        if (!sentinelArmed) armBackSentinel();
        if (!capacitorBound) bindCapacitorBackButton();
      };
      document.addEventListener('pointerdown', markActive, { passive: true, capture: true });
      document.addEventListener('touchstart', markActive, { passive: true, capture: true });
      document.addEventListener('keydown', markActive, { passive: true, capture: true });
      document.addEventListener('deviceready', bindCapacitorBackButton);

      // Bảo vệ thao tác vuốt mép rời app trên Mobile Standalone PWA / WebView nếu trình duyệt không tự bắn popstate
      let edgeTouch = null;
      document.addEventListener(
        'touchstart',
        (ev) => {
          if (ev.touches?.length !== 1 || exitConfirmed || global.__NOIR_EXIT_CONFIRMED__) {
            edgeTouch = null;
            return;
          }
          const t = ev.touches[0];
          const vw = global.innerWidth || 0;
          const fromLeftEdge = t.clientX <= 20;
          const fromRightEdge = vw > 0 && t.clientX >= vw - 20;
          if (!fromLeftEdge && !fromRightEdge) {
            edgeTouch = null;
            return;
          }
          const target = ev.target;
          if (target?.closest?.('input[type="range"], canvas, [data-autotester-ui="true"]')) {
            edgeTouch = null;
            return;
          }
          edgeTouch = {
            x: t.clientX,
            y: t.clientY,
            fromLeftEdge,
            t0: Date.now(),
            popAtStart: lastPopstateAt,
          };
        },
        { passive: true, capture: true }
      );

      document.addEventListener(
        'touchend',
        (ev) => {
          if (!edgeTouch || exitConfirmed || global.__NOIR_EXIT_CONFIRMED__) return;
          const touchSnap = edgeTouch;
          edgeTouch = null;
          if (Date.now() - touchSnap.t0 > 550) return;
          const t = ev.changedTouches?.[0];
          if (!t) return;
          const dx = t.clientX - touchSnap.x;
          const dy = Math.abs(t.clientY - touchSnap.y);
          const validSwipe =
            (touchSnap.fromLeftEdge && dx >= 85 && dy < 35) ||
            (!touchSnap.fromLeftEdge && dx <= -85 && dy < 35);
          if (!validSwipe) return;
          const isStandalonePwa = Boolean(
            global.matchMedia?.('(display-mode: standalone)')?.matches || global.navigator?.standalone
          );
          if (!isStandalonePwa) return;
          setTimeout(() => {
            if (lastPopstateAt !== touchSnap.popAtStart || document.getElementById(MODAL_ID)) return;
            showExitConfirmModal(
              () => {
                if (global.Capacitor?.Plugins?.App?.exitApp) {
                  global.Capacitor.Plugins.App.exitApp();
                } else {
                  try { global.close(); } catch (_e) {}
                }
              },
              () => {}
            );
          }, 120);
        },
        { passive: true, capture: true }
      );

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
          } else if (global.Capacitor?.Plugins?.App?.exitApp) {
            global.Capacitor.Plugins.App.exitApp();
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

    // Electron window close confirmation (nút X hoặc Alt+F4 trên máy tính)
    try {
      if (global.NoirDesktopLocalEngine?.onExitConfirmRequest) {
        global.NoirDesktopLocalEngine.onExitConfirmRequest(() => {
          showExitConfirmModal(() => {
            global.NoirDesktopLocalEngine.approveExitClose();
          });
        });
      }
    } catch (_eElectron) {}

    // Browser / Mobile Back button & vuốt Back (popstate sentinel — bảo vệ ngay từ màn hình nhập API đầu vào!)
    global.addEventListener('popstate', () => {
      lastPopstateAt = Date.now();
      if (exitConfirmed || global.__NOIR_EXIT_CONFIRMED__ || global.__NOIR_DISABLE_EXIT_SENTINEL__ || global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__) return;
      sentinelArmed = false;
      showExitConfirmModal(
        () => {
          exitConfirmed = true;
          global.__NOIR_EXIT_CONFIRMED__ = true;
          global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__ = true;
          if (global.Capacitor?.Plugins?.App?.exitApp) {
            try { global.Capacitor.Plugins.App.exitApp(); } catch (_eCapExit) {}
            return;
          }
          try { global.history.back(); } catch (_e) {}
        },
        () => {
          armBackSentinel();
        }
      );
    });

    // Native browser close-tab / leave-site guard (bảo vệ ngay từ màn hình chào / nhập API đầu vào!)
    global.addEventListener('beforeunload', (ev) => {
      if (isDesktopElectron()) return;
      if (exitConfirmed || global.__NOIR_EXIT_CONFIRMED__ || global.__NOIR_DISABLE_BEFOREUNLOAD_PROMPT__) return;
      ev.preventDefault();
      ev.returnValue = EXIT_PROMPT_TEXT;
      return EXIT_PROMPT_TEXT;
    });
  }

  NS.exitGuard = {
    PROMPT_TEXT: EXIT_PROMPT_TEXT,
    confirmExit: showExitConfirmModal,
    isInstalled: () => Boolean(global.__noirExitGuardInstalled),
    armBackSentinel,
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
