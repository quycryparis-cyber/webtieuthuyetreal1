/**
 * ============================================================================
 * ☁️ CLOUDFLARE WORKER MẪU — CỔNG TRUNG CHUYỂN CORS SIÊU NHẸ (MIỄN PHÍ)
 * ============================================================================
 * Chỉ cần dán ~30 dòng code này vào Cloudflare Workers (free tier 100.000 req/ngày)
 * rồi nhập URL Worker vào mục Cài đặt của "Đầu tư hôm nay" khi chạy bản Web tĩnh.
 * Không lưu bất kỳ dữ liệu cá nhân nào (Stateless). Bản Desktop Electron KHÔNG cần file này.
 * ============================================================================
 */
const ALLOWED_HOSTS = new Set([
  'sjc.com.vn',
  'portal.vietcombank.com.vn',
  'query1.finance.yahoo.com',
  'finfo-api.vndirect.com.vn',
  'apipubaws.tcbs.com.vn',
  'cafef.vn',
  'vnexpress.net',
  'vietstock.vn',
  'vneconomy.vn',
  'fred.stlouisfed.org',
  'api.gold-api.com',
  'open.er-api.com',
  'nominatim.openstreetmap.org',
]);

export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }
    const url = new URL(request.url);
    const target = url.searchParams.get('url');
    if (!target) return new Response('Missing ?url=', { status: 400 });

    let parsed;
    try {
      parsed = new URL(target);
    } catch {
      return new Response('Invalid target URL', { status: 400 });
    }
    if (!['https:', 'http:'].includes(parsed.protocol) || !ALLOWED_HOSTS.has(parsed.hostname)) {
      return new Response('Host not allowed', { status: 403 });
    }

    const upstream = await fetch(parsed.toString(), {
      headers: { 'User-Agent': 'BiNovelStudio-InvestToday/2.0' },
    });
    const body = await upstream.text();
    return new Response(body, {
      status: upstream.status,
      headers: {
        'Content-Type': upstream.headers.get('Content-Type') || 'text/plain; charset=utf-8',
        'Access-Control-Allow-Origin': '*',
        'Cache-Control': 'public, max-age=180',
      },
    });
  },
};
