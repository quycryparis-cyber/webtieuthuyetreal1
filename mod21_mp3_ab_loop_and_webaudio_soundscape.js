/**
 * ============================================================================
 * MODULE 21: TRÌNH PHÁT NHẠC MP3, LẶP ĐOẠN A-B CHUẨN XÁC & PHÒNG THU ÂM THANH
 *            KHÔNG GIAN WEBAUDIO TỰ SINH 0MB (ACOUSTIC SOUNDSCAPE STUDIO)
 * ============================================================================
 * Tệp: mod21_mp3_ab_loop_and_webaudio_soundscape.js
 * Thuộc hệ thống: Web Viết Tiểu Thuyết Của Bi — Studio Sáng Tác Đa Nền Tảng
 *
 * Chức năng cốt lõi:
 * 1. Trình phát nhạc cá nhân (.MP3, .WAV, .OGG, .FLAC, .M4A) với bộ nhớ danh sách
 *    bài hát trong phiên, tua nhanh ±5s/±15s, chỉnh tốc độ phát (0.75x -> 1.5x).
 * 2. Bộ lặp đoạn A -> B (A-B Repeat Loop) đồng bộ 2 chiều giữa thanh trượt
 *    (#s11-slider-point-a, #s11-slider-point-b) và ô nhập thời gian mm:ss
 *    (#s11-input-point-a, #s11-input-point-b), kèm chế độ lặp toàn bài / lặp A-B.
 * 3. Bộ tổng hợp âm thanh không gian WebAudio (Procedural 0MB Synthesizer):
 *    - RAIN (Mưa Đêm Noir): 3 lớp mưa (mưa rào xa, mưa rơi mái hiên, giọt mưa
 *      tách tách trên kính cửa sổ) + tiếng sấm rền trầm ấm ngẫu nhiên.
 *    - PIANO (Piano Dịu Đêm Khuya): Thuật toán Markov sinh hợp âm & giai điệu
 *      piano acoustic kèm tiếng búa đàn gõ dây và vang âm phòng hòa nhạc.
 *    - NOIR_MIX (Mưa Đêm + Jazz Piano + Warm Pad): Bản phối đặc trưng cho tiểu
 *      thuyết trinh thám, tâm lý, chiều sâu nội tâm.
 *    - FIREPLACE (Lửa Trại & Củi Khô): Tiếng lửa bập bùng, hơi ấm lò sưởi và
 *      tiếng củi thông nổ lách tách ngẫu nhiên trong không gian stereo.
 *    - OCEAN (Sóng Biển Đêm Trăng): Hai lớp sóng vỗ bờ và bọt sóng rút êm dịu
 *      theo chu kỳ nhịp thở tự nhiên.
 * 4. Máy tạo âm thanh bàn phím cơ ASMR (Cherry Brown, Topre Thock, Máy chữ cổ
 *    điển có tiếng chuông xuống dòng) và Sóng não Binaural Beats hỗ trợ tập trung.
 * ============================================================================
 */

