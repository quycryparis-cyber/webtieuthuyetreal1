/**
 * ============================================================================
 * STREAM FETCHER ENGINE — YOUTUBE DIRECT STREAM MULTI-INSTANCE FAILOVER
 * ============================================================================
 * Tác vụ:
 *  - Nhận videoId của YouTube, xoay vòng nhiều server Piped API & Invidious API
 *    (cộng thêm server tự host do người dùng nhập nếu có) với AbortController 4s.
 *  - Bóc tách đồng thời videoStreamUrl (ưu tiên MP4 H.264 muxed hoặc HLS .m3u8
 *    tương thích Safari iOS + Chrome Android) và audioStreamUrl (ưu tiên M4A/MP4A).
 *  - Tự động phát hiện trạng thái YouTube chặn IP máy chủ công cộng (LOGIN_REQUIRED /
 *    403 / 429 / 500) và trả fallback: true để hệ thống chuyển an toàn về iframe.
 * ============================================================================
 */
(function initNoirStudioStreamFetcher(global) {
  'use strict';

  const NS = (global.NoirStudio = global.NoirStudio || {});

  const DEFAULT_TIMEOUT_MS = 8500;
  const ENDPOINT_RACE_BATCH_SIZE = 28;
  const STREAM_CACHE_TTL_MS = 90 * 60 * 1000; // 90 phút fallback nếu link không có ?expire=
  const STREAM_EXPIRY_SAFETY_MS = 5 * 60 * 1000; // Trừ hao 5 phút trước khi link Google hết hạn
  const CUSTOM_SERVER_STORAGE_KEY = 'noir_v39_custom_stream_server';
  const CACHE_KEY_PREFIX = 'mod39_yt_direct_streams_v5_';
  const STREAM_IDB_NAME = 'NoirYtStreamCacheDB';
  const STREAM_IDB_STORE = 'streams';
  const STREAM_IDB_VERSION = 1;

  const CLOUDFLARE_WORKER_TEMPLATE = `// Cloudflare Worker (Miễn phí) — Bóc tách đa-client Innertube & Proxy Range YouTube cho Web Tiểu Thuyết Bi
// Cách dùng: Đăng nhập dash.cloudflare.com -> Workers & Pages -> Create Worker -> Dán code này -> Deploy -> Copy URL *.workers.dev dán vào ô Nguồn Luồng PiP.
export default {
  async fetch(request) {
    const cors = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range, Content-Type',
      'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges'
    };
    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors });

    const reqUrl = new URL(request.url);
    const proxyTarget = reqUrl.searchParams.get('proxy');
    if (proxyTarget) {
      const fwdHeaders = new Headers({
        'User-Agent': 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip'
      });
      const range = request.headers.get('Range');
      if (range) fwdHeaders.set('Range', range);
      const upstream = await fetch(proxyTarget, { headers: fwdHeaders });
      const resHeaders = new Headers(cors);
      ['Content-Type', 'Content-Length', 'Content-Range', 'Accept-Ranges'].forEach((h) => {
        const v = upstream.headers.get(h);
        if (v) resHeaders.set(h, v);
      });
      return new Response(upstream.body, { status: upstream.status, headers: resHeaders });
    }

    const pathMatch = reqUrl.pathname.match(/\\/streams\\/([a-zA-Z0-9_-]{6,})/);
    const videoId = reqUrl.searchParams.get('videoId') || reqUrl.searchParams.get('v') || (pathMatch && pathMatch[1]) || '';
    if (!videoId) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing videoId' }), {
        status: 400, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }

    const clients = [
      {
        ua: 'com.google.android.apps.youtube.vr.oculus/1.60.19 (Linux; U; Android 12L; eureka-user Build/SQ3A.220605.009.A1) gzip',
        client: { clientName: 'ANDROID_VR', clientVersion: '1.60.19', androidSdkVersion: 32, hl: 'vi', gl: 'VN' }
      },
      {
        ua: 'com.google.ios.youtube/20.10.4 (iPhone16,2; U; CPU iOS 18_3_1 like Mac OS X)',
        client: { clientName: 'IOS', clientVersion: '20.10.4', deviceMake: 'Apple', deviceModel: 'iPhone16,2', hl: 'vi', gl: 'VN' }
      },
      {
        ua: 'Mozilla/5.0 (SMART-TV; Linux; Tizen 6.5) AppleWebKit/538.1 (KHTML, like Gecko) Safari/538.1',
        client: { clientName: 'TVHTML5_SIMPLY_EMBEDDED_PLAYER', clientVersion: '2.0', hl: 'vi', gl: 'VN' }
      },
      {
        ua: 'com.google.android.youtube/19.29.37 (Linux; U; Android 14) gzip',
        client: { clientName: 'ANDROID', clientVersion: '19.29.37', androidSdkVersion: 34, hl: 'vi', gl: 'VN' }
      }
    ];

    try {
      let lastStatus = 403;
      let lastReason = 'LOGIN_REQUIRED';
      for (const cfg of clients) {
        const ytRes = await fetch('https://www.youtube.com/youtubei/v1/player?prettyPrint=false', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'User-Agent': cfg.ua },
          body: JSON.stringify({ videoId, context: { client: cfg.client } })
        });
        const data = await ytRes.json();
        const status = data?.playabilityStatus?.status;
        if (status && status !== 'OK') {
          lastStatus = 403;
          lastReason = data?.playabilityStatus?.reason || status;
          continue;
        }
        const sd = data?.streamingData || {};
        const formats = Array.isArray(sd.formats) ? sd.formats : [];
        const adaptive = Array.isArray(sd.adaptiveFormats) ? sd.adaptiveFormats : [];
        const bestMuxed = formats.find((f) => f.url && String(f.mimeType || '').includes('video/mp4')) || formats.find((f) => f.url);
        const bestAdaptiveH264 = adaptive.find((f) => f.url && String(f.mimeType || '').includes('video/mp4') && String(f.mimeType || '').includes('avc1'));
        const bestAudio =
          adaptive.find((f) => f.url && String(f.mimeType || '').includes('audio/mp4')) ||
          adaptive.find((f) => f.url && String(f.mimeType || '').startsWith('audio/')) ||
          bestMuxed;
        if (!bestMuxed?.url && !bestAdaptiveH264?.url && !bestAudio?.url && !sd.hlsManifestUrl) continue;

        const toProxy = (u) => (u ? reqUrl.origin + '/?proxy=' + encodeURIComponent(u) : '');
        const vd = data?.videoDetails || {};
        const primaryVideo = bestMuxed?.url || bestAdaptiveH264?.url || '';
        return new Response(JSON.stringify({
          ok: true,
          videoId,
          title: vd.title || '',
          durationSec: Number(vd.lengthSeconds) || 0,
          isLive: Boolean(vd.isLiveContent || (sd.hlsManifestUrl && !formats.length && !adaptive.length)),
          videoStreamUrl: toProxy(primaryVideo),
          muxedVideoUrl: toProxy(bestMuxed?.url || ''),
          adaptiveVideoUrl: toProxy(bestAdaptiveH264?.url || ''),
          requiresPairedAudio: Boolean(!bestMuxed?.url && bestAdaptiveH264?.url && bestAudio?.url),
          audioStreamUrl: toProxy(bestAudio?.url || bestMuxed?.url || ''),
          hlsUrl: sd.hlsManifestUrl || '',
          thumbnailUrl: 'https://i.ytimg.com/vi/' + videoId + '/hqdefault.jpg'
        }), { status: 200, headers: { ...cors, 'Content-Type': 'application/json' } });
      }

      return new Response(JSON.stringify({ ok: false, error: lastReason }), {
        status: lastStatus, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    } catch (err) {
      return new Response(JSON.stringify({ ok: false, error: String(err?.message || err) }), {
        status: 500, headers: { ...cors, 'Content-Type': 'application/json' }
      });
    }
  }
};`;

  const COBALT_INSTANCES = Object.freeze([
    'https://rue-cobalt.xenon.zone',
    'https://cobaltapi.cjs.nz'
  ]);

  const INVIDIOUS_INSTANCES = Object.freeze([
    'https://yt.chocolatemoo53.com',
    'https://inv.nadeko.net',
    'https://invidious.nerdvpn.de',
    'https://invidious.tiekoetter.com'
  ]);

  const PIPED_INSTANCES = Object.freeze([
    'https://api.piped.private.coffee',
    'https://pipedapi.ducks.party',
    'https://pipedapi.reallyaweso.me',
    'https://pipedapi.adminforge.de',
    'https://pipedapi.tokhmi.xyz',
    'https://piped-api.garudalinux.org',
    'https://pipedapi.kavin.rocks'
  ]);

  function normalizeOriginUrl(rawUrl) {
    const clean = String(rawUrl || '').trim().replace(/\/+$/, '');
    if (!clean) return '';
    try {
      const parsed = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`);
      if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return '';
      return parsed.origin;
    } catch (_err) {
      return '';
    }
  }

  function inferSourceTypeFromOrigin(origin) {
    const lower = String(origin || '').toLowerCase();
    if (lower.includes('inv') || lower.includes('chocolatemoo')) return 'invidious';
    return 'piped';
  }

  function isUnplayableMirrorUrl(rawUrl) {
    const u = String(rawUrl || '').toLowerCase();
    return !u || u.includes('player.odycdn.com') || u.includes('odycdn.com/v6/streams/');
  }

  function scoreVideoStreamCandidate(item, allowVideoOnly = false) {
    if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return -1;
    if (!allowVideoOnly && item.videoOnly === true) return -1;
    const mime = String(item.mimeType || item.type || item.format || '').toLowerCase();
    if (allowVideoOnly && !mime.startsWith('video/')) return -1;
    const codecs = String(item.codec || mime).toLowerCase();
    const qualityStr = String(item.quality || item.qualityLabel || '');
    const heightMatch = qualityStr.match(/(\d{3,4})p/);
    const height = Number(item.height) || (heightMatch ? Number(heightMatch[1]) : 360);

    let score = 0;
    // Ưu tiên tuyệt đối MP4/H.264 vì chạy ổn định trên cả iOS Safari (HLS/MP4) lẫn Chrome Android
    if (mime.includes('mp4') || mime.includes('mpeg4')) score += 100000;
    else if (mime.includes('webm')) score += 40000;
    // Ưu tiên tuyệt đối H.264/AVC1 trong MP4 cho bộ giải mã phần cứng di động (tránh AV1 4K gây giật/treo); trừ điểm VP9/AV1 nếu có MP4 H.264
    if (codecs.includes('avc1') || codecs.includes('h264')) score += 25000;
    else if (codecs.includes('av01') || codecs.includes('vp09') || codecs.includes('vp9')) score -= 30000;

    // Cân bằng chất lượng tối ưu cho PiP & mobile (720p/480p > 360p > 1080p nặng; tránh >1080p)
    if (height >= 480 && height <= 720) score += 15000 + height;
    else if (height >= 360 && height < 480) score += 12000 + height;
    else if (height > 720 && height <= 1080) score += 9000 + height;
    else if (height > 1080) score -= 5000;
    else score += Math.max(0, height);

    if (item.proxyUrl || String(item.url).includes('videoplayback')) {
      score += 500;
    }
    return score;
  }

  function scoreAudioStreamCandidate(item) {
    if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return -1;
    const mime = String(item.mimeType || item.type || item.format || '').toLowerCase();
    const bitrate = Number(item.bitrate) || 0;
    // Ưu tiên M4A / AAC / MP4A cho WebKit/iOS Safari khi chạy nền
    const iosBonus =
      mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac')
        ? 1000000
        : mime.includes('webm') || mime.includes('opus')
          ? 200000
          : 0;
    return iosBonus + bitrate;
  }

  function canBrowserPlayHlsNatively() {
    if (typeof document === 'undefined') return false;
    try {
      const v = document.createElement('video');
      return Boolean(
        v &&
          typeof v.canPlayType === 'function' &&
          (v.canPlayType('application/vnd.apple.mpegurl') || v.canPlayType('application/x-mpegURL'))
      );
    } catch (_e) {
      return false;
    }
  }

  function parseDurationSeconds(rawDuration) {
    const num = Number(rawDuration);
    if (!Number.isFinite(num) || num <= 0) return 0;
    return Math.floor(num);
  }

  function extractFromPipedPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;

    const hlsUrl = typeof payload.hls === 'string' && payload.hls.startsWith('http') ? payload.hls : '';
    const isLive = Boolean(
      payload.livestream === true ||
        payload.isLive === true ||
        Number(payload.duration) === -1
    );

    const videoList = Array.isArray(payload.videoStreams) ? payload.videoStreams : [];
    const muxedVideos = videoList
      .filter((item) => {
        if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return false;
        if (item.videoOnly === true) return false;
        const fmt = String(item.format || '').toUpperCase();
        const mime = String(item.mimeType || item.type || '').toLowerCase();
        const urlLower = String(item.url || '').toLowerCase();
        return fmt === 'MPEG_4' || mime.includes('mp4') || (!fmt && !mime && urlLower.includes('.mp4'));
      })
      .map((item) => ({ item, score: scoreVideoStreamCandidate(item, false) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    const adaptiveVideos = videoList
      .filter((item) => {
        if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return false;
        if (item.videoOnly !== true) return false;
        const fmt = String(item.format || '').toUpperCase();
        const mime = String(item.mimeType || item.type || '').toLowerCase();
        return (
          fmt === 'MPEG_4' ||
          mime.includes('video/mp4') ||
          mime.includes('video/webm')
        );
      })
      .map((item) => ({ item, score: scoreVideoStreamCandidate(item, true) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    const audioList = Array.isArray(payload.audioStreams) ? payload.audioStreams : [];
    const rankedAudios = audioList
      .filter((item) => {
        if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return false;
        const mime = String(item.mimeType || item.type || item.format || '').toLowerCase();
        return !mime || mime.includes('mp4') || mime.includes('m4a') || mime.includes('aac') || mime.startsWith('audio/');
      })
      .map((item) => ({ item, score: scoreAudioStreamCandidate(item) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    const muxedVideoUrl = muxedVideos[0]?.item?.url || '';
    const alternateMuxedUrls = muxedVideos
      .map((entry) => entry?.item?.url || '')
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 6);
    const alternateAdaptiveVideoUrls = adaptiveVideos
      .map((entry) => entry?.item?.url || '')
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 8);
    const adaptiveVideoUrl = alternateAdaptiveVideoUrls[0] || '';
    const rankedAudioUrls = rankedAudios
      .map((entry) => entry?.item?.url || '')
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx);
    const playableHlsUrl = canBrowserPlayHlsNatively() ? hlsUrl : '';
    const alternateAudioUrls = [...rankedAudioUrls, ...alternateMuxedUrls, playableHlsUrl]
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 8);
    const audioStreamUrl = rankedAudioUrls[0] || muxedVideoUrl || playableHlsUrl || '';
    const videoStreamUrl = isLive && playableHlsUrl ? playableHlsUrl : muxedVideoUrl || playableHlsUrl || adaptiveVideoUrl || '';
    const requiresPairedAudio = Boolean(!muxedVideoUrl && !(isLive && playableHlsUrl) && adaptiveVideoUrl && audioStreamUrl);

    if (!videoStreamUrl && !audioStreamUrl) return null;

    return {
      videoStreamUrl,
      muxedVideoUrl,
      alternateMuxedUrls,
      adaptiveVideoUrl,
      alternateAdaptiveVideoUrls,
      audioStreamUrl,
      alternateAudioUrls,
      requiresPairedAudio,
      hlsUrl,
      isLive,
      title: String(payload.title || '').trim(),
      durationSec: isLive ? 0 : parseDurationSeconds(payload.duration || payload.lengthSeconds),
      thumbnailUrl: String(payload.thumbnailUrl || '').trim()
    };
  }

  function extractFromInvidiousPayload(payload, videoId = '', instanceOrigin = '') {
    if (!payload || typeof payload !== 'object') return null;

    const vid = String(videoId || payload.videoId || '').trim();
    const origin = normalizeOriginUrl(instanceOrigin);
    const hlsUrl =
      typeof payload.hlsUrl === 'string' && payload.hlsUrl.startsWith('http') ? payload.hlsUrl : '';
    const isLive = Boolean(payload.liveNow === true || payload.isUpcoming === true || (Number(payload.lengthSeconds) === 0 && hlsUrl));

    // Khối xử lý 2: Invidious formatStreams (Muxed) + adaptiveFormats (Audio m4a & Video H.264 tách luồng khi formatStreams rỗng)
    const formatList = Array.isArray(payload.formatStreams) ? payload.formatStreams : [];
    const muxedVideos = formatList
      .filter((item) => {
        if (!item || !item.url || isUnplayableMirrorUrl(item.url)) return false;
        const container = String(item.container || '').toLowerCase();
        const type = String(item.type || item.mimeType || '').toLowerCase();
        return !container || container === 'mp4' || type.includes('mp4');
      })
      .map((item) => {
        const itag = String(item.itag || '');
        const itagBonus = itag === '18' ? 50000 : itag === '22' ? 45000 : 0;
        return { item, score: scoreVideoStreamCandidate(item, false) + itagBonus };
      })
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    const allAdaptive = Array.isArray(payload.adaptiveFormats) ? payload.adaptiveFormats : [];
    const adaptiveAudioList = allAdaptive.filter((f) => {
      const t = String(f?.type || '').toLowerCase();
      return t.startsWith('audio/mp4') || t.startsWith('audio/');
    });
    const rankedAudios = adaptiveAudioList
      .map((item) => ({ item, score: scoreAudioStreamCandidate(item) }))
      .filter((entry) => entry.score >= 0)
      .sort((a, b) => b.score - a.score);

    // Trích xuất video-only từ adaptiveFormats (ưu tiên H.264/MP4 itag 135/134/136/133, dự phòng WebM VP8/VP9)
    // để Tab 5 chạy HTML5 <video> (Ảnh 2) đồng bộ 100% cùng Audio itag 140 ở Tab 3.
    const adaptiveVideoList = allAdaptive.filter((f) => {
      if (!f || !f.url || isUnplayableMirrorUrl(f.url)) return false;
      const t = String(f.type || '').toLowerCase();
      const itag = String(f.itag || '');
      const isH264Mp4Itag = itag === '133' || itag === '134' || itag === '135' || itag === '136' || itag === '137' || itag === '160';
      const isPlayableWebm = t.startsWith('video/webm') && !t.includes('av01');
      return t.startsWith('video/mp4') || t.includes('avc1') || isH264Mp4Itag || isPlayableWebm;
    });
    const rankedAdpVideos = adaptiveVideoList
      .map((item) => {
        const itag = String(item.itag || '');
        const itagBonus = itag === '135' ? 42000 : itag === '134' ? 40000 : itag === '136' ? 38000 : itag === '133' ? 30000 : itag === '160' ? 20000 : 0;
        return { item, score: scoreVideoStreamCandidate(item, true) + itagBonus };
      })
      .filter((entry) => entry.score >= -40000)
      .sort((a, b) => b.score - a.score);

    const bestMuxedItem = muxedVideos[0]?.item || null;
    const rawMuxedUrl = bestMuxedItem?.url || '';
    const chosenItag = String(bestMuxedItem?.itag || '18');
    const proxyVideoStreamUrl =
      origin && vid && bestMuxedItem
        ? `${origin}/latest_version?id=${encodeURIComponent(vid)}&itag=${encodeURIComponent(chosenItag)}&local=true`
        : '';

    // Ưu tiên URL trực tiếp googlevideo.com trước (tránh proxy /latest_version?local=true bị tắt/403 trên node Invidious), giữ proxy làm dự phòng!
    const muxedVideoUrl = rawMuxedUrl || proxyVideoStreamUrl;

    const rawAdpUrls = [];
    const proxyAdpUrls = [];
    for (const entry of rankedAdpVideos.slice(0, 6)) {
      const it = entry.item;
      const itagStr = String(it?.itag || '').trim();
      const rawV = String(it?.url || '').trim();
      const proxyV =
        origin && vid && itagStr
          ? `${origin}/latest_version?id=${encodeURIComponent(vid)}&itag=${encodeURIComponent(itagStr)}&local=true`
          : '';
      if (rawV) rawAdpUrls.push(rawV);
      if (proxyV) proxyAdpUrls.push(proxyV);
    }
    const alternateAdaptiveVideoUrls = [...rawAdpUrls, ...proxyAdpUrls]
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 8);
    const bestAdpVideoItem = rankedAdpVideos[0]?.item || null;
    const rawAdaptiveVideoUrl = bestAdpVideoItem?.url || '';
    const proxyAdaptiveVideoUrl =
      origin && vid && bestAdpVideoItem?.itag
        ? `${origin}/latest_version?id=${encodeURIComponent(vid)}&itag=${encodeURIComponent(String(bestAdpVideoItem.itag))}&local=true`
        : '';
    const adaptiveVideoUrl = alternateAdaptiveVideoUrls[0] || '';

    const bestAudioItem = rankedAudios[0]?.item || null;
    const rawAudioUrl = bestAudioItem?.url || '';
    const audioItag = String(bestAudioItem?.itag || '');
    const proxyAudioUrl =
      origin && vid && audioItag
        ? `${origin}/latest_version?id=${encodeURIComponent(vid)}&itag=${encodeURIComponent(audioItag)}&local=true`
        : '';
    const proxyAudioFallbacks = rankedAudios
      .slice(0, 3)
      .map((e) => {
        const itStr = String(e?.item?.itag || '');
        return origin && vid && itStr
          ? `${origin}/latest_version?id=${encodeURIComponent(vid)}&itag=${encodeURIComponent(itStr)}&local=true`
          : '';
      })
      .filter(Boolean);

    const playableHlsUrl = canBrowserPlayHlsNatively() ? hlsUrl : '';
    const alternateMuxedUrls = [
      rawMuxedUrl,
      ...muxedVideos.map((e) => e?.item?.url || ''),
      proxyVideoStreamUrl
    ]
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 6);
    const alternateAudioUrls = [
      rawAudioUrl,
      ...rankedAudios.map((e) => e?.item?.url || ''),
      rawMuxedUrl,
      proxyAudioUrl,
      ...proxyAudioFallbacks,
      proxyVideoStreamUrl,
      playableHlsUrl
    ]
      .filter((u, idx, arr) => u && arr.indexOf(u) === idx)
      .slice(0, 8);

    const audioStreamUrl = alternateAudioUrls[0] || '';
    const videoStreamUrl = isLive && playableHlsUrl ? playableHlsUrl : muxedVideoUrl || playableHlsUrl || adaptiveVideoUrl || '';
    const requiresPairedAudio = Boolean(!muxedVideoUrl && !(isLive && playableHlsUrl) && adaptiveVideoUrl && audioStreamUrl);

    if (!videoStreamUrl && !audioStreamUrl) return null;

    const thumbs = Array.isArray(payload.videoThumbnails) ? payload.videoThumbnails : [];
    const thumbUrl = String(thumbs[0]?.url || '').trim();

    return {
      videoStreamUrl,
      muxedVideoUrl,
      alternateMuxedUrls,
      directVideoStreamUrl: rawMuxedUrl || rawAdaptiveVideoUrl,
      proxyVideoStreamUrl: proxyVideoStreamUrl || proxyAdaptiveVideoUrl,
      adaptiveVideoUrl,
      alternateAdaptiveVideoUrls,
      audioStreamUrl,
      alternateAudioUrls,
      requiresPairedAudio,
      hlsUrl,
      isLive,
      title: String(payload.title || '').trim(),
      durationSec: isLive ? 0 : parseDurationSeconds(payload.lengthSeconds),
      thumbnailUrl: thumbUrl
    };
  }

  function extractExpiresAtMs(result) {
    const fallbackExp = Date.now() + STREAM_CACHE_TTL_MS;
    if (!result || typeof result !== 'object') return fallbackExp;
    const candidates = [
      result.audioStreamUrl,
      result.videoStreamUrl,
      result.muxedVideoUrl,
      result.adaptiveVideoUrl,
      result.hlsUrl
    ].filter(Boolean);
    const now = Date.now();
    let bestExp = 0;
    for (let i = 0; i < candidates.length; i++) {
      const urlStr = String(candidates[i] || '');
      const mSec = urlStr.match(/[?&]expire=(\d{9,12})(?:&|$)/);
      if (mSec) {
        const ms = Number(mSec[1]) * 1000 - STREAM_EXPIRY_SAFETY_MS;
        if (ms > now + 60000 && (!bestExp || ms < bestExp)) bestExp = ms;
      }
      const mMs = urlStr.match(/[?&]exp=(\d{12,15})(?:&|$)/);
      if (mMs) {
        const ms = Number(mMs[1]) - STREAM_EXPIRY_SAFETY_MS;
        if (ms > now + 60000 && (!bestExp || ms < bestExp)) bestExp = ms;
      }
    }
    if (!bestExp) return fallbackExp;
    return Math.max(now + 60000, Math.min(now + 6 * 60 * 60 * 1000, bestExp));
  }

  function extractFromCobaltPayload(payload, origin = '', videoId = '', modeHint = '') {
    if (!payload || typeof payload !== 'object') return null;
    const status = String(payload.status || '').toLowerCase();
    if (!status || status === 'error') return null;
    const thumb = videoId ? `https://i.ytimg.com/vi/${encodeURIComponent(videoId)}/hqdefault.jpg` : '';
    const normTitle = String(payload.filename || '').replace(/\.[a-z0-9]{2,5}$/i, '').trim();

    if (status === 'tunnel' || status === 'redirect') {
      const u = String(payload.url || '').trim();
      if (!u || isUnplayableMirrorUrl(u)) return null;
      const hintAudio = modeHint === 'cobalt-audio' || /\.(m4a|mp3|ogg|opus|weba)(\?|$)/i.test(String(payload.filename || u));
      if (hintAudio) {
        return {
          videoStreamUrl: '',
          muxedVideoUrl: '',
          adaptiveVideoUrl: '',
          audioStreamUrl: u,
          alternateAudioUrls: [u],
          requiresPairedAudio: false,
          audioOnlyFallback: true,
          hlsUrl: '',
          isLive: false,
          title: normTitle,
          durationSec: 0,
          thumbnailUrl: thumb
        };
      }
      return {
        videoStreamUrl: u,
        muxedVideoUrl: u,
        adaptiveVideoUrl: '',
        audioStreamUrl: u,
        alternateMuxedUrls: [u],
        alternateAudioUrls: [u],
        requiresPairedAudio: false,
        audioOnlyFallback: false,
        hlsUrl: '',
        isLive: false,
        title: normTitle,
        durationSec: 0,
        thumbnailUrl: thumb
      };
    }

    if (status === 'local-processing') {
      const tunnels = Array.isArray(payload.tunnel) ? payload.tunnel.map((u) => String(u || '').trim()).filter(Boolean) : [];
      if (!tunnels.length) return null;
      const procType = String(payload.type || '').toLowerCase();
      if (procType === 'proxy' || modeHint === 'cobalt-audio' || tunnels.length === 1 && procType !== 'merge') {
        return {
          videoStreamUrl: '',
          muxedVideoUrl: '',
          adaptiveVideoUrl: '',
          audioStreamUrl: tunnels[0],
          alternateAudioUrls: tunnels.slice(0, 6),
          requiresPairedAudio: false,
          audioOnlyFallback: true,
          hlsUrl: '',
          isLive: false,
          title: normTitle,
          durationSec: 0,
          thumbnailUrl: thumb
        };
      }
      if (tunnels.length >= 2) {
        return {
          videoStreamUrl: tunnels[0],
          muxedVideoUrl: '',
          adaptiveVideoUrl: tunnels[0],
          alternateAdaptiveVideoUrls: [tunnels[0]],
          audioStreamUrl: tunnels[1],
          alternateAudioUrls: tunnels.slice(1).filter(Boolean),
          requiresPairedAudio: true,
          audioOnlyFallback: false,
          hlsUrl: '',
          isLive: false,
          title: normTitle,
          durationSec: 0,
          thumbnailUrl: thumb
        };
      }
      return {
        videoStreamUrl: tunnels[0],
        muxedVideoUrl: tunnels[0],
        adaptiveVideoUrl: '',
        audioStreamUrl: tunnels[0],
        alternateMuxedUrls: [tunnels[0]],
        alternateAudioUrls: [tunnels[0]],
        requiresPairedAudio: false,
        audioOnlyFallback: false,
        hlsUrl: '',
        isLive: false,
        title: normTitle,
        durationSec: 0,
        thumbnailUrl: thumb
      };
    }

    if (status === 'picker') {
      const audioU = String(payload.audio || '').trim();
      const firstPick = Array.isArray(payload.picker) ? payload.picker.find((p) => p && p.url && p.type !== 'photo') : null;
      const videoU = String(firstPick?.url || '').trim();
      if (!audioU && !videoU) return null;
      return {
        videoStreamUrl: videoU,
        muxedVideoUrl: videoU,
        adaptiveVideoUrl: '',
        audioStreamUrl: audioU || videoU,
        alternateAudioUrls: [audioU, videoU].filter(Boolean),
        requiresPairedAudio: false,
        audioOnlyFallback: Boolean(!videoU && audioU),
        hlsUrl: '',
        isLive: false,
        title: normTitle,
        durationSec: 0,
        thumbnailUrl: String(firstPick?.thumb || thumb)
      };
    }

    return null;
  }

  function extractFromGenericPayload(payload) {
    if (!payload || typeof payload !== 'object') return null;
    if (payload.status === 'tunnel' || payload.status === 'redirect' || payload.status === 'local-processing' || payload.status === 'picker') {
      return extractFromCobaltPayload(payload);
    }
    if (Array.isArray(payload.videoStreams) || Array.isArray(payload.audioStreams) || payload.hls) {
      return extractFromPipedPayload(payload);
    }
    if (Array.isArray(payload.formatStreams) || Array.isArray(payload.adaptiveFormats) || payload.hlsUrl) {
      return extractFromInvidiousPayload(payload);
    }
    if (typeof payload.videoStreamUrl === 'string' || typeof payload.audioStreamUrl === 'string') {
      return {
        videoStreamUrl: String(payload.videoStreamUrl || ''),
        muxedVideoUrl: String(payload.muxedVideoUrl || ''),
        adaptiveVideoUrl: String(payload.adaptiveVideoUrl || ''),
        requiresPairedAudio: Boolean(payload.requiresPairedAudio),
        audioStreamUrl: String(payload.audioStreamUrl || payload.videoStreamUrl || ''),
        hlsUrl: String(payload.hlsUrl || ''),
        isLive: Boolean(payload.isLive),
        title: String(payload.title || ''),
        durationSec: parseDurationSeconds(payload.durationSec),
        thumbnailUrl: String(payload.thumbnailUrl || '')
      };
    }
    return null;
  }

  class YouTubeDirectStreamFetcher {
    constructor() {
      this._inFlightByVideoId = new Map();
      this._memoryCache = new Map();
      this._idbPromise = null;
      this.warmCacheFromIdb();
    }

    getCustomInstanceUrl() {
      try {
        if (typeof global.localStorage !== 'undefined') {
          return normalizeOriginUrl(global.localStorage.getItem(CUSTOM_SERVER_STORAGE_KEY) || '');
        }
      } catch (_err) {}
      return '';
    }

    setCustomInstanceUrl(rawUrl) {
      const normalized = normalizeOriginUrl(rawUrl);
      try {
        if (typeof global.localStorage !== 'undefined') {
          if (normalized) {
            global.localStorage.setItem(CUSTOM_SERVER_STORAGE_KEY, normalized);
          } else {
            global.localStorage.removeItem(CUSTOM_SERVER_STORAGE_KEY);
          }
        }
      } catch (_err) {}
      this.clearCache();
      return normalized;
    }

    getWorkerTemplateCode() {
      return CLOUDFLARE_WORKER_TEMPLATE;
    }

    extractStreamsFromPayload(payload, type = 'piped', origin = '', videoId = '') {
      const normType = String(type || '').toLowerCase();
      if (normType.startsWith('cobalt')) {
        return extractFromCobaltPayload(payload, origin, videoId, normType) || extractFromGenericPayload(payload);
      }
      return normType === 'invidious'
        ? extractFromInvidiousPayload(payload, videoId, origin) || extractFromGenericPayload(payload)
        : extractFromPipedPayload(payload) || extractFromGenericPayload(payload);
    }

    openStreamIdb() {
      if (this._idbPromise) return this._idbPromise;
      if (typeof global.indexedDB === 'undefined') {
        this._idbPromise = Promise.resolve(null);
        return this._idbPromise;
      }
      this._idbPromise = new Promise((resolve) => {
        try {
          const req = global.indexedDB.open(STREAM_IDB_NAME, STREAM_IDB_VERSION);
          req.onupgradeneeded = () => {
            try {
              const db = req.result;
              if (!db.objectStoreNames.contains(STREAM_IDB_STORE)) {
                db.createObjectStore(STREAM_IDB_STORE, { keyPath: 'videoId' });
              }
            } catch (_eUp) {}
          };
          req.onsuccess = () => resolve(req.result || null);
          req.onerror = () => resolve(null);
          req.onblocked = () => resolve(null);
        } catch (_eOpen) {
          resolve(null);
        }
      });
      return this._idbPromise;
    }

    warmCacheFromIdb() {
      this.openStreamIdb().then((db) => {
        if (!db) return;
        try {
          const tx = db.transaction(STREAM_IDB_STORE, 'readonly');
          const store = tx.objectStore(STREAM_IDB_STORE);
          const req = store.getAll();
          req.onsuccess = () => {
            const list = Array.isArray(req.result) ? req.result : [];
            const now = Date.now();
            list.forEach((entry) => {
              if (
                entry &&
                entry.videoId &&
                Number(entry.expiresAtMs) > now &&
                (entry.videoStreamUrl || entry.audioStreamUrl)
              ) {
                this._memoryCache.set(entry.videoId, entry);
              }
            });
          };
        } catch (_eWarm) {}
      }).catch(() => {});
    }

    async readCacheAsync(videoId) {
      const syncHit = this.readCache(videoId);
      if (syncHit) return syncHit;
      try {
        const db = await this.openStreamIdb();
        if (!db) return null;
        return await new Promise((resolve) => {
          let settled = false;
          const finish = (val) => {
            if (settled) return;
            settled = true;
            resolve(val || null);
          };
          setTimeout(() => finish(null), 150);
          try {
            const tx = db.transaction(STREAM_IDB_STORE, 'readonly');
            const req = tx.objectStore(STREAM_IDB_STORE).get(videoId);
            req.onsuccess = () => {
              const entry = req.result;
              if (
                entry &&
                Number(entry.expiresAtMs) > Date.now() &&
                (entry.videoStreamUrl || entry.audioStreamUrl)
              ) {
                this._memoryCache.set(videoId, entry);
                finish({ ...entry, fromCache: true });
              } else {
                finish(null);
              }
            };
            req.onerror = () => finish(null);
          } catch (_eTx) {
            finish(null);
          }
        });
      } catch (_eIdb) {
        return null;
      }
    }

    clearCache(videoId = '') {
      const vid = String(videoId || '').trim();
      if (vid) {
        this._memoryCache.delete(vid);
        try {
          global.sessionStorage?.removeItem(`${CACHE_KEY_PREFIX}${vid}`);
        } catch (_err) {}
        this.openStreamIdb().then((db) => {
          if (!db) return;
          try {
            db.transaction(STREAM_IDB_STORE, 'readwrite').objectStore(STREAM_IDB_STORE).delete(vid);
          } catch (_eDel) {}
        }).catch(() => {});
        return;
      }
      this._memoryCache.clear();
      try {
        if (typeof global.sessionStorage !== 'undefined') {
          const toDelete = [];
          for (let i = 0; i < global.sessionStorage.length; i++) {
            const k = global.sessionStorage.key(i);
            if (k && k.startsWith(CACHE_KEY_PREFIX)) toDelete.push(k);
          }
          toDelete.forEach((k) => global.sessionStorage.removeItem(k));
        }
      } catch (_err) {}
      this.openStreamIdb().then((db) => {
        if (!db) return;
        try {
          db.transaction(STREAM_IDB_STORE, 'readwrite').objectStore(STREAM_IDB_STORE).clear();
        } catch (_eClr) {}
      }).catch(() => {});
    }

    buildEndpointList(videoId, customOriginOverride = '') {
      const encodedId = encodeURIComponent(videoId);
      const watchUrl = `https://www.youtube.com/watch?v=${encodedId}`;
      const seen = new Set();
      const list = [];

      const pushOrigin = (rawOrigin, explicitType = null, label = '') => {
        const origin = normalizeOriginUrl(rawOrigin);
        if (!origin) return;
        const type = explicitType || inferSourceTypeFromOrigin(origin);
        const key = `${type}:${origin}`;
        if (seen.has(key)) return;
        seen.add(key);
        let url = '';
        let method = 'GET';
        let body = null;
        if (type === 'worker') {
          url = `${origin}/?videoId=${encodedId}&v=${encodedId}`;
        } else if (type === 'invidious') {
          url = `${origin}/api/v1/videos/${encodedId}`;
        } else if (type === 'cobalt-video') {
          url = `${origin}/`;
          method = 'POST';
          body = {
            url: watchUrl,
            downloadMode: 'auto',
            videoQuality: '480',
            youtubeVideoCodec: 'h264',
            localProcessing: 'preferred'
          };
        } else if (type === 'cobalt-audio') {
          url = `${origin}/`;
          method = 'POST';
          body = {
            url: watchUrl,
            downloadMode: 'audio',
            audioFormat: 'best',
            localProcessing: 'preferred'
          };
        } else {
          url = `${origin}/streams/${encodedId}`;
        }
        list.push({ type, origin, url, method, body, label: label || origin });
      };

      const customOrigin = normalizeOriginUrl(customOriginOverride) || this.getCustomInstanceUrl();
      if (customOrigin) {
        pushOrigin(customOrigin, 'worker', 'custom-worker');
        pushOrigin(customOrigin, 'piped', 'custom-piped');
        pushOrigin(customOrigin, 'invidious', 'custom-invidious');
      }

      const maxLen = Math.max(INVIDIOUS_INSTANCES.length, PIPED_INSTANCES.length, COBALT_INSTANCES.length);
      for (let i = 0; i < maxLen; i++) {
        if (INVIDIOUS_INSTANCES[i]) pushOrigin(INVIDIOUS_INSTANCES[i], 'invidious');
        if (COBALT_INSTANCES[i]) {
          pushOrigin(COBALT_INSTANCES[i], 'cobalt-video');
          pushOrigin(COBALT_INSTANCES[i], 'cobalt-audio');
        }
        if (PIPED_INSTANCES[i]) pushOrigin(PIPED_INSTANCES[i], 'piped');
      }

      // Bổ sung các mirror Invidious khỏe vừa được bộ tìm kiếm phát hiện động trong sessionStorage (nếu có)
      try {
        if (typeof global.sessionStorage !== 'undefined') {
          const rawDyn = global.sessionStorage.getItem('mod39_dyn_invidious_hosts_v1');
          const parsedDyn = rawDyn ? JSON.parse(rawDyn) : null;
          if (parsedDyn && Array.isArray(parsedDyn.hosts)) {
            parsedDyn.hosts.forEach((h) => {
              const rawU = String(h?.url || '');
              const idxApi = rawU.indexOf('/api/');
              const dynOrigin = idxApi > 0 ? rawU.slice(0, idxApi) : rawU;
              if (dynOrigin) pushOrigin(dynOrigin, 'invidious');
            });
          }
        }
      } catch (_dynErr) {}
      return list;
    }

    readCache(videoId) {
      const mem = this._memoryCache.get(videoId);
      if (mem && Number(mem.expiresAtMs) > Date.now() && (mem.videoStreamUrl || mem.audioStreamUrl)) {
        return { ...mem, fromCache: true };
      }
      try {
        if (typeof global.sessionStorage !== 'undefined') {
          const raw = global.sessionStorage.getItem(`${CACHE_KEY_PREFIX}${videoId}`);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (
              parsed &&
              Number(parsed.expiresAtMs) > Date.now() &&
              (parsed.videoStreamUrl || parsed.audioStreamUrl)
            ) {
              this._memoryCache.set(videoId, parsed);
              return { ...parsed, fromCache: true };
            }
          }
        }
      } catch (_err) {}
      return null;
    }

    writeCache(videoId, result) {
      if (!videoId || !result || (!result.videoStreamUrl && !result.audioStreamUrl)) return;
      const entry = {
        ...result,
        videoId,
        expiresAtMs: extractExpiresAtMs(result)
      };
      this._memoryCache.set(videoId, entry);
      try {
        if (typeof global.sessionStorage !== 'undefined') {
          global.sessionStorage.setItem(`${CACHE_KEY_PREFIX}${videoId}`, JSON.stringify(entry));
        }
      } catch (_err) {}
      this.openStreamIdb().then((db) => {
        if (!db) return;
        try {
          db.transaction(STREAM_IDB_STORE, 'readwrite').objectStore(STREAM_IDB_STORE).put(entry);
        } catch (_ePut) {}
      }).catch(() => {});
    }

    async probePlayableStreamUrl(targetUrl, fetchFn, probeTimeoutMs, parentSignal = null) {
      if (!targetUrl) return false;
      const Ctrl = typeof global.AbortController === 'function' ? global.AbortController : null;
      const controller = Ctrl ? new Ctrl() : null;
      const onParentAbort = () => {
        try {
          controller?.abort();
        } catch (_e) {}
      };
      if (parentSignal && controller) {
        if (parentSignal.aborted) return false;
        parentSignal.addEventListener('abort', onParentAbort, { once: true });
      }
      const timerId = controller
        ? setTimeout(() => {
            try {
              controller.abort();
            } catch (_e) {}
          }, Math.max(800, Number(probeTimeoutMs) || 1800))
        : null;
      try {
        const res = await fetchFn(targetUrl, {
          method: 'GET',
          mode: 'cors',
          headers: { Range: 'bytes=0-63' },
          signal: controller ? controller.signal : undefined
        });
        try {
          await res.body?.cancel?.();
        } catch (_eCancel) {}
        if (!res || !res.ok) return false;
        const clHeader = res.headers?.get?.('content-length');
        if (clHeader !== null && clHeader !== '' && Number(clHeader) === 0) return false;
        const ct = String(res.headers?.get?.('content-type') || '').toLowerCase();
        if (ct.includes('text/html') || ct.includes('application/json') || ct.includes('image/')) {
          return false;
        }
        return true;
      } catch (_eProbe) {
        return false;
      } finally {
        if (timerId) clearTimeout(timerId);
        if (parentSignal) {
          try {
            parentSignal.removeEventListener('abort', onParentAbort);
          } catch (_e) {}
        }
      }
    }

    async fetchSingleEndpoint(endpoint, fetchFn, timeoutMs, videoId = '', externalSignal = null, options = {}) {
      const Ctrl = typeof global.AbortController === 'function' ? global.AbortController : null;
      const controller = Ctrl ? new Ctrl() : null;
      let timerId = null;
      const onExternalAbort = () => {
        try {
          controller?.abort();
        } catch (_e) {}
      };
      if (externalSignal && controller) {
        if (externalSignal.aborted) {
          onExternalAbort();
        } else {
          externalSignal.addEventListener('abort', onExternalAbort, { once: true });
        }
      }

      try {
        if (controller) {
          timerId = setTimeout(() => {
            try {
              controller.abort();
            } catch (_e) {}
          }, timeoutMs);
        }

        const isCobalt = String(endpoint.type || '').startsWith('cobalt');
        const reqInit = {
          method: endpoint.method || (isCobalt ? 'POST' : 'GET'),
          mode: 'cors',
          signal: controller ? controller.signal : undefined
        };
        if (isCobalt && endpoint.body) {
          reqInit.headers = {
            Accept: 'application/json',
            'Content-Type': 'application/json'
          };
          reqInit.body = JSON.stringify(endpoint.body);
        }

        const resp = await fetchFn(endpoint.url, reqInit);

        let payload = null;
        try {
          payload = await resp.json();
        } catch (_jsonErr) {
          payload = null;
        }

        const isCobaltError = isCobalt && String(payload?.status || '').toLowerCase() === 'error';
        if (!resp.ok || isCobaltError) {
          const errMsg = String(
            payload?.error?.code || payload?.message || payload?.error || `HTTP ${resp.status}`
          );
          const lowerErr = errMsg.toLowerCase();
          return {
            ok: false,
            httpStatus: resp.status,
            isGeoBlocked:
              lowerErr.includes('country') || lowerErr.includes('available in your') || lowerErr.includes('geo'),
            isBotBlocked:
              errMsg.includes('LOGIN_REQUIRED') ||
              errMsg.includes('not a bot') ||
              lowerErr.includes('youtube.login') ||
              lowerErr.includes('auth.jwt') ||
              lowerErr.includes('turnstile'),
            reason: errMsg
          };
        }

        const extracted =
          endpoint.type === 'invidious'
            ? extractFromInvidiousPayload(payload, videoId, endpoint.origin) || extractFromGenericPayload(payload)
            : endpoint.type === 'worker'
              ? extractFromGenericPayload(payload)
              : isCobalt
                ? extractFromCobaltPayload(payload, endpoint.origin, videoId, endpoint.type)
                : extractFromPipedPayload(payload) || extractFromGenericPayload(payload);

        if (!extracted || (!extracted.videoStreamUrl && !extracted.audioStreamUrl)) {
          return { ok: false, reason: 'Không có luồng phát MP4/M4A khả dụng trong phản hồi.' };
        }

        const resolveWorkerUrl = (u) => {
          const s = String(u || '').trim();
          if (!s) return '';
          if (s.startsWith('/')) return `${endpoint.origin}${s}`;
          return s;
        };

        const resolvedAudio = resolveWorkerUrl(extracted.audioStreamUrl);
        const resolvedVideo = resolveWorkerUrl(extracted.videoStreamUrl);

        // Cobalt thường trả HTTP 200 tunnel nhưng upstream Google bị 0 bytes nếu IP proxy bị chặn: probe Range bytes=0-63
        if (!options.skipProbe && isCobalt) {
          const probeOk = await this.probePlayableStreamUrl(
            resolvedAudio || resolvedVideo,
            fetchFn,
            Math.min(2000, timeoutMs),
            controller ? controller.signal : null
          );
          if (!probeOk) {
            return {
              ok: false,
              isBotBlocked: true,
              reason: 'Cobalt tunnel 0 bytes hoặc bị chặn đọc luồng media.'
            };
          }
        }

        return {
          ok: true,
          ...extracted,
          videoStreamUrl: resolvedVideo,
          muxedVideoUrl: resolveWorkerUrl(extracted.muxedVideoUrl || ''),
          adaptiveVideoUrl: resolveWorkerUrl(extracted.adaptiveVideoUrl || ''),
          alternateAdaptiveVideoUrls: Array.isArray(extracted.alternateAdaptiveVideoUrls)
            ? extracted.alternateAdaptiveVideoUrls.map(resolveWorkerUrl).filter(Boolean)
            : [],
          directVideoStreamUrl: resolveWorkerUrl(extracted.directVideoStreamUrl || ''),
          proxyVideoStreamUrl: resolveWorkerUrl(extracted.proxyVideoStreamUrl || ''),
          audioStreamUrl: resolvedAudio,
          alternateAudioUrls: Array.isArray(extracted.alternateAudioUrls)
            ? extracted.alternateAudioUrls.map(resolveWorkerUrl).filter(Boolean)
            : [],
          alternateMuxedUrls: Array.isArray(extracted.alternateMuxedUrls)
            ? extracted.alternateMuxedUrls.map(resolveWorkerUrl).filter(Boolean)
            : [],
          hlsUrl: resolveWorkerUrl(extracted.hlsUrl),
          sourceHost: endpoint.origin,
          sourceType: endpoint.type
        };
      } catch (err) {
        const isAbort = err && err.name === 'AbortError';
        return {
          ok: false,
          reason: isAbort ? `Timeout (${timeoutMs}ms)` : String(err?.message || 'Lỗi kết nối')
        };
      } finally {
        if (timerId) clearTimeout(timerId);
        if (externalSignal) {
          try {
            externalSignal.removeEventListener('abort', onExternalAbort);
          } catch (_e) {}
        }
      }
    }

    async fetchStreams(videoId, options = {}) {
      const vid = String(videoId || '').trim();
      if (!vid) {
        return {
          ok: false,
          fallback: true,
          videoId: '',
          videoStreamUrl: '',
          audioStreamUrl: '',
          hlsUrl: '',
          isLive: false,
          sourceHost: '',
          sourceType: '',
          durationSec: 0,
          title: '',
          thumbnailUrl: '',
          attemptsCount: 0,
          botBlockedDetected: false,
          errorReason: 'Thiếu mã videoId YouTube.'
        };
      }

      const excludeSet = new Set(
        Array.isArray(options.excludeHosts)
          ? options.excludeHosts.map((h) => normalizeOriginUrl(h)).filter(Boolean)
          : []
      );

      if (!options.forceRefresh) {
        const cached = this.readCache(vid) || (!options.fetchImpl ? await this.readCacheAsync(vid) : null);
        if (cached && (!excludeSet.size || !excludeSet.has(normalizeOriginUrl(cached.sourceHost)))) {
          return {
            ...cached,
            ok: true,
            fallback: false,
            errorReason: ''
          };
        }
      }

      if (this._inFlightByVideoId.has(vid)) {
        return this._inFlightByVideoId.get(vid);
      }

      const fetchFn =
        typeof options.fetchImpl === 'function'
          ? options.fetchImpl
          : typeof global.fetch === 'function'
            ? global.fetch.bind(global)
            : null;

      if (!fetchFn || (typeof global.navigator !== 'undefined' && global.navigator.onLine === false)) {
        return {
          ok: false,
          fallback: true,
          videoId: vid,
          videoStreamUrl: '',
          audioStreamUrl: '',
          hlsUrl: '',
          isLive: false,
          sourceHost: '',
          sourceType: '',
          durationSec: 0,
          title: '',
          thumbnailUrl: '',
          attemptsCount: 0,
          botBlockedDetected: false,
          errorReason: 'Thiết bị đang ngoại tuyến hoặc trình duyệt không hỗ trợ fetch.'
        };
      }

      const timeoutMs = Math.max(1200, Number(options.timeoutMs) || DEFAULT_TIMEOUT_MS);
      const rawEndpoints = Array.isArray(options.customEndpoints) && options.customEndpoints.length
        ? options.customEndpoints
        : this.buildEndpointList(vid, options.customOrigin);
      const endpoints = excludeSet.size
        ? rawEndpoints.filter((ep) => !excludeSet.has(normalizeOriginUrl(ep.origin)))
        : rawEndpoints;

      const promise = (async () => {
        let attemptsCount = 0;
        let botBlockedDetected = false;
        let lastReason = '';

        // Nếu truyền customEndpoints tường minh (unit test failover), thử tuần tự để đếm chính xác attemptsCount;
        // Ngược lại trên môi trường thực tế: đua song song toàn bộ cụm Piped & Invidious trong 2.5s (Promise.any + AbortController)
        const isExplicitCustomEndpoints = Array.isArray(options.customEndpoints) && options.customEndpoints.length > 0;
        const customBatch = endpoints.filter((ep) => String(ep.label || '').startsWith('custom-'));
        const publicList = endpoints.filter((ep) => !String(ep.label || '').startsWith('custom-'));
        const batches = [];
        if (isExplicitCustomEndpoints) {
          endpoints.forEach((ep) => batches.push([ep]));
        } else {
          if (customBatch.length) batches.push(customBatch);
          for (let i = 0; i < publicList.length; i += ENDPOINT_RACE_BATCH_SIZE) {
            batches.push(publicList.slice(i, i + ENDPOINT_RACE_BATCH_SIZE));
          }
        }

        const skipProbe = Boolean(options.fetchImpl);
        const raceBatch = (batch) =>
          new Promise((resolveBatch) => {
            if (!batch.length) {
              resolveBatch(null);
              return;
            }
            const Ctrl = typeof global.AbortController === 'function' ? global.AbortController : null;
            const batchAbort = Ctrl ? new Ctrl() : null;
            let pending = batch.length;
            let settled = false;
            let audioOnlyReserve = null;
            let audioHoldTimer = null;

            const finalizeBatch = (winner) => {
              if (settled) return;
              settled = true;
              if (audioHoldTimer) {
                clearTimeout(audioHoldTimer);
                audioHoldTimer = null;
              }
              try {
                batchAbort?.abort();
              } catch (_e) {}
              resolveBatch(winner || null);
            };

            batch.forEach((ep) => {
              attemptsCount += 1;
              this.fetchSingleEndpoint(ep, fetchFn, timeoutMs, vid, batchAbort ? batchAbort.signal : null, { skipProbe })
                .then((res) => {
                  if (settled) return;
                  if (res && res.ok) {
                    const hasVideoStream = Boolean(
                      res.muxedVideoUrl || res.adaptiveVideoUrl || res.videoStreamUrl || res.hlsUrl
                    );
                    if (hasVideoStream && !res.audioOnlyFallback) {
                      finalizeBatch(res);
                      return;
                    }
                    if (!audioOnlyReserve) {
                      audioOnlyReserve = res;
                      if (pending > 1 && !audioHoldTimer) {
                        audioHoldTimer = setTimeout(() => {
                          finalizeBatch(audioOnlyReserve);
                        }, Math.min(1200, timeoutMs));
                      }
                    }
                    return;
                  }
                  if (res?.isBotBlocked) botBlockedDetected = true;
                  if (res?.reason) lastReason = res.reason;
                })
                .catch(() => {})
                .finally(() => {
                  pending -= 1;
                  if (!settled && pending <= 0) {
                    finalizeBatch(audioOnlyReserve || null);
                  }
                });
            });
          });

        for (let b = 0; b < batches.length; b++) {
          const res = await raceBatch(batches[b]);
          if (res && res.ok) {
            const successResult = {
              ok: true,
              fallback: false,
              videoId: vid,
              videoStreamUrl: res.videoStreamUrl || res.hlsUrl || '',
              muxedVideoUrl: res.muxedVideoUrl || (!res.requiresPairedAudio && !res.audioOnlyFallback ? (res.videoStreamUrl || '') : ''),
              alternateMuxedUrls: Array.isArray(res.alternateMuxedUrls) ? res.alternateMuxedUrls : [],
              adaptiveVideoUrl: res.adaptiveVideoUrl || '',
              alternateAdaptiveVideoUrls: Array.isArray(res.alternateAdaptiveVideoUrls) ? res.alternateAdaptiveVideoUrls : [],
              directVideoStreamUrl: res.directVideoStreamUrl || '',
              proxyVideoStreamUrl: res.proxyVideoStreamUrl || '',
              requiresPairedAudio: Boolean(res.requiresPairedAudio),
              audioOnlyFallback: Boolean(res.audioOnlyFallback),
              audioStreamUrl: res.audioStreamUrl || res.videoStreamUrl || res.hlsUrl || '',
              alternateAudioUrls: Array.isArray(res.alternateAudioUrls) ? res.alternateAudioUrls : [],
              hlsUrl: res.hlsUrl || '',
              isLive: Boolean(res.isLive),
              sourceHost: res.sourceHost,
              sourceType: res.sourceType,
              durationSec: res.durationSec || 0,
              title: res.title || '',
              thumbnailUrl: res.thumbnailUrl || '',
              attemptsCount,
              botBlockedDetected: false,
              errorReason: ''
            };
            this.writeCache(vid, successResult);
            return successResult;
          }
        }

        const errorReason = botBlockedDetected
          ? 'Các máy chủ Piped/Invidious công cộng đang bị YouTube chặn bot (LOGIN_REQUIRED). Chuyển dự phòng về iframe youtube-nocookie.com.'
          : lastReason || 'Không thể lấy luồng phát trực tiếp từ các server công cộng.';

        return {
          ok: false,
          fallback: true,
          videoId: vid,
          videoStreamUrl: '',
          audioStreamUrl: '',
          hlsUrl: '',
          isLive: false,
          sourceHost: '',
          sourceType: '',
          durationSec: 0,
          title: '',
          thumbnailUrl: '',
          attemptsCount,
          botBlockedDetected,
          errorReason
        };
      })().finally(() => {
        this._inFlightByVideoId.delete(vid);
      });

      this._inFlightByVideoId.set(vid, promise);
      return promise;
    }
  }

  NS.streamFetcher = new YouTubeDirectStreamFetcher();
})(typeof window !== 'undefined' ? window : globalThis);
