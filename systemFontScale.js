/**
 * systemFontScale.js
 * ==============================================================================
 * Bộ chọn Cỡ Chữ Toàn Hệ Thống (Nhỏ / Bình thường / To / Rất to) + Phóng to /
 * Thu nhỏ đồng bộ các hộp, thẻ, modal & nút bấm mà không làm tràn khung hình.
 */
(function (global) {
  'use strict';

  var NS = (global.NoirStudio = global.NoirStudio || {});
  var STORAGE_KEY = 'noir_v45_system_font_scale';
  var STYLE_ID = 'noir-system-font-scale-style';
  var HEADER_TRIGGER_ID = 'btn-header-font-scale-switcher';
  var HEADER_POPOVER_ID = 'header-font-scale-popover';
  var TAB6_BAR_ID = 'tab6-system-font-scale-bar';
  var TAB5_BAR_ID = 'tab5-system-font-scale-bar';

  var PRESETS = [
    {
      key: 'small',
      label: 'Nhỏ',
      shortCode: 'A-',
      badgeText: '88%',
      desktopScale: 0.875,
      mobileScale: 0.875,
    },
    {
      key: 'normal',
      label: 'Bình thường',
      shortCode: 'A',
      badgeText: '100%',
      desktopScale: 1,
      mobileScale: 1,
    },
    {
      key: 'large',
      label: 'To',
      shortCode: 'A+',
      badgeText: '115%',
      desktopScale: 1.15,
      mobileScale: 1.12,
    },
    {
      key: 'xlarge',
      label: 'Rất to',
      shortCode: 'A++',
      badgeText: '130%',
      desktopScale: 1.3,
      mobileScale: 1.22,
    },
  ];

  var PRESET_MAP = {};
  PRESETS.forEach(function (item) {
    PRESET_MAP[item.key] = item;
  });

  function readStoredScale() {
    try {
      var val = global.localStorage && global.localStorage.getItem(STORAGE_KEY);
      if (val && PRESET_MAP[val]) return val;
    } catch (_) {}
    return 'normal';
  }

  function writeStoredScale(key) {
    try {
      if (global.localStorage) {
        global.localStorage.setItem(STORAGE_KEY, key);
      }
    } catch (_) {}
  }

  function isMobileViewport() {
    try {
      return (global.innerWidth || document.documentElement.clientWidth || 1024) < 640;
    } catch (_) {
      return false;
    }
  }

  function buildScaledCssText() {
    return [
      ':root {',
      '  --noir-ui-scale: 1;',
      '}',
      'html[data-noir-ui-scale-active="true"] {',
      '  font-size: calc(16px * var(--noir-ui-scale)) !important;',
      '}',
      'html[data-noir-ui-scale-active="true"] .text-\\[9px\\] { font-size: calc(9px * var(--noir-ui-scale)) !important; line-height: 1.45 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[9\\.5px\\] { font-size: calc(9.5px * var(--noir-ui-scale)) !important; line-height: 1.45 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[10px\\] { font-size: calc(10px * var(--noir-ui-scale)) !important; line-height: 1.45 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[10\\.5px\\] { font-size: calc(10.5px * var(--noir-ui-scale)) !important; line-height: 1.45 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[11px\\] { font-size: calc(11px * var(--noir-ui-scale)) !important; line-height: 1.48 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[11\\.5px\\] { font-size: calc(11.5px * var(--noir-ui-scale)) !important; line-height: 1.48 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[12px\\] { font-size: calc(12px * var(--noir-ui-scale)) !important; line-height: 1.5 !important; }',
      'html[data-noir-ui-scale-active="true"] .text-\\[13px\\] { font-size: calc(13px * var(--noir-ui-scale)) !important; line-height: 1.5 !important; }',
      'html[data-noir-ui-scale-active="true"] .studio-main-tab {',
      '  font-size: calc(12.5px * min(var(--noir-ui-scale), 1.18)) !important;',
      '  padding: calc(0.45rem * min(var(--noir-ui-scale), 1.16)) calc(0.68rem * min(var(--noir-ui-scale), 1.12)) !important;',
      '}',
      'html[data-noir-ui-scale-active="true"] #s14-master-top-nav > div {',
      '  max-width: calc(100vw - 12px) !important;',
      '}',
      'html[data-noir-ui-scale-active="true"] #noir-smart-delayed-tooltip {',
      '  font-size: calc(11.5px * var(--noir-ui-scale)) !important;',
      '  max-width: min(calc(340px * var(--noir-ui-scale)), calc(100vw - 16px)) !important;',
      '}',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[135px\\] { max-width: min(calc(135px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[140px\\] { max-width: min(calc(140px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[200px\\] { max-width: min(calc(200px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[220px\\] { max-width: min(calc(220px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[240px\\] { max-width: min(calc(240px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[260px\\] { max-width: min(calc(260px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[320px\\] { max-width: min(calc(320px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[360px\\] { max-width: min(calc(360px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[450px\\] { max-width: min(calc(450px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-\\[580px\\] { max-width: min(calc(580px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .w-\\[252px\\] { width: min(calc(252px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .w-\\[260px\\] { width: min(calc(260px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .w-\\[292px\\] { width: min(calc(292px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .w-\\[410px\\] { width: min(calc(410px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .w-\\[420px\\] { width: min(calc(420px * var(--noir-ui-scale)), calc(100vw - 16px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .min-w-\\[160px\\] { min-width: min(calc(160px * var(--noir-ui-scale)), 100%) !important; }',
      'html[data-noir-ui-scale-active="true"] .min-w-\\[180px\\] { min-width: min(calc(180px * var(--noir-ui-scale)), 100%) !important; }',
      'html[data-noir-ui-scale-active="true"] .min-w-\\[200px\\] { min-width: min(calc(200px * var(--noir-ui-scale)), 100%) !important; }',
      'html[data-noir-ui-scale-active="true"] .min-w-\\[220px\\] { min-width: min(calc(220px * var(--noir-ui-scale)), 100%) !important; }',
      'html[data-noir-ui-scale-active="true"] .min-w-\\[240px\\] { min-width: min(calc(240px * var(--noir-ui-scale)), 100%) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-xs { max-width: min(20rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-sm { max-width: min(24rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-md { max-width: min(28rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-lg { max-width: min(32rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-xl { max-width: min(36rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-2xl { max-width: min(42rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-3xl { max-width: min(48rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-4xl { max-width: min(56rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-5xl { max-width: min(64rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-6xl { max-width: min(72rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] .max-w-7xl { max-width: min(80rem, calc(100vw - 12px)) !important; }',
      'html[data-noir-ui-scale-active="true"] [role="dialog"] > div, html[data-noir-ui-scale-active="true"] [aria-modal="true"] > div {',
      '  max-width: calc(100vw - 12px);',
      '  max-height: calc(100dvh - 12px);',
      '}',
      'html[data-noir-ui-scale-active="true"] .noir-font-scale-btn {',
      '  min-height: calc(36px * min(var(--noir-ui-scale), 1.15));',
      '}',
      '@media (max-width: 639px) {',
      '  html[data-noir-ui-scale="large"], html[data-noir-ui-scale="xlarge"] {',
      '    overflow-x: clip;',
      '  }',
      '  html[data-noir-ui-scale-active="true"] .studio-main-tab {',
      '    font-size: calc(12px * min(var(--noir-ui-scale), 1.12)) !important;',
      '  }',
      '}',
    ].join('\n');
  }

  function translateText(text) {
    try {
      var i18n = global.NoirNovel && global.NoirNovel.i18n;
      if (i18n && typeof i18n.translateText === 'function') {
        return i18n.translateText(text);
      }
    } catch (_) {}
    return text;
  }

  function translateContainer(el) {
    if (!el) return;
    try {
      var i18n = global.NoirNovel && global.NoirNovel.i18n;
      if (i18n && typeof i18n.translateElement === 'function') {
        i18n.translateElement(el);
      }
    } catch (_) {}
  }

  var engine = {
    name: 'systemFontScale',
    currentKey: 'normal',
    currentNumericScale: 1,
    _initialized: false,
    _popoverOpen: false,

    getPresets: function () {
      return PRESETS.slice();
    },

    getPreset: function (key) {
      return PRESET_MAP[key] || PRESET_MAP.normal;
    },

    ensureStyleSheet: function () {
      if (!document.head) return null;
      var styleEl = document.getElementById(STYLE_ID);
      if (!styleEl) {
        styleEl = document.createElement('style');
        styleEl.id = STYLE_ID;
        styleEl.textContent = buildScaledCssText();
        document.head.appendChild(styleEl);
      }
      return styleEl;
    },

    applyScale: function (key, options) {
      var opts = options || {};
      var preset = this.getPreset(key);
      var mobile = isMobileViewport();
      var scaleNum = mobile ? preset.mobileScale : preset.desktopScale;

      this.ensureStyleSheet();
      this.currentKey = preset.key;
      this.currentNumericScale = scaleNum;

      var html = document.documentElement;
      if (html) {
        html.style.setProperty('--noir-ui-scale', String(scaleNum));
        html.setAttribute('data-noir-ui-scale', preset.key);
        html.setAttribute('data-noir-ui-scale-active', preset.key === 'normal' ? 'false' : 'true');
        if (preset.key === 'normal') {
          html.style.removeProperty('font-size');
        }
      }

      if (opts.persist !== false) {
        writeStoredScale(preset.key);
      }

      this.syncUI();

      if (opts.emit !== false) {
        try {
          if (NS.bus && typeof NS.bus.emit === 'function') {
            NS.bus.emit('ui:font-scale-changed', {
              key: preset.key,
              label: preset.label,
              scale: scaleNum,
              mobile: mobile,
            });
          }
          global.dispatchEvent(
            new CustomEvent('noir:font-scale-changed', {
              detail: {
                key: preset.key,
                label: preset.label,
                scale: scaleNum,
                mobile: mobile,
              },
            })
          );
        } catch (_) {}
      }

      return {
        key: preset.key,
        label: preset.label,
        scale: scaleNum,
      };
    },

    setScale: function (key, options) {
      return this.applyScale(key, options);
    },

    getScaleState: function () {
      return {
        key: this.currentKey,
        label: this.getPreset(this.currentKey).label,
        scale: this.currentNumericScale,
        presets: PRESETS.slice(),
      };
    },

    renderBarButtonsHtml: function (variant) {
      var activeKey = this.currentKey;
      var compact = variant === 'popover';
      return PRESETS.map(function (item) {
        var active = item.key === activeKey;
        var baseCls = compact
          ? 'noir-font-scale-btn w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all cursor-pointer '
          : 'noir-font-scale-btn flex-1 min-w-[78px] inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-extrabold transition-all cursor-pointer ';
        var stateCls = active
          ? 'border-indigo-400 bg-indigo-600 text-white shadow-md shadow-indigo-900/30 ring-1 ring-indigo-300/60'
          : 'border-zinc-700/80 bg-zinc-900/80 text-zinc-200 hover:border-indigo-400/70 hover:text-white';
        return (
          '<button type="button" class="' +
          baseCls +
          stateCls +
          '" data-font-scale-choice="' +
          item.key +
          '" aria-pressed="' +
          (active ? 'true' : 'false') +
          '">' +
          '<span class="font-mono text-[11px] opacity-85" data-i18n-skip="1">' +
          item.shortCode +
          '</span>' +
          '<span>' +
          item.label +
          '</span>' +
          (compact
            ? '<span class="ml-auto font-mono text-[10px] opacity-75" data-i18n-skip="1">' +
              item.badgeText +
              '</span>'
            : '') +
          '</button>'
        );
      }).join('');
    },

    mountContainerBars: function () {
      var tab6Host = document.getElementById(TAB6_BAR_ID);
      if (tab6Host) {
        tab6Host.innerHTML =
          '<div class="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-2.5">' +
          '  <div class="space-y-0.5">' +
          '    <div class="text-xs font-extrabold text-indigo-300 flex items-center gap-1.5">' +
          '      <span>🔠 Cỡ chữ toàn hệ thống</span>' +
          '    </div>' +
          '    <p class="text-[11px] text-zinc-400">Chỉnh cỡ chữ và tự động phóng to hoặc thu nhỏ đồng bộ các hộp, thẻ và hộp thoại.</p>' +
          '  </div>' +
          '  <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2" data-font-scale-group="tab6">' +
          this.renderBarButtonsHtml('bar') +
          '  </div>' +
          '</div>';
        translateContainer(tab6Host);
      }

      var tab5Host = document.getElementById(TAB5_BAR_ID);
      if (tab5Host) {
        tab5Host.innerHTML =
          '<div class="flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">' +
          '  <div class="space-y-0.5">' +
          '    <div class="text-xs font-extrabold text-indigo-300">🔠 Cỡ chữ toàn hệ thống</div>' +
          '    <p class="text-[11px] text-zinc-400">Chỉnh cỡ chữ và tự động phóng to hoặc thu nhỏ đồng bộ các hộp, thẻ và hộp thoại.</p>' +
          '  </div>' +
          '  <div class="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2" data-font-scale-group="tab5">' +
          this.renderBarButtonsHtml('bar') +
          '  </div>' +
          '</div>';
        translateContainer(tab5Host);
      }
    },

    ensureHeaderPopover: function () {
      var trigger = document.getElementById(HEADER_TRIGGER_ID);
      if (!trigger) return null;

      var labelEl = trigger.querySelector('#header-font-scale-current-label');
      if (labelEl) {
        var preset = this.getPreset(this.currentKey);
        labelEl.textContent = translateText(preset.label);
      }

      var popover = document.getElementById(HEADER_POPOVER_ID);
      if (!popover) {
        popover = document.createElement('div');
        popover.id = HEADER_POPOVER_ID;
        popover.setAttribute('role', 'menu');
        popover.setAttribute('aria-label', 'Cỡ chữ toàn hệ thống');
        popover.className =
          'hidden fixed z-[9200] w-[260px] max-w-[calc(100vw-16px)] max-h-[84dvh] overflow-y-auto rounded-2xl border border-indigo-500/45 bg-zinc-950/98 backdrop-blur-xl p-3 shadow-2xl space-y-2';
        document.body.appendChild(popover);
      }

      popover.innerHTML =
        '<div class="flex items-center justify-between border-b border-zinc-800 pb-1.5">' +
        '  <span class="text-xs font-extrabold text-indigo-300">🔠 Cỡ chữ toàn hệ thống</span>' +
        '  <button type="button" id="btn-close-header-font-popover" class="text-xs font-bold text-zinc-400 hover:text-white px-1.5 py-0.5 rounded" aria-label="Đóng">✕</button>' +
        '</div>' +
        '<div class="space-y-1.5" data-font-scale-group="header">' +
        this.renderBarButtonsHtml('popover') +
        '</div>';
      translateContainer(popover);
      return popover;
    },

    positionPopover: function () {
      var trigger = document.getElementById(HEADER_TRIGGER_ID);
      var popover = document.getElementById(HEADER_POPOVER_ID);
      if (!trigger || !popover) return;
      var rect = trigger.getBoundingClientRect();
      var vw = global.innerWidth || 360;
      var vh = (global.visualViewport && global.visualViewport.height) || global.innerHeight || 800;
      var popWidth = Math.min(popover.offsetWidth || 260, vw - 16);
      popover.style.maxHeight = Math.max(180, Math.round(vh - 16)) + 'px';
      var left = Math.max(8, Math.min(rect.right - popWidth, vw - popWidth - 8));
      var top = Math.min(rect.bottom + 8, vh - (popover.offsetHeight || 220) - 8);
      popover.style.left = left + 'px';
      popover.style.top = Math.max(8, top) + 'px';
    },

    togglePopover: function (forceState) {
      var popover = this.ensureHeaderPopover();
      var trigger = document.getElementById(HEADER_TRIGGER_ID);
      if (!popover || !trigger) return;
      var next = typeof forceState === 'boolean' ? forceState : !this._popoverOpen;
      this._popoverOpen = next;
      popover.classList.toggle('hidden', !next);
      trigger.setAttribute('aria-expanded', next ? 'true' : 'false');
      if (next) {
        this.positionPopover();
      }
    },

    syncUI: function () {
      this.mountContainerBars();
      this.ensureHeaderPopover();

      var activeKey = this.currentKey;
      var buttons = document.querySelectorAll('[data-font-scale-choice]');
      for (var i = 0; i < buttons.length; i++) {
        var btn = buttons[i];
        var key = btn.getAttribute('data-font-scale-choice');
        var active = key === activeKey;
        btn.setAttribute('aria-pressed', active ? 'true' : 'false');
      }

      var triggerLabel = document.getElementById('header-font-scale-current-label');
      if (triggerLabel) {
        triggerLabel.textContent = translateText(this.getPreset(activeKey).label);
      }

      if (this._popoverOpen) {
        this.positionPopover();
      }
    },

    bindEvents: function () {
      if (this._eventsBound) return;
      this._eventsBound = true;
      var self = this;

      document.addEventListener('click', function (ev) {
        var choiceBtn =
          ev.target && ev.target.closest ? ev.target.closest('[data-font-scale-choice]') : null;
        if (choiceBtn) {
          ev.preventDefault();
          var chosenKey = choiceBtn.getAttribute('data-font-scale-choice');
          self.setScale(chosenKey, { persist: true, emit: true });
          if (choiceBtn.closest('#' + HEADER_POPOVER_ID)) {
            self.togglePopover(false);
          }
          return;
        }

        var triggerBtn =
          ev.target && ev.target.closest ? ev.target.closest('#' + HEADER_TRIGGER_ID) : null;
        if (triggerBtn) {
          ev.preventDefault();
          ev.stopPropagation();
          self.togglePopover();
          return;
        }

        var closeBtn =
          ev.target && ev.target.closest ? ev.target.closest('#btn-close-header-font-popover') : null;
        if (closeBtn) {
          ev.preventDefault();
          self.togglePopover(false);
          return;
        }

        if (self._popoverOpen) {
          var insidePopover =
            ev.target && ev.target.closest ? ev.target.closest('#' + HEADER_POPOVER_ID) : null;
          if (!insidePopover) {
            self.togglePopover(false);
          }
        }
      });

      document.addEventListener('keydown', function (ev) {
        if (ev.key === 'Escape' && self._popoverOpen) {
          self.togglePopover(false);
        }
      });

      global.addEventListener('resize', function () {
        self.applyScale(self.currentKey, { persist: false, emit: false });
      });

      global.addEventListener('noir:i18n:changed', function () {
        self.syncUI();
      });
      if (NS.bus && typeof NS.bus.on === 'function') {
        NS.bus.on('i18n:changed', function () {
          self.syncUI();
        });
      }
    },

    init: function () {
      var stored = readStoredScale();
      this.ensureStyleSheet();
      this.bindEvents();
      this.applyScale(stored, { persist: false, emit: false });
      this._initialized = true;
      return true;
    },
  };

  NS.systemFontScale = engine;
  if (typeof NS.registerModule === 'function') {
    NS.registerModule('systemFontScale', engine);
  }

  // Áp dụng sớm ngay khi parse HTML nếu HEAD đã sẵn sàng để tránh giật font lúc tải trang
  try {
    engine.ensureStyleSheet();
    engine.applyScale(readStoredScale(), { persist: false, emit: false });
  } catch (_) {}

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function () {
      engine.init();
    });
  } else {
    engine.init();
  }
})(typeof window !== 'undefined' ? window : globalThis);