(function () {
  'use strict';

  window.NoirStudio = window.NoirStudio || {};

  // ==========================================================================
  // PHẦN 1: CƠ SỞ DỮ LIỆU ÂM HỌC, HỢP ÂM PIANO TỰ SINH & CẤU HÌNH DSP
  // ==========================================================================

  const AUDIO_STUDIO_STORAGE_KEYS = {
    SYNTH_PRESET: 'noir_mod21_synth_preset_v1',
    SYNTH_VOLUME: 'noir_mod21_synth_volume_v1',
    PLAYBACK_SPEED: 'noir_mod21_playback_speed_v1',
    LOOP_MODE: 'noir_mod21_loop_mode_v1',
    POINT_A_SEC: 'noir_mod21_ab_point_a_sec_v1',
    POINT_B_SEC: 'noir_mod21_ab_point_b_sec_v1',
    AB_ENABLED: 'noir_mod21_ab_enabled_v1',
    ASMR_KEY_PROFILE: 'noir_mod21_asmr_key_profile_v1',
    ASMR_KEY_VOLUME: 'noir_mod21_asmr_key_volume_v1',
    BINAURAL_MODE: 'noir_mod21_binaural_mode_v1',
    PIANO_SCALE_MOOD: 'noir_mod21_piano_scale_mood_v1',
    LAYER_MIX_OVERRIDES: 'noir_mod21_layer_mix_overrides_v1'
  };

  /**
   * Danh mục cấu hình chi tiết cho từng Preset âm thanh không gian
   */
  const SOUNDSCAPE_PRESETS_CATALOG = {
    RAIN: {
      key: 'RAIN',
      label: '🌧️ Mưa Đêm',
      fullName: 'Mưa Đêm Trên Phố Vắng (Multi-Layer Acoustic Rain)',
      statusText: 'Đang phát: 🌧️ Mưa Đêm (3 lớp mưa + sấm xa)',
      description: 'Tiếng mưa rơi đều trên mái ngói, giọt mưa gõ nhịp lên ô cửa kính và tiếng sấm trầm vọng từ chân trời xa.',
      layers: {
        rainDeepRumble: 0.52,
        rainMidWash: 0.68,
        rainWindowDrops: 0.58,
        thunderRoll: 0.35,
        piano: 0.0,
        noirPad: 0.0,
        fireplaceHearth: 0.0,
        fireplaceCrackles: 0.0,
        oceanSurf: 0.0,
        oceanFoam: 0.0
      },
      reverbMix: 0.28,
      masterLowpassHz: 9500
    },
    PIANO: {
      key: 'PIANO',
      label: '🎹 Piano Dịu',
      fullName: 'Độc Tấu Piano Đêm Khuya (Generative Nocturne Piano)',
      statusText: 'Đang phát: 🎹 Piano Dịu (Tự sinh giai điệu bất tận)',
      description: 'Giai điệu dương cầm trầm lắng tự biến thiên theo chuỗi hợp âm Markov, không bao giờ lặp lại nhàm chán.',
      layers: {
        rainDeepRumble: 0.0,
        rainMidWash: 0.0,
        rainWindowDrops: 0.0,
        thunderRoll: 0.0,
        piano: 0.85,
        noirPad: 0.25,
        fireplaceHearth: 0.0,
        fireplaceCrackles: 0.0,
        oceanSurf: 0.0,
        oceanFoam: 0.0
      },
      reverbMix: 0.48,
      masterLowpassHz: 7800
    },
    NOIR_MIX: {
      key: 'NOIR_MIX',
      label: '🎷 Mưa + Piano',
      fullName: 'Hòa Âm Mưa Đêm & Piano Noir (Signature Noir Studio)',
      statusText: 'Đang phát: 🎷 Mưa Đêm + Piano Noir',
      description: 'Sự kết hợp hoàn hảo giữa tiếng mưa rả rích bên hiên và tiếng đàn dương cầm trầm mặc trong quán nhỏ lúc nửa đêm.',
      layers: {
        rainDeepRumble: 0.38,
        rainMidWash: 0.46,
        rainWindowDrops: 0.42,
        thunderRoll: 0.24,
        piano: 0.78,
        noirPad: 0.38,
        fireplaceHearth: 0.0,
        fireplaceCrackles: 0.0,
        oceanSurf: 0.0,
        oceanFoam: 0.0
      },
      reverbMix: 0.42,
      masterLowpassHz: 8500
    },
    FIREPLACE: {
      key: 'FIREPLACE',
      label: '🔥 Lửa Trại',
      fullName: 'Lò Sưởi Củi Thông & Lửa Trại Đêm Đông (Warm Hearth & Crackles)',
      statusText: 'Đang phát: 🔥 Lửa Trại Ấm Áp',
      description: 'Tiếng ngọn lửa bập bùng trầm ấm hòa cùng tiếng nhựa thông sôi nhẹ và tiếng củi khô nổ lách tách.',
      layers: {
        rainDeepRumble: 0.0,
        rainMidWash: 0.0,
        rainWindowDrops: 0.0,
        thunderRoll: 0.0,
        piano: 0.0,
        noirPad: 0.12,
        fireplaceHearth: 0.74,
        fireplaceCrackles: 0.82,
        oceanSurf: 0.0,
        oceanFoam: 0.0
      },
      reverbMix: 0.20,
      masterLowpassHz: 9200
    },
    OCEAN: {
      key: 'OCEAN',
      label: '🌊 Sóng Biển',
      fullName: 'Sóng Biển Đêm Trăng & Gió Khơi Xa (Biphasic Ocean Surf)',
      statusText: 'Đang phát: 🌊 Sóng Biển Đêm',
      description: 'Nhịp sóng vỗ bờ cát nối tiếp bọt sóng rút ra xa theo chu kỳ hơi thở sâu, giúp tâm trí tĩnh lặng tuyệt đối.',
      layers: {
        rainDeepRumble: 0.0,
        rainMidWash: 0.0,
        rainWindowDrops: 0.0,
        thunderRoll: 0.0,
        piano: 0.0,
        noirPad: 0.16,
        fireplaceHearth: 0.0,
        fireplaceCrackles: 0.0,
        oceanSurf: 0.82,
        oceanFoam: 0.68
      },
      reverbMix: 0.34,
      masterLowpassHz: 8200
    },
    FAN: {
      key: 'FAN',
      label: '🌀 Tiếng Quạt',
      fullName: 'Giả Lập Tiếng Quạt Đêm Êm Dịu (Soft Oscillating Fan)',
      statusText: 'Đang phát: 🌀 Tiếng Quạt Đêm Êm Dịu',
      description: 'Âm thanh gió quạt máy quay nhẹ đều nhịp hòa cùng tiếng động cơ trầm ấm, cực kỳ dễ chịu khi đọc viết hoặc ngủ.',
      layers: {
        rainDeepRumble: 0.0, rainMidWash: 0.0, rainWindowDrops: 0.0, thunderRoll: 0.0,
        piano: 0.0, noirPad: 0.0, fireplaceHearth: 0.0, fireplaceCrackles: 0.0, oceanSurf: 0.0, oceanFoam: 0.0,
        electricFan: 0.85, purePinkNoise: 0.0, pureWhiteNoise: 0.0, pureBlueNoise: 0.0
      },
      reverbMix: 0.08,
      masterLowpassHz: 2400
    },
    PINK_NOISE: {
      key: 'PINK_NOISE',
      label: '🌸 Ồn Hồng',
      fullName: 'Tiếng Ồn Hồng Thư Giãn (-3dB/octave Pink Noise)',
      statusText: 'Đang phát: 🌸 Tiếng Ồn Hồng (Pink Noise)',
      description: 'Âm sắc ấm áp cân bằng dải trầm giúp lọc tạp âm xung quanh, hỗ trợ tập trung sâu và thư giãn hệ thần kinh.',
      layers: {
        rainDeepRumble: 0.0, rainMidWash: 0.0, rainWindowDrops: 0.0, thunderRoll: 0.0,
        piano: 0.0, noirPad: 0.0, fireplaceHearth: 0.0, fireplaceCrackles: 0.0, oceanSurf: 0.0, oceanFoam: 0.0,
        electricFan: 0.0, purePinkNoise: 0.82, pureWhiteNoise: 0.0, pureBlueNoise: 0.0
      },
      reverbMix: 0.06,
      masterLowpassHz: 4200
    },
    WHITE_NOISE: {
      key: 'WHITE_NOISE',
      label: '🤍 Ồn Trắng',
      fullName: 'Tiếng Ồn Trắng Mềm Mại (Soft Focus White Noise)',
      statusText: 'Đang phát: 🤍 Tiếng Ồn Trắng (White Noise)',
      description: 'Màn chắn âm thanh đều nhẹ giúp cách ly tiếng ồn phòng học/quán cà phê và duy trì sự tập trung liên tục.',
      layers: {
        rainDeepRumble: 0.0, rainMidWash: 0.0, rainWindowDrops: 0.0, thunderRoll: 0.0,
        piano: 0.0, noirPad: 0.0, fireplaceHearth: 0.0, fireplaceCrackles: 0.0, oceanSurf: 0.0, oceanFoam: 0.0,
        electricFan: 0.0, purePinkNoise: 0.0, pureWhiteNoise: 0.72, pureBlueNoise: 0.0
      },
      reverbMix: 0.04,
      masterLowpassHz: 4800
    },
    BLUE_NOISE: {
      key: 'BLUE_NOISE',
      label: '💙 Ồn Xanh',
      fullName: 'Tiếng Ồn Xanh Trong Trẻo (+3dB/octave Soft Blue Noise)',
      statusText: 'Đang phát: 💙 Tiếng Ồn Xanh (Blue Noise)',
      description: 'Dải âm thanh thanh thoát tựa làn gió mát qua kẽ lá, tạo cảm giác tỉnh táo nhẹ nhàng không gây nặng đầu.',
      layers: {
        rainDeepRumble: 0.0, rainMidWash: 0.0, rainWindowDrops: 0.0, thunderRoll: 0.0,
        piano: 0.0, noirPad: 0.0, fireplaceHearth: 0.0, fireplaceCrackles: 0.0, oceanSurf: 0.0, oceanFoam: 0.0,
        electricFan: 0.0, purePinkNoise: 0.0, pureWhiteNoise: 0.0, pureBlueNoise: 0.74
      },
      reverbMix: 0.08,
      masterLowpassHz: 7400
    },
    OFF: {
      key: 'OFF',
      label: '🔇 Tắt Âm',
      fullName: 'Tắt Âm Thanh Không Gian',
      statusText: 'Đang tắt',
      description: 'Tạm dừng toàn bộ bộ tổng hợp âm thanh không gian WebAudio.',
      layers: {
        rainDeepRumble: 0.0,
        rainMidWash: 0.0,
        rainWindowDrops: 0.0,
        thunderRoll: 0.0,
        piano: 0.0,
        noirPad: 0.0,
        fireplaceHearth: 0.0,
        fireplaceCrackles: 0.0,
        oceanSurf: 0.0,
        oceanFoam: 0.0
      },
      reverbMix: 0.0,
      masterLowpassHz: 12000
    }
  };

  /**
   * Thư viện Tiến trình Hợp âm & Thang âm cho Piano Tự Sinh (Generative Piano)
   * Mỗi hợp âm gồm:
   * - name: Tên hợp âm nhạc lý
   * - bassMidi: Nốt trầm tay trái (MIDI)
   * - chordMidis: Các nốt hợp âm tay phải / đệm (MIDI)
   * - scaleMidis: Các nốt giai điệu mở rộng để rải ngón (Arpeggio / Melody)
   * - nextWeights: Xác suất chuyển sang hợp âm tiếp theo theo chuỗi Markov
   */
  const GENERATIVE_PIANO_MOODS = {
    NOIR_MELANCHOLY: {
      id: 'NOIR_MELANCHOLY',
      name: 'Trầm Mặc Đêm Mưa (D Dorian / Melancholy Noir)',
      tempoBpm: 54,
      arpeggioDensity: 0.68,
      melodyChance: 0.72,
      chords: [
        {
          name: 'Dm9 (Rê thứ 9)',
          bassMidi: 38, // D2
          fifthMidi: 45, // A2
          chordMidis: [53, 57, 60, 64], // F3, A3, C4, E4
          scaleMidis: [62, 64, 65, 67, 69, 71, 72, 74, 76], // D4 -> E5 Dorian
          nextWeights: [0.1, 0.4, 0.3, 0.2]
        },
        {
          name: 'Gm11 (Sol thứ 11)',
          bassMidi: 43, // G2
          fifthMidi: 50, // D3
          chordMidis: [53, 58, 60, 62], // F3, Bb3, C4, D4
          scaleMidis: [62, 65, 67, 69, 70, 72, 74, 77],
          nextWeights: [0.35, 0.1, 0.35, 0.2]
        },
        {
          name: 'Bbmaj9 (Si giáng trưởng 9)',
          bassMidi: 34, // Bb1
          fifthMidi: 41, // F2
          chordMidis: [50, 53, 57, 60], // D3, F3, A3, C4
          scaleMidis: [60, 62, 64, 65, 69, 70, 72, 74],
          nextWeights: [0.3, 0.2, 0.1, 0.4]
        },
        {
          name: 'A7sus4 -> A7b9 (La 7 át biến âm)',
          bassMidi: 33, // A1
          fifthMidi: 40, // E2
          chordMidis: [52, 55, 57, 61], // E3, G3, A3, C#4
          scaleMidis: [61, 62, 64, 65, 67, 69, 70, 73],
          nextWeights: [0.65, 0.15, 0.15, 0.05]
        }
      ]
    },
    IMPRESSIONIST_DREAM: {
      id: 'IMPRESSIONIST_DREAM',
      name: 'Sương Khói Ấn Tượng (Debussy / Satie Reverie)',
      tempoBpm: 48,
      arpeggioDensity: 0.75,
      melodyChance: 0.80,
      chords: [
        {
          name: 'Fmaj9#11 (Fa trưởng Lydian)',
          bassMidi: 41, // F2
          fifthMidi: 48, // C3
          chordMidis: [52, 57, 60, 64, 67], // E3, A3, C4, E4, G4
          scaleMidis: [64, 67, 69, 71, 72, 74, 76, 79],
          nextWeights: [0.15, 0.45, 0.25, 0.15]
        },
        {
          name: 'Em9 (Mi thứ 9)',
          bassMidi: 40, // E2
          fifthMidi: 47, // B2
          chordMidis: [55, 59, 62, 66], // G3, B3, D4, F#4
          scaleMidis: [62, 64, 66, 67, 69, 71, 74, 76],
          nextWeights: [0.25, 0.1, 0.45, 0.2]
        },
        {
          name: 'Dm11 (Rê thứ 11)',
          bassMidi: 38, // D2
          fifthMidi: 45, // A2
          chordMidis: [53, 55, 57, 60, 64], // F3, G3, A3, C4, E4
          scaleMidis: [60, 62, 64, 65, 67, 69, 72, 74],
          nextWeights: [0.3, 0.2, 0.1, 0.4]
        },
        {
          name: 'Cmaj9 (Đô trưởng 9)',
          bassMidi: 36, // C2
          fifthMidi: 43, // G2
          chordMidis: [52, 55, 59, 62], // E3, G3, B3, D4
          scaleMidis: [60, 62, 64, 67, 69, 71, 72, 76],
          nextWeights: [0.45, 0.25, 0.2, 0.1]
        }
      ]
    },
    WUXIA_ANCIENT_MOON: {
      id: 'WUXIA_ANCIENT_MOON',
      name: 'Cổ Phong Nguyệt Dạ (Ngũ Cung Thương Điệu)',
      tempoBpm: 52,
      arpeggioDensity: 0.72,
      melodyChance: 0.85,
      chords: [
        {
          name: 'Am7add11 (La thứ Ngũ cung)',
          bassMidi: 33, // A1
          fifthMidi: 40, // E2
          chordMidis: [52, 55, 57, 60, 62], // E3, G3, A3, C4, D4
          scaleMidis: [60, 62, 64, 67, 69, 72, 74, 76, 79],
          nextWeights: [0.1, 0.4, 0.3, 0.2]
        },
        {
          name: 'F6/9 (Fa trưởng Ngũ cung)',
          bassMidi: 41, // F2
          fifthMidi: 48, // C3
          chordMidis: [50, 53, 55, 57, 60], // D3, F3, G3, A3, C4
          scaleMidis: [60, 62, 64, 67, 69, 72, 74, 76],
          nextWeights: [0.3, 0.1, 0.4, 0.2]
        },
        {
          name: 'G6sus4 (Sol treo Ngũ cung)',
          bassMidi: 43, // G2
          fifthMidi: 50, // D3
          chordMidis: [52, 55, 60, 62], // E3, G3, C4, D4
          scaleMidis: [62, 64, 67, 69, 72, 74, 76, 79],
          nextWeights: [0.35, 0.25, 0.1, 0.3]
        },
        {
          name: 'Em7 (Mi thứ Ngũ cung)',
          bassMidi: 40, // E2
          fifthMidi: 47, // B2
          chordMidis: [50, 55, 59, 62], // D3, G3, B3, D4
          scaleMidis: [60, 62, 64, 67, 69, 71, 74, 76],
          nextWeights: [0.5, 0.25, 0.15, 0.1]
        }
      ]
    },
    MYSTERY_DETECTIVE: {
      id: 'MYSTERY_DETECTIVE',
      name: 'Bí Ẩn Hồ Sơ Đêm (Suspense & Mystery)',
      tempoBpm: 50,
      arpeggioDensity: 0.62,
      melodyChance: 0.65,
      chords: [
        {
          name: 'Cm(maj9) (Đô thứ trưởng 9)',
          bassMidi: 36, // C2
          fifthMidi: 43, // G2
          chordMidis: [51, 55, 59, 62], // Eb3, G3, B3, D4
          scaleMidis: [60, 62, 63, 66, 67, 68, 71, 72, 74],
          nextWeights: [0.15, 0.4, 0.25, 0.2]
        },
        {
          name: 'Abmaj7#11 (La giáng trưởng #11)',
          bassMidi: 32, // Ab1
          fifthMidi: 39, // Eb2
          chordMidis: [51, 55, 56, 60, 62], // Eb3, G3, Ab3, C4, D4
          scaleMidis: [60, 62, 63, 67, 68, 70, 72, 75],
          nextWeights: [0.3, 0.1, 0.4, 0.2]
        },
        {
          name: 'Fm9 (Fa thứ 9)',
          bassMidi: 41, // F2
          fifthMidi: 48, // C3
          chordMidis: [51, 56, 60, 63, 67], // Eb3, Ab3, C4, Eb4, G4
          scaleMidis: [60, 63, 65, 67, 68, 70, 72, 75],
          nextWeights: [0.25, 0.2, 0.1, 0.45]
        },
        {
          name: 'G7alt (Sol 7 biến âm căng thẳng)',
          bassMidi: 43, // G2
          fifthMidi: 50, // D3
          chordMidis: [53, 56, 59, 63], // F3, Ab3, B3, Eb4
          scaleMidis: [59, 60, 63, 65, 67, 68, 71, 74],
          nextWeights: [0.65, 0.15, 0.15, 0.05]
        }
      ]
    }
  };

  /**
   * Cấu hình âm thanh Bàn phím cơ ASMR & Máy chữ cổ điển khi gõ văn bản
   */
  const ASMR_KEYBOARD_PROFILES = {
    OFF: {
      id: 'OFF',
      label: '🔇 Tắt âm gõ phím',
      clickFreq: 0,
      thockFreq: 0,
      noiseAmt: 0
    },
    TOPRE_THOCK: {
      id: 'TOPRE_THOCK',
      label: '⌨️ Topre 45g (Trầm ấm / Thocky)',
      clickFreq: 1450,
      thockFreq: 195,
      noiseAmt: 0.28,
      decaySec: 0.048
    },
    CHERRY_BROWN: {
      id: 'CHERRY_BROWN',
      label: '🟤 Cherry MX Brown (Đầm tay / Tactile)',
      clickFreq: 2150,
      thockFreq: 250,
      noiseAmt: 0.35,
      decaySec: 0.042
    },
    VINTAGE_TYPEWRITER: {
      id: 'VINTAGE_TYPEWRITER',
      label: '📠 Máy chữ cổ điển Olympia (Có chuông Enter)',
      clickFreq: 3200,
      thockFreq: 310,
      noiseAmt: 0.65,
      decaySec: 0.058,
      hasCarriageBell: true
    }
  };

  /**
   * Cấu hình sóng não Binaural Beats hỗ trợ tập trung sâu
   */
  const BINAURAL_FOCUS_MODES = {
    OFF: {
      id: 'OFF',
      label: 'Tắt sóng não',
      carrierHz: 0,
      beatHz: 0,
      desc: 'Không phát tần số sóng não phụ trợ'
    },
    ALPHA_FLOW: {
      id: 'ALPHA_FLOW',
      label: '🧠 Sóng Alpha 10Hz (Trạng thái Flow sáng tác)',
      carrierHz: 200,
      beatHz: 10,
      desc: 'Trái 200Hz / Phải 210Hz — Giúp tâm trí thư thái nhưng tập trung liền mạch khi viết nháp dài.'
    },
    THETA_IMAGINATION: {
      id: 'THETA_IMAGINATION',
      label: '🌙 Sóng Theta 6Hz (Liên tưởng & Miêu tả nội tâm)',
      carrierHz: 180,
      beatHz: 6,
      desc: 'Trái 180Hz / Phải 186Hz — Kích thích trí tưởng tượng sâu, phù hợp khi lên ý tưởng hoặc viết cảnh nội tâm.'
    },
    BETA_LOGIC: {
      id: 'BETA_LOGIC',
      label: '⚡ Sóng Beta 15Hz (Soát lỗi & Kiểm toán cốt truyện)',
      carrierHz: 220,
      beatHz: 15,
      desc: 'Trái 220Hz / Phải 235Hz — Tăng độ tỉnh táo, sắc bén khi rà soát logic và biên tập câu chữ.'
    }
  };

  // ==========================================================================
  // PHẦN 2: BỘ XỬ LÝ TÍN HIỆU SỐ WEBAUDIO DSP KERNEL (0MB PROCEDURAL BUFFERS)
  // ==========================================================================

  class WebAudioDspKernel {
    /**
     * Chuyển đổi mã nốt MIDI sang tần số Hz chuẩn A4 = 440Hz
     */
    static midiToFreq(midiNote) {
      return 440 * Math.pow(2, (Number(midiNote) - 69) / 12);
    }

    /**
     * Tạo bộ đệm White Noise (Nhiễu trắng đồng nhất)
     */
    static createWhiteNoiseBuffer(audioCtx, durationSec = 4.0) {
      const sampleRate = audioCtx.sampleRate;
      const frameCount = Math.floor(sampleRate * durationSec);
      const buffer = audioCtx.createBuffer(2, frameCount, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const data = buffer.getChannelData(ch);
        for (let i = 0; i < frameCount; i++) {
          data[i] = Math.random() * 2 - 1;
        }
      }
      return buffer;
    }

    /**
     * Tạo bộ đệm Pink Noise (-3dB/octave) bằng bộ lọc Paul Kellet chuẩn xác
     * Dùng cho tiếng mưa rơi đều trên mái hiên và tiếng sóng vỗ tự nhiên
     */
    static createPinkNoiseBuffer(audioCtx, durationSec = 6.0) {
      const sampleRate = audioCtx.sampleRate;
      const frameCount = Math.floor(sampleRate * durationSec);
      const buffer = audioCtx.createBuffer(2, frameCount, sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const output = buffer.getChannelData(ch);
        let b0 = 0.0;
        let b1 = 0.0;
        let b2 = 0.0;
        let b3 = 0.0;
        let b4 = 0.0;
        let b5 = 0.0;
        let b6 = 0.0;

        for (let i = 0; i < frameCount; i++) {
          const white = Math.random() * 2 - 1;
          b0 = 0.99886 * b0 + white * 0.0555179;
          b1 = 0.99332 * b1 + white * 0.0750759;
          b2 = 0.96900 * b2 + white * 0.1538520;
          b3 = 0.86650 * b3 + white * 0.3104856;
          b4 = 0.55000 * b4 + white * 0.5329522;
          b5 = -0.7616 * b5 - white * 0.0168980;
          output[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
          b6 = white * 0.115926;
        }

        // Crossfade nhẹ 4096 mẫu đầu/cuối để lặp vòng không có tiếng "click"
        const fadeLen = Math.min(4096, Math.floor(frameCount * 0.05));
        for (let i = 0; i < fadeLen; i++) {
          const ratio = i / fadeLen;
          const inv = 1 - ratio;
          const tailIdx = frameCount - fadeLen + i;
          const blended = output[i] * ratio + output[tailIdx] * inv;
          output[i] = blended;
          output[tailIdx] = blended;
        }
      }
      return buffer;
    }

    /**
     * Tạo bộ đệm Brown/Red Noise (-6dB/octave) bằng tích phân rò rỉ
     * Dùng cho tiếng sấm xa, hơi ấm lò sưởi và nền trầm của mưa đêm
     */
    static createBrownNoiseBuffer(audioCtx, durationSec = 6.0) {
      const sampleRate = audioCtx.sampleRate;
      const frameCount = Math.floor(sampleRate * durationSec);
      const buffer = audioCtx.createBuffer(2, frameCount, sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const output = buffer.getChannelData(ch);
        let lastOut = 0.0;
        for (let i = 0; i < frameCount; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 3.2; // Chuẩn hóa biên độ
        }

        const fadeLen = Math.min(4096, Math.floor(frameCount * 0.05));
        for (let i = 0; i < fadeLen; i++) {
          const ratio = i / fadeLen;
          const tailIdx = frameCount - fadeLen + i;
          const blended = output[i] * ratio + output[tailIdx] * (1 - ratio);
          output[i] = blended;
          output[tailIdx] = blended;
        }
      }
      return buffer;
    }

    /**
     * Tạo bộ đệm Blue Noise (+3dB/octave mềm mại) bằng vi phân bậc nhất + làm mịn biên độ
     */
    static createBlueNoiseBuffer(audioCtx, durationSec = 5.0) {
      const sampleRate = audioCtx.sampleRate;
      const frameCount = Math.floor(sampleRate * durationSec);
      const buffer = audioCtx.createBuffer(2, frameCount, sampleRate);
      for (let ch = 0; ch < 2; ch++) {
        const output = buffer.getChannelData(ch);
        let prev = 0.0;
        let smooth = 0.0;
        for (let i = 0; i < frameCount; i++) {
          const white = Math.random() * 2 - 1;
          const diff = (white - prev) * 0.5;
          prev = white;
          smooth = smooth * 0.35 + diff * 0.65;
          output[i] = smooth * 0.55;
        }
        const fadeLen = Math.min(4096, Math.floor(frameCount * 0.05));
        for (let i = 0; i < fadeLen; i++) {
          const ratio = i / fadeLen;
          const tailIdx = frameCount - fadeLen + i;
          const blended = output[i] * ratio + output[tailIdx] * (1 - ratio);
          output[i] = blended;
          output[tailIdx] = blended;
        }
      }
      return buffer;
    }

    /**
     * Tạo bộ đệm Impulse Response giả lập phòng hòa nhạc ấm áp (Concert Hall Reverb)
     * Hoàn toàn bằng thuật toán toán học (0MB dung lượng mạng)
     */
    static createSyntheticReverbImpulse(audioCtx, durationSec = 3.2, decayRate = 2.6) {
      const sampleRate = audioCtx.sampleRate;
      const length = Math.floor(sampleRate * durationSec);
      const impulse = audioCtx.createBuffer(2, length, sampleRate);

      for (let ch = 0; ch < 2; ch++) {
        const channelData = impulse.getChannelData(ch);
        let lpState = 0;
        for (let i = 0; i < length; i++) {
          const t = i / length;
          // Đường bao suy giảm kép: phản xạ sớm (early reflections) + đuôi vang (late tail)
          const earlyEnv = i < sampleRate * 0.06 ? Math.sin((i / (sampleRate * 0.06)) * Math.PI) * 0.35 : 0;
          const tailEnv = Math.pow(1 - t, decayRate);
          const rawNoise = Math.random() * 2 - 1;
          // Lọc thông thấp dần theo thời gian (vật lý hấp thụ tần số cao của không khí)
          const dampFactor = 0.18 + 0.65 * (1 - t);
          lpState = lpState + dampFactor * (rawNoise - lpState);
          channelData[i] = lpState * (tailEnv + earlyEnv) * 0.65;
        }
      }
      return impulse;
    }
  }

  // ==========================================================================
  // PHẦN 3: BỘ TỔNG HỢP ÂM THANH BÀN PHÍM CƠ ASMR & MÁY CHỮ CỔ ĐIỂN
  // ==========================================================================

  class MechanicalKeyboardAsmrSynth {
    constructor(getAudioContextFn) {
      this.getAudioContext = getAudioContextFn;
      this.activeProfileKey = 'OFF';
      this.volume = 0.45;
      this.noiseBuffer = null;
      this.lastKeyTimestamp = 0;
      this.boundKeyListener = null;
    }

    setProfile(profileKey) {
      if (ASMR_KEYBOARD_PROFILES[profileKey]) {
        this.activeProfileKey = profileKey;
      } else {
        this.activeProfileKey = 'OFF';
      }
      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.ASMR_KEY_PROFILE, this.activeProfileKey);
      } catch (_err) {
        // Bỏ qua lỗi bộ nhớ đầy
      }
    }

    setVolume(volNormalized) {
      this.volume = Math.max(0, Math.min(1, Number(volNormalized) || 0.45));
      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.ASMR_KEY_VOLUME, String(this.volume));
      } catch (_err) {
        // Bỏ qua lỗi bộ nhớ
      }
    }

    attachToEditorInputs() {
      if (this.boundKeyListener) return;
      this.boundKeyListener = (ev) => {
        if (this.activeProfileKey === 'OFF') return;
        const target = ev.target;
        if (!target) return;
        const isWritingArea =
          target.id === 'textarea-chapter-content' ||
          target.id === 's20-quad-output-textarea' ||
          target.id === 'textarea-quick-scratchpad' ||
          target.id === 'input-chapter-title' ||
          target.tagName === 'TEXTAREA';
        if (!isWritingArea) return;
        if (ev.repeat) return;

        // Tránh quá tải nếu gõ quá nhanh (< 16ms)
        const now = performance.now();
        if (now - this.lastKeyTimestamp < 16) return;
        this.lastKeyTimestamp = now;

        this.triggerKeystrokeSound(ev.key, ev.code);
      };
      document.addEventListener('keydown', this.boundKeyListener, { passive: true });
    }

    triggerKeystrokeSound(keyName, keyCode) {
      const profile = ASMR_KEYBOARD_PROFILES[this.activeProfileKey];
      if (!profile || profile.id === 'OFF' || this.volume <= 0.01) return;

      const ctx = this.getAudioContext();
      if (!ctx) return;
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (!this.noiseBuffer) {
        this.noiseBuffer = WebAudioDspKernel.createWhiteNoiseBuffer(ctx, 0.25);
      }

      const now = ctx.currentTime;

      // Nếu là phím Enter ở chế độ Máy chữ cổ điển -> phát tiếng chuông "Ding!" + kéo cần gạt
      if (keyName === 'Enter' && profile.hasCarriageBell) {
        this.playTypewriterCarriageBell(ctx, now);
        return;
      }

      // Tinh chỉnh cao độ nhẹ theo từng phím (Spacebar trầm hơn, Backspace đanh hơn)
      let pitchMultiplier = 0.94 + Math.random() * 0.12;
      let gainScale = 1.0;
      if (keyCode === 'Space' || keyName === ' ') {
        pitchMultiplier = 0.74;
        gainScale = 1.22;
      } else if (keyName === 'Backspace' || keyName === 'Enter' || keyName === 'Shift') {
        pitchMultiplier = 0.84;
        gainScale = 1.12;
      }

      // 1. Thành phần thân vỏ phím (Bottom-out Thock)
      const thockOsc = ctx.createOscillator();
      const thockGain = ctx.createGain();
      thockOsc.type = 'triangle';
      const baseThock = profile.thockFreq * pitchMultiplier;
      thockOsc.frequency.setValueAtTime(baseThock * 1.4, now);
      thockOsc.frequency.exponentialRampToValueAtTime(Math.max(45, baseThock * 0.55), now + profile.decaySec);

      const peakGain = Math.min(0.4, 0.16 * this.volume * gainScale);
      thockGain.gain.setValueAtTime(0.0001, now);
      thockGain.gain.linearRampToValueAtTime(peakGain, now + 0.003);
      thockGain.gain.exponentialRampToValueAtTime(0.0001, now + profile.decaySec);

      thockOsc.connect(thockGain);
      thockGain.connect(ctx.destination);
      thockOsc.start(now);
      thockOsc.stop(now + profile.decaySec + 0.01);

      // 2. Thành phần tiếng khấc công tắc (Tactile/Clicky Transient)
      const noiseSrc = ctx.createBufferSource();
      noiseSrc.buffer = this.noiseBuffer;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(profile.clickFreq * pitchMultiplier, now);
      bandpass.Q.setValueAtTime(3.2, now);

      const clickGain = ctx.createGain();
      const clickPeak = Math.min(0.35, 0.14 * this.volume * profile.noiseAmt * gainScale);
      clickGain.gain.setValueAtTime(0.0001, now);
      clickGain.gain.linearRampToValueAtTime(clickPeak, now + 0.0015);
      clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.018);

      noiseSrc.connect(bandpass);
      bandpass.connect(clickGain);
      clickGain.connect(ctx.destination);
      noiseSrc.start(now, Math.random() * 0.15, 0.025);
    }

    playTypewriterCarriageBell(ctx, now) {
      // Tiếng chuông đồng thanh mảnh của máy đánh chữ Olympia
      const bellFreqs = [2280, 4560, 6810];
      bellFreqs.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now);

        const amp = (0.12 / (idx + 1)) * this.volume;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(amp, now + 0.004);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.55 / (idx + 1));

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now);
        osc.stop(now + 0.6);
      });
    }
  }

  // ==========================================================================
  // PHẦN 4: HỆ THỐNG TỔNG HỢP KHÔNG GIAN ÂM THANH ĐA LỚP (PROCEDURAL SOUNDSCAPE)
  // ==========================================================================

  class ProceduralMultiLayerSoundscapeGraph {
    constructor() {
      this.ctx = null;
      this.isRunning = false;
      this.activePresetKey = 'OFF';
      this.masterVolumePercent = 45;
      this.currentPianoMoodKey = 'NOIR_MELANCHOLY';
      this.currentBinauralKey = 'OFF';

      // Tùy chỉnh âm lượng từng lớp riêng lẻ (Mixer 6 kênh)
      this.layerUserMultipliers = {
        rain: 1.0,
        thunder: 1.0,
        piano: 1.0,
        pad: 1.0,
        fireplace: 1.0,
        ocean: 1.0
      };

      // Các nút WebAudio cốt lõi
      this.masterGain = null;
      this.masterFilter = null;
      this.analyserNode = null;
      this.convolverNode = null;
      this.reverbSendGain = null;
      this.dryBusGain = null;
      this.mediaStreamDest = null;
      this.streamBridgeAudioEl = null;
      this._streamBridgeRoutingActive = false;

      // Các bộ đệm nhiễu dùng chung
      this.pinkBuffer = null;
      this.brownBuffer = null;
      this.whiteBuffer = null;

      // Các nhánh âm thanh liên tục (Continuous Loops)
      this.continuousBranches = {};

      // Các bộ định thời sinh hạt âm thanh ngẫu nhiên (Stochastic Schedulers)
      this.dropletTimer = null;
      this.thunderTimer = null;
      this.crackleTimer = null;
      this.pianoChordTimer = null;
      this.pianoMelodyTimer = null;

      // Trạng thái bộ sinh hợp âm Markov cho Piano
      this.currentChordIndex = 0;
      this.lastMelodyMidi = 64;

      // Nhánh sóng não Binaural
      this.binauralNodes = null;
    }

    ensureContext() {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return null;
        this.ctx = new AudioContextClass();
        this.buildCoreAudioBus();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    }

    buildCoreAudioBus() {
      const ctx = this.ctx;
      if (!ctx) return;

      // Tạo bộ đệm nhiễu & xung Reverb
      this.pinkBuffer = WebAudioDspKernel.createPinkNoiseBuffer(ctx, 7.0);
      this.brownBuffer = WebAudioDspKernel.createBrownNoiseBuffer(ctx, 7.0);
      this.whiteBuffer = WebAudioDspKernel.createWhiteNoiseBuffer(ctx, 3.0);
      this.blueBuffer = WebAudioDspKernel.createBlueNoiseBuffer(ctx, 5.0);

      // Master Gain & Filter & Analyser
      this.masterFilter = ctx.createBiquadFilter();
      this.masterFilter.type = 'lowpass';
      this.masterFilter.frequency.value = 9500;

      this.masterGain = ctx.createGain();
      this.masterGain.gain.value = (this.masterVolumePercent / 100) * 0.85;

      this.analyserNode = ctx.createAnalyser();
      this.analyserNode.fftSize = 128;
      this.analyserNode.smoothingTimeConstant = 0.82;

      // Dry Bus & Convolution Reverb Send Bus
      this.dryBusGain = ctx.createGain();
      this.dryBusGain.gain.value = 0.85;

      this.convolverNode = ctx.createConvolver();
      this.convolverNode.buffer = WebAudioDspKernel.createSyntheticReverbImpulse(ctx, 3.0, 2.5);

      this.reverbSendGain = ctx.createGain();
      this.reverbSendGain.gain.value = 0.35;

      // Kết nối sơ đồ định tuyến:
      // DryBus -> MasterFilter
      // ReverbSend -> Convolver -> MasterFilter
      // MasterFilter -> MasterGain -> Analyser -> Destination
      this.dryBusGain.connect(this.masterFilter);
      this.reverbSendGain.connect(this.convolverNode);
      this.convolverNode.connect(this.masterFilter);

      this.masterFilter.connect(this.masterGain);
      this.masterGain.connect(this.analyserNode);
      this.analyserNode.connect(ctx.destination);
      this._directDestinationConnected = true;

      // Khởi tạo sẵn các nhánh âm thanh liên tục ở mức Gain = 0.0001
      this.initContinuousNoiseBranches();
    }

    ensureBackgroundStreamBridge() {
      const ctx = this.ctx;
      if (!ctx || !this.analyserNode || typeof document === 'undefined' || !document.body) return;
      if (typeof ctx.createMediaStreamDestination !== 'function') return;
      try {
        if (!this.mediaStreamDest) {
          this.mediaStreamDest = ctx.createMediaStreamDestination();
          this.analyserNode.connect(this.mediaStreamDest);
        }
        if (!this.streamBridgeAudioEl || !document.body.contains(this.streamBridgeAudioEl)) {
          let el = document.getElementById('mod21-soundscape-stream-bridge');
          if (!el) {
            el = document.createElement('audio');
            el.id = 'mod21-soundscape-stream-bridge';
            el.setAttribute('aria-hidden', 'true');
            el.setAttribute('playsinline', '');
            el.setAttribute('webkit-playsinline', '');
            el.playsInline = true;
            el.muted = false;
            el.volume = 1.0;
            el.style.cssText =
              'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:-12px;left:-12px;';
            document.body.appendChild(el);
          }
          el.srcObject = this.mediaStreamDest.stream;
          this.streamBridgeAudioEl = el;
        }
        if (this.streamBridgeAudioEl && this.streamBridgeAudioEl.paused) {
          const playRes = this.streamBridgeAudioEl.play();
          if (playRes && typeof playRes.then === 'function') {
            playRes
              .then(() => {
                // Đã dẫn luồng WebAudio qua thẻ <audio> thật -> ngắt đầu ra trực tiếp tránh phát đúp tiếng
                if (this._directDestinationConnected && this.analyserNode && this.ctx) {
                  try {
                    this.analyserNode.disconnect(this.ctx.destination);
                    this._directDestinationConnected = false;
                    this._streamBridgeRoutingActive = true;
                  } catch (_e) {}
                }
              })
              .catch(() => {
                if (!this._directDestinationConnected && this.analyserNode && this.ctx) {
                  try {
                    this.analyserNode.connect(this.ctx.destination);
                    this._directDestinationConnected = true;
                    this._streamBridgeRoutingActive = false;
                  } catch (_e) {}
                }
              });
          }
        }
      } catch (_err) {}
    }

    pauseBackgroundStreamBridge() {
      if (this.streamBridgeAudioEl && !this.streamBridgeAudioEl.paused) {
        try {
          this.streamBridgeAudioEl.pause();
        } catch (_e) {}
      }
    }

    initContinuousNoiseBranches() {
      const ctx = this.ctx;
      if (!ctx) return;

      // 1. Nhánh Mưa Trầm Xa (Rain Deep Rumble - Brown Noise + Lowpass 340Hz)
      const rainDeepSrc = ctx.createBufferSource();
      rainDeepSrc.buffer = this.brownBuffer;
      rainDeepSrc.loop = true;
      const rainDeepFilter = ctx.createBiquadFilter();
      rainDeepFilter.type = 'lowpass';
      rainDeepFilter.frequency.value = 340;
      const rainDeepGain = ctx.createGain();
      rainDeepGain.gain.value = 0.0001;
      rainDeepSrc.connect(rainDeepFilter);
      rainDeepFilter.connect(rainDeepGain);
      rainDeepGain.connect(this.dryBusGain);
      rainDeepSrc.start(0, Math.random() * 3.0);
      this.continuousBranches.rainDeepRumble = {
        src: rainDeepSrc,
        filter: rainDeepFilter,
        gain: rainDeepGain
      };

      // 2. Nhánh Mưa Rào Mái Hiên (Rain Mid Wash - Pink Noise + Bandpass 1150Hz + LFO Gió)
      const rainMidSrc = ctx.createBufferSource();
      rainMidSrc.buffer = this.pinkBuffer;
      rainMidSrc.loop = true;
      const rainMidFilter = ctx.createBiquadFilter();
      rainMidFilter.type = 'bandpass';
      rainMidFilter.frequency.value = 1150;
      rainMidFilter.Q.value = 0.65;

      // LFO làm tần số mưa dao động nhẹ như có làn gió đêm thổi qua
      const windLfo = ctx.createOscillator();
      const windLfoGain = ctx.createGain();
      windLfo.type = 'sine';
      windLfo.frequency.value = 0.11; // Chu kỳ ~9 giây
      windLfoGain.gain.value = 260;
      windLfo.connect(windLfoGain);
      windLfoGain.connect(rainMidFilter.frequency);
      windLfo.start();

      const rainMidGain = ctx.createGain();
      rainMidGain.gain.value = 0.0001;
      rainMidSrc.connect(rainMidFilter);
      rainMidFilter.connect(rainMidGain);
      rainMidGain.connect(this.dryBusGain);
      rainMidGain.connect(this.reverbSendGain);
      rainMidSrc.start(0, Math.random() * 4.0);
      this.continuousBranches.rainMidWash = {
        src: rainMidSrc,
        filter: rainMidFilter,
        gain: rainMidGain,
        lfo: windLfo
      };

      // 3. Nhánh Hơi Ấm Lò Sưởi & Lửa Trại (Fireplace Hearth - Brown Noise + Lowpass 210Hz + Flicker LFO)
      const hearthSrc = ctx.createBufferSource();
      hearthSrc.buffer = this.brownBuffer;
      hearthSrc.loop = true;
      const hearthFilter = ctx.createBiquadFilter();
      hearthFilter.type = 'lowpass';
      hearthFilter.frequency.value = 210;

      const flickerLfo = ctx.createOscillator();
      const flickerGain = ctx.createGain();
      flickerLfo.type = 'triangle';
      flickerLfo.frequency.value = 0.28;
      flickerGain.gain.value = 55;
      flickerLfo.connect(flickerGain);
      flickerGain.connect(hearthFilter.frequency);
      flickerLfo.start();

      const hearthOutGain = ctx.createGain();
      hearthOutGain.gain.value = 0.0001;
      hearthSrc.connect(hearthFilter);
      hearthFilter.connect(hearthOutGain);
      hearthOutGain.connect(this.dryBusGain);
      hearthSrc.start(0, Math.random() * 2.5);
      this.continuousBranches.fireplaceHearth = {
        src: hearthSrc,
        filter: hearthFilter,
        gain: hearthOutGain,
        lfo: flickerLfo
      };

      // 4. Nhánh Sóng Biển Vỗ Bờ (Ocean Surf - Pink Noise + Sweeping Lowpass LFO 0.095Hz)
      const oceanSurfSrc = ctx.createBufferSource();
      oceanSurfSrc.buffer = this.pinkBuffer;
      oceanSurfSrc.loop = true;
      const oceanSurfFilter = ctx.createBiquadFilter();
      oceanSurfFilter.type = 'lowpass';
      oceanSurfFilter.frequency.value = 520;

      const surfWaveLfo = ctx.createOscillator();
      const surfWaveDepth = ctx.createGain();
      surfWaveLfo.type = 'sine';
      surfWaveLfo.frequency.value = 0.095; // Chu kỳ sóng vỗ ~10.5 giây
      surfWaveDepth.gain.value = 390;
      surfWaveLfo.connect(surfWaveDepth);
      surfWaveDepth.connect(oceanSurfFilter.frequency);
      surfWaveLfo.start();

      const oceanSurfGain = ctx.createGain();
      oceanSurfGain.gain.value = 0.0001;
      oceanSurfSrc.connect(oceanSurfFilter);
      oceanSurfFilter.connect(oceanSurfGain);
      oceanSurfGain.connect(this.dryBusGain);
      oceanSurfGain.connect(this.reverbSendGain);
      oceanSurfSrc.start(0, Math.random() * 5.0);
      this.continuousBranches.oceanSurf = {
        src: oceanSurfSrc,
        filter: oceanSurfFilter,
        gain: oceanSurfGain,
        lfo: surfWaveLfo
      };

      // 5. Nhánh Bọt Sóng Rút Ra Khơi (Ocean Receding Foam - Brown/Pink + Bandpass lệch pha)
      const oceanFoamSrc = ctx.createBufferSource();
      oceanFoamSrc.buffer = this.brownBuffer;
      oceanFoamSrc.loop = true;
      const oceanFoamFilter = ctx.createBiquadFilter();
      oceanFoamFilter.type = 'bandpass';
      oceanFoamFilter.frequency.value = 880;
      oceanFoamFilter.Q.value = 0.55;

      const foamLfo = ctx.createOscillator();
      const foamDepth = ctx.createGain();
      foamLfo.type = 'cosine' in OscillatorNode.prototype ? 'sine' : 'sine';
      foamLfo.frequency.value = 0.095;
      foamDepth.gain.value = 340;
      foamLfo.connect(foamDepth);
      foamDepth.connect(oceanFoamFilter.frequency);
      foamLfo.start(ctx.currentTime + 2.6); // Lệch pha 1/4 chu kỳ sóng

      const oceanFoamGain = ctx.createGain();
      oceanFoamGain.gain.value = 0.0001;
      oceanFoamSrc.connect(oceanFoamFilter);
      oceanFoamFilter.connect(oceanFoamGain);
      oceanFoamGain.connect(this.dryBusGain);
      oceanFoamSrc.start(0, Math.random() * 3.5);
      this.continuousBranches.oceanFoam = {
        src: oceanFoamSrc,
        filter: oceanFoamFilter,
        gain: oceanFoamGain,
        lfo: foamLfo
      };

      // 6. Nhánh Giả Lập Tiếng Quạt Đêm Êm Dịu (Pink/Brown breeze + LFO cánh quạt 0.24Hz + motor hum 108Hz)
      const fanSrc = ctx.createBufferSource();
      fanSrc.buffer = this.pinkBuffer;
      fanSrc.loop = true;
      const fanFilter = ctx.createBiquadFilter();
      fanFilter.type = 'lowpass';
      fanFilter.frequency.value = 440;
      fanFilter.Q.value = 0.7;
      const fanLfo = ctx.createOscillator();
      const fanLfoGain = ctx.createGain();
      fanLfo.type = 'sine';
      fanLfo.frequency.value = 0.24;
      fanLfoGain.gain.value = 65;
      fanLfo.connect(fanLfoGain);
      fanLfoGain.connect(fanFilter.frequency);
      const fanMotor = ctx.createOscillator();
      const fanMotorGain = ctx.createGain();
      fanMotor.type = 'sine';
      fanMotor.frequency.value = 108;
      fanMotorGain.gain.value = 0.035;
      const fanGain = ctx.createGain();
      fanGain.gain.value = 0.0001;
      fanSrc.connect(fanFilter);
      fanFilter.connect(fanGain);
      fanMotor.connect(fanMotorGain);
      fanMotorGain.connect(fanGain);
      fanGain.connect(this.dryBusGain);
      fanSrc.start(0, Math.random() * 2.0);
      fanLfo.start(0);
      fanMotor.start(0);
      this.continuousBranches.electricFan = { src: fanSrc, filter: fanFilter, gain: fanGain, lfo: fanLfo, motor: fanMotor };

      // 7. Nhánh Tiếng Ồn Hồng Thuần Êm Dịu (Pure Pink Noise)
      const pinkPureSrc = ctx.createBufferSource();
      pinkPureSrc.buffer = this.pinkBuffer;
      pinkPureSrc.loop = true;
      const pinkPureFilter = ctx.createBiquadFilter();
      pinkPureFilter.type = 'lowpass';
      pinkPureFilter.frequency.value = 2600;
      const pinkPureGain = ctx.createGain();
      pinkPureGain.gain.value = 0.0001;
      pinkPureSrc.connect(pinkPureFilter);
      pinkPureFilter.connect(pinkPureGain);
      pinkPureGain.connect(this.dryBusGain);
      pinkPureSrc.start(0, Math.random() * 2.0);
      this.continuousBranches.purePinkNoise = { src: pinkPureSrc, filter: pinkPureFilter, gain: pinkPureGain };

      // 8. Nhánh Tiếng Ồn Trắng Mềm Mại (Soft Band-Limited White Noise)
      const whitePureSrc = ctx.createBufferSource();
      whitePureSrc.buffer = this.whiteBuffer;
      whitePureSrc.loop = true;
      const whiteHp = ctx.createBiquadFilter();
      whiteHp.type = 'highpass';
      whiteHp.frequency.value = 220;
      const whiteLp = ctx.createBiquadFilter();
      whiteLp.type = 'lowpass';
      whiteLp.frequency.value = 3800;
      const whitePureGain = ctx.createGain();
      whitePureGain.gain.value = 0.0001;
      whitePureSrc.connect(whiteHp);
      whiteHp.connect(whiteLp);
      whiteLp.connect(whitePureGain);
      whitePureGain.connect(this.dryBusGain);
      whitePureSrc.start(0, Math.random() * 1.5);
      this.continuousBranches.pureWhiteNoise = { src: whitePureSrc, filter: whiteLp, gain: whitePureGain };

      // 9. Nhánh Tiếng Ồn Xanh Thanh Thoát (Soft Blue Noise)
      const bluePureSrc = ctx.createBufferSource();
      bluePureSrc.buffer = this.blueBuffer || this.whiteBuffer;
      bluePureSrc.loop = true;
      const blueBp = ctx.createBiquadFilter();
      blueBp.type = 'bandpass';
      blueBp.frequency.value = 2400;
      blueBp.Q.value = 0.55;
      const bluePureGain = ctx.createGain();
      bluePureGain.gain.value = 0.0001;
      bluePureSrc.connect(blueBp);
      blueBp.connect(bluePureGain);
      bluePureGain.connect(this.dryBusGain);
      bluePureSrc.start(0, Math.random() * 2.0);
      this.continuousBranches.pureBlueNoise = { src: bluePureSrc, filter: blueBp, gain: bluePureGain };
    }

    /**
     * Chuyển đổi Preset âm thanh không gian với hiệu ứng Crossfade mượt mà 1.2 giây
     */
    applyPreset(presetKey) {
      const preset = SOUNDSCAPE_PRESETS_CATALOG[presetKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;
      this.activePresetKey = preset.key;

      if (preset.key === 'OFF') {
        this.isRunning = false;
        this.stopStochasticSchedulers();
        this.pauseBackgroundStreamBridge();
        if (this.ctx) {
          const now = this.ctx.currentTime;
          Object.values(this.continuousBranches).forEach((branch) => {
            if (branch && branch.gain) {
              branch.gain.gain.cancelScheduledValues(now);
              branch.gain.gain.setValueAtTime(branch.gain.gain.value, now);
              branch.gain.gain.linearRampToValueAtTime(0.0001, now + 0.65);
            }
          });
        }
        return preset;
      }

      const ctx = this.ensureContext();
      if (!ctx) return preset;

      this.isRunning = true;
      this.ensureBackgroundStreamBridge();
      const now = ctx.currentTime;

      // Điều chỉnh bộ lọc tổng và lượng Reverb
      if (this.masterFilter) {
        this.masterFilter.frequency.setTargetAtTime(preset.masterLowpassHz || 9000, now, 0.4);
      }
      if (this.reverbSendGain) {
        this.reverbSendGain.gain.setTargetAtTime(preset.reverbMix || 0.3, now, 0.4);
      }

      this.syncContinuousLayerLevels();
      this.restartStochasticSchedulers();
      return preset;
    }

    /**
     * Đồng bộ mức âm lượng của các nhánh liên tục dựa trên Preset hiện tại và Mixer tùy chỉnh
     */
    syncContinuousLayerLevels() {
      if (!this.ctx) return;
      const preset = SOUNDSCAPE_PRESETS_CATALOG[this.activePresetKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;
      const now = this.ctx.currentTime;
      const layers = preset.layers;

      const setSmoothGain = (branchName, targetVal) => {
        const branch = this.continuousBranches[branchName];
        if (!branch || !branch.gain) return;
        const safeTarget = Math.max(0.0001, targetVal);
        branch.gain.gain.cancelScheduledValues(now);
        branch.gain.gain.setValueAtTime(Math.max(0.0001, branch.gain.gain.value), now);
        branch.gain.gain.exponentialRampToValueAtTime(safeTarget, now + 0.9);
      };

      setSmoothGain('rainDeepRumble', (layers.rainDeepRumble || 0) * this.layerUserMultipliers.rain * 0.45);
      setSmoothGain('rainMidWash', (layers.rainMidWash || 0) * this.layerUserMultipliers.rain * 0.38);
      setSmoothGain('fireplaceHearth', (layers.fireplaceHearth || 0) * this.layerUserMultipliers.fireplace * 0.52);
      setSmoothGain('oceanSurf', (layers.oceanSurf || 0) * this.layerUserMultipliers.ocean * 0.44);
      setSmoothGain('oceanFoam', (layers.oceanFoam || 0) * this.layerUserMultipliers.ocean * 0.32);
      setSmoothGain('electricFan', (layers.electricFan || 0) * 0.55);
      setSmoothGain('purePinkNoise', (layers.purePinkNoise || 0) * 0.48);
      setSmoothGain('pureWhiteNoise', (layers.pureWhiteNoise || 0) * 0.22);
      setSmoothGain('pureBlueNoise', (layers.pureBlueNoise || 0) * 0.28);
    }

    stopStochasticSchedulers() {
      if (this.dropletTimer) {
        clearInterval(this.dropletTimer);
        this.dropletTimer = null;
      }
      if (this.thunderTimer) {
        clearInterval(this.thunderTimer);
        this.thunderTimer = null;
      }
      if (this.crackleTimer) {
        clearInterval(this.crackleTimer);
        this.crackleTimer = null;
      }
      if (this.pianoChordTimer) {
        clearInterval(this.pianoChordTimer);
        this.pianoChordTimer = null;
      }
      if (this.pianoMelodyTimer) {
        clearInterval(this.pianoMelodyTimer);
        this.pianoMelodyTimer = null;
      }
    }

    restartStochasticSchedulers() {
      this.stopStochasticSchedulers();
      if (!this.isRunning || this.activePresetKey === 'OFF') return;

      const preset = SOUNDSCAPE_PRESETS_CATALOG[this.activePresetKey];
      if (!preset) return;

      // 1. Bộ lập lịch giọt mưa rơi trên kính cửa sổ (Raindrops on Window Pane)
      if (preset.layers.rainWindowDrops > 0) {
        this.dropletTimer = setInterval(() => {
          if (!this.isRunning) return;
          const intensity = preset.layers.rainWindowDrops * this.layerUserMultipliers.rain;
          if (intensity <= 0.02) return;
          const dropsCount = 1 + Math.floor(Math.random() * 3);
          for (let i = 0; i < dropsCount; i++) {
            if (Math.random() < 0.72) {
              this.spawnSingleRaindropOnGlass(intensity);
            }
          }
        }, 180);
      }

      // 2. Bộ lập lịch tiếng sấm rền xa (Distant Thunder Roll)
      if (preset.layers.thunderRoll > 0) {
        this.thunderTimer = setInterval(() => {
          if (!this.isRunning) return;
          const intensity = preset.layers.thunderRoll * this.layerUserMultipliers.thunder;
          if (intensity > 0.05 && Math.random() < 0.42) {
            this.spawnDistantThunderRoll(intensity);
          }
        }, 16000);
      }

      // 3. Bộ lập lịch tiếng củi khô nổ lách tách (Fireplace Wood Crackles & Pops)
      if (preset.layers.fireplaceCrackles > 0) {
        this.crackleTimer = setInterval(() => {
          if (!this.isRunning) return;
          const intensity = preset.layers.fireplaceCrackles * this.layerUserMultipliers.fireplace;
          if (intensity <= 0.02) return;
          const popCount = 1 + Math.floor(Math.random() * 4);
          for (let i = 0; i < popCount; i++) {
            if (Math.random() < 0.78) {
              this.spawnWoodCracklePop(intensity);
            }
          }
        }, 150);
      }

      // 4. Bộ lập lịch Hợp âm & Giai điệu Piano Tự Sinh + Đệm Jazz Pad
      if (preset.layers.piano > 0 || preset.layers.noirPad > 0) {
        const mood = GENERATIVE_PIANO_MOODS[this.currentPianoMoodKey] || GENERATIVE_PIANO_MOODS.NOIR_MELANCHOLY;
        const barDurationMs = Math.round((60 / mood.tempoBpm) * 4 * 1000);

        // Đánh hợp âm đầu tiên ngay lập tức
        this.triggerNextMarkovPianoChord(preset);

        this.pianoChordTimer = setInterval(() => {
          if (!this.isRunning) return;
          this.triggerNextMarkovPianoChord(preset);
        }, barDurationMs);

        // Các nốt giai điệu rải ngón giữa các phách
        const eighthNoteMs = Math.round(barDurationMs / 6);
        this.pianoMelodyTimer = setInterval(() => {
          if (!this.isRunning) return;
          this.maybeTriggerPianoMelodyNote(preset);
        }, eighthNoteMs);
      }
    }

    /**
     * Sinh âm thanh một giọt mưa chạm vào mặt kính cửa sổ (Stereo Panned Droplet)
     */
    spawnSingleRaindropOnGlass(intensity) {
      if (!this.ctx || !this.whiteBuffer) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + Math.random() * 0.14;

      const src = ctx.createBufferSource();
      src.buffer = this.whiteBuffer;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      const centerFreq = 2200 + Math.random() * 3400;
      bp.frequency.setValueAtTime(centerFreq, now);
      bp.Q.setValueAtTime(6.0 + Math.random() * 5.0, now);

      const gain = ctx.createGain();
      const peak = (0.015 + Math.random() * 0.032) * intensity;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.002);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.024 + Math.random() * 0.018);

      src.connect(bp);
      bp.connect(gain);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.random() * 1.6 - 0.8, now);
        gain.connect(panner);
        panner.connect(this.dryBusGain);
      } else {
        gain.connect(this.dryBusGain);
      }

      src.start(now, Math.random() * 1.5, 0.05);
    }

    /**
     * Sinh tiếng sấm rền trầm ấm phía chân trời xa (Sub-Bass Filtered Swell)
     */
    spawnDistantThunderRoll(intensity) {
      if (!this.ctx || !this.brownBuffer) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + 0.1;
      const duration = 4.2 + Math.random() * 3.0;

      const src = ctx.createBufferSource();
      src.buffer = this.brownBuffer;
      src.loop = true;

      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(55, now);
      lowpass.frequency.linearRampToValueAtTime(135 + Math.random() * 45, now + 0.9);
      lowpass.frequency.exponentialRampToValueAtTime(42, now + duration);

      const gain = ctx.createGain();
      const peak = Math.min(0.65, (0.24 + Math.random() * 0.18) * intensity);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.65);
      gain.gain.setValueAtTime(peak * 0.72, now + 1.4);
      gain.gain.linearRampToValueAtTime(peak * 0.9, now + 1.9);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

      src.connect(lowpass);
      lowpass.connect(gain);
      gain.connect(this.dryBusGain);
      gain.connect(this.reverbSendGain);

      src.start(now, Math.random() * 2.0, duration + 0.2);
    }

    /**
     * Sinh tiếng củi thông nổ lách tách trong đống lửa trại
     */
    spawnWoodCracklePop(intensity) {
      if (!this.ctx || !this.whiteBuffer) return;
      const ctx = this.ctx;
      const now = ctx.currentTime + Math.random() * 0.12;

      const src = ctx.createBufferSource();
      src.buffer = this.whiteBuffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      const freq = 1600 + Math.random() * 4200;
      filter.frequency.setValueAtTime(freq, now);
      filter.Q.setValueAtTime(4.5 + Math.random() * 6.0, now);

      const gain = ctx.createGain();
      const peak = (0.022 + Math.random() * 0.048) * intensity;
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.linearRampToValueAtTime(peak, now + 0.0012);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.015 + Math.random() * 0.02);

      src.connect(filter);
      filter.connect(gain);

      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.random() * 1.1 - 0.55, now);
        gain.connect(panner);
        panner.connect(this.dryBusGain);
      } else {
        gain.connect(this.dryBusGain);
      }

      src.start(now, Math.random() * 1.8, 0.04);
    }

    /**
     * Chuyển sang hợp âm tiếp theo theo ma trận xác suất Markov và đánh hợp âm Piano + Pad
     */
    triggerNextMarkovPianoChord(preset) {
      if (!this.ctx) return;
      const mood = GENERATIVE_PIANO_MOODS[this.currentPianoMoodKey] || GENERATIVE_PIANO_MOODS.NOIR_MELANCHOLY;
      const chords = mood.chords;
      if (!chords || !chords.length) return;

      const currentChord = chords[this.currentChordIndex % chords.length];

      // Chọn hợp âm kế tiếp theo trọng số Markov
      const weights = currentChord.nextWeights || [0.25, 0.25, 0.25, 0.25];
      const r = Math.random();
      let acc = 0;
      let nextIdx = 0;
      for (let i = 0; i < weights.length; i++) {
        acc += weights[i];
        if (r <= acc) {
          nextIdx = i;
          break;
        }
      }
      this.currentChordIndex = nextIdx % chords.length;

      const pianoLevel = (preset.layers.piano || 0) * this.layerUserMultipliers.piano;
      const padLevel = (preset.layers.noirPad || 0) * this.layerUserMultipliers.pad;

      if (pianoLevel > 0.02) {
        // Đánh nốt Bass tay trái
        this.synthesizeAcousticPianoNote(currentChord.bassMidi, pianoLevel * 0.55, 4.6, 0.0);
        // Đánh quãng 5 tay trái trễ 0.28s
        if (currentChord.fifthMidi) {
          this.synthesizeAcousticPianoNote(currentChord.fifthMidi, pianoLevel * 0.42, 4.2, 0.28 + Math.random() * 0.08);
        }
        // Rải mềm các nốt hợp âm tay phải (Humanized Strum / Arpeggio)
        currentChord.chordMidis.forEach((midi, idx) => {
          const delaySec = 0.45 + idx * (0.16 + Math.random() * 0.08);
          const vel = pianoLevel * (0.38 + Math.random() * 0.14);
          this.synthesizeAcousticPianoNote(midi, vel, 3.8, delaySec);
        });
      }

      if (padLevel > 0.02) {
        this.synthesizeWarmNoirPadChord(currentChord.chordMidis, padLevel * 0.26, 5.2);
      }
    }

    /**
     * Xác suất gảy thêm các nốt giai điệu đơn lẻ ở quãng cao (Right-hand Nocturne Melody)
     */
    maybeTriggerPianoMelodyNote(preset) {
      if (!this.ctx) return;
      const pianoLevel = (preset.layers.piano || 0) * this.layerUserMultipliers.piano;
      if (pianoLevel <= 0.02) return;

      const mood = GENERATIVE_PIANO_MOODS[this.currentPianoMoodKey] || GENERATIVE_PIANO_MOODS.NOIR_MELANCHOLY;
      if (Math.random() > mood.melodyChance * 0.55) return;

      const chord = mood.chords[this.currentChordIndex % mood.chords.length];
      const scale = chord.scaleMidis;
      if (!scale || !scale.length) return;

      // Ưu tiên chọn nốt liền kề với nốt giai điệu trước đó (Voice Leading tự nhiên)
      let closestIdx = 0;
      let minDist = 999;
      scale.forEach((m, idx) => {
        const d = Math.abs(m - this.lastMelodyMidi);
        if (d < minDist) {
          minDist = d;
          closestIdx = idx;
        }
      });

      const stepDelta = Math.floor(Math.random() * 5) - 2; // Bước nhảy -2, -1, 0, +1, +2 bậc
      const chosenIdx = Math.max(0, Math.min(scale.length - 1, closestIdx + stepDelta));
      const midiNote = scale[chosenIdx];
      this.lastMelodyMidi = midiNote;

      const velocity = pianoLevel * (0.32 + Math.random() * 0.22);
      const jitterDelay = Math.random() * 0.09;
      this.synthesizeAcousticPianoNote(midiNote, velocity, 2.9, jitterDelay);
    }

    /**
     * Tổng hợp âm sắc Dương cầm Acoustic (Felt Piano) bằng bộ tạo dao động đa hài âm
     * + tiếng búa nỉ chạm dây + bộ lọc thông thấp động theo lực gõ (Velocity Filter)
     */
    synthesizeAcousticPianoNote(midiNote, velocity = 0.35, durationSec = 3.5, delaySec = 0) {
      if (!this.ctx) return;
      const ctx = this.ctx;
      const startTime = ctx.currentTime + Math.max(0, delaySec);
      const freq = WebAudioDspKernel.midiToFreq(midiNote);

      // Voice Filter mô phỏng độ ấm của đàn Upright Piano có lớp nỉ (Felt Piano)
      const noteFilter = ctx.createBiquadFilter();
      noteFilter.type = 'lowpass';
      const initialCutoff = Math.min(6500, freq * (3.2 + velocity * 5.5));
      const tailCutoff = Math.max(240, freq * 1.35);
      noteFilter.frequency.setValueAtTime(initialCutoff, startTime);
      noteFilter.frequency.exponentialRampToValueAtTime(tailCutoff, startTime + durationSec * 0.75);

      const noteGain = ctx.createGain();
      const peakGain = Math.min(0.28, velocity * 0.22);
      noteGain.gain.setValueAtTime(0.0001, startTime);
      noteGain.gain.linearRampToValueAtTime(peakGain, startTime + 0.014);
      noteGain.gain.exponentialRampToValueAtTime(peakGain * 0.38, startTime + 0.45);
      noteGain.gain.exponentialRampToValueAtTime(0.0001, startTime + durationSec);

      // 1. Dao động cơ bản (Fundamental - Triangle/Sine ấm)
      const osc1 = ctx.createOscillator();
      osc1.type = 'triangle';
      osc1.frequency.setValueAtTime(freq, startTime);

      // 2. Hài âm bậc 2 + lệch tần nhẹ (Inharmonicity / Sympathetic String Detune)
      const osc2 = ctx.createOscillator();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(freq * 2.0008, startTime);
      const osc2Gain = ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.26, startTime);
      osc2Gain.gain.exponentialRampToValueAtTime(0.02, startTime + durationSec * 0.5);

      // 3. Hài âm bậc 3 tạo độ trong trẻo khi mới gõ phím
      const osc3 = ctx.createOscillator();
      osc3.type = 'sine';
      osc3.frequency.setValueAtTime(freq * 3.002, startTime);
      const osc3Gain = ctx.createGain();
      osc3Gain.gain.setValueAtTime(0.09, startTime);
      osc3Gain.gain.exponentialRampToValueAtTime(0.001, startTime + durationSec * 0.25);

      osc1.connect(noteFilter);
      osc2.connect(osc2Gain);
      osc2Gain.connect(noteFilter);
      osc3.connect(osc3Gain);
      osc3Gain.connect(noteFilter);

      noteFilter.connect(noteGain);

      // Phân bổ vị trí Stereo tự nhiên như ngồi trước đàn Piano (Nốt trầm bên trái, nốt cao bên phải)
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        const panVal = Math.max(-0.65, Math.min(0.65, ((midiNote - 60) / 36) * 0.55));
        panner.pan.setValueAtTime(panVal, startTime);
        noteGain.connect(panner);
        panner.connect(this.dryBusGain);
        panner.connect(this.reverbSendGain);
      } else {
        noteGain.connect(this.dryBusGain);
        noteGain.connect(this.reverbSendGain);
      }

      osc1.start(startTime);
      osc2.start(startTime);
      osc3.start(startTime);
      osc1.stop(startTime + durationSec + 0.05);
      osc2.stop(startTime + durationSec + 0.05);
      osc3.stop(startTime + durationSec + 0.05);
    }

    /**
     * Tổng hợp lớp đệm Warm Noir Pad (Ambient Synth Strings) nâng đỡ phía dưới tiếng mưa và piano
     */
    synthesizeWarmNoirPadChord(chordMidis, padGainLevel = 0.1, durationSec = 5.0) {
      if (!this.ctx || !chordMidis || !chordMidis.length) return;
      const ctx = this.ctx;
      const now = ctx.currentTime;

      const padFilter = ctx.createBiquadFilter();
      padFilter.type = 'lowpass';
      padFilter.frequency.setValueAtTime(420, now);
      padFilter.frequency.linearRampToValueAtTime(920, now + durationSec * 0.5);
      padFilter.frequency.linearRampToValueAtTime(380, now + durationSec);

      const envGain = ctx.createGain();
      const safePeak = Math.min(0.14, padGainLevel * 0.12);
      envGain.gain.setValueAtTime(0.0001, now);
      envGain.gain.linearRampToValueAtTime(safePeak, now + durationSec * 0.38);
      envGain.gain.exponentialRampToValueAtTime(0.0001, now + durationSec);

      padFilter.connect(envGain);
      envGain.connect(this.dryBusGain);
      envGain.connect(this.reverbSendGain);

      chordMidis.slice(0, 3).forEach((midi, idx) => {
        const freq = WebAudioDspKernel.midiToFreq(midi);
        const osc = ctx.createOscillator();
        osc.type = idx % 2 === 0 ? 'sawtooth' : 'triangle';
        osc.frequency.setValueAtTime(freq * (1 + (idx - 1) * 0.0025), now);
        osc.connect(padFilter);
        osc.start(now);
        osc.stop(now + durationSec + 0.05);
      });
    }

    /**
     * Bật/Tắt sóng não Binaural Beats hỗ trợ tập trung sâu
     */
    setBinauralFocusMode(modeKey) {
      const mode = BINAURAL_FOCUS_MODES[modeKey] || BINAURAL_FOCUS_MODES.OFF;
      this.currentBinauralKey = mode.id;

      // Dừng nhánh Binaural cũ nếu có
      if (this.binauralNodes) {
        try {
          const now = this.ctx ? this.ctx.currentTime : 0;
          this.binauralNodes.gain.gain.linearRampToValueAtTime(0.0001, now + 0.3);
          setTimeout(() => {
            try {
              this.binauralNodes?.leftOsc?.stop();
              this.binauralNodes?.rightOsc?.stop();
            } catch (_e) {
              // Đã dừng
            }
          }, 350);
        } catch (_err) {
          // Bỏ qua
        }
        this.binauralNodes = null;
      }

      if (mode.id === 'OFF' || mode.carrierHz <= 0) return mode;

      const ctx = this.ensureContext();
      if (!ctx) return mode;

      const now = ctx.currentTime;
      const leftOsc = ctx.createOscillator();
      const rightOsc = ctx.createOscillator();
      leftOsc.type = 'sine';
      rightOsc.type = 'sine';
      leftOsc.frequency.setValueAtTime(mode.carrierHz, now);
      rightOsc.frequency.setValueAtTime(mode.carrierHz + mode.beatHz, now);

      const merger = ctx.createChannelMerger(2);
      const binauralGain = ctx.createGain();
      binauralGain.gain.setValueAtTime(0.0001, now);
      binauralGain.gain.linearRampToValueAtTime(0.045, now + 1.0);

      leftOsc.connect(merger, 0, 0);
      rightOsc.connect(merger, 0, 1);
      merger.connect(binauralGain);
      binauralGain.connect(this.masterGain);

      leftOsc.start(now);
      rightOsc.start(now);

      this.binauralNodes = {
        leftOsc,
        rightOsc,
        gain: binauralGain
      };
      return mode;
    }

    setMasterVolume(volPercent) {
      const clamped = Math.max(0, Math.min(100, Number(volPercent) || 0));
      this.masterVolumePercent = clamped;
      if (this.ctx && this.masterGain) {
        const now = this.ctx.currentTime;
        const targetLinear = (clamped / 100) * 0.88;
        this.masterGain.gain.setTargetAtTime(targetLinear, now, 0.08);
      }
    }
  }

  // ==========================================================================
  // PHẦN 5: BỘ SƯU TẬP 16 BỐI CẢNH ÂM THANH VĂN HỌC (LITERARY SOUND SCENES)
  // ==========================================================================

  const CURATED_LITERARY_SOUND_SCENES = [
    {
      id: 'SCENE_HANOI_NIGHT_RAIN',
      title: '🌧️ Đêm Mưa Phố Cổ & Ánh Đèn Vàng',
      genreTag: 'Tâm lý / Đời thường / Trinh thám',
      basePreset: 'NOIR_MIX',
      pianoMood: 'NOIR_MELANCHOLY',
      binaural: 'ALPHA_FLOW',
      mix: { rain: 1.15, thunder: 0.65, piano: 0.85, pad: 0.70, fireplace: 0.0, ocean: 0.0 },
      description: 'Tiếng mưa rả rích trên mái ngói rêu phong hòa cùng tiếng dương cầm trầm lắng từ căn gác nhỏ.'
    },
    {
      id: 'SCENE_MIDNIGHT_JAZZ_CAFE',
      title: '🎷 Quán Cà Phê Jazz Lúc 02:00 Sáng',
      genreTag: 'Noir / Đô thị / Lãng mạn u buồn',
      basePreset: 'NOIR_MIX',
      pianoMood: 'IMPRESSIONIST_DREAM',
      binaural: 'ALPHA_FLOW',
      mix: { rain: 0.65, thunder: 0.2, piano: 1.25, pad: 1.1, fireplace: 0.35, ocean: 0.0 },
      description: 'Hợp âm dương cầm giàu màu sắc ấn tượng quyện cùng hơi ấm lò sưởi nhẹ và mưa bụi ngoài khung kính.'
    },
    {
      id: 'SCENE_ANCIENT_MOON_PAVILION',
      title: '🌙 Thủy Đình Dưới Trăng Khuyết (Cổ Phong)',
      genreTag: 'Cổ trang / Tiên hiệp / Kiếm hiệp',
      basePreset: 'PIANO',
      pianoMood: 'WUXIA_ANCIENT_MOON',
      binaural: 'THETA_IMAGINATION',
      mix: { rain: 0.35, thunder: 0.0, piano: 1.2, pad: 0.9, fireplace: 0.0, ocean: 0.25 },
      description: 'Thang âm ngũ cung thanh tao vang vọng bên mặt hồ tĩnh lặng, gợi cảm giác cô tịch và thoát tục.'
    },
    {
      id: 'SCENE_DETECTIVE_CASEFILE',
      title: '🕵️ Hồ Sơ Mật Trong Phòng Thẩm Vấn',
      genreTag: 'Hình sự / Tâm lý tội phạm / Kinh dị',
      basePreset: 'NOIR_MIX',
      pianoMood: 'MYSTERY_DETECTIVE',
      binaural: 'BETA_LOGIC',
      mix: { rain: 1.0, thunder: 1.25, piano: 0.75, pad: 1.2, fireplace: 0.0, ocean: 0.0 },
      description: 'Chuỗi hợp âm thứ-trưởng căng thẳng cùng tiếng sấm rền xa, giữ nhịp độ hồi hộp khi viết cảnh đấu trí.'
    },
    {
      id: 'SCENE_WINTER_CABIN_HEARTH',
      title: '🔥 Nhà Gỗ Giữa Rừng Tuyết Đêm Đông',
      genreTag: 'Kỳ ảo / Phiêu lưu / Chữa lành',
      basePreset: 'FIREPLACE',
      pianoMood: 'IMPRESSIONIST_DREAM',
      binaural: 'ALPHA_FLOW',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.55, pad: 0.45, fireplace: 1.3, ocean: 0.0 },
      description: 'Tiếng củi thông nổ lách tách ấm sực trong lò sưởi đá giữa đêm tuyết rơi tĩnh mịch.'
    },
    {
      id: 'SCENE_LIGHTHOUSE_STORM',
      title: '🌊 Ngọn Hải Đăng Trước Cơn Bão Biển',
      genreTag: 'Viễn tưởng / Sinh tồn / Bi kịch',
      basePreset: 'OCEAN',
      pianoMood: 'MYSTERY_DETECTIVE',
      binaural: 'THETA_IMAGINATION',
      mix: { rain: 0.85, thunder: 1.15, piano: 0.0, pad: 0.65, fireplace: 0.0, ocean: 1.35 },
      description: 'Sóng biển cuộn trào vỗ vào vách đá hòa cùng mưa rào và sấm rền ngoài khơi xa.'
    },
    {
      id: 'SCENE_DAWN_BY_THE_SHORE',
      title: '🐚 Bờ Cát Bình Minh Sau Đêm Dài',
      genreTag: 'Đoàn viên / Kết mở / Hồi ức',
      basePreset: 'OCEAN',
      pianoMood: 'IMPRESSIONIST_DREAM',
      binaural: 'ALPHA_FLOW',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.85, pad: 0.6, fireplace: 0.0, ocean: 1.0 },
      description: 'Nhịp sóng biển dịu dàng vỗ bờ cát cùng những nốt dương cầm trong trẻo như ánh nắng sớm.'
    },
    {
      id: 'SCENE_VICTORIAN_LIBRARY',
      title: '📚 Thư Viện Cổ & Tiếng Mưa Trên Kính Màu',
      genreTag: 'Học viện / Bí ẩn / Lịch sử',
      basePreset: 'RAIN',
      pianoMood: 'NOIR_MELANCHOLY',
      binaural: 'BETA_LOGIC',
      mix: { rain: 0.9, thunder: 0.35, piano: 0.0, pad: 0.3, fireplace: 0.75, ocean: 0.0 },
      description: 'Sự hòa quyện giữa tiếng giọt mưa gõ lên cửa sổ kính màu và tiếng lửa sưởi ấm áp trong phòng đọc sách.'
    },
    {
      id: 'SCENE_SOFT_ELECTRIC_FAN',
      title: '🌀 Tiếng Quạt Đêm Êm Dịu (Electric Fan)',
      genreTag: 'Nhẹ nhàng / Chống tạp âm / Dễ ngủ',
      basePreset: 'FAN',
      pianoMood: 'IMPRESSIONIST_DREAM',
      binaural: 'OFF',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.0, pad: 0.0, fireplace: 0.0, ocean: 0.0 },
      description: 'Giả lập tiếng gió quạt máy quay nhẹ đều nhịp cùng tiếng động cơ trầm ấm giúp tập trung viết hoặc thư giãn.'
    },
    {
      id: 'SCENE_PINK_NOISE_CALM',
      title: '🌸 Tiếng Ồn Hồng Thư Giãn (Pink Noise)',
      genreTag: 'Tập trung sâu / Ấm tai / Học tập',
      basePreset: 'PINK_NOISE',
      pianoMood: 'NOIR_MELANCHOLY',
      binaural: 'OFF',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.0, pad: 0.0, fireplace: 0.0, ocean: 0.0 },
      description: 'Tần số hồng -3dB/quãng tám cực êm dịu, che tạp âm xung quanh mà không gây mỏi tai suốt nhiều giờ.'
    },
    {
      id: 'SCENE_WHITE_NOISE_FOCUS',
      title: '🤍 Tiếng Ồn Trắng Tập Trung (White Noise)',
      genreTag: 'Làm việc / Cách âm / Tập trung cao',
      basePreset: 'WHITE_NOISE',
      pianoMood: 'NOIR_MELANCHOLY',
      binaural: 'OFF',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.0, pad: 0.0, fireplace: 0.0, ocean: 0.0 },
      description: 'Tiếng ồn trắng đã lọc mềm dải gắt tạo màng chắn âm thanh đều nhẹ cho phòng học và sáng tác.'
    },
    {
      id: 'SCENE_BLUE_NOISE_BREEZE',
      title: '💙 Tiếng Ồn Xanh Thanh Thoát (Blue Noise)',
      genreTag: 'Tỉnh táo nhẹ / Trong trẻo / Đọc sách',
      basePreset: 'BLUE_NOISE',
      pianoMood: 'IMPRESSIONIST_DREAM',
      binaural: 'OFF',
      mix: { rain: 0.0, thunder: 0.0, piano: 0.0, pad: 0.0, fireplace: 0.0, ocean: 0.0 },
      description: 'Tiếng ồn xanh dịu nhẹ như làn gió sớm lướt qua tán lá, giữ đầu óc tỉnh táo và thanh thản.'
    }
  ];

  // ==========================================================================
  // PHẦN 5B: CẦU NỐI PHÁT ÂM THANH TRONG NỀN & MEDIA SESSION API (MOBILE + PWA)
  // ==========================================================================

  class BackgroundMediaSessionBridge {
    constructor() {
      this.activeTags = new Set();
      this.keepAliveAudioEl = null;
      this.keepAliveUrl = null;
      this.activeSource = null;
      this.handlersBySource = new Map();
      this.visibilityCallbacks = new Set();
      this._boundVisibility = false;
      this._boundMediaSession = false;
      this._wakeLockSentinel = null;
      this._gestureUnlocked = false;
    }

    ensureAudioSessionPlayback() {
      try {
        if (typeof navigator !== 'undefined' && navigator.audioSession) {
          if (navigator.audioSession.type !== 'playback') {
            navigator.audioSession.type = 'playback';
          }
        }
      } catch (_err) {}
    }

    unlockOnGesture() {
      if (this._gestureUnlocked) return;
      this._gestureUnlocked = true;
      this.ensureAudioSessionPlayback();
      const el = this.ensureKeepAliveElement();
      if (el && el.paused && el.src && typeof navigator !== 'undefined' && !navigator.webdriver) {
        try {
          const p = el.play();
          if (p && typeof p.then === 'function') {
            p.then(() => {
              const ytNeedsKeepAlive =
                this.activeTags.has('youtube') &&
                (Boolean(document.hidden) || !window.NoirStudio?.nativePlayer?.isActive?.());
              if (!this.activeTags.has('soundscape') && !this.activeTags.has('alarm') && !ytNeedsKeepAlive && !el.paused) {
                el.pause();
              }
            }).catch(() => {});
          }
        } catch (_e) {}
      }
    }

    acquireWakeLock() {
      try {
        if (
          typeof document === 'undefined' ||
          document.hidden ||
          typeof navigator === 'undefined' ||
          !navigator.wakeLock ||
          typeof navigator.wakeLock.request !== 'function' ||
          navigator.webdriver ||
          this._wakeLockSentinel
        ) {
          return;
        }
        navigator.wakeLock.request('screen').then((sentinel) => {
          this._wakeLockSentinel = sentinel;
          sentinel?.addEventListener?.('release', () => {
            if (this._wakeLockSentinel === sentinel) this._wakeLockSentinel = null;
          });
        }).catch(() => {});
      } catch (_e) {}
    }

    releaseWakeLock() {
      try {
        if (this._wakeLockSentinel && typeof this._wakeLockSentinel.release === 'function') {
          this._wakeLockSentinel.release().catch(() => {});
        }
      } catch (_e) {}
      this._wakeLockSentinel = null;
    }

    /**
     * Tạo tệp WAV PCM 1 giây tần số 8kHz biên độ siêu nhỏ (+/-1 LSB ~ -90 dBFS)
     * để trình duyệt di động / PWA giữ Audio Focus khi tắt màn hình hoặc chuyển app.
     */
    buildSilentKeepAliveWavUrl() {
      if (this.keepAliveUrl) return this.keepAliveUrl;
      try {
        const sampleRate = 8000;
        const numSamples = sampleRate;
        const dataSize = numSamples * 2;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);

        const writeStr = (offset, str) => {
          for (let i = 0; i < str.length; i++) {
            view.setUint8(offset + i, str.charCodeAt(i));
          }
        };

        writeStr(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeStr(8, 'WAVE');
        writeStr(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, 1, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * 2, true);
        view.setUint16(32, 2, true);
        view.setUint16(34, 16, true);
        writeStr(36, 'data');
        view.setUint32(40, dataSize, true);

        for (let i = 0; i < numSamples; i++) {
          // +/- 1 LSB tránh bộ tối ưu hóa tắt hoàn toàn stream trên iOS/Android
          view.setInt16(44 + i * 2, i % 2 === 0 ? 1 : -1, true);
        }

        const bytes = new Uint8Array(buffer);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) {
          binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
        }
        this.keepAliveUrl = 'data:audio/wav;base64,' + btoa(binary);
      } catch (_err) {
        this.keepAliveUrl = '';
      }
      return this.keepAliveUrl;
    }

    ensureKeepAliveElement() {
      if (typeof document === 'undefined' || !document.body) return null;
      if (this.keepAliveAudioEl && document.body.contains(this.keepAliveAudioEl)) {
        return this.keepAliveAudioEl;
      }
      let el = document.getElementById('mod21-mobile-bg-keepalive');
      if (!el) {
        el = document.createElement('audio');
        el.id = 'mod21-mobile-bg-keepalive';
        el.setAttribute('aria-hidden', 'true');
        el.setAttribute('playsinline', '');
        el.setAttribute('webkit-playsinline', '');
        el.playsInline = true;
        el.loop = true;
        el.preload = 'auto';
        el.volume = 0.01;
        el.muted = false;
        el.style.cssText =
          'position:fixed;width:1px;height:1px;opacity:0;pointer-events:none;bottom:-10px;left:-10px;';
        document.body.appendChild(el);
      }
      const wavUrl = this.buildSilentKeepAliveWavUrl();
      if (wavUrl && el.src !== wavUrl) {
        el.src = wavUrl;
      }
      this.keepAliveAudioEl = el;
      return el;
    }

    bindGlobalVisibilityEvents() {
      if (this._boundVisibility || typeof document === 'undefined') return;
      this._boundVisibility = true;

      const triggerWake = (reason) => {
        this.visibilityCallbacks.forEach((cb) => {
          try {
            cb({ hidden: Boolean(document.hidden), reason });
          } catch (_err) {
            // Bỏ qua an toàn
          }
        });
        const ytNeedsKeepAlive =
          this.activeTags.has('youtube') &&
          (Boolean(document.hidden) || !window.NoirStudio?.nativePlayer?.isActive?.());
        if (this.activeTags.has('soundscape') || this.activeTags.has('alarm') || ytNeedsKeepAlive) {
          const keepEl = this.ensureKeepAliveElement();
          if (keepEl && keepEl.paused && keepEl.src) {
            keepEl.play().catch(() => {});
          }
        }
        this.updateDomStatusPill();
      };

      document.addEventListener('visibilitychange', () => triggerWake('visibilitychange'));
      if (typeof window !== 'undefined') {
        window.addEventListener('pageshow', () => triggerWake('pageshow'));
        window.addEventListener('focus', () => triggerWake('focus'));
      }
    }

    onVisibilityChange(cb) {
      if (typeof cb === 'function') {
        this.visibilityCallbacks.add(cb);
      }
      this.bindGlobalVisibilityEvents();
    }

    activateKeepAlive(tag = 'soundscape') {
      this.activeTags.add(String(tag || 'soundscape'));
      this.ensureAudioSessionPlayback();
      this.acquireWakeLock();
      this.bindGlobalVisibilityEvents();
      const el = this.ensureKeepAliveElement();
      const ytNeedsKeepAlive =
        this.activeTags.has('youtube') &&
        (Boolean(document.hidden) || !window.NoirStudio?.nativePlayer?.isActive?.());
      // Khi WebAudio (Soundscape / Chuông hệ thống) hoặc YouTube cần giữ phiên nền trên mobile, phát HTML5 <audio>
      if (
        el &&
        (this.activeTags.has('soundscape') || this.activeTags.has('alarm') || ytNeedsKeepAlive) &&
        el.src
      ) {
        el.play().catch(() => {});
      }
      this.updateDomStatusPill();
      return el;
    }

    deactivateKeepAlive(tag = 'soundscape') {
      this.activeTags.delete(String(tag || 'soundscape'));
      const ytStillNeedsKeepAlive =
        this.activeTags.has('youtube') &&
        (Boolean(document.hidden) || !window.NoirStudio?.nativePlayer?.isActive?.());
      if (
        !this.activeTags.has('soundscape') &&
        !this.activeTags.has('alarm') &&
        !ytStillNeedsKeepAlive &&
        this.keepAliveAudioEl &&
        !this.keepAliveAudioEl.paused
      ) {
        try {
          this.keepAliveAudioEl.pause();
        } catch (_err) {
          // Bỏ qua
        }
      }
      if (this.activeTags.size === 0) {
        this.releaseWakeLock();
      }
      this.updateDomStatusPill();
    }

    registerSourceHandlers(sourceType, handlers) {
      if (!sourceType || !handlers) return;
      this.handlersBySource.set(sourceType, handlers);
      this.bindMediaSessionHandlersOnce();
    }

    resolveHandlerTarget() {
      if (this.activeSource && this.handlersBySource.has(this.activeSource)) {
        return this.handlersBySource.get(this.activeSource);
      }
      const iterator = this.handlersBySource.values().next();
      return iterator && !iterator.done ? iterator.value : null;
    }

    bindMediaSessionHandlersOnce() {
      if (this._boundMediaSession) return;
      if (typeof navigator === 'undefined' || !('mediaSession' in navigator) || !navigator.mediaSession) {
        return;
      }
      this._boundMediaSession = true;

      const safeBind = (action, invoker) => {
        try {
          navigator.mediaSession.setActionHandler(action, (details) => {
            const target = this.resolveHandlerTarget();
            if (target && typeof target[invoker] === 'function') {
              target[invoker](details);
            }
          });
        } catch (_err) {
          // Một số trình duyệt không hỗ trợ đủ toàn bộ action
        }
      };

      safeBind('play', 'play');
      safeBind('pause', 'pause');
      safeBind('seekbackward', 'seekbackward');
      safeBind('seekforward', 'seekforward');
      safeBind('seekto', 'seekto');
      safeBind('stop', 'stop');
    }

    syncMediaSession(options = {}) {
      const {
        sourceType = 'mp3',
        title = 'Noir Studio Audio',
        artist = 'Bi Light Novel Studio',
        album = 'Phòng Sáng Tác & Phát Nền',
        artworkUrl = window.NoirStudio?.getPortraitArtworkUrl?.() || './assets/app-icon-192.png',
        state = 'paused',
        duration = 0,
        position = 0,
        playbackRate = 1.0,
        handlers = null
      } = options;

      if (handlers) {
        this.registerSourceHandlers(sourceType, handlers);
      }

      if (state === 'playing' || !this.activeSource) {
        this.activeSource = sourceType;
      } else if (this.activeSource === sourceType && state === 'none') {
        this.activeSource = null;
      }

      this.bindMediaSessionHandlersOnce();
      this.bindGlobalVisibilityEvents();

      if (typeof navigator !== 'undefined' && 'mediaSession' in navigator && navigator.mediaSession) {
        try {
          if (typeof MediaMetadata === 'function' && state !== 'none') {
            navigator.mediaSession.metadata = new MediaMetadata({
              title: String(title || 'Noir Studio Audio'),
              artist: String(artist || 'Bi Light Novel Studio'),
              album: String(album || 'Noir Studio'),
              artwork: artworkUrl
                ? [
                    { src: artworkUrl, sizes: '512x512', type: 'image/jpeg' },
                    { src: artworkUrl, sizes: '256x256', type: 'image/png' }
                  ]
                : []
            });
          }
          navigator.mediaSession.playbackState = state;
          if (
            typeof navigator.mediaSession.setPositionState === 'function' &&
            Number.isFinite(duration) &&
            duration > 0 &&
            Number.isFinite(position) &&
            position >= 0 &&
            position <= duration
          ) {
            navigator.mediaSession.setPositionState({
              duration,
              playbackRate: Math.max(0.25, Math.min(4, Number(playbackRate) || 1)),
              position
            });
          }
        } catch (_err) {
          // Trình duyệt hoặc môi trường headless không hỗ trợ đủ API MediaSession
        }
      }

      this.updateDomStatusPill();
    }

    updateDomStatusPill() {
      if (typeof document === 'undefined') return;
      const tr21 = (s) => {
        const str = String(s || '');
        const fn =
          (typeof window !== 'undefined' && (window.NoirStudio?.i18n?.translateText || window.NoirNovel?.i18n?.translateText)) ||
          null;
        return typeof fn === 'function' ? fn(str) : str;
      };
      const pill = document.getElementById('mod21-mobile-bg-state-pill');
      const statusText = document.getElementById('mod21-mobile-bg-status-text');
      const hasTags = this.activeTags.size > 0;
      const hidden = Boolean(document.hidden);

      if (pill) {
        if (hasTags && hidden) {
          pill.textContent = tr21('🌙 Đang phát trong nền');
          pill.className =
            'px-2 py-0.5 rounded-full bg-emerald-500/25 border border-emerald-400/60 text-emerald-200 font-extrabold shrink-0';
        } else if (hasTags) {
          pill.textContent = tr21('📱 Nền Đang Kích Hoạt');
          pill.className =
            'px-2 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-bold shrink-0';
        } else {
          pill.textContent = tr21('📱 Nền Sẵn Sàng');
          pill.className =
            'px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/40 text-emerald-300 font-bold shrink-0';
        }
      }

      if (statusText) {
        const activeLabels = Array.from(this.activeTags).map((tag) => {
          if (tag === 'mp3') return 'MP3';
          if (tag === 'soundscape') return tr21('Âm thanh môi trường');
          if (tag === 'youtube') return 'YouTube';
          if (tag === 'alarm') return tr21('Chuông báo thức');
          return tr21(tag);
        });
        statusText.textContent = activeLabels.length
          ? `${tr21('Phát nền & Màn hình khóa đang kích hoạt:')} ${activeLabels.join(' + ')} (MediaSession Ready).`
          : tr21('Phát nền trên Điện thoại & Ứng dụng (MediaSession + Màn hình khóa) đã sẵn sàng.');
      }
    }
  }

  // ==========================================================================
  // PHẦN 6: LỚP ĐIỀU KHIỂN CHÍNH (AudioPlayerAndWebAudioSoundscapeEngine)
  // ==========================================================================

  class AudioPlayerAndWebAudioSoundscapeEngine {
    constructor() {
      this._initialized = false;
      this.bgAudioBridge = new BackgroundMediaSessionBridge();

      // Trạng thái trình phát MP3 & Lặp đoạn A-B
      this.currentObjectUrl = null;
      this._externalStream = null;
      this._externalSessionSeq = 0;
      this._activeConflictModal = null;
      this._explicitUserPaused = false;
      this._lastVisHiddenAtMs = 0;
      this._unlockingGestureInProgress = false;
      this.currentTrackMeta = {
        name: 'Chưa nạp tệp âm thanh',
        artist: '',
        artworkUrl: '',
        videoId: '',
        isExternalStream: false,
        externalUrl: '',
        sizeBytes: 0,
        durationSec: 0,
        loadedAt: null
      };
      this.trackHistory = [];
      this.trackBookmarks = [];
      this.playbackRate = 1.0;
      this.loopMode = 'LOOP_ALL'; // 'LOOP_ALL' | 'LOOP_AB'
      this.abLoopEnabled = false;
      this.pointASec = 0;
      this.pointBSec = 60;

      // Bộ tổng hợp âm thanh không gian & Bàn phím ASMR
      this.soundscapeGraph = new ProceduralMultiLayerSoundscapeGraph();
      this.keyboardAsmr = new MechanicalKeyboardAsmrSynth(() => this.soundscapeGraph.ensureContext());

      // Kênh phát clip nhúng ẩn (không hiện UI playlist/MP3, dùng chung hạ tầng AudioContext / KeepAlive của Mục 3)
      this._hiddenBuiltInClips = new Map();
      this._activeHiddenClipSource = null;
      this._activeHiddenClipGain = null;
      this._activeHiddenClipTimer = null;
      this._hiddenClipPlaySeq = 0;
      this._hiddenClipAudioEl = null;

      // Vòng lặp vẽ biểu đồ phổ tần số (Spectrum Visualizer) & Kiểm tra A-B Loop
      this.visualizerRafId = null;
      this.abMonitorRafId = null;
      this.abBackgroundTimer = null;

      // Trạng thái rút gọn mặc định khi đăng nhập lần đầu
      this.isFloatingAudioCollapsed = true;
      this.tab5OpenPanels = new Set();
      this._savedPreMuteVolume = 45;
      this._isMutedAll = false;
    }

    /**
     * Tiện ích hiển thị thông báo thân thiện (tương thích với window.NoirStudio.utils)
     */
    notify(message, type = 'info') {
      if (window.NoirStudio && window.NoirStudio.utils && typeof window.NoirStudio.utils.showToast === 'function') {
        window.NoirStudio.utils.showToast(message, type);
      } else {
        console.log(`[NoirStudio AudioStudio - ${type}] ${message}`);
      }
    }

    /**
     * Định dạng số giây sang chuỗi mm:ss hoặc hh:mm:ss chuẩn xác
     */
    formatTimeCode(secondsInput) {
      const totalSec = Math.max(0, Math.floor(Number(secondsInput) || 0));
      const hrs = Math.floor(totalSec / 3600);
      const mins = Math.floor((totalSec % 3600) / 60);
      const secs = totalSec % 60;
      const pad = (n) => String(n).padStart(2, '0');
      if (hrs > 0) {
        return `${pad(hrs)}:${pad(mins)}:${pad(secs)}`;
      }
      return `${pad(mins)}:${pad(secs)}`;
    }

    /**
     * Phân tích chuỗi thời gian "mm:ss", "hh:mm:ss" hoặc số giây thuần túy sang số giây
     */
    parseTimeCode(rawStr, fallbackSec = 0) {
      if (typeof rawStr === 'number' && !Number.isNaN(rawStr)) {
        return Math.max(0, Math.floor(rawStr));
      }
      if (!rawStr || typeof rawStr !== 'string') return fallbackSec;
      const cleaned = rawStr.trim();
      if (!cleaned) return fallbackSec;

      if (/^\d+(\.\d+)?$/.test(cleaned)) {
        return Math.max(0, Math.floor( parseFloat(cleaned) ));
      }

      const parts = cleaned.split(':').map((p) => parseInt(p.trim(), 10));
      if (parts.some((n) => Number.isNaN(n) || n < 0)) {
        return fallbackSec;
      }
      if (parts.length === 2) {
        return parts[0] * 60 + parts[1];
      }
      if (parts.length === 3) {
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
      }
      return fallbackSec;
    }

    /**
     * Khởi tạo toàn bộ sự kiện DOM, khôi phục cấu hình đã lưu và gắn giao diện nâng cao
     */
    init() {
      if (this._initialized) return;
      this._initialized = true;

      this.restoreSavedSettings();
      this.bindCoreDomControls();
      this.injectAdvancedStudioEnhancementsUI();
      this.keyboardAsmr.attachToEditorInputs();
      this.startHighPrecisionABLoopMonitor();
      this.startSpectrumVisualizerLoop();
      this.setupBackgroundAudioIntegration();
      this.syncAllAudioUI();
      this.restoreSavedLocalMp3IfAny?.();
    }

    setupBackgroundAudioIntegration() {
      this.bgAudioBridge.registerSourceHandlers('mp3', {
        play: () => {
          this._explicitUserPaused = false;
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl && audioEl.src) {
            this.bgAudioBridge.activateKeepAlive('mp3');
            if (this.currentTrackMeta?.isExternalStream) this.bgAudioBridge.activateKeepAlive('youtube');
            audioEl.play().catch(() => {});
          }
        },
        pause: () => {
          this._explicitUserPaused = true;
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl && !audioEl.paused) audioEl.pause();
        },
        seekbackward: (details) => {
          this.seekRelative(-(Number(details?.seekOffset) || 5));
        },
        seekforward: (details) => {
          this.seekRelative(Number(details?.seekOffset) || 5);
        },
        seekto: (details) => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl && audioEl.src && typeof details?.seekTime === 'number') {
            audioEl.currentTime = Math.max(0, details.seekTime);
          }
        },
        stop: () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl) {
            audioEl.pause();
            audioEl.currentTime = 0;
          }
          this.bgAudioBridge.deactivateKeepAlive('mp3');
          this.syncMp3MediaSession();
        }
      });

      this.bgAudioBridge.registerSourceHandlers('soundscape', {
        play: () => {
          const lastKey = this._lastActiveSoundscapeKey || 'NOIR_MIX';
          this.setSynthPreset(lastKey === 'OFF' ? 'NOIR_MIX' : lastKey);
        },
        pause: () => {
          this._lastActiveSoundscapeKey = this.soundscapeGraph.activePresetKey || 'NOIR_MIX';
          this.setSynthPreset('OFF');
        },
        stop: () => {
          this.setSynthPreset('OFF');
        }
      });

      this.bgAudioBridge.onVisibilityChange(({ hidden }) => {
        if (hidden) {
          this._lastVisHiddenAtMs = Date.now();
        } else {
          this._lastVisHiddenAtMs = 0;
        }
        if (this.soundscapeGraph.isRunning) {
          this.soundscapeGraph.ensureContext()?.resume?.().catch(() => {});
          this.soundscapeGraph.ensureBackgroundStreamBridge();
        }
        if (!hidden && this.bgAudioBridge.activeTags.size > 0) {
          this.bgAudioBridge.acquireWakeLock();
        }
        const audioEl = document.getElementById('s8-native-audio-bar');
        if (hidden && audioEl && audioEl.src) {
          if (
            this.currentTrackMeta?.isExternalStream &&
            !this._explicitUserPaused &&
            !audioEl.ended &&
            !this._externalStream?._endedHandled
          ) {
            this.bgAudioBridge.ensureAudioSessionPlayback();
            this.bgAudioBridge.activateKeepAlive('mp3');
            this.bgAudioBridge.activateKeepAlive('youtube');
            if (audioEl.paused) {
              audioEl.play().catch(() => {});
            }
            this.syncMp3MediaSession();
          } else if (!audioEl.paused) {
            this.bgAudioBridge.ensureAudioSessionPlayback();
            this.bgAudioBridge.activateKeepAlive('mp3');
            this.syncMp3MediaSession();
          }
        }
        if (this.abLoopEnabled || this.loopMode === 'LOOP_AB') {
          if (audioEl && audioEl.src && !audioEl.paused) {
            this.enforceABLoopConstraint(audioEl);
          }
        }
      });
    }

    syncMp3MediaSession() {
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl || !audioEl.src) {
        this.bgAudioBridge.deactivateKeepAlive('mp3');
        return;
      }
      const isPlaying = !audioEl.paused && !audioEl.ended;
      if (isPlaying) {
        this.bgAudioBridge.activateKeepAlive('mp3');
      } else {
        this.bgAudioBridge.deactivateKeepAlive('mp3');
      }
      this.bgAudioBridge.syncMediaSession({
        sourceType: 'mp3',
        title: this.currentTrackMeta?.name || 'Nhạc MP3 Studio',
        artist:
          this.currentTrackMeta?.artist ||
          'Phát nền Audio Studio • Web Viết Tiểu Thuyết Của Bi',
        album: this.abLoopEnabled
          ? `Lặp A–B (${this.formatTimeCode(this.pointASec)} → ${this.formatTimeCode(this.pointBSec)})`
          : this.currentTrackMeta?.isExternalStream
            ? 'YouTube Audio Nền • Mục 3 MP3'
            : 'Phát MP3 Tùy Chọn',
        artworkUrl: this.currentTrackMeta?.artworkUrl || undefined,
        state: isPlaying ? 'playing' : 'paused',
        duration: Number.isFinite(audioEl.duration) ? audioEl.duration : this.currentTrackMeta?.durationSec || 0,
        position: Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0,
        playbackRate: this.playbackRate || 1.0
      });
    }

    syncSoundscapeMediaSession() {
      const activeKey = this.soundscapeGraph.activePresetKey || 'OFF';
      const preset = SOUNDSCAPE_PRESETS_CATALOG[activeKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;
      if (activeKey === 'OFF') {
        this.bgAudioBridge.deactivateKeepAlive('soundscape');
        const audioEl = document.getElementById('s8-native-audio-bar');
        if (audioEl && audioEl.src && !audioEl.paused) {
          this.syncMp3MediaSession();
        } else {
          this.bgAudioBridge.syncMediaSession({
            sourceType: 'soundscape',
            title: 'Noir Studio Audio',
            state: 'none'
          });
        }
        return;
      }
      this._lastActiveSoundscapeKey = activeKey;
      this.bgAudioBridge.activateKeepAlive('soundscape');
      this.bgAudioBridge.syncMediaSession({
        sourceType: 'soundscape',
        title: preset.statusText || 'Âm thanh không gian WebAudio',
        artist: `${preset.description || 'Soundscape tổng hợp thời gian thực'} (${this.soundscapeGraph.masterVolumePercent}%)`,
        album: 'Ambient Soundscape • Phát trong nền',
        state: 'playing',
        duration: 0,
        position: 0,
        playbackRate: 1.0
      });
    }

    /**
     * Khôi phục các thiết lập âm thanh từ LocalStorage
     */
    restoreSavedSettings() {
      try {
        const savedVol = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.SYNTH_VOLUME);
        if (savedVol !== null) {
          this.soundscapeGraph.masterVolumePercent = Math.max(0, Math.min(100, Number(savedVol) || 45));
        }

        const savedSpeed = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.PLAYBACK_SPEED);
        if (savedSpeed !== null) {
          this.playbackRate = Math.max(0.25, Math.min(4.0, Number(savedSpeed) || 1.0));
        }

        const savedLoopMode = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.LOOP_MODE);
        if (savedLoopMode === 'LOOP_AB' || savedLoopMode === 'LOOP_ALL') {
          this.loopMode = savedLoopMode;
        }

        const savedA = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.POINT_A_SEC);
        const savedB = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.POINT_B_SEC);
        const savedAbEnabled = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.AB_ENABLED);
        if (savedA !== null) this.pointASec = Math.max(0, parseInt(savedA, 10) || 0);
        if (savedB !== null) this.pointBSec = Math.max(this.pointASec + 1, parseInt(savedB, 10) || 60);
        if (savedAbEnabled === 'true') {
          this.abLoopEnabled = true;
          this.loopMode = 'LOOP_AB';
        } else if (savedAbEnabled === 'false') {
          this.abLoopEnabled = false;
        }

        const savedAsmr = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.ASMR_KEY_PROFILE);
        if (savedAsmr && ASMR_KEYBOARD_PROFILES[savedAsmr]) {
          this.keyboardAsmr.activeProfileKey = savedAsmr;
        }

        const savedMood = localStorage.getItem(AUDIO_STUDIO_STORAGE_KEYS.PIANO_SCALE_MOOD);
        if (savedMood && GENERATIVE_PIANO_MOODS[savedMood]) {
          this.soundscapeGraph.currentPianoMoodKey = savedMood;
        }

        const savedFloatAudioCollapsed = localStorage.getItem('noir_v39_floating_audio_collapsed');
        if (savedFloatAudioCollapsed === 'false') {
          this.isFloatingAudioCollapsed = false;
        } else {
          this.isFloatingAudioCollapsed = true;
        }

        const savedOpenPanels = localStorage.getItem('noir_v39_tab5_open_panels');
        if (savedOpenPanels) {
          const parsedPanels = JSON.parse(savedOpenPanels);
          if (Array.isArray(parsedPanels)) {
            this.tab5OpenPanels = new Set(parsedPanels.map((id) => String(id)));
          }
        }
      } catch (_err) {
        // Bỏ qua nếu trình duyệt chặn LocalStorage
      }
    }

    persistTab5AccordionState() {
      try {
        localStorage.setItem(
          'noir_v39_tab5_open_panels',
          JSON.stringify(Array.from(this.tab5OpenPanels || []))
        );
      } catch (_err) {
        // Bỏ qua
      }
    }

    /**
     * Đồng bộ nhãn nút trạng thái Mở rộng / Thu gọn cho cả 5 ô lớn Tab 5.
     * @param {HTMLElement|null} btn
     * @param {boolean} isOpen
     */
    syncTab5CardToggleState(btn, isOpen) {
      if (!btn) return;
      btn.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
      const badge = btn.querySelector('.bug13-state-badge');
      if (badge) {
        const rawBadge = isOpen
          ? 'Đang mở rộng, bấm vào để thu gọn'
          : 'Đang thu gọn, bấm vào để mở rộng';
        badge.textContent =
          window.NoirStudio?.i18n?.translateText
            ? window.NoirStudio.i18n.translateText(rawBadge)
            : rawBadge;
        badge.classList.toggle('bg-emerald-600', isOpen);
        badge.classList.toggle('border-emerald-400', isOpen);
        badge.classList.toggle('text-white', isOpen);
        badge.classList.toggle('bg-zinc-800', !isOpen);
        badge.classList.toggle('border-zinc-600', !isOpen);
        badge.classList.toggle('text-zinc-100', !isOpen);
      }
      const arrow = btn.querySelector('.bug13-arrow');
      if (arrow) {
        arrow.textContent = isOpen ? '▴' : '▾';
      }
    }

    applyTab5AccordionState() {
      window.NoirStudio = window.NoirStudio || {};
      window.NoirStudio.syncTab5CardToggleState = (btn, isOpen) =>
        this.syncTab5CardToggleState(btn, isOpen);
      const tab5ToggleBtns = document.querySelectorAll('.bug13-toggle-option-btn');
      tab5ToggleBtns.forEach((btn) => {
        const targetId = btn.getAttribute('data-bug13-target');
        const panel = targetId ? document.getElementById(targetId) : null;
        if (!panel) return;
        const shouldOpen = this.tab5OpenPanels.has(targetId);
        panel.classList.toggle('hidden', !shouldOpen);
        this.syncTab5CardToggleState(btn, shouldOpen);
      });
    }

    syncFloatingAudioBarUI() {
      const pill = document.getElementById('s15-floating-audio-pill');
      const controls = document.getElementById('floating-audio-controls');
      const collapseBtn = document.getElementById('btn-floating-audio-collapse');
      const arrow = document.getElementById('floating-audio-arrow');
      const labelEl = document.getElementById('floating-audio-status-label');
      const playPauseBtn = document.getElementById('btn-floating-audio-playpause');
      const rainBtn = document.getElementById('btn-floating-audio-rain');
      const presetSel = document.getElementById('select-floating-audio-preset');
      const muteBtn = document.getElementById('btn-floating-audio-mute');

      if (!pill) return;

      const isCollapsed = this.isFloatingAudioCollapsed !== false;
      if (controls) controls.classList.toggle('hidden', isCollapsed);
      if (collapseBtn) collapseBtn.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true');
      if (arrow) arrow.textContent = isCollapsed ? '▴' : '▾';

      const audioEl = document.getElementById('s8-native-audio-bar');
      const mp3Playing = Boolean(audioEl && audioEl.src && !audioEl.paused);
      const activeKey = this.soundscapeGraph.activePresetKey || 'OFF';
      const preset = SOUNDSCAPE_PRESETS_CATALOG[activeKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;

      if (labelEl) {
        if (mp3Playing) {
          const shortTitle = String(this.currentTrackMeta?.name || 'Đang phát MP3').slice(0, 14);
          labelEl.textContent = `▶ ${shortTitle} • Nền`;
        } else if (activeKey !== 'OFF') {
          labelEl.textContent = `${preset.statusText.slice(0, 13)} (${this.soundscapeGraph.masterVolumePercent}%) • Nền`;
        } else {
          labelEl.textContent = 'Đang tắt';
        }
      }

      if (playPauseBtn) {
        playPauseBtn.textContent = mp3Playing || activeKey !== 'OFF' ? '⏸ Tạm dừng' : '▶ Phát nhạc';
      }
      if (presetSel && presetSel.value !== activeKey) {
        presetSel.value = SOUNDSCAPE_PRESETS_CATALOG[activeKey] ? activeKey : 'OFF';
      }
      if (rainBtn) {
        rainBtn.classList.toggle('border-emerald-400', activeKey === 'RAIN');
        rainBtn.classList.toggle('text-emerald-300', activeKey === 'RAIN');
      }
      if (muteBtn) {
        const isMuted = Boolean(this._isMutedAll || (audioEl && audioEl.muted));
        muteBtn.textContent = isMuted ? '🔇 Bật tiếng' : '🔊 Tắt tiếng';
      }
    }

    bindFloatingAudioMiniBar() {
      const collapseBtn = document.getElementById('btn-floating-audio-collapse');
      const playPauseBtn = document.getElementById('btn-floating-audio-playpause');
      const rainBtn = document.getElementById('btn-floating-audio-rain');
      const presetSel = document.getElementById('select-floating-audio-preset');
      const muteBtn = document.getElementById('btn-floating-audio-mute');
      const openTab5Btn = document.getElementById('btn-floating-audio-open-tab5');

      if (collapseBtn && collapseBtn.dataset.mod21AudioBound !== '1') {
        collapseBtn.dataset.mod21AudioBound = '1';
        collapseBtn.addEventListener('click', () => {
          this.isFloatingAudioCollapsed = !this.isFloatingAudioCollapsed;
          try {
            localStorage.setItem(
              'noir_v39_floating_audio_collapsed',
              this.isFloatingAudioCollapsed ? 'true' : 'false'
            );
          } catch (_e) {
            // Bỏ qua
          }
          this.syncFloatingAudioBarUI();
          setTimeout(() => window.NoirStudio?.floatingBars?.clampBarIntoViewport?.('audio'), 15);
        });
      }

      if (presetSel && presetSel.dataset.mod21PresetBound !== '1') {
        presetSel.dataset.mod21PresetBound = '1';
        presetSel.addEventListener('change', (ev) => {
          const nextKey = String(ev.target?.value || 'OFF');
          this.setSynthPreset(nextKey);
          this.syncFloatingAudioBarUI();
        });
      }

      if (playPauseBtn && playPauseBtn.dataset.mod21AudioBound !== '1') {
        playPauseBtn.addEventListener('click', () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl && audioEl.src) {
            if (audioEl.paused) {
              if (
                !this.currentTrackMeta?.isExternalStream &&
                window.NoirStudio?.youtubeStudio?.isActivelyPlaying?.()
              ) {
                this.confirmStopYoutubeForLocalMp3(this.currentTrackMeta?.name || '', () => {
                  window.NoirStudio?.youtubeStudio?.playerCtrl?.stopAndClearVideo?.(false);
                  this._stoppedLocalMp3ByUser = false;
                  this._explicitUserPaused = false;
                  audioEl.play().catch(() => {});
                });
                return;
              }
              audioEl.play().catch(() => {});
            } else {
              audioEl.pause();
            }
          } else if (this.soundscapeGraph.activePresetKey === 'OFF') {
            this.setSynthPreset('NOIR_MIX');
          } else {
            this.setSynthPreset('OFF');
          }
          this.syncFloatingAudioBarUI();
        });
      }

      if (rainBtn && rainBtn.dataset.mod21AudioBound !== '1') {
        rainBtn.dataset.mod21AudioBound = '1';
        rainBtn.addEventListener('click', () => {
          const next = this.soundscapeGraph.activePresetKey === 'RAIN' ? 'OFF' : 'RAIN';
          this.setSynthPreset(next);
          this.syncFloatingAudioBarUI();
        });
      }

      if (muteBtn && muteBtn.dataset.mod21AudioBound !== '1') {
        muteBtn.dataset.mod21AudioBound = '1';
        muteBtn.addEventListener('click', () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          this._isMutedAll = !this._isMutedAll;
          if (audioEl) {
            audioEl.muted = this._isMutedAll;
          }
          if (this._isMutedAll) {
            if (this.soundscapeGraph.masterVolumePercent > 0) {
              this._savedPreMuteVolume = this.soundscapeGraph.masterVolumePercent;
            }
            this.setSynthVolume(0);
          } else {
            this.setSynthVolume(this._savedPreMuteVolume || 45);
          }
          this.syncFloatingAudioBarUI();
        });
      }

      const jumpTab5Btn = document.getElementById('btn-floating-audio-jump-tab5');
      const jumpToMusicBox = () => {
        if (window.NoirStudio?.navigator?.openTab5Section) {
          window.NoirStudio.navigator.openTab5Section('s14-panel-music-box', '#s14-panel-music-box');
          return;
        }
        window.NoirStudio?.navigator?.navigateToScreen?.('SCREEN_5_AMBIENCE');
        this.tab5OpenPanels.add('s14-panel-music-box');
        this.persistTab5AccordionState();
        this.applyTab5AccordionState();
      };

      if (openTab5Btn && openTab5Btn.dataset.mod21AudioBound !== '1') {
        openTab5Btn.dataset.mod21AudioBound = '1';
        openTab5Btn.addEventListener('click', jumpToMusicBox);
      }

      if (jumpTab5Btn && jumpTab5Btn.dataset.mod21AudioBound !== '1') {
        jumpTab5Btn.dataset.mod21AudioBound = '1';
        jumpTab5Btn.addEventListener('click', (ev) => {
          ev.stopPropagation();
          jumpToMusicBox();
        });
      }
    }

    /**
     * Gắn kết sự kiện cho toàn bộ các phần tử DOM chuẩn trong Tab 5
     */
    bindCoreDomControls() {
      const mp3Input = document.getElementById('s8-custom-mp3-input');
      const loadMp3Btn = document.getElementById('btn-s8-load-mp3');
      const audioEl = document.getElementById('s8-native-audio-bar');
      const seekBackBtn = document.getElementById('btn-audio-seek-back');
      const seekFwdBtn = document.getElementById('btn-audio-seek-fwd');
      const speedSelect = document.getElementById('s9-audio-speed-select');
      const sliderA = document.getElementById('s11-slider-point-a');
      const inputA = document.getElementById('s11-input-point-a');
      const sliderB = document.getElementById('s11-slider-point-b');
      const inputB = document.getElementById('s11-input-point-b');
      const loopModeSelect = document.getElementById('s9-audio-loop-mode');
      const abToggleBtn = document.getElementById('btn-s11-ab-toggle');
      const synthVolSlider = document.getElementById('synth-volume-slider');

      // 1. Nạp file MP3 từ máy
      if (loadMp3Btn && mp3Input) {
        loadMp3Btn.addEventListener('click', () => {
          mp3Input.click();
        });
        mp3Input.addEventListener('change', (ev) => {
          const file = ev.target.files && ev.target.files[0];
          if (file) {
            this.loadCustomMp3File(file);
          }
          mp3Input.value = '';
        });
      }
      const stopMp3Btn = document.getElementById('btn-s8-stop-mp3');
      if (stopMp3Btn && stopMp3Btn.dataset.mod21StopBound !== '1') {
        stopMp3Btn.dataset.mod21StopBound = '1';
        stopMp3Btn.addEventListener('click', () => {
          this.stopAndClearMp3(true);
        });
      }

      // 2. Sự kiện trên thanh <audio id="s8-native-audio-bar">
      if (audioEl) {
        audioEl.removeAttribute('crossorigin');
        audioEl.setAttribute('playsinline', '');
        audioEl.setAttribute('webkit-playsinline', '');
        audioEl.playsInline = true;
        audioEl.loop = this.loopMode === 'LOOP_ALL' && !this.abLoopEnabled;
        audioEl.playbackRate = this.playbackRate;

        audioEl.addEventListener('loadedmetadata', () => {
          const dur = Math.max(1, Math.floor(audioEl.duration || this._externalStream?.durationSec || 300));
          this.currentTrackMeta.durationSec = dur;
          if (sliderA) sliderA.max = String(dur);
          if (sliderB) sliderB.max = String(dur);

          if (this._externalStream && Number(this._externalStream.pendingSeekSec) > 0.2) {
            const rawSeek = Math.max(0, Number(this._externalStream.pendingSeekSec) || 0);
            const rawAudioDur = Number(audioEl.duration);
            const safeMax = Number.isFinite(rawAudioDur) && rawAudioDur > 0.3 ? Math.max(0, rawAudioDur - 0.25) : dur;
            const seekSec = Math.min(safeMax, rawSeek);
            this._externalStream.pendingSeekSec = 0;
            try {
              if (seekSec > 0) audioEl.currentTime = seekSec;
            } catch (_eSeek) {}
          }

          if (this.pointBSec > dur || this.pointBSec <= this.pointASec) {
            this.pointASec = 0;
            this.pointBSec = dur;
          }
          this.syncABInputsFromState();
          this.renderPlaylistAndBookmarksUI();
          this.syncMp3MediaSession();
        });

        audioEl.addEventListener('timeupdate', () => {
          if (this.currentTrackMeta?.isExternalStream) {
            if (!this.verifyCoherenceWithTab5Player(audioEl)) {
              return;
            }
          }
          this.enforceABLoopConstraint(audioEl);
          if (this.currentTrackMeta?.isExternalStream && this._externalStream?.onTimeUpdate) {
            try {
              this._externalStream.onTimeUpdate({
                currentTime: Number(audioEl.currentTime) || 0,
                duration: Number.isFinite(audioEl.duration) ? audioEl.duration : Number(this._externalStream.durationSec) || 0,
                paused: Boolean(audioEl.paused),
                ended: Boolean(audioEl.ended || this._externalStream?._endedHandled)
              });
            } catch (_eCb) {}
          }
        });

        audioEl.addEventListener('play', () => {
          if (this._unlockingGestureInProgress) return;
          if (this.currentTrackMeta?.isExternalStream) {
            const ext = this._externalStream;
            const ytCtrl = window.NoirStudio?.youtubeStudio?.playerCtrl;
            const isLoadingExt = Boolean(ext?._loadingInProgress);
            if (!ext) {
              try { audioEl.pause(); } catch (_eStale) {}
              this.pauseExternalAudioStream(true);
              return;
            }
            if (ytCtrl) {
              const tab5Vid = String(ytCtrl.activeVideo?.videoId || '').trim();
              const extVid = String(ext.videoId || '').trim();
              const activatingVid = String(ytCtrl._activatingMod21VideoId || '').trim();
              const isHandshaking = isLoadingExt || (extVid && activatingVid === extVid);
              const isBridgedFromTab5 = Boolean(ext.onTimeUpdate || ext.onStateChange);
              const isSameVideoStandalone = !isBridgedFromTab5 && (!extVid || !tab5Vid || extVid === tab5Vid);
              const audibleIframeMountedAfterLoad =
                Number(ytCtrl._audibleIframeMountSeq || 0) > Number(ext.audibleIframeMountSeqAtLoad || 0);
              if (extVid && tab5Vid && tab5Vid !== extVid && !isHandshaking) {
                try { audioEl.pause(); } catch (_eMismatch) {}
                this.pauseExternalAudioStream(true);
                ytCtrl.reconcileTab5AndTab3Sync?.('mod21-play-mismatch');
                return;
              }
              if (
                !isHandshaking &&
                (
                  (isBridgedFromTab5 && (!tab5Vid || ytCtrl.activeEngine === 'IFRAME' || ytCtrl.activeEngine === 'HTML5')) ||
                  audibleIframeMountedAfterLoad
                )
              ) {
                try { audioEl.pause(); } catch (_eDesync) {}
                this.pauseExternalAudioStream(true);
                return;
              }
              if (!isHandshaking && !tab5Vid && !isSameVideoStandalone) {
                try { audioEl.pause(); } catch (_eNoVid) {}
                this.pauseExternalAudioStream(true);
                return;
              }
            }
          }
          if (
            !this.currentTrackMeta?.isExternalStream &&
            !this._allowingLocalMp3Override &&
            window.NoirStudio?.youtubeStudio?.isActivelyPlaying?.()
          ) {
            try { audioEl.pause(); } catch (_ePauseConflict) {}
            this.confirmStopYoutubeForLocalMp3(this.currentTrackMeta?.name || '', () => {
              window.NoirStudio?.youtubeStudio?.playerCtrl?.stopAndClearVideo?.(false);
              this._allowingLocalMp3Override = true;
              this._stoppedLocalMp3ByUser = false;
              this._explicitUserPaused = false;
              audioEl.play().finally(() => { this._allowingLocalMp3Override = false; });
            });
            return;
          }
          if (this._externalStream) {
            this._externalStream._endedHandled = false;
          }
          this.syncFloatingAudioBarUI();
          this.syncMp3MediaSession();
          this.persistAudioPlaybackStateNow(false);
          if (this.currentTrackMeta?.isExternalStream && this._externalStream?.onStateChange) {
            try {
              this._externalStream.onStateChange({
                state: 1,
                currentTime: Number(audioEl.currentTime) || 0,
                sessionSeq: this._externalStream.extSessionToken
              });
            } catch (_eCb) {}
          }
        });
        audioEl.addEventListener('pause', () => {
          if (this._unlockingGestureInProgress) return;
          const recentlyHidden = Date.now() - (this._lastVisHiddenAtMs || 0) < 1200;
          if (
            this.currentTrackMeta?.isExternalStream &&
            !this._explicitUserPaused &&
            !audioEl.ended &&
            !this._externalStream?._endedHandled &&
            !this._externalStream?._loadingInProgress &&
            typeof document !== 'undefined' &&
            (document.hidden || recentlyHidden)
          ) {
            this.bgAudioBridge.ensureAudioSessionPlayback();
            this.bgAudioBridge.activateKeepAlive('mp3');
            this.bgAudioBridge.activateKeepAlive('youtube');
            audioEl.play().catch(() => {});
            this.syncMp3MediaSession();
            return;
          }
          this.syncFloatingAudioBarUI();
          this.syncMp3MediaSession();
          this.persistAudioPlaybackStateNow(false);
          if (
            this.currentTrackMeta?.isExternalStream &&
            this._externalStream?.onStateChange &&
            !audioEl.ended &&
            !this._externalStream?._endedHandled
          ) {
            try {
              this._externalStream.onStateChange({ state: 2, currentTime: Number(audioEl.currentTime) || 0 });
            } catch (_eCb) {}
          }
        });
        audioEl.addEventListener('seeked', () => {
          this.syncMp3MediaSession();
          this.persistAudioPlaybackStateNow(false);
          if (this.currentTrackMeta?.isExternalStream && this._externalStream?.onSeeked) {
            try {
              this._externalStream.onSeeked({
                currentTime: Number(audioEl.currentTime) || 0,
                paused: Boolean(audioEl.paused)
              });
            } catch (_eCb) {}
          }
        });
        audioEl.addEventListener('ratechange', () => {
          this.syncMp3MediaSession();
          if (this.currentTrackMeta?.isExternalStream && this._externalStream?.onRateChange) {
            try {
              this._externalStream.onRateChange({
                playbackRate: Number(audioEl.playbackRate) || 1
              });
            } catch (_eCb) {}
          }
        });
        audioEl.addEventListener('volumechange', () => this.syncFloatingAudioBarUI());

        audioEl.addEventListener('error', () => {
          if (this._unlockingGestureInProgress || !this.currentTrackMeta?.isExternalStream || !this._externalStream || this._externalStream._loadingInProgress) return;
          const ext = this._externalStream;
          const nextIdx = (ext.candidateIndex || 0) + 1;
          if (Array.isArray(ext.candidates) && ext.candidates[nextIdx]) {
            ext.candidateIndex = nextIdx;
            const nextUrl = ext.candidates[nextIdx];
            if (Number.isFinite(audioEl.currentTime) && audioEl.currentTime > 0.2) {
              ext.pendingSeekSec = audioEl.currentTime;
            }
            this.currentTrackMeta.externalUrl = nextUrl;
            audioEl.removeAttribute('crossorigin');
            audioEl.src = nextUrl;
            try { audioEl.load(); } catch (_eL) {}
            audioEl.play().catch(() => {});
            return;
          }
          const failTime = Number(audioEl.currentTime) || Number(ext.pendingSeekSec) || 0;
          const failVid = ext.videoId || '';
          const cbErr = ext.onError;
          this._externalStream = null;
          this.currentTrackMeta.isExternalStream = false;
          this.currentTrackMeta.externalUrl = '';
          this.bgAudioBridge.deactivateKeepAlive('mp3');
          if (typeof cbErr === 'function') {
            try {
              cbErr({ currentTime: failTime, videoId: failVid });
            } catch (_eErrCb) {}
          }
        });

        audioEl.addEventListener('ended', () => {
          if (this.currentTrackMeta?.isExternalStream) {
            // Luồng YouTube luôn tuân thủ nghiêm ngặt cài đặt Repeat / A-B Loop từ Tab 5, KHÔNG dùng LOOP_ALL mặc định của Mục 3!
            if (this._externalStream) {
              this._externalStream._endedHandled = true;
            }
            if (!audioEl.loop && !audioEl.paused) {
              try {
                audioEl.pause();
              } catch (_eEndP) {}
            }
            this.syncFloatingAudioBarUI();
            this.syncMp3MediaSession();
            if (this._externalStream?.onEnded) {
              try {
                this._externalStream.onEnded({
                  currentTime: Number(audioEl.currentTime) || 0,
                  duration: Number.isFinite(audioEl.duration) ? audioEl.duration : 0
                });
              } catch (_eEndCb) {}
            }
            return;
          }
          if (this.abLoopEnabled || this.loopMode === 'LOOP_AB') {
            audioEl.currentTime = this.pointASec;
            audioEl.play().catch(() => {});
          } else if (this.loopMode === 'LOOP_ALL') {
            audioEl.currentTime = 0;
            audioEl.play().catch(() => {});
          } else {
            this.syncFloatingAudioBarUI();
            this.syncMp3MediaSession();
          }
        });
      }

      // 3. Nút tua nhanh ±5s
      if (seekBackBtn) {
        seekBackBtn.addEventListener('click', () => this.seekRelative(-5));
      }
      if (seekFwdBtn) {
        seekFwdBtn.addEventListener('click', () => this.seekRelative(5));
      }

      // 4. Chọn tốc độ phát (0.75x, 1.0x, 1.25x, 1.5x)
      if (speedSelect) {
        speedSelect.value = String(this.playbackRate);
        speedSelect.addEventListener('change', (ev) => {
          this.setSpeed(parseFloat(ev.target.value) || 1.0);
        });
      }

      // 5. Đồng bộ 2 chiều Điểm A & Điểm B (Thanh trượt <-> Ô nhập mm:ss)
      if (sliderA) {
        sliderA.addEventListener('input', () => {
          let valA = parseInt(sliderA.value, 10) || 0;
          if (valA >= this.pointBSec) {
            valA = Math.max(0, this.pointBSec - 1);
            sliderA.value = String(valA);
          }
          this.pointASec = valA;
          if (inputA) inputA.value = this.formatTimeCode(this.pointASec);
          this.persistABState();
        });
      }

      if (sliderB) {
        sliderB.addEventListener('input', () => {
          let valB = parseInt(sliderB.value, 10) || 1;
          if (valB <= this.pointASec) {
            valB = this.pointASec + 1;
            sliderB.value = String(valB);
          }
          this.pointBSec = valB;
          if (inputB) inputB.value = this.formatTimeCode(this.pointBSec);
          this.persistABState();
        });
      }

      const attachSmartMobileTimeAutoJump = (inpEl) => {
        if (!inpEl || inpEl.dataset.mod21SmartTimeBound) return;
        inpEl.dataset.mod21SmartTimeBound = '1';
        inpEl.setAttribute('inputmode', 'numeric');
        inpEl.setAttribute('autocomplete', 'off');
        const setCaretSafe = (pos) => {
          const apply = () => {
            try { inpEl.setSelectionRange(pos, pos); } catch (_e) {}
          };
          apply();
          setTimeout(apply, 0);
        };
        const insertMaskedDigits = (digitStr) => {
          const digitsOnly = String(digitStr || '').replace(/\D+/g, '');
          if (!digitsOnly) return false;
          const slots = [0, 1, 3, 4];
          let masked = /^\d{2}:\d{2}$/.test(String(inpEl.value || '').trim())
            ? String(inpEl.value).trim()
            : '00:00';
          let pos = typeof inpEl.selectionStart === 'number' ? inpEl.selectionStart : 0;
          const selEnd = typeof inpEl.selectionEnd === 'number' ? inpEl.selectionEnd : pos;
          if (selEnd > pos && pos === 0 && selEnd >= 4) pos = 0;
          for (let d = 0; d < digitsOnly.length; d++) {
            let slotIdx = slots.findIndex((s) => s >= pos);
            if (slotIdx === -1) slotIdx = slots.length - 1;
            const chars = masked.split('');
            chars[slots[slotIdx]] = digitsOnly[d];
            masked = chars.join('');
            pos = slotIdx < slots.length - 1 ? slots[slotIdx + 1] : 5;
          }
          inpEl.value = masked;
          setCaretSafe(pos);
          return true;
        };
        inpEl.addEventListener('focus', () => {
          if (!/^\d{2}:\d{2}$/.test(String(inpEl.value || '').trim())) {
            inpEl.value = '00:00';
          }
          setTimeout(() => {
            try { inpEl.setSelectionRange(0, 2); } catch (_e) {}
          }, 0);
        });
        inpEl.addEventListener('keydown', (ev) => {
          if (ev.key === 'Enter' || ev.keyCode === 13) {
            this.updateABLoopPoints();
            inpEl.blur();
            return;
          }
          if (ev.ctrlKey || ev.metaKey || ev.altKey) return;
          if (/^[0-9]$/.test(ev.key)) {
            ev.preventDefault();
            insertMaskedDigits(ev.key);
          }
        });
        inpEl.addEventListener('beforeinput', (ev) => {
          if (ev.inputType === 'insertText' && typeof ev.data === 'string' && /^[0-9]+$/.test(ev.data)) {
            ev.preventDefault();
            insertMaskedDigits(ev.data);
          }
        });
        inpEl.addEventListener('input', () => {
          const cur = String(inpEl.value || '');
          const pos = typeof inpEl.selectionStart === 'number' ? inpEl.selectionStart : cur.length;
          if (/^\d{2}:\d{2}$/.test(cur)) {
            if (pos === 2) setCaretSafe(3);
            return;
          }
          if (cur.indexOf(':') !== -1) {
            const parts = cur.split(':').map((p) => p.replace(/\D+/g, ''));
            let p0 = parts[0] || '';
            let p1 = parts[1] || '';
            if (p0.length > 2) {
              const overflow = p0.slice(2);
              p0 = p0.slice(0, 2);
              p1 = (overflow + p1).slice(0, 2);
              inpEl.value = `${p0}:${p1.padEnd(2, '0')}`;
              setCaretSafe(Math.min(5, 3 + overflow.length));
            } else if (p1.length > 2) {
              inpEl.value = `${p0.padStart(2, '0')}:${p1.slice(0, 2)}`;
              setCaretSafe(Math.min(5, pos));
            }
          } else {
            const digits = cur.replace(/\D+/g, '').slice(0, 4);
            if (digits.length === 2) {
              inpEl.value = `${digits}:`;
              setCaretSafe(3);
            } else if (digits.length > 2) {
              inpEl.value = `${digits.slice(0, 2)}:${digits.slice(2)}`;
              setCaretSafe(inpEl.value.length);
            }
          }
        });
      };

      if (inputA) {
        attachSmartMobileTimeAutoJump(inputA);
        inputA.addEventListener('change', () => {
          this.updateABLoopPoints();
        });
      }

      if (inputB) {
        attachSmartMobileTimeAutoJump(inputB);
        inputB.addEventListener('change', () => {
          this.updateABLoopPoints();
        });
      }

      // 6. Chế độ lặp (LOOP_ALL / LOOP_AB) & Nút Bật/Tắt Lặp A-B
      if (loopModeSelect) {
        loopModeSelect.value = this.loopMode;
        loopModeSelect.addEventListener('change', (ev) => {
          this.loopMode = ev.target.value;
          try {
            localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.LOOP_MODE, this.loopMode);
          } catch (_e) {
            // Bỏ qua
          }
          if (this.loopMode === 'LOOP_AB' && !this.abLoopEnabled) {
            this.toggleABLoop(true);
          } else if (this.loopMode === 'LOOP_ALL' && this.abLoopEnabled) {
            this.toggleABLoop(false);
          } else {
            this.syncABToggleUI();
          }
        });
      }

      if (abToggleBtn) {
        abToggleBtn.addEventListener('click', () => {
          this.toggleABLoop();
        });
      }

      // 7. Các nút chọn Preset âm thanh không gian WebAudio (.synth-preset-btn)
      const presetBtns = document.querySelectorAll('.synth-preset-btn');
      presetBtns.forEach((btn) => {
        btn.addEventListener('click', () => {
          const presetKey = btn.getAttribute('data-synth-preset') || 'OFF';
          this.setSynthPreset(presetKey);
        });
      });

      // 8. Thanh trượt âm lượng không gian (#synth-volume-slider)
      if (synthVolSlider) {
        synthVolSlider.value = String(this.soundscapeGraph.masterVolumePercent);
        synthVolSlider.addEventListener('input', (ev) => {
          this.setSynthVolume(parseInt(ev.target.value, 10) || 0);
        });
      }

      // 9. Nút đóng/mở khung accordion trong Tab 5 (.bug13-toggle-option-btn) — luôn thu gọn mặc định lần đầu
      const tab5ToggleBtns = document.querySelectorAll('.bug13-toggle-option-btn');
      tab5ToggleBtns.forEach((btn) => {
        if (btn.dataset.mod21Bound === 'true') return;
        btn.dataset.mod21Bound = 'true';
        btn.addEventListener('click', () => {
          const targetId = btn.getAttribute('data-bug13-target');
          const panel = targetId ? document.getElementById(targetId) : null;
          if (!panel) return;
          const isHidden = panel.classList.toggle('hidden');
          this.syncTab5CardToggleState(btn, !isHidden);
          if (targetId) {
            if (isHidden) {
              this.tab5OpenPanels.delete(targetId);
            } else {
              this.tab5OpenPanels.add(targetId);
            }
            this.persistTab5AccordionState();
          }
        });
      });

      // 9b. Nút Thu gọn hết / Mở rộng tất cả Tab 5 (#btn-tab5-collapse-all / #btn-tab5-expand-all)
      const btnTab5Collapse = document.getElementById('btn-tab5-collapse-all');
      if (btnTab5Collapse && !btnTab5Collapse.dataset.mod21Bound) {
        btnTab5Collapse.dataset.mod21Bound = 'true';
        btnTab5Collapse.addEventListener('click', () => {
          this.tab5OpenPanels.clear();
          this.applyTab5AccordionState();
          if (window.NoirStudio?.navigator?.collapsibleToolbars?.setTargetCollapsed) {
            window.NoirStudio.navigator.collapsibleToolbars.setTargetCollapsed('tab5-audio-advanced-grid', true);
          } else {
            const advAudio = document.getElementById('tab5-audio-advanced-grid');
            if (advAudio) advAudio.classList.add('hidden');
          }
          this.persistTab5AccordionState();
          this.notify('⏫ Đã thu gọn toàn bộ khung công cụ Tab 5.', 'info');
        });
      }

      const btnTab5Expand = document.getElementById('btn-tab5-expand-all');
      if (btnTab5Expand && !btnTab5Expand.dataset.mod21Bound) {
        btnTab5Expand.dataset.mod21Bound = 'true';
        btnTab5Expand.addEventListener('click', () => {
          ['s14-panel-attendance-box', 's14-panel-pomodoro-box', 's14-panel-music-box', 's14-panel-typography-box', 's14-panel-youtube-box'].forEach((id) => this.tab5OpenPanels.add(id));
          this.applyTab5AccordionState();
          if (window.NoirStudio?.navigator?.collapsibleToolbars?.setTargetCollapsed) {
            window.NoirStudio.navigator.collapsibleToolbars.setTargetCollapsed('tab5-audio-advanced-grid', false);
          } else {
            const advAudio = document.getElementById('tab5-audio-advanced-grid');
            if (advAudio) advAudio.classList.remove('hidden');
          }
          this.persistTab5AccordionState();
          this.notify('⏬ Đã mở rộng tất cả khung công cụ Tab 5.', 'success');
        });
      }

      this.applyTab5AccordionState();
      this.bindFloatingAudioMiniBar();
    }

    dismissConflictModal() {
      const modal =
        this._activeConflictModal ||
        (typeof document !== 'undefined' ? document.getElementById('mod21-yt-conflict-modal') : null);
      if (modal && modal.parentNode) {
        try { modal.parentNode.removeChild(modal); } catch (_e) {}
      }
      this._activeConflictModal = null;
    }

    confirmStopYoutubeForLocalMp3(trackName = '', onConfirm = null, onCancel = null) {
      if (typeof document === 'undefined' || !document.body) {
        if (typeof onConfirm === 'function') onConfirm();
        return;
      }
      this.dismissConflictModal();
      const tr = (s) =>
        window.NoirStudio?.i18n?.translateText ? window.NoirStudio.i18n.translateText(String(s || '')) : String(s || '');
      const cleanTrackName = String(trackName || '').trim();
      const modal = document.createElement('div');
      modal.id = 'mod21-yt-conflict-modal';
      modal.className =
        'fixed inset-0 z-[100020] bg-black/75 backdrop-blur-sm flex items-start justify-center p-4 overflow-y-auto';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.innerHTML = `
        <div class="my-auto w-full max-w-md rounded-2xl border border-amber-400/55 bg-zinc-900 text-zinc-100 shadow-2xl p-5 space-y-4">
          <div class="text-base font-extrabold text-amber-300 flex items-center gap-2">
            <span>🎬 Bạn đang xem video YouTube</span>
          </div>
          <p class="text-sm text-zinc-200 leading-relaxed">
            <span>Bạn đang xem video YouTube. Bạn có muốn tắt video YouTube để nghe tệp nhạc này không?</span>
          </p>
          ${cleanTrackName ? `<div class="px-3 py-2 rounded-xl bg-zinc-950 border border-zinc-700 text-xs text-emerald-300 font-semibold break-words"><span class="text-zinc-400">Tệp nhạc đã chọn:</span> <span data-i18n-ignore="true">${cleanTrackName.replace(/[<>&"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[c]))}</span></div>` : ''}
          <div class="flex flex-wrap items-center justify-end gap-2 pt-1">
            <button type="button" id="btn-mod21-conflict-no" class="px-3.5 py-2 rounded-xl border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition cursor-pointer">✖️ Không, tiếp tục xem YouTube</button>
            <button type="button" id="btn-mod21-conflict-yes" class="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-extrabold shadow-lg transition cursor-pointer">⏹️ Có, tắt YouTube để nghe nhạc</button>
          </div>
        </div>
      `;
      document.body.appendChild(modal);
      this._activeConflictModal = modal;
      try {
        window.NoirStudio?.i18n?.translateElement?.(modal);
      } catch (_eI18n) {}

      const closeModal = () => this.dismissConflictModal();
      modal.querySelector('#btn-mod21-conflict-no')?.addEventListener('click', () => {
        closeModal();
        if (typeof onCancel === 'function') onCancel();
      });
      modal.querySelector('#btn-mod21-conflict-yes')?.addEventListener('click', () => {
        closeModal();
        if (typeof onConfirm === 'function') onConfirm();
      });
      modal.addEventListener('click', (ev) => {
        if (ev.target === modal) {
          closeModal();
          if (typeof onCancel === 'function') onCancel();
        }
      });
    }

    stopLocalMp3ForYoutubePriority() {
      this.dismissConflictModal();
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!this.currentTrackMeta?.isExternalStream && audioEl) {
        try { audioEl.pause(); } catch (_eP) {}
        if (this.currentObjectUrl) {
          try { URL.revokeObjectURL(this.currentObjectUrl); } catch (_eU) {}
          this.currentObjectUrl = null;
        }
        try {
          audioEl.loop = false;
          audioEl.removeAttribute('src');
        } catch (_eR) {}
        this._stoppedLocalMp3ByUser = true;
        this._explicitUserPaused = false;
        if (this.currentTrackMeta) {
          this.currentTrackMeta.name = '';
          this.currentTrackMeta.externalUrl = '';
        }
        this.bgAudioBridge?.deactivateKeepAlive?.('mp3');
        this.syncFloatingAudioBarUI();
        this.persistAudioPlaybackStateNow(false);
      }
    }

    /**
     * Nạp tệp nhạc cá nhân (.MP3, .WAV, .OGG, .FLAC, .M4A) vào trình phát
     */
    loadCustomMp3File(file) {
      if (!file) return false;
      if (window.NoirStudio?.youtubeStudio?.isActivelyPlaying?.()) {
        this.confirmStopYoutubeForLocalMp3(
          file.name || '',
          () => {
            try {
              window.NoirStudio?.youtubeStudio?.playerCtrl?.stopAndClearVideo?.(false);
            } catch (_eStopYt) {}
            this._applyLoadCustomMp3File(file);
          },
          () => {
            this.notify('🎬 Đã giữ nguyên video YouTube đang phát.', 'info');
          }
        );
        return false;
      }
      return this._applyLoadCustomMp3File(file);
    }

    _applyLoadCustomMp3File(file) {
      if (!file) return false;
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl) return false;

      this._externalSessionSeq += 1;
      if (this.currentObjectUrl) {
        try {
          URL.revokeObjectURL(this.currentObjectUrl);
        } catch (_e) {
          // Bỏ qua
        }
      }
      this._externalStream = null;
      this._explicitUserPaused = false;
      audioEl.removeAttribute('crossorigin');

      const objectUrl = URL.createObjectURL(file);
      this.currentObjectUrl = objectUrl;
      audioEl.src = objectUrl;
      audioEl.playbackRate = this.playbackRate;
      audioEl.loop = this.loopMode === 'LOOP_ALL' && !this.abLoopEnabled;

      this.currentTrackMeta = {
        name: file.name || 'Ban_Nhac_Ca_Nhan.mp3',
        artist: 'Phát nền Audio Studio • Web Viết Tiểu Thuyết Của Bi',
        artworkUrl: '',
        videoId: '',
        isExternalStream: false,
        externalUrl: '',
        sizeBytes: file.size || 0,
        durationSec: 0,
        loadedAt: Date.now()
      };
      if (typeof window !== 'undefined' && typeof window.CustomEvent === 'function') {
        try {
          window.dispatchEvent(new window.CustomEvent('mod21:local-track-loaded', { detail: { name: this.currentTrackMeta.name } }));
        } catch (_eEv) {}
      }

      // Lưu vào danh sách phát trong phiên
      this.trackHistory.unshift({
        id: 'track_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
        name: this.currentTrackMeta.name,
        sizeMB: ((file.size || 0) / (1024 * 1024)).toFixed(2),
        fileRef: file,
        addedAt: Date.now()
      });
      if (this.trackHistory.length > 12) {
        this.trackHistory.pop();
      }

      this._allowingLocalMp3Override = true;
      audioEl
        .play()
        .then(() => {
          this._allowingLocalMp3Override = false;
          this.notify(`🎵 Đang phát nhạc cá nhân: "${file.name}" (${this.playbackRate}x)`, 'success');
        })
        .catch(() => {
          this._allowingLocalMp3Override = false;
          this.notify(`🎵 Đã nạp bài nhạc "${file.name}". Hãy bấm nút ▶ để bắt đầu phát!`, 'info');
        });

      this._stoppedLocalMp3ByUser = false;
      this.saveLocalMp3BlobToIdb(file);
      this.persistAudioPlaybackStateNow(true);
      this.renderPlaylistAndBookmarksUI();
      return true;
    }

    async saveLocalMp3BlobToIdb(file) {
      try {
        const idb = window.NoirStudio?.idb;
        if (!file || !idb || typeof idb.set !== 'function') return false;
        if (file.size > 24 * 1024 * 1024) return false;
        const storeName = window.NoirStudio?.constants?.STORES?.STATE_CACHE || 'state_cache';
        await idb.set(storeName, 'noir_v40_active_local_mp3_blob', {
          id: 'noir_v40_active_local_mp3_blob',
          name: String(file.name || 'Ban_Nhac_Ca_Nhan.mp3'),
          type: String(file.type || 'audio/mpeg'),
          size: Number(file.size) || 0,
          blob: file,
          savedAt: Date.now()
        });
        return true;
      } catch (_) {
        return false;
      }
    }

    async clearLocalMp3BlobFromIdb() {
      try {
        const idb = window.NoirStudio?.idb;
        if (!idb || typeof idb.delete !== 'function') return false;
        const storeName = window.NoirStudio?.constants?.STORES?.STATE_CACHE || 'state_cache';
        await idb.delete(storeName, 'noir_v40_active_local_mp3_blob');
        return true;
      } catch (_) {
        return false;
      }
    }

    persistAudioPlaybackStateNow(forceWrite = false) {
      try {
        if (typeof localStorage === 'undefined') return false;
        const audioEl = document.getElementById('s8-native-audio-bar');
        const isExt = Boolean(this.currentTrackMeta?.isExternalStream);
        const hasLocal = Boolean(!isExt && audioEl && audioEl.src && !this._stoppedLocalMp3ByUser && !audioEl.src.startsWith('data:audio/wav;base64,'));
        const curSec = audioEl && Number.isFinite(audioEl.currentTime) ? Math.floor(audioEl.currentTime) : 0;
        const payload = {
          hasLocalTrack: hasLocal,
          localTrackName: hasLocal ? String(this.currentTrackMeta?.name || '') : '',
          isExternalStream: isExt,
          currentTime: curSec,
          paused: audioEl ? Boolean(audioEl.paused) : true,
          stoppedByUser: Boolean(this._stoppedLocalMp3ByUser),
          synthPresetKey: String(this.soundscapeGraph?.activePresetKey || 'OFF'),
          muted: Boolean(this._isMutedAll || (audioEl && audioEl.muted))
        };
        const sig = JSON.stringify(payload);
        if (!forceWrite && sig === this._lastMod21PlaybackSig) return true;
        this._lastMod21PlaybackSig = sig;
        localStorage.setItem('noir_v40_mod21_playback_state_v1', sig);
        return true;
      } catch (_) {
        return false;
      }
    }

    async stopAndClearMp3(showToast = true) {
      this._explicitUserPaused = true;
      this._stoppedLocalMp3ByUser = true;
      this._externalSessionSeq += 1;
      const audioEl = document.getElementById('s8-native-audio-bar');
      const wasExt = Boolean(this.currentTrackMeta?.isExternalStream);
      if (wasExt && window.NoirStudio?.youtubeStudio?.playerCtrl?.activeEngine === 'MOD21_AUDIO') {
        try { window.NoirStudio.youtubeStudio.playerCtrl.pause(); } catch (_) {}
      }
      if (this.currentObjectUrl) {
        try { URL.revokeObjectURL(this.currentObjectUrl); } catch (_) {}
        this.currentObjectUrl = null;
      }
      this._externalStream = null;
      if (this.currentTrackMeta) {
        this.currentTrackMeta.isExternalStream = false;
        this.currentTrackMeta.externalUrl = '';
        this.currentTrackMeta.videoId = '';
        this.currentTrackMeta.name = '';
      }
      if (audioEl) {
        try { audioEl.loop = false; audioEl.pause(); } catch (_) {}
        try {
          audioEl.removeAttribute('src');
          audioEl.load();
        } catch (_) {}
      }
      this.bgAudioBridge?.deactivateKeepAlive?.('mp3');
      if (this.soundscapeGraph?.activePresetKey && this.soundscapeGraph.activePresetKey !== 'OFF') {
        this.setSynthPreset('OFF');
      }
      await this.clearLocalMp3BlobFromIdb();
      this.persistAudioPlaybackStateNow(true);
      this.syncFloatingAudioBarUI();
      this.syncMp3MediaSession();
      if (showToast) {
        this.notify('⏹️ Đã dừng hẳn và tắt trình phát MP3.', 'info');
      }
      return true;
    }

    async restoreSavedLocalMp3IfAny() {
      try {
        if (typeof localStorage === 'undefined') return false;
        const raw = localStorage.getItem('noir_v40_mod21_playback_state_v1');
        if (!raw) return false;
        const saved = JSON.parse(raw);
        if (!saved || saved.stoppedByUser || !saved.hasLocalTrack || saved.isExternalStream) {
          return false;
        }
        const idb = window.NoirStudio?.idb;
        const storeName = window.NoirStudio?.constants?.STORES?.STATE_CACHE || 'state_cache';
        const rec = idb && typeof idb.get === 'function'
          ? await idb.get(storeName, 'noir_v40_active_local_mp3_blob', null)
          : null;
        if (!rec || !rec.blob) return false;
        const audioEl = document.getElementById('s8-native-audio-bar');
        if (!audioEl || this.currentTrackMeta?.isExternalStream || audioEl.src) return false;

        const objectUrl = URL.createObjectURL(rec.blob);
        this.currentObjectUrl = objectUrl;
        this._stoppedLocalMp3ByUser = false;
        this._explicitUserPaused = true;
        audioEl.src = objectUrl;
        audioEl.playbackRate = this.playbackRate;
        audioEl.loop = this.loopMode === 'LOOP_ALL' && !this.abLoopEnabled;
        audioEl.muted = Boolean(saved.muted);
        this.currentTrackMeta = {
          name: rec.name || saved.localTrackName || 'Ban_Nhac_Ca_Nhan.mp3',
          artist: 'Phát nền Audio Studio • Web Viết Tiểu Thuyết Của Bi',
          artworkUrl: '',
          videoId: '',
          isExternalStream: false,
          externalUrl: '',
          sizeBytes: rec.size || rec.blob.size || 0,
          durationSec: 0,
          loadedAt: Date.now()
        };
        const resumeAt = Math.max(0, Number(saved.currentTime) || 0);
        if (resumeAt > 0) {
          const onMeta = () => {
            try {
              const dur = Number.isFinite(audioEl.duration) ? audioEl.duration : resumeAt;
              audioEl.currentTime = Math.min(Math.max(0, dur - 0.2), resumeAt);
            } catch (_) {}
          };
          audioEl.addEventListener('loadedmetadata', onMeta, { once: true });
        }
        this.syncFloatingAudioBarUI();
        return true;
      } catch (_) {
        return false;
      }
    }

    unlockExternalAudioGesture() {
      const audioEl = document.getElementById('s8-native-audio-bar');
      this.bgAudioBridge.ensureAudioSessionPlayback();
      this.bgAudioBridge.activateKeepAlive('youtube');
      try {
        if (this.soundscapeGraph && typeof this.soundscapeGraph.ensureContext === 'function') {
          this.soundscapeGraph.ensureContext()?.resume?.().catch?.(() => {});
        }
      } catch (_eCtx) {}
      if (!audioEl) return false;
      if (this.currentTrackMeta?.isExternalStream && this._externalStream && audioEl.src && !audioEl.paused && !this._unlockingGestureInProgress) {
        return true;
      }
      if (!audioEl.src || audioEl.src.startsWith('data:audio/wav;base64,')) {
        const silentWav =
          'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA';
        this._unlockingGestureInProgress = true;
        try {
          if (audioEl.src !== silentWav) {
            audioEl.src = silentWav;
          }
          audioEl.removeAttribute('crossorigin');
          audioEl.setAttribute('playsinline', '');
          audioEl.setAttribute('webkit-playsinline', '');
          audioEl.playsInline = true;
          const p = audioEl.play();
          if (p && typeof p.then === 'function') {
            p.then(
              () => {
                if (this._unlockingGestureInProgress && audioEl.src === silentWav && !this.currentTrackMeta?.isExternalStream) {
                  try { audioEl.pause(); } catch (_eP) {}
                }
                this._unlockingGestureInProgress = false;
              },
              () => {
                this._unlockingGestureInProgress = false;
              }
            );
          } else {
            this._unlockingGestureInProgress = false;
          }
        } catch (_eU) {
          this._unlockingGestureInProgress = false;
        }
      }
      return true;
    }

    /**
     * Nạp luồng âm thanh YouTube trích xuất trực tiếp từ Mod 39 vào trình phát <audio> Mục 3.
     * TUYỆT ĐỐI không nối qua AudioContext.createMediaElementSource() để tránh bị trình duyệt khóa CORS làm câm tiếng.
     */
    async loadExternalAudioStream(payload = {}) {
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl) return { ok: false, reason: 'missing-audio-el' };
      const extSessionToken = ++this._externalSessionSeq;
      try {
        if (!audioEl.paused) audioEl.pause();
      } catch (_eCutOld) {}
      this.dismissConflictModal();
      this._unlockingGestureInProgress = false;
      this._explicitUserPaused = Boolean(payload.autoplay === false);
      this._stoppedLocalMp3ByUser = false;

      const canHlsAudio = Boolean(
        typeof audioEl.canPlayType === 'function' &&
          (audioEl.canPlayType('application/vnd.apple.mpegurl') || audioEl.canPlayType('application/x-mpegURL'))
      );
      const candidates = [
        payload.url || payload.audioUrl,
        ...(Array.isArray(payload.fallbackUrls) ? payload.fallbackUrls : [])
      ]
        .map((u) => String(u || '').trim())
        .filter((u, idx, arr) => {
          if (!u || arr.indexOf(u) !== idx) return false;
          if (!canHlsAudio && /\.m3u8(?:$|\?)/i.test(u)) return false;
          return true;
        });

      if (!candidates.length) {
        return { ok: false, reason: 'no-audio-url' };
      }

      if (this.currentObjectUrl) {
        try {
          URL.revokeObjectURL(this.currentObjectUrl);
        } catch (_e) {}
        this.currentObjectUrl = null;
      }

      const startSec = Math.max(0, Number(payload.startSeconds) || 0);
      const vid = String(payload.videoId || '').trim();
      const artworkUrl =
        String(payload.artwork || '').trim() ||
        (vid ? `https://i.ytimg.com/vi/${vid}/hqdefault.jpg` : '');

      // Cấu hình phát thẳng ra loa thiết bị (không gán crossOrigin, không đi qua WebAudio Analyser)
      audioEl.removeAttribute('crossorigin');
      audioEl.setAttribute('playsinline', '');
      audioEl.setAttribute('webkit-playsinline', '');
      audioEl.playsInline = true;
      audioEl.preload = 'auto';

      const cleanRate = Number(payload.playbackRate);
      if (Number.isFinite(cleanRate) && cleanRate >= 0.5 && cleanRate <= 2.0) {
        this.playbackRate = cleanRate;
      }
      audioEl.playbackRate = this.playbackRate || 1.0;

      if (typeof payload.muted === 'boolean') {
        this._isMutedAll = payload.muted;
        audioEl.muted = payload.muted;
      }
      if (typeof payload.volume === 'number' && Number.isFinite(payload.volume)) {
        audioEl.volume = Math.max(0, Math.min(1, payload.volume / 100));
      }
      // Luồng YouTube KHÔNG kế thừa mặc định LOOP_ALL của Tab 3 — chỉ lặp khi Tab 5 bật repeatMode!
      audioEl.loop = Boolean(payload.repeatMode && !payload.abLoopEnabled && !payload.isLive);

      const audibleIframeSeqNow = Number(window.NoirStudio?.youtubeStudio?.playerCtrl?._audibleIframeMountSeq || 0);
      this._externalStream = {
        extSessionToken,
        videoId: vid,
        candidates,
        candidateIndex: 0,
        _loadingInProgress: true,
        audibleIframeMountSeqAtLoad: audibleIframeSeqNow,
        title: String(payload.title || `YouTube Audio (${vid || 'Stream'})`).trim(),
        artist: String(payload.artist || 'YouTube Audio Nền • Web Tiểu Thuyết Bi').trim(),
        artworkUrl,
        durationSec: Math.max(0, Number(payload.durationSec) || 0),
        isLive: Boolean(payload.isLive),
        pendingSeekSec: startSec,
        onTimeUpdate: typeof payload.onTimeUpdate === 'function' ? payload.onTimeUpdate : null,
        onStateChange: typeof payload.onStateChange === 'function' ? payload.onStateChange : null,
        onSeeked: typeof payload.onSeeked === 'function' ? payload.onSeeked : null,
        onRateChange: typeof payload.onRateChange === 'function' ? payload.onRateChange : null,
        onEnded: typeof payload.onEnded === 'function' ? payload.onEnded : null,
        onError: typeof payload.onError === 'function' ? payload.onError : null
      };

      this.currentTrackMeta = {
        name: this._externalStream.title,
        artist: this._externalStream.artist,
        artworkUrl,
        videoId: vid,
        isExternalStream: true,
        externalUrl: candidates[0],
        sizeBytes: 0,
        durationSec: this._externalStream.durationSec,
        loadedAt: Date.now()
      };

      this.bgAudioBridge.ensureAudioSessionPlayback();
      this.bgAudioBridge.activateKeepAlive('mp3');
      this.bgAudioBridge.activateKeepAlive('youtube');

      const playCandidateWithTimeout = async (url, attemptTimeoutMs) => {
        if (extSessionToken !== this._externalSessionSeq) {
          return { ok: false, aborted: true, gestureBlock: false, reason: 'superseded' };
        }
        audioEl.removeAttribute('crossorigin');
        if (audioEl.src !== url) {
          audioEl.src = url;
          try {
            audioEl.load();
          } catch (_eL) {}
        } else if (startSec > 0 && audioEl.readyState >= 1) {
          try {
            audioEl.currentTime = startSec;
            if (this._externalStream && this._externalStream.extSessionToken === extSessionToken) {
              this._externalStream.pendingSeekSec = 0;
            }
          } catch (_eS) {}
        }

        return await new Promise((resolveAttempt) => {
          let settled = false;
          let timerId = null;
          let extendedOnce = false;
          const cleanup = () => {
            if (timerId) {
              clearTimeout(timerId);
              timerId = null;
            }
            audioEl.removeEventListener('error', onErr);
            audioEl.removeEventListener('playing', onPlaying);
            audioEl.removeEventListener('canplay', onPlaying);
          };
          const done = (result) => {
            if (settled) return;
            settled = true;
            cleanup();
            resolveAttempt(result);
          };
          const onErr = () => done({ ok: false, gestureBlock: false, reason: 'media-error' });
          const onPlaying = () => {
            if (extSessionToken !== this._externalSessionSeq) {
              done({ ok: false, aborted: true, gestureBlock: false, reason: 'superseded' });
              return;
            }
            done({ ok: true, playing: true, gestureBlock: false });
          };

          audioEl.addEventListener('error', onErr, { once: true });
          audioEl.addEventListener('playing', onPlaying, { once: true });
          audioEl.addEventListener('canplay', onPlaying, { once: true });
          const isFastLocalUrl = /^blob:|^data:/i.test(String(url || ''));
          const armTimeout = (ms) => {
            timerId = setTimeout(() => {
              if (extSessionToken !== this._externalSessionSeq) {
                done({ ok: false, aborted: true, gestureBlock: false, reason: 'superseded' });
                return;
              }
              if (!audioEl.paused && !audioEl.error && audioEl.readyState >= 2) {
                done({ ok: true, playing: true, gestureBlock: false });
              } else if (!extendedOnce && !audioEl.error && (audioEl.readyState >= 1 || audioEl.networkState === 2)) {
                extendedOnce = true;
                armTimeout(isFastLocalUrl ? 550 : 1800);
              } else if (!isFastLocalUrl && !audioEl.error && (!audioEl.paused || audioEl.readyState >= 1)) {
                done({ ok: true, playing: Boolean(!audioEl.paused), gestureBlock: false });
              } else {
                done({ ok: false, gestureBlock: false, reason: 'timeout' });
              }
            }, ms);
          };
          armTimeout(attemptTimeoutMs);

          const p = audioEl.play();
          if (p && typeof p.then === 'function') {
            p.then(
              () => {
                if (extSessionToken !== this._externalSessionSeq) {
                  try { audioEl.pause(); } catch (_eSt) {}
                  done({ ok: false, aborted: true, gestureBlock: false, reason: 'superseded' });
                  return;
                }
                done({ ok: Boolean(!audioEl.error), playing: Boolean(!audioEl.paused && !audioEl.error), gestureBlock: false });
              },
              (playErr) => {
                const isGesture = Boolean(
                  playErr &&
                    (playErr.name === 'NotAllowedError' || /user gesture|not allowed/i.test(String(playErr.message || '')))
                );
                done({
                  ok: false,
                  playing: false,
                  gestureBlock: isGesture,
                  reason: String(playErr?.message || 'play-rejected')
                });
              }
            );
          } else if (!audioEl.paused && !audioEl.error) {
            done({ ok: true, playing: true, gestureBlock: false });
          }
        });
      };

      const maxCandidates = Math.min(candidates.length, 6);
      const isLocalFirstCandidate = /^blob:|^data:/i.test(String(candidates[0] || ''));
      const perAttemptMs = isLocalFirstCandidate ? 1800 : 4800;
      if (this._externalStream && this._externalStream.extSessionToken === extSessionToken) {
        this._externalStream.pendingSeekSec = startSec;
      }
      audioEl.src = candidates[0];
      try {
        audioEl.load();
      } catch (_eInitLoad) {}

      this.syncMp3MediaSession();
      this.renderPlaylistAndBookmarksUI();
      this.syncFloatingAudioBarUI();

      let playingNow = false;
      let gestureBlocked = false;
      let lastReason = 'stream-play-failed';
      try {
        if (payload.autoplay !== false) {
          for (let idx = 0; idx < maxCandidates; idx++) {
            if (extSessionToken !== this._externalSessionSeq || !this._externalStream) {
              return { ok: false, aborted: true, reason: 'superseded' };
            }
            this._externalStream.candidateIndex = idx;
            this.currentTrackMeta.externalUrl = candidates[idx];
            const attempt = await playCandidateWithTimeout(candidates[idx], perAttemptMs);
            if (attempt.aborted || extSessionToken !== this._externalSessionSeq) {
              return { ok: false, aborted: true, reason: 'superseded' };
            }
            if (attempt.ok && attempt.playing) {
              playingNow = true;
              break;
            }
            if (attempt.gestureBlock) {
              gestureBlocked = true;
              break;
            }
            lastReason = attempt.reason || lastReason;
          }
          if (extSessionToken !== this._externalSessionSeq) {
            return { ok: false, aborted: true, reason: 'superseded' };
          }
          if (!playingNow && !gestureBlocked) {
            try {
              audioEl.pause();
              audioEl.loop = false;
              audioEl.removeAttribute('src');
              audioEl.load();
            } catch (_eReset) {}
            this._externalStream = null;
            this.currentTrackMeta.isExternalStream = false;
            this.currentTrackMeta.externalUrl = '';
            this.currentTrackMeta.videoId = '';
            return { ok: false, playing: false, reason: lastReason };
          }
        } else if (startSec > 0 && audioEl.readyState >= 1) {
          try {
            audioEl.currentTime = startSec;
            if (this._externalStream && this._externalStream.extSessionToken === extSessionToken) {
              this._externalStream.pendingSeekSec = 0;
            }
          } catch (_eSeekPaused) {}
        }
      } finally {
        if (this._externalStream && this._externalStream.extSessionToken === extSessionToken) {
          this._externalStream._loadingInProgress = false;
        }
      }

      if (extSessionToken !== this._externalSessionSeq) {
        return { ok: false, aborted: true, reason: 'superseded' };
      }

      this.syncMp3MediaSession();
      this.syncFloatingAudioBarUI();
      return {
        ok: true,
        playing: playingNow,
        paused: Boolean(audioEl.paused),
        element: audioEl,
        url: this.currentTrackMeta.externalUrl
      };
    }

    getExternalAudioState() {
      const audioEl = document.getElementById('s8-native-audio-bar');
      const active = Boolean(audioEl && this.currentTrackMeta?.isExternalStream && this._externalStream);
      const dur =
        active && Number.isFinite(audioEl.duration) && audioEl.duration > 0
          ? audioEl.duration
          : Number(this._externalStream?.durationSec || this.currentTrackMeta?.durationSec || 0);
      const cur =
        active && Number.isFinite(audioEl.currentTime) && audioEl.currentTime >= 0
          ? audioEl.currentTime
          : Number(this._externalStream?.pendingSeekSec || 0);
      let state = -1;
      if (active) {
        if (audioEl.ended || this._externalStream?._endedHandled) state = 0;
        else if (!audioEl.paused) state = audioEl.readyState >= 3 ? 1 : 3;
        else state = 2;
      }
      return {
        active,
        videoId: active ? String(this._externalStream?.videoId || '') : '',
        url: active ? String(this.currentTrackMeta?.externalUrl || audioEl.src || '') : '',
        currentTime: cur,
        duration: dur,
        paused: active ? Boolean(audioEl.paused) : true,
        state,
        playbackRate: active ? Number(audioEl.playbackRate || this.playbackRate || 1) : 1
      };
    }

    pauseExternalAudioStream(clearSource = false) {
      this._explicitUserPaused = true;
      this._unlockingGestureInProgress = false;
      const audioEl = document.getElementById('s8-native-audio-bar');
      const curTime = audioEl && Number.isFinite(audioEl.currentTime) ? audioEl.currentTime : 0;
      const wasExternal = Boolean(this.currentTrackMeta?.isExternalStream || this._externalStream);
      if (audioEl && !audioEl.paused && (wasExternal || !clearSource)) {
        try { audioEl.pause(); } catch (_e) {}
      }
      if (clearSource) {
        this._externalSessionSeq += 1;
        this._externalStream = null;
        if (this.currentTrackMeta) {
          this.currentTrackMeta.isExternalStream = false;
          this.currentTrackMeta.externalUrl = '';
          this.currentTrackMeta.videoId = '';
        }
        if (wasExternal || !this.currentObjectUrl) {
          if (this.currentObjectUrl) {
            try { URL.revokeObjectURL(this.currentObjectUrl); } catch (_eU) {}
            this.currentObjectUrl = null;
          }
          if (this.currentTrackMeta) {
            this.currentTrackMeta.name = '';
            this.currentTrackMeta.artist = '';
            this.currentTrackMeta.artworkUrl = '';
            this.currentTrackMeta.durationSec = 0;
          }
          if (audioEl) {
            try {
              audioEl.loop = false;
              audioEl.pause();
              audioEl.removeAttribute('src');
              audioEl.load();
            } catch (_eR) {}
          }
          this.renderPlaylistAndBookmarksUI();
        }
        this.bgAudioBridge.deactivateKeepAlive('mp3');
        this.bgAudioBridge.deactivateKeepAlive('youtube');
      }
      this.syncFloatingAudioBarUI();
      this.syncMp3MediaSession();
      this.persistAudioPlaybackStateNow(false);
      return curTime;
    }

    seekExternalAudio(seconds) {
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl || !this.currentTrackMeta?.isExternalStream) return false;
      if (this._externalStream) {
        this._externalStream._endedHandled = false;
      }
      const target = Math.max(0, Number(seconds) || 0);
      if (audioEl.readyState >= 1) {
        try { audioEl.currentTime = target; } catch (_e) {}
        if (this._externalStream) this._externalStream.pendingSeekSec = 0;
      } else if (this._externalStream) {
        this._externalStream.pendingSeekSec = target;
      }
      this.syncMp3MediaSession();
      return true;
    }

    setExternalAudioPaused(shouldPause) {
      this._explicitUserPaused = Boolean(shouldPause);
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl || !this.currentTrackMeta?.isExternalStream) return Promise.resolve(false);
      if (!shouldPause && this._externalStream) {
        this._externalStream._endedHandled = false;
      }
      if (shouldPause) {
        if (!audioEl.paused) {
          try { audioEl.pause(); } catch (_e) {}
        }
        this.syncMp3MediaSession();
        return Promise.resolve(true);
      }
      this.bgAudioBridge.ensureAudioSessionPlayback();
      this.bgAudioBridge.activateKeepAlive('mp3');
      this.bgAudioBridge.activateKeepAlive('youtube');
      return audioEl.play().then(() => {
        this.syncMp3MediaSession();
        return true;
      }, () => false);
    }

    setExternalAudioPrefs(prefs = {}) {
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl || !this.currentTrackMeta?.isExternalStream) return;
      if (typeof prefs.speed === 'number' && Number.isFinite(prefs.speed)) {
        const cleanRate = Math.max(0.25, Math.min(4.0, prefs.speed));
        this.playbackRate = cleanRate;
        audioEl.playbackRate = cleanRate;
      }
      if (typeof prefs.volume === 'number' && Number.isFinite(prefs.volume)) {
        audioEl.volume = Math.max(0, Math.min(1, prefs.volume / 100));
      }
      if (typeof prefs.muted === 'boolean') {
        this._isMutedAll = prefs.muted;
        audioEl.muted = prefs.muted;
      }
      if (typeof prefs.repeatMode === 'boolean') {
        audioEl.loop = Boolean(prefs.repeatMode && !prefs.abLoopEnabled && !this._externalStream?.isLive);
      }
      this.syncMp3MediaSession();
    }

    verifyCoherenceWithTab5Player(audioEl) {
      if (!this.currentTrackMeta?.isExternalStream) return true;
      const ext = this._externalStream;
      if (!ext) {
        if (audioEl) {
          try { audioEl.pause(); } catch (_eP) {}
        }
        this.pauseExternalAudioStream(true);
        return false;
      }
      if (ext._loadingInProgress) return true;
      const ytCtrl = window.NoirStudio?.youtubeStudio?.playerCtrl;
      if (!ytCtrl) return true;
      const tab5Vid = String(ytCtrl.activeVideo?.videoId || '').trim();
      const extVid = String(ext.videoId || '').trim();
      const activatingVid = String(ytCtrl._activatingMod21VideoId || '').trim();
      if (extVid && activatingVid === extVid) return true;
      const isBridgedFromTab5 = Boolean(ext.onTimeUpdate || ext.onStateChange);
      const audibleIframeMountedAfterLoad =
        Number(ytCtrl._audibleIframeMountSeq || 0) > Number(ext.audibleIframeMountSeqAtLoad || 0);
      if (
        (extVid && tab5Vid && tab5Vid !== extVid) ||
        audibleIframeMountedAfterLoad ||
        (isBridgedFromTab5 && (!tab5Vid || ytCtrl.activeEngine === 'IFRAME' || ytCtrl.activeEngine === 'HTML5'))
      ) {
        if (audioEl) {
          try { audioEl.pause(); } catch (_eP2) {}
        }
        this.pauseExternalAudioStream(true);
        return false;
      }
      return true;
    }

    onTab5StreamSignal(signal = {}) {
      if (!signal || typeof signal !== 'object') return false;
      const action = String(signal.action || '').trim();
      const engine = String(signal.engine || '').trim();
      const sigVid = String(signal.videoId || '').trim();
      const extVid = String(this._externalStream?.videoId || this.currentTrackMeta?.videoId || '').trim();
      this._lastTab5StreamSignal = {
        action,
        engine,
        videoId: sigVid,
        sessionId: Number(signal.sessionId) || 0,
        streamTypeLabel: String(signal.streamTypeLabel || ''),
        timestamp: Date.now()
      };

      // 1) Khi khung phát Tab 5 chuyển sang Luồng phát YouTube (IFRAME), HTML5 Video trực tiếp, hoặc Tắt/Đang đổi luồng:
      // Ngắt và xóa ngay lập tức luồng MP3 cũ ở Tab 3 để chờ đồng bộ với luồng phát mới.
      if (
        action === 'stop' ||
        action === 'switch-to-youtube-stream' ||
        action === 'switch-to-html5-video' ||
        action === 'resolving-stream' ||
        engine === 'IFRAME' ||
        engine === 'HTML5' ||
        engine === 'STOPPED' ||
        engine === 'RESOLVING_STREAM'
      ) {
        if (this.currentTrackMeta?.isExternalStream || this._externalStream) {
          this.pauseExternalAudioStream(true);
        }
        return true;
      }

      // 2) Khi khung phát Tab 5 chuyển sang video mới khác với video đang nạp ở Tab 3:
      if (
        (action === 'switch-video' || sigVid) &&
        extVid &&
        sigVid &&
        extVid !== sigVid
      ) {
        this.pauseExternalAudioStream(true);
        if (action === 'load-public-stream' && signal.streamPayload) {
          this.loadExternalAudioStream(signal.streamPayload);
        }
        return true;
      }

      // 3) Khi khung phát Tab 5 báo có Luồng phát công cộng mới cần nạp sang Tab 3:
      if (action === 'load-public-stream' && signal.streamPayload) {
        const targetUrl = String(signal.streamPayload.url || '').trim();
        const currentUrl = String(this.currentTrackMeta?.externalUrl || '').trim();
        if (
          !this.currentTrackMeta?.isExternalStream ||
          !this._externalStream ||
          (sigVid && extVid !== sigVid) ||
          (targetUrl && currentUrl !== targetUrl)
        ) {
          this.loadExternalAudioStream(signal.streamPayload);
        }
        return true;
      }

      return this.verifyCoherenceWithTab5Player(document.getElementById('s8-native-audio-bar'));
    }

    _base64ToArrayBufferHidden(dataUri) {
      try {
        if (typeof dataUri !== 'string' || !dataUri || typeof window.atob !== 'function') return null;
        const commaIdx = dataUri.indexOf(',');
        if (commaIdx < 0) return null;
        const b64 = dataUri.slice(commaIdx + 1).trim();
        const bin = window.atob(b64);
        const bytes = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) {
          bytes[i] = bin.charCodeAt(i);
        }
        return bytes.buffer;
      } catch (_eB64) {
        return null;
      }
    }

    _buildWavBlobUrlHidden(audioBuffer) {
      try {
        if (!audioBuffer || typeof Blob !== 'function' || typeof URL === 'undefined' || typeof URL.createObjectURL !== 'function') {
          return '';
        }
        const numChannels = Math.min(2, Math.max(1, audioBuffer.numberOfChannels || 1));
        const sampleRate = audioBuffer.sampleRate || 48000;
        const length = audioBuffer.length || 0;
        if (!length) return '';
        const blockAlign = numChannels * 2;
        const dataSize = length * blockAlign;
        const buffer = new ArrayBuffer(44 + dataSize);
        const view = new DataView(buffer);
        const writeAscii = (offset, str) => {
          for (let j = 0; j < str.length; j++) view.setUint8(offset + j, str.charCodeAt(j));
        };
        writeAscii(0, 'RIFF');
        view.setUint32(4, 36 + dataSize, true);
        writeAscii(8, 'WAVE');
        writeAscii(12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * blockAlign, true);
        view.setUint16(32, blockAlign, true);
        view.setUint16(34, 16, true);
        writeAscii(36, 'data');
        view.setUint32(40, dataSize, true);
        const channels = [];
        for (let ch = 0; ch < numChannels; ch++) channels.push(audioBuffer.getChannelData(ch));
        let ptr = 44;
        let maxPeak = 0;
        for (let sIdx = 0; sIdx < length; sIdx++) {
          for (let ch = 0; ch < numChannels; ch++) {
            const rawSample = channels[ch][sIdx] || 0;
            const absVal = Math.abs(rawSample);
            if (absVal > maxPeak) maxPeak = absVal;
            const sample = Math.max(-1, Math.min(1, rawSample));
            view.setInt16(ptr, sample < 0 ? sample * 0x8000 : sample * 0x7fff, true);
            ptr += 2;
          }
        }
        if (maxPeak < 0.0005) return '';
        return URL.createObjectURL(new Blob([buffer], { type: 'audio/wav' }));
      } catch (_eWav) {
        return '';
      }
    }

    _ensureHiddenClipAudioElement(initialSrc = '') {
      try {
        if (typeof document === 'undefined' || !document.createElement) return null;
        let el = this._hiddenClipAudioEl;
        if (!el) {
          el = document.getElementById('mod21-hidden-clip-player') || document.createElement('audio');
          el.id = 'mod21-hidden-clip-player';
          el.preload = 'auto';
          el.autoplay = false;
          el.loop = false;
          el.controls = false;
          el.setAttribute('aria-hidden', 'true');
          el.setAttribute('playsinline', '');
          el.setAttribute('webkit-playsinline', '');
          el.playsInline = true;
          el.style.cssText = 'position:fixed;width:1px;height:1px;right:0;bottom:0;opacity:0;pointer-events:none;z-index:-1;';
          if (document.body && !el.parentNode) document.body.appendChild(el);
          this._hiddenClipAudioEl = el;
        } else if (document.body && !el.parentNode) {
          document.body.appendChild(el);
        }
        const curAttr = el.getAttribute('src') || '';
        if (initialSrc && el.src !== initialSrc && curAttr !== initialSrc) {
          el.src = initialSrc;
          try { if (typeof el.load === 'function') el.load(); } catch (_eL) {}
        }
        return el;
      } catch (_eEl) {
        return null;
      }
    }

    getHiddenBuiltInClip(clipKey) {
      return this._hiddenBuiltInClips.get(String(clipKey || '')) || null;
    }

    getHiddenClipAudioElement() {
      return this._hiddenClipAudioEl || (typeof document !== 'undefined' ? document.getElementById('mod21-hidden-clip-player') : null);
    }

    registerHiddenBuiltInClip(clipKey, primarySrc, fallbackUrl = '') {
      const key = String(clipKey || '').trim();
      if (!key) return null;
      const existing = this._hiddenBuiltInClips.get(key);
      if (existing && existing.primarySrc === primarySrc && existing.fallbackUrl === fallbackUrl) {
        return existing;
      }
      let m4aBlobUrl = existing?.m4aBlobUrl || '';
      if (!m4aBlobUrl && primarySrc) {
        try {
          const rawBytes = this._base64ToArrayBufferHidden(primarySrc);
          if (rawBytes && rawBytes.byteLength > 64 && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            m4aBlobUrl = URL.createObjectURL(new Blob([rawBytes], { type: 'audio/mp4' }));
          }
        } catch (_eM4aBlob) {}
      }
      const entry = {
        clipKey: key,
        primarySrc: String(primarySrc || ''),
        fallbackUrl: String(fallbackUrl || ''),
        m4aBlobUrl,
        audioBuffer: existing?.audioBuffer || null,
        wavBlobUrl: existing?.wavBlobUrl || '',
        decodePromise: null,
        durationSec: existing?.durationSec || 3.435
      };
      this._hiddenBuiltInClips.set(key, entry);
      if (entry.wavBlobUrl || entry.m4aBlobUrl) {
        this._ensureHiddenClipAudioElement(entry.wavBlobUrl || entry.m4aBlobUrl);
      }
      this._decodeHiddenBuiltInClip(key);
      return entry;
    }

    _decodeHiddenBuiltInClip(clipKey) {
      const entry = this.getHiddenBuiltInClip(clipKey);
      if (!entry) return Promise.resolve(null);
      if (entry.audioBuffer && entry.wavBlobUrl) return Promise.resolve(entry.audioBuffer);
      if (entry.decodePromise) return entry.decodePromise;

      const rawBuf = this._base64ToArrayBufferHidden(entry.primarySrc);
      const loadBytes = rawBuf
        ? Promise.resolve(rawBuf)
        : (entry.fallbackUrl && typeof fetch === 'function'
            ? fetch(entry.fallbackUrl).then((r) => (r && r.ok ? r.arrayBuffer() : null)).catch(() => null)
            : Promise.resolve(null));

      const decodeWithContext = (ctxInstance, arrBuf) => {
        if (!ctxInstance || typeof ctxInstance.decodeAudioData !== 'function' || !arrBuf || arrBuf.byteLength < 16) {
          return Promise.resolve(null);
        }
        return new Promise((resolve) => {
          let settled = false;
          const done = (b) => {
            if (settled) return;
            settled = true;
            resolve(b || null);
          };
          try {
            const p = ctxInstance.decodeAudioData(arrBuf.slice(0), done, () => done(null));
            if (p && typeof p.then === 'function') p.then(done, () => done(null));
          } catch (_eD) {
            done(null);
          }
        });
      };

      entry.decodePromise = loadBytes
        .then(async (arrBuf) => {
          if (!arrBuf || arrBuf.byteLength < 16) return null;
          if (!entry.m4aBlobUrl && typeof URL !== 'undefined' && typeof URL.createObjectURL === 'function') {
            try {
              entry.m4aBlobUrl = URL.createObjectURL(new Blob([arrBuf.slice(0)], { type: 'audio/mp4' }));
            } catch (_eM) {}
          }
          const OfflineCtx = window.OfflineAudioContext || window.webkitOfflineAudioContext;
          const primaryCtx =
            (this.soundscapeGraph?.ctx && this.soundscapeGraph.ctx.state !== 'closed' && typeof this.soundscapeGraph.ctx.decodeAudioData === 'function')
              ? this.soundscapeGraph.ctx
              : (typeof OfflineCtx === 'function' ? new OfflineCtx(1, 1, 48000) : null);
          let decoded = await decodeWithContext(primaryCtx, arrBuf);
          let wavUrl = decoded ? this._buildWavBlobUrlHidden(decoded) : '';
          if (!wavUrl) {
            const RealAudioCtx = window.AudioContext || window.webkitAudioContext;
            if (typeof RealAudioCtx === 'function') {
              let tempCtx = null;
              try {
                tempCtx = (this.soundscapeGraph?.ctx && this.soundscapeGraph.ctx.state !== 'closed')
                  ? this.soundscapeGraph.ctx
                  : new RealAudioCtx();
                const retryDecoded = await decodeWithContext(tempCtx, arrBuf);
                if (retryDecoded) {
                  decoded = retryDecoded;
                  wavUrl = this._buildWavBlobUrlHidden(retryDecoded);
                }
                if (tempCtx && tempCtx !== this.soundscapeGraph?.ctx && typeof tempCtx.close === 'function') {
                  tempCtx.close().catch(() => {});
                }
              } catch (_eTemp) {}
            }
          }
          entry.decodePromise = null;
          if (decoded) {
            entry.audioBuffer = decoded;
            entry.durationSec = decoded.duration || entry.durationSec;
          }
          if (wavUrl) {
            entry.wavBlobUrl = wavUrl;
          } else if (!entry.wavBlobUrl && entry.m4aBlobUrl) {
            entry.wavBlobUrl = entry.m4aBlobUrl;
          }
          const targetPreloadUrl = entry.wavBlobUrl || entry.m4aBlobUrl;
          if (targetPreloadUrl) {
            const el = this.getHiddenClipAudioElement();
            if (!el || el.paused) {
              this._ensureHiddenClipAudioElement(targetPreloadUrl);
            }
          }
          return decoded;
        })
        .catch(() => {
          entry.decodePromise = null;
          return null;
        });
      return entry.decodePromise;
    }

    unlockHiddenBuiltInClipGesture(clipKey = '') {
      this.bgAudioBridge.ensureAudioSessionPlayback();
      try {
        const existingCtx = this.soundscapeGraph?.ctx;
        if (existingCtx && existingCtx.state === 'suspended' && typeof existingCtx.resume === 'function') {
          existingCtx.resume().catch(() => {});
        }
      } catch (_eU) {}
      if (clipKey) {
        const entry = this.getHiddenBuiltInClip(clipKey);
        if (entry) {
          const preloadSrc = entry.wavBlobUrl || entry.m4aBlobUrl || entry.primarySrc || entry.fallbackUrl;
          const el = this.getHiddenClipAudioElement();
          const curSrc = el ? (el.getAttribute('src') || el.src || '') : '';
          if (preloadSrc && (!el || (el.paused && curSrc !== preloadSrc && el.readyState < 1))) {
            this._ensureHiddenClipAudioElement(preloadSrc);
          }
        }
        this._decodeHiddenBuiltInClip(clipKey);
      }
    }

    stopHiddenBuiltInClip() {
      if (this._activeHiddenClipTimer) {
        clearTimeout(this._activeHiddenClipTimer);
        this._activeHiddenClipTimer = null;
      }
      if (this._activeHiddenClipSource) {
        try { this._activeHiddenClipSource.onended = null; } catch (_e0) {}
        try { this._activeHiddenClipSource.stop(0); } catch (_e1) {}
        try { this._activeHiddenClipSource.disconnect(); } catch (_e2) {}
        this._activeHiddenClipSource = null;
      }
      if (this._activeHiddenClipGain) {
        try { this._activeHiddenClipGain.disconnect(); } catch (_e3) {}
        this._activeHiddenClipGain = null;
      }
      const el = this.getHiddenClipAudioElement();
      if (el) {
        try { el.onended = null; el.onerror = null; el.onstalled = null; el.onabort = null; } catch (_e4) {}
        try { if (!el.paused) el.pause(); } catch (_e5) {}
        try { if (el.currentTime !== 0) el.currentTime = 0; } catch (_e6) {}
      }
      this.bgAudioBridge.deactivateKeepAlive('alarm');
    }

    playHiddenBuiltInClip(clipKey, options = {}) {
      const entry = this.getHiddenBuiltInClip(clipKey);
      if (!entry) return { ok: false, engine: '' };
      const mySeq = ++this._hiddenClipPlaySeq;
      this.stopHiddenBuiltInClip();
      // Chỉ đặt audioSession playback, KHÔNG bật mod21-mobile-bg-keepalive song song để tránh xung đột AudioFocus trên Android Brave/Chrome
      this.bgAudioBridge.ensureAudioSessionPlayback();

      const notifyEnded = () => {
        if (mySeq === this._hiddenClipPlaySeq && typeof options.onEnded === 'function') {
          try { options.onEnded({ clipKey }); } catch (_eCb) {}
        }
      };

      const tryWebAudioFallback = (onWebAudioFail) => {
        if (mySeq !== this._hiddenClipPlaySeq) return false;
        try {
          const ctx = this.soundscapeGraph?.ensureContext?.();
          if (ctx && ctx.state === 'suspended' && typeof ctx.resume === 'function') {
            ctx.resume().catch(() => {});
          }
          // Tuyệt đối không gọi src.start(0) khi AudioContext đang suspended (sẽ bị dồn hàng đợi và phát chắp vá ở lần bấm sau!)
          if (ctx && ctx.state === 'running' && entry.audioBuffer && typeof ctx.createBufferSource === 'function') {
            const src = ctx.createBufferSource();
            src.buffer = entry.audioBuffer;
            src.loop = false;
            src.playbackRate.value = 1.0;
            const gain = typeof ctx.createGain === 'function' ? ctx.createGain() : null;
            if (gain) {
              gain.gain.value = 1.0;
              src.connect(gain);
              gain.connect(ctx.destination);
            } else {
              src.connect(ctx.destination);
            }

            const cleanupNode = () => {
              if (this._activeHiddenClipTimer) {
                clearTimeout(this._activeHiddenClipTimer);
                this._activeHiddenClipTimer = null;
              }
              if (mySeq === this._hiddenClipPlaySeq) {
                this._activeHiddenClipSource = null;
                this._activeHiddenClipGain = null;
              }
              try { src.onended = null; src.disconnect(); } catch (_eD0) {}
              try { if (gain) gain.disconnect(); } catch (_eD1) {}
              notifyEnded();
            };

            this._activeHiddenClipSource = src;
            this._activeHiddenClipGain = gain;
            src.onended = cleanupNode;
            const durMs = Math.ceil((entry.durationSec || 3.435) * 1000) + 800;
            this._activeHiddenClipTimer = setTimeout(cleanupNode, durMs);
            src.start(0);
            return true;
          }
        } catch (_eWeb) {}
        if (typeof onWebAudioFail === 'function') onWebAudioFail();
        return false;
      };

      // 1) ƯU TIÊN SỐ 1: Phát trực tiếp qua thẻ HTML5 <audio id="mod21-hidden-clip-player"> của Mục 3
      //    (Đồng bộ 0ms ngay trong UserActivation click gesture — vượt mọi rào cản AudioContext trên Brave/Mobile/iOS/Desktop)
      const playEl = (srcUrl, engineTag, onFail) => {
        const el = this._ensureHiddenClipAudioElement(srcUrl);
        if (!el || !srcUrl) {
          if (typeof onFail === 'function') onFail();
          return false;
        }
        try {
          const curAttr = el.getAttribute('src') || '';
          if (el.src !== srcUrl && curAttr !== srcUrl) {
            el.src = srcUrl;
            try { if (el.load) el.load(); } catch (_eLd) {}
          }
          el.muted = false;
          el.loop = false;
          el.volume = 1.0;
          el.playbackRate = 1.0;
          try {
            if (el.currentTime > 0) el.currentTime = 0;
          } catch (_eCt) {}

          let finished = false;
          const finishEl = () => {
            if (finished) return;
            finished = true;
            if (this._activeHiddenClipTimer) {
              clearTimeout(this._activeHiddenClipTimer);
              this._activeHiddenClipTimer = null;
            }
            try { el.onended = null; el.onerror = null; } catch (_eCl) {}
            try { if (!el.paused) el.pause(); } catch (_ePs) {}
            try { if (el.currentTime !== 0) el.currentTime = 0; } catch (_eZt) {}
            notifyEnded();
          };
          el.onended = finishEl;
          el.onerror = () => {
            if (finished) return;
            finished = true;
            if (this._activeHiddenClipTimer) {
              clearTimeout(this._activeHiddenClipTimer);
              this._activeHiddenClipTimer = null;
            }
            try { el.onended = null; el.onerror = null; } catch (_eCl2) {}
            if (typeof onFail === 'function') onFail();
          };
          this._activeHiddenClipTimer = setTimeout(finishEl, Math.ceil((entry.durationSec || 3.5) * 1000) + 900);
          const p = el.play();
          if (p && typeof p.catch === 'function') {
            p.catch(() => {
              if (finished) return;
              finished = true;
              if (this._activeHiddenClipTimer) {
                clearTimeout(this._activeHiddenClipTimer);
                this._activeHiddenClipTimer = null;
              }
              try { el.onended = null; el.onerror = null; } catch (_eCl3) {}
              if (typeof onFail === 'function') onFail();
            });
          }
          return engineTag;
        } catch (_ePlay) {
          if (typeof onFail === 'function') onFail();
          return false;
        }
      };

      const failChain = () => {
        if (mySeq !== this._hiddenClipPlaySeq) return;
        if (typeof options.onFail === 'function') {
          options.onFail({ clipKey });
        } else {
          notifyEnded();
        }
      };
      const tryRawM4aChain = () => {
        if (mySeq !== this._hiddenClipPlaySeq) return;
        const primary = entry.primarySrc || entry.fallbackUrl;
        let retriedFile = false;
        const runFileOrWebAudio = () => {
          if (retriedFile) return;
          retriedFile = true;
          if (entry.fallbackUrl && primary !== entry.fallbackUrl) {
            playEl(entry.fallbackUrl, 'm4a-file', () => tryWebAudioFallback(failChain));
          } else {
            tryWebAudioFallback(failChain);
          }
        };
        playEl(primary, 'm4a-data', runFileOrWebAudio);
      };
      const tryM4aBlobChain = () => {
        if (mySeq !== this._hiddenClipPlaySeq) return;
        if (entry.m4aBlobUrl && entry.m4aBlobUrl !== entry.wavBlobUrl) {
          if (playEl(entry.m4aBlobUrl, 'm4a-blob', () => tryWebAudioFallback(tryRawM4aChain))) {
            return;
          }
        }
        tryWebAudioFallback(tryRawM4aChain);
      };

      const primaryBlobUrl = entry.wavBlobUrl || entry.m4aBlobUrl;
      if (primaryBlobUrl) {
        const blobTag = entry.wavBlobUrl ? 'wav-audio' : 'm4a-blob';
        const startedTag = playEl(primaryBlobUrl, blobTag, tryM4aBlobChain);
        if (startedTag) {
          return { ok: true, engine: startedTag, audioElement: this._hiddenClipAudioEl, durationSec: entry.durationSec };
        }
      }
      if (tryWebAudioFallback()) {
        return { ok: true, engine: 'webaudio', sourceNode: this._activeHiddenClipSource, durationSec: entry.durationSec };
      }
      if (entry.primarySrc || entry.fallbackUrl) {
        const m4aRes = playEl(entry.primarySrc || entry.fallbackUrl, 'm4a-data', () => {
          if (entry.fallbackUrl && entry.primarySrc !== entry.fallbackUrl) {
            playEl(entry.fallbackUrl, 'm4a-file', failChain);
          } else {
            failChain();
          }
        });
        if (m4aRes) {
          return { ok: true, engine: m4aRes, audioElement: this._hiddenClipAudioEl, durationSec: entry.durationSec };
        }
      }
      return { ok: false, engine: '' };
    }

    /**
     * Tua nhanh hoặc tua lùi theo số giây (ví dụ: -5s hoặc +5s)
     */
    seekRelative(deltaSec) {
      const audioEl = document.getElementById('s8-native-audio-bar');
      if (!audioEl || !audioEl.src) {
        this.notify('💡 Hãy chọn một tệp nhạc .MP3 từ máy trước khi tua!', 'warning');
        return;
      }
      const duration = Number.isFinite(audioEl.duration) ? audioEl.duration : 36000;
      const targetTime = Math.max(0, Math.min(duration, (audioEl.currentTime || 0) + Number(deltaSec || 0)));
      audioEl.currentTime = targetTime;
    }

    /**
     * Đặt tốc độ phát nhạc (0.25x -> 4.0x)
     */
    setSpeed(rate) {
      const clampedRate = Math.max(0.25, Math.min(4.0, Number(rate) || 1.0));
      this.playbackRate = clampedRate;

      const audioEl = document.getElementById('s8-native-audio-bar');
      if (audioEl) {
        audioEl.playbackRate = clampedRate;
      }
      const speedSelect = document.getElementById('s9-audio-speed-select');
      if (speedSelect && speedSelect.value !== String(clampedRate)) {
        speedSelect.value = String(clampedRate);
      }

      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.PLAYBACK_SPEED, String(clampedRate));
      } catch (_err) {
        // Bỏ qua
      }
      this.notify(`⏩ Đã chỉnh tốc độ phát nhạc: ${clampedRate}x`, 'info');
    }

    /**
     * Cập nhật Điểm A và Điểm B từ ô nhập văn bản mm:ss hoặc thanh trượt
     */
    updateABLoopPoints() {
      const sliderA = document.getElementById('s11-slider-point-a');
      const inputA = document.getElementById('s11-input-point-a');
      const sliderB = document.getElementById('s11-slider-point-b');
      const inputB = document.getElementById('s11-input-point-b');
      const audioEl = document.getElementById('s8-native-audio-bar');

      const maxDur =
        audioEl && Number.isFinite(audioEl.duration) && audioEl.duration > 0
          ? Math.floor(audioEl.duration)
          : parseInt(sliderB?.max || '300', 10) || 300;

      let secA = inputA ? this.parseTimeCode(inputA.value, this.pointASec) : this.pointASec;
      let secB = inputB ? this.parseTimeCode(inputB.value, this.pointBSec) : this.pointBSec;

      secA = Math.max(0, Math.min(maxDur - 1, secA));
      secB = Math.max(secA + 1, Math.min(maxDur, secB));

      this.pointASec = secA;
      this.pointBSec = secB;

      this.syncABInputsFromState();
      this.persistABState();

      if (this.abLoopEnabled && audioEl && audioEl.src) {
        if (audioEl.currentTime < this.pointASec || audioEl.currentTime > this.pointBSec) {
          audioEl.currentTime = this.pointASec;
        }
      }
    }

    syncABInputsFromState() {
      const sliderA = document.getElementById('s11-slider-point-a');
      const inputA = document.getElementById('s11-input-point-a');
      const sliderB = document.getElementById('s11-slider-point-b');
      const inputB = document.getElementById('s11-input-point-b');

      if (sliderA) sliderA.value = String(this.pointASec);
      if (inputA) inputA.value = this.formatTimeCode(this.pointASec);
      if (sliderB) sliderB.value = String(this.pointBSec);
      if (inputB) inputB.value = this.formatTimeCode(this.pointBSec);
    }

    persistABState() {
      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.POINT_A_SEC, String(this.pointASec));
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.POINT_B_SEC, String(this.pointBSec));
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.AB_ENABLED, String(this.abLoopEnabled));
      } catch (_err) {
        // Bỏ qua
      }
    }

    /**
     * Bật hoặc tắt chế độ lặp đoạn A -> B
     */
    toggleABLoop(forceState) {
      this.updateABLoopPoints();
      if (typeof forceState === 'boolean') {
        this.abLoopEnabled = forceState;
      } else {
        this.abLoopEnabled = !this.abLoopEnabled;
      }

      const loopModeSelect = document.getElementById('s9-audio-loop-mode');
      if (this.abLoopEnabled) {
        this.loopMode = 'LOOP_AB';
        if (loopModeSelect) loopModeSelect.value = 'LOOP_AB';
      } else {
        this.loopMode = 'LOOP_ALL';
        if (loopModeSelect) loopModeSelect.value = 'LOOP_ALL';
      }

      const audioEl = document.getElementById('s8-native-audio-bar');
      if (audioEl && !this.currentTrackMeta?.isExternalStream) {
        audioEl.loop = !this.abLoopEnabled && this.loopMode === 'LOOP_ALL';
        if (this.abLoopEnabled && audioEl.src) {
          if (audioEl.currentTime < this.pointASec || audioEl.currentTime > this.pointBSec) {
            audioEl.currentTime = this.pointASec;
          }
        }
      }

      this.persistABState();
      this.syncABToggleUI();

      if (this.abLoopEnabled) {
        this.notify(
          `✂️ Đã bật lặp đoạn A ➔ B (${this.formatTimeCode(this.pointASec)} đến ${this.formatTimeCode(this.pointBSec)})`,
          'success'
        );
      } else {
        this.notify('🔁 Đã tắt lặp đoạn A-B (Chuyển về lặp toàn bài).', 'info');
      }
    }

    syncABToggleUI() {
      const abToggleBtn = document.getElementById('btn-s11-ab-toggle');
      if (!abToggleBtn) return;

      if (this.abLoopEnabled) {
        abToggleBtn.className =
          'px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-950/60';
        abToggleBtn.textContent = `🔁 Đang Lặp A-B (${this.formatTimeCode(this.pointASec)}➔${this.formatTimeCode(this.pointBSec)})`;
      } else {
        abToggleBtn.className =
          'px-3 py-1 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white font-bold text-xs';
        abToggleBtn.textContent = '⏹️ Bật Lặp A-B';
      }
    }

    /**
     * Giám sát và ép thời gian phát luôn nằm trong khoảng [A, B] với độ trễ mẫu thấp
     */
    enforceABLoopConstraint(audioEl) {
      if (!audioEl || !audioEl.src) return;
      if (this.currentTrackMeta?.isExternalStream) return;
      if (!this.abLoopEnabled && this.loopMode !== 'LOOP_AB') return;
      if (this.pointBSec <= this.pointASec) return;

      const cur = audioEl.currentTime || 0;
      if (cur >= this.pointBSec || cur < this.pointASec - 0.25) {
        audioEl.currentTime = this.pointASec;
        if (audioEl.paused) {
          audioEl.play().catch(() => {});
        }
      }
    }

    startHighPrecisionABLoopMonitor() {
      if (this.abMonitorRafId) {
        cancelAnimationFrame(this.abMonitorRafId);
        this.abMonitorRafId = null;
      }
      if (this.abBackgroundTimer) clearInterval(this.abBackgroundTimer);

      const checkAB = () => {
        if (!this.abLoopEnabled && this.loopMode !== 'LOOP_AB') return;
        const audioEl = document.getElementById('s8-native-audio-bar');
        if (audioEl && !audioEl.paused) {
          this.enforceABLoopConstraint(audioEl);
        }
      };

      // Dùng 1 bộ hẹn giờ nhẹ 180ms (tự bỏ qua ngay khi không bật Lặp A-B -> tiết kiệm 60FPS CPU cho toàn app!)
      this.abBackgroundTimer = setInterval(checkAB, 180);
    }

    /**
     * Kích hoạt một Preset âm thanh không gian WebAudio ('RAIN', 'PIANO', 'NOIR_MIX', 'FIREPLACE', 'OCEAN', 'OFF')
     */
    setSynthPreset(presetKey) {
      const normalizedKey = SOUNDSCAPE_PRESETS_CATALOG[presetKey] ? presetKey : 'OFF';
      const preset = this.soundscapeGraph.applyPreset(normalizedKey);

      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.SYNTH_PRESET, preset.key);
      } catch (_err) {
        // Bỏ qua
      }

      this.syncSynthPresetButtonsUI();
      this.syncFloatingAudioBarUI();
      this.syncSoundscapeMediaSession();

      if (preset.key === 'OFF') {
        this.notify('🔇 Đã tắt âm thanh không gian WebAudio.', 'info');
      } else {
        this.notify(`🎧 ${preset.statusText} — ${preset.description}`, 'success');
      }
    }

    /**
     * Điều chỉnh âm lượng tổng của bộ tổng hợp không gian (0 -> 100%)
     */
    setSynthVolume(volPercent) {
      const clamped = Math.max(0, Math.min(100, Number(volPercent) || 0));
      this.soundscapeGraph.setMasterVolume(clamped);

      const slider = document.getElementById('synth-volume-slider');
      if (slider && slider.value !== String(clamped)) {
        slider.value = String(clamped);
      }

      const statusEl = document.getElementById('synth-sound-status');
      const preset = SOUNDSCAPE_PRESETS_CATALOG[this.soundscapeGraph.activePresetKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;
      if (statusEl && preset.key !== 'OFF') {
        statusEl.textContent = `${preset.statusText} • ${clamped}%`;
      }

      try {
        localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.SYNTH_VOLUME, String(clamped));
      } catch (_err) {
        // Bỏ qua
      }
      this.syncFloatingAudioBarUI();
    }

    syncSynthPresetButtonsUI() {
      const activeKey = this.soundscapeGraph.activePresetKey;
      const preset = SOUNDSCAPE_PRESETS_CATALOG[activeKey] || SOUNDSCAPE_PRESETS_CATALOG.OFF;

      const statusEl = document.getElementById('synth-sound-status');
      if (statusEl) {
        if (activeKey === 'OFF') {
          statusEl.textContent = 'Đang tắt';
          statusEl.className = 'text-[11px] text-zinc-400';
        } else {
          statusEl.textContent = `${preset.statusText} • ${this.soundscapeGraph.masterVolumePercent}%`;
          statusEl.className = 'text-[11px] font-bold text-emerald-400';
        }
      }

      const btns = document.querySelectorAll('.synth-preset-btn');
      btns.forEach((btn) => {
        const key = btn.getAttribute('data-synth-preset');
        if (key === activeKey && activeKey !== 'OFF') {
          btn.className =
            'synth-preset-btn py-1.5 px-2 rounded-lg border-2 border-emerald-400 bg-emerald-500/20 text-emerald-300 text-[11px] font-extrabold shadow';
        } else if (key === 'OFF') {
          btn.className =
            'synth-preset-btn py-1.5 px-2 rounded-lg border border-rose-500/40 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 text-[11px] font-bold';
        } else {
          btn.className =
            'synth-preset-btn py-1.5 px-2 rounded-lg border border-zinc-800 hover:border-emerald-500 bg-zinc-900 text-zinc-200 text-[11px] font-semibold';
        }
      });
    }

    syncAllAudioUI() {
      this.syncABInputsFromState();
      this.syncABToggleUI();
      this.syncSynthPresetButtonsUI();
      this.syncFloatingAudioBarUI();
    }

    // ========================================================================
    // PHẦN 7: GIAO DIỆN MỞ RỘNG TRONG TAB 5 (BỘ TRỘN 6 KÊNH, PHỔ TẦN SỐ
    //         SPECTRUM 60FPS, CHỌN THANG ÂM PIANO, BÀN PHÍM CƠ ASMR & BOOKMARK)
    // ========================================================================

    injectAdvancedStudioEnhancementsUI() {
      const musicBox = document.getElementById('s14-panel-music-box');
      if (!musicBox || document.getElementById('mod21-advanced-soundscape-deck')) return;

      const deck = document.createElement('div');
      deck.id = 'mod21-advanced-soundscape-deck';
      deck.className =
        'pt-4 mt-2 border-t border-studioLightBorder dark:border-zinc-800 space-y-4 text-xs';

      deck.innerHTML = `
        <!-- Hàng 1: Phổ âm thanh trực quan (Spectrum & A-B Timeline) + Đặt nhanh mốc A/B tại vị trí đang nghe -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
          <div class="lg:col-span-7 p-3.5 rounded-xl bg-studioLightBg dark:bg-zinc-950 border border-emerald-500/30 space-y-2">
            <div class="flex flex-wrap items-center justify-between gap-2">
              <span class="font-extrabold text-emerald-400 flex items-center gap-1.5">
                <span>📊 Phổ Tần Số Thực Thời & Thanh Trực Quan Đoạn Lặp A ➔ B</span>
              </span>
              <div class="flex items-center gap-1.5">
                <button type="button" id="btn-mod21-capture-point-a" class="px-2 py-1 rounded bg-emerald-600/20 border border-emerald-500/40 hover:bg-emerald-600/30 text-emerald-300 font-bold text-[10px]" title="Lấy thời điểm nhạc đang phát hiện tại làm Điểm A">
                  📍 Đặt A tại giây đang nghe
                </button>
                <button type="button" id="btn-mod21-capture-point-b" class="px-2 py-1 rounded bg-amber-600/20 border border-amber-500/40 hover:bg-amber-600/30 text-amber-300 font-bold text-[10px]" title="Lấy thời điểm nhạc đang phát hiện tại làm Điểm B">
                  📍 Đặt B tại giây đang nghe
                </button>
                <button type="button" id="btn-mod21-bookmark-moment" class="px-2 py-1 rounded bg-indigo-600/20 border border-indigo-500/40 hover:bg-indigo-600/30 text-indigo-300 font-bold text-[10px]" title="Đánh dấu đoạn nhạc cao trào này cho phân cảnh đang viết">
                  ⭐ Lưu mốc nhạc
                </button>
              </div>
            </div>
            <canvas id="mod21-audio-spectrum-canvas" width="560" height="80" class="w-full h-20 rounded-lg bg-zinc-900/90 border border-zinc-800 block"></canvas>
            <div id="mod21-bookmarks-strip" class="flex items-center gap-1.5 flex-wrap text-[10px] text-zinc-400">
              <span>Chưa có mốc đánh dấu bài hát. Bấm "⭐ Lưu mốc nhạc" để ghim đoạn nhạc cảm xúc.</span>
            </div>
          </div>

          <!-- Bàn phím cơ ASMR, Thang âm Piano & Sóng não Binaural -->
          <div class="lg:col-span-5 p-3.5 rounded-xl bg-studioLightBg dark:bg-zinc-950 border border-indigo-500/30 space-y-2.5">
            <div class="font-extrabold text-indigo-400">⌨️ Âm Thanh Gõ Phím Cơ ASMR & Tần Số Tập Trung:</div>

            <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label class="block text-[10px] font-bold text-zinc-400 mb-1">Công tắc bàn phím khi gõ:</label>
                <select id="mod21-select-asmr-switch" class="noir-dark-select w-full px-2 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 font-semibold text-[11px] text-white">
                  ${Object.values(ASMR_KEYBOARD_PROFILES)
                    .map((p) => `<option value="${p.id}">${p.label}</option>`)
                    .join('')}
                </select>
              </div>

              <div>
                <label class="block text-[10px] font-bold text-zinc-400 mb-1">Màu sắc hợp âm Piano:</label>
                <select id="mod21-select-piano-mood" class="noir-dark-select w-full px-2 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 font-semibold text-[11px] text-white">
                  ${Object.values(GENERATIVE_PIANO_MOODS)
                    .map((m) => `<option value="${m.id}">${m.name}</option>`)
                    .join('')}
                </select>
              </div>
            </div>

            <div>
              <label class="block text-[10px] font-bold text-zinc-400 mb-1">Sóng não Binaural hỗ trợ trạng thái Flow:</label>
              <select id="mod21-select-binaural-mode" class="noir-dark-select w-full px-2 py-1.5 rounded-lg border border-zinc-700 bg-zinc-950 font-semibold text-[11px] text-white">
                ${Object.values(BINAURAL_FOCUS_MODES)
                  .map((b) => `<option value="${b.id}">${b.label}</option>`)
                  .join('')}
              </select>
            </div>
          </div>
        </div>

        <!-- Hàng 2: Bộ sưu tập 8 Bối cảnh Âm thanh Văn học chọn lọc (1-Click Literary Scenes) -->
        <div class="p-3.5 rounded-xl bg-studioLightBg dark:bg-zinc-950 border border-studioLightBorder dark:border-zinc-800 space-y-2.5">
          <div class="flex flex-wrap items-center justify-between gap-2">
            <span class="font-extrabold text-amber-400">🎬 Kho Bối Cảnh Âm Thanh Theo Phân Cảnh Truyện (1-Click Literary Soundscapes):</span>
            <span class="text-[10px] text-zinc-400">Tự động phối trộn 6 kênh âm thanh + chọn thang âm Piano phù hợp với tâm trạng chương truyện</span>
          </div>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
            ${CURATED_LITERARY_SOUND_SCENES.map(
              (scene) => `
              <button type="button" data-literary-scene="${scene.id}" class="mod21-scene-card p-2.5 rounded-xl border border-zinc-800 hover:border-amber-500/60 bg-zinc-900/80 hover:bg-amber-500/10 text-left transition flex flex-col justify-between gap-1">
                <div>
                  <div class="font-extrabold text-[11px] text-emerald-300">${scene.title}</div>
                  <div class="text-[9px] font-bold uppercase text-amber-400/90 mt-0.5">${scene.genreTag}</div>
                </div>
                <div class="text-[10px] text-zinc-400 line-clamp-2 leading-snug">${scene.description}</div>
              </button>
            `
            ).join('')}
          </div>
        </div>
      `;

      musicBox.appendChild(deck);

      // Gắn sự kiện cho các nút vừa tạo
      const capABtn = document.getElementById('btn-mod21-capture-point-a');
      const capBBtn = document.getElementById('btn-mod21-capture-point-b');
      const bookmarkBtn = document.getElementById('btn-mod21-bookmark-moment');
      const asmrSelect = document.getElementById('mod21-select-asmr-switch');
      const moodSelect = document.getElementById('mod21-select-piano-mood');
      const binauralSelect = document.getElementById('mod21-select-binaural-mode');

      if (capABtn) {
        capABtn.addEventListener('click', () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (!audioEl || !audioEl.src) {
            this.notify('💡 Hãy nạp một bài nhạc .MP3 trước khi đặt Điểm A!', 'warning');
            return;
          }
          const cur = Math.floor(audioEl.currentTime || 0);
          this.pointASec = cur;
          if (this.pointBSec <= this.pointASec) {
            this.pointBSec = Math.min(Math.floor(audioEl.duration || cur + 30), cur + 15);
          }
          this.syncABInputsFromState();
          this.persistABState();
          this.notify(`📍 Đã đặt Điểm A tại ${this.formatTimeCode(this.pointASec)}`, 'success');
        });
      }

      if (capBBtn) {
        capBBtn.addEventListener('click', () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (!audioEl || !audioEl.src) {
            this.notify('💡 Hãy nạp một bài nhạc .MP3 trước khi đặt Điểm B!', 'warning');
            return;
          }
          const cur = Math.max(this.pointASec + 1, Math.floor(audioEl.currentTime || 1));
          this.pointBSec = cur;
          this.syncABInputsFromState();
          this.persistABState();
          this.notify(`📍 Đã đặt Điểm B tại ${this.formatTimeCode(this.pointBSec)}`, 'success');
        });
      }

      if (bookmarkBtn) {
        bookmarkBtn.addEventListener('click', () => {
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (!audioEl || !audioEl.src) {
            this.notify('💡 Hãy phát một bài nhạc .MP3 để đánh dấu mốc thời gian!', 'warning');
            return;
          }
          const sec = Math.floor(audioEl.currentTime || 0);
          this.trackBookmarks.push({
            id: 'bm_' + Date.now(),
            sec,
            label: `Mốc ${this.formatTimeCode(sec)}`
          });
          this.renderPlaylistAndBookmarksUI();
          this.notify(`⭐ Đã lưu mốc nhạc tại ${this.formatTimeCode(sec)}!`, 'success');
        });
      }

      if (asmrSelect) {
        asmrSelect.value = this.keyboardAsmr.activeProfileKey;
        asmrSelect.addEventListener('change', (ev) => {
          const profileKey = ev.target.value;
          this.keyboardAsmr.setProfile(profileKey);
          const profile = ASMR_KEYBOARD_PROFILES[profileKey] || ASMR_KEYBOARD_PROFILES.OFF;
          if (profile.id !== 'OFF') {
            this.keyboardAsmr.triggerKeystrokeSound('a', 'KeyA');
            this.notify(`⌨️ Đã bật âm gõ phím: ${profile.label}`, 'success');
          } else {
            this.notify('🔇 Đã tắt âm thanh gõ phím cơ ASMR.', 'info');
          }
        });
      }

      if (moodSelect) {
        moodSelect.value = this.soundscapeGraph.currentPianoMoodKey;
        moodSelect.addEventListener('change', (ev) => {
          const moodKey = ev.target.value;
          if (GENERATIVE_PIANO_MOODS[moodKey]) {
            this.soundscapeGraph.currentPianoMoodKey = moodKey;
            try {
              localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.PIANO_SCALE_MOOD, moodKey);
            } catch (_e) {
              // Bỏ qua
            }
            if (this.soundscapeGraph.isRunning) {
              this.soundscapeGraph.restartStochasticSchedulers();
            }
            this.notify(`🎹 Đã chuyển thang âm Piano sang: ${GENERATIVE_PIANO_MOODS[moodKey].name}`, 'success');
          }
        });
      }

      if (binauralSelect) {
        binauralSelect.value = this.soundscapeGraph.currentBinauralKey;
        binauralSelect.addEventListener('change', (ev) => {
          const mode = this.soundscapeGraph.setBinauralFocusMode(ev.target.value);
          try {
            localStorage.setItem(AUDIO_STUDIO_STORAGE_KEYS.BINAURAL_MODE, mode.id);
          } catch (_e) {
            // Bỏ qua
          }
          if (mode.id === 'OFF') {
            this.notify('🔇 Đã tắt tần số sóng não Binaural.', 'info');
          } else {
            this.notify(`${mode.label}: ${mode.desc}`, 'success');
          }
        });
      }

      const sceneCards = deck.querySelectorAll('.mod21-scene-card');
      sceneCards.forEach((card) => {
        card.addEventListener('click', () => {
          const sceneId = card.getAttribute('data-literary-scene');
          const scene = CURATED_LITERARY_SOUND_SCENES.find((s) => s.id === sceneId);
          if (!scene) return;

          this.soundscapeGraph.layerUserMultipliers = Object.assign(
            { rain: 1, thunder: 1, piano: 1, pad: 1, fireplace: 1, ocean: 1 },
            scene.mix
          );
          this.soundscapeGraph.currentPianoMoodKey = scene.pianoMood;
          if (moodSelect) moodSelect.value = scene.pianoMood;

          this.setSynthPreset(scene.basePreset);
          if (scene.binaural) {
            this.soundscapeGraph.setBinauralFocusMode(scene.binaural);
            if (binauralSelect) binauralSelect.value = scene.binaural;
          }
          this.notify(`🎬 Đã kích hoạt bối cảnh: ${scene.title} (${scene.genreTag})`, 'success');
        });
      });
    }

    renderPlaylistAndBookmarksUI() {
      const strip = document.getElementById('mod21-bookmarks-strip');
      if (!strip) return;

      if (this.trackBookmarks.length === 0 && this.trackHistory.length === 0) {
        strip.innerHTML =
          '<span>Chưa có mốc đánh dấu bài hát. Bấm "⭐ Lưu mốc nhạc" để ghim đoạn nhạc cảm xúc.</span>';
        return;
      }

      const bmHtml = this.trackBookmarks
        .map(
          (bm) => `
          <button type="button" data-jump-sec="${bm.sec}" class="px-2 py-0.5 rounded-md bg-indigo-500/20 border border-indigo-500/40 hover:bg-indigo-500/35 text-indigo-300 font-monoCode font-bold">
            ⭐ ${bm.label}
          </button>
        `
        )
        .join('');

      strip.innerHTML = `
        <span class="font-bold text-emerald-400">🎵 ${this.currentTrackMeta.name}:</span>
        ${bmHtml || '<span class="text-zinc-500">Chưa ghim mốc thời gian</span>'}
      `;

      strip.querySelectorAll('[data-jump-sec]').forEach((btn) => {
        btn.addEventListener('click', () => {
          const sec = parseInt(btn.getAttribute('data-jump-sec') || '0', 10);
          const audioEl = document.getElementById('s8-native-audio-bar');
          if (audioEl && audioEl.src) {
            audioEl.currentTime = sec;
            audioEl.play().catch(() => {});
          }
        });
      });
    }

    /**
     * Vòng lặp vẽ biểu đồ phổ tần số 36 cột & Thanh tiến trình đoạn lặp A-B
     */
    startSpectrumVisualizerLoop() {
      if (this.visualizerRafId) cancelAnimationFrame(this.visualizerRafId);

      const freqData = new Uint8Array(64);

      const renderFrame = () => {
        const canvas = document.getElementById('mod21-audio-spectrum-canvas');
        const musicPanel = document.getElementById('s14-panel-music-box');
        const tab5Section = document.getElementById('s14-screen-5-ambience');

        const isVisible =
          !document.hidden &&
          canvas &&
          musicPanel &&
          !musicPanel.classList.contains('hidden') &&
          tab5Section &&
          !tab5Section.classList.contains('hidden');

        if (!isVisible) {
          // Khi không ở Tab 5 hoặc tab đang ẩn -> ngủ đông 700ms thay vì chạy 60FPS gây lag toàn app!
          this.visualizerIdleTimer = setTimeout(() => {
            this.visualizerRafId = requestAnimationFrame(renderFrame);
          }, 700);
          return;
        }

        if (isVisible) {
          const audioElCheck = document.getElementById('s8-native-audio-bar');
          const hasAnyAudioPlaying = Boolean(
            (audioElCheck && !audioElCheck.paused) ||
            (this.soundscapeGraph && this.soundscapeGraph.isRunning)
          );
          if (!hasAnyAudioPlaying && this._visualizerStaticDrawnOnce) {
            this.visualizerIdleTimer = setTimeout(() => {
              this.visualizerRafId = requestAnimationFrame(renderFrame);
            }, 600);
            return;
          }
          this._visualizerStaticDrawnOnce = !hasAnyAudioPlaying;
          const ctx2d = canvas.getContext('2d');
          const w = canvas.width;
          const h = canvas.height;
          ctx2d.clearRect(0, 0, w, h);

          // Nền tối tinh tế
          ctx2d.fillStyle = 'rgba(9, 9, 11, 0.85)';
          ctx2d.fillRect(0, 0, w, h);

          // Vẽ vùng đánh dấu đoạn lặp A -> B trên nền biểu đồ
          const audioEl = document.getElementById('s8-native-audio-bar');
          const totalDur =
            audioEl && Number.isFinite(audioEl.duration) && audioEl.duration > 0
              ? audioEl.duration
              : Math.max(60, this.pointBSec);

          const xA = Math.max(0, Math.min(w, (this.pointASec / totalDur) * w));
          const xB = Math.max(xA + 2, Math.min(w, (this.pointBSec / totalDur) * w));

          ctx2d.fillStyle = this.abLoopEnabled
            ? 'rgba(16, 185, 129, 0.16)'
            : 'rgba(245, 158, 11, 0.08)';
          ctx2d.fillRect(xA, 0, xB - xA, h);

          // Vạch A và Vạch B
          ctx2d.fillStyle = '#10b981';
          ctx2d.fillRect(xA, 0, 2, h);
          ctx2d.fillStyle = '#f59e0b';
          ctx2d.fillRect(xB - 2, 0, 2, h);

          // Vẽ 36 cột phổ âm thanh (từ WebAudio Analyser hoặc mô phỏng nhịp nhạc MP3)
          let hasRealtimeSpectrum = false;
          if (this.soundscapeGraph.isRunning && this.soundscapeGraph.analyserNode) {
            this.soundscapeGraph.analyserNode.getByteFrequencyData(freqData);
            hasRealtimeSpectrum = true;
          }

          const barCount = 36;
          const barWidth = Math.floor((w - barCount * 3) / barCount);
          const nowMs = performance.now();

          for (let i = 0; i < barCount; i++) {
            let normVal = 0.06;
            if (hasRealtimeSpectrum) {
              normVal = Math.max(0.06, (freqData[i] || 0) / 255);
            } else if (audioEl && !audioEl.paused) {
              // Sóng nhịp điệu mềm mại khi phát MP3
              const wave1 = Math.sin(nowMs * 0.005 + i * 0.35) * 0.5 + 0.5;
              const wave2 = Math.cos(nowMs * 0.003 - i * 0.2) * 0.5 + 0.5;
              normVal = 0.12 + wave1 * wave2 * 0.68;
            }

            const barH = Math.max(4, Math.floor(normVal * (h - 14)));
            const bx = 6 + i * (barWidth + 3);
            const by = h - barH - 4;

            ctx2d.fillStyle = i % 2 === 0 ? 'rgba(16, 185, 129, 0.78)' : 'rgba(99, 102, 241, 0.75)';
            ctx2d.fillRect(bx, by, barWidth, barH);
          }

          // Kim chỉ vị trí phát hiện tại của MP3
          if (audioEl && audioEl.src && totalDur > 0) {
            const playheadX = Math.max(0, Math.min(w - 2, ((audioEl.currentTime || 0) / totalDur) * w));
            ctx2d.fillStyle = '#ffffff';
            ctx2d.fillRect(playheadX, 0, 2, h);
          }
        }

        this.visualizerRafId = requestAnimationFrame(renderFrame);
      };

      this.visualizerRafId = requestAnimationFrame(renderFrame);
    }
  }

  // ==========================================================================
  // PHẦN 8: KHỞI TẠO ĐỐI TƯỢNG & ĐĂNG KÝ VÀO KHÔNG GIAN TÊN WINDOW.NOIRSTUDIO
  // ==========================================================================

  const audioStudio = new AudioPlayerAndWebAudioSoundscapeEngine();
  window.NoirStudio.AudioPlayerAndWebAudioSoundscapeEngine = AudioPlayerAndWebAudioSoundscapeEngine;
  window.NoirStudio.audioStudio = audioStudio;
  window.NoirStudio.audioBackgroundBridge = audioStudio.bgAudioBridge;
  window.NoirStudio.loadExternalAudioStream = (payload) => audioStudio.loadExternalAudioStream(payload);
  window.NoirStudio.playExternalStreamInMp3Engine = (payload) => audioStudio.loadExternalAudioStream(payload);
  window.NoirStudio.unlockExternalAudioGesture = () => audioStudio.unlockExternalAudioGesture();
  window.NoirStudio.onTab5StreamSignal = (signal) => audioStudio.onTab5StreamSignal(signal);

  if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
    window.addEventListener('mod39:stream-signal', (ev) => {
      if (ev && ev.detail) {
        audioStudio.onTab5StreamSignal(ev.detail);
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      audioStudio.init();
    });
  } else {
    audioStudio.init();
  }
})();
