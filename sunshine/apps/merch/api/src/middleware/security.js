const crypto = require('crypto');
const { isProduction } = require('../config/environment');

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function parseCookies(req, _res, next) {
  const header = req.headers.cookie || '';
  req.cookies = Object.fromEntries(
    header.split(';')
      .map((part) => part.trim())
      .filter(Boolean)
      .map((part) => {
        const separator = part.indexOf('=');
        if (separator === -1) return [part, ''];
        const value = part.slice(separator + 1);
        try {
          return [part.slice(0, separator), decodeURIComponent(value)];
        } catch {
          return [part.slice(0, separator), value];
        }
      })
  );
  next();
}

function securityHeaders(_req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function equalValues(left, right) {
  if (!left || !right) return false;
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  return leftBuffer.length === rightBuffer.length && crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function csrfProtection(req, res, next) {
  if (SAFE_METHODS.has(req.method) || req.path === '/api/orders/webhook/shopify' || !req.cookies.wd_session) {
    return next();
  }

  if (!equalValues(req.cookies.wd_csrf, req.get('x-csrf-token'))) {
    return res.status(403).json({ error: 'Invalid CSRF token.' });
  }
  return next();
}

function cookieOptions(httpOnly) {
  const maxAge = Number(process.env.SESSION_COOKIE_MAX_AGE_SECONDS || 28800);
  return [
    'Path=/',
    httpOnly ? 'HttpOnly' : null,
    'SameSite=Lax',
    isProduction ? 'Secure' : null,
    `Max-Age=${Number.isSafeInteger(maxAge) && maxAge > 0 ? maxAge : 28800}`,
  ].filter(Boolean).join('; ');
}

function appendCookie(res, name, value, options) {
  const current = res.getHeader('Set-Cookie');
  const cookies = current ? (Array.isArray(current) ? current : [current]) : [];
  cookies.push(`${name}=${encodeURIComponent(value)}; ${options}`);
  res.setHeader('Set-Cookie', cookies);
}

function setSessionCookies(res, token) {
  appendCookie(res, 'wd_session', token, cookieOptions(true));
  appendCookie(res, 'wd_csrf', crypto.randomBytes(32).toString('base64url'), cookieOptions(false));
}

function clearSessionCookies(res) {
  const expiration = 'Path=/; Max-Age=0; SameSite=Lax' + (isProduction ? '; Secure' : '');
  appendCookie(res, 'wd_session', '', expiration);
  appendCookie(res, 'wd_csrf', '', expiration);
}

module.exports = {
  clearSessionCookies,
  csrfProtection,
  equalValues,
  parseCookies,
  securityHeaders,
  setSessionCookies,
};
