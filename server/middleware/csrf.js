import crypto from 'crypto';

const CSRF_COOKIE_NAME = 'XSRF-TOKEN';
const CSRF_HEADER_NAME = 'x-csrf-token';

export const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

export const setCsrfCookie = (res, token) => {
  res.cookie(CSRF_COOKIE_NAME, token, {
    httpOnly: false, // Must be readable by frontend JS to attach to request headers
    secure: process.env.COOKIE_SECURE === 'true',
    sameSite: process.env.COOKIE_SAME_SITE || 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};

export const csrfProtection = (req, res, next) => {
  const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
  if (safeMethods.includes(req.method)) {
    return next();
  }

  // Exempt public auth endpoints like login and register from CSRF token enforcement
  // (since user does not yet have an authenticated session)
  const fullPath = (req.originalUrl || req.path).split('?')[0];
  const isExempt =
    fullPath.endsWith('/auth/login') ||
    fullPath.endsWith('/auth/register') ||
    fullPath.endsWith('/auth/csrf-token') ||
    fullPath === '/api/health';

  if (isExempt) {
    return next();
  }

  // If request uses cookie authentication, strictly verify CSRF token
  const hasAuthCookie = !!req.cookies?.securepay_token;
  if (!hasAuthCookie) {
    // If bearer auth is explicitly used (e.g. mobile/script/automated tests without cookies), CSRF is not applicable
    return next();
  }

  const cookieToken = req.cookies?.[CSRF_COOKIE_NAME];
  const headerToken = req.headers[CSRF_HEADER_NAME];

  if (!cookieToken || !headerToken || cookieToken !== headerToken) {
    return res.status(403).json({
      success: false,
      message: 'CSRF token missing or mismatch. Request rejected for security.',
    });
  }

  next();
};
