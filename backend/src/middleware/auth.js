const jwt = require('jsonwebtoken');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, token] = authHeader.split(' ');
  const adminKey = process.env.ADMIN_API_KEY;
  const headerKey = req.headers['x-admin-key'];

  if (!token && adminKey && headerKey === adminKey) {
    req.user = { isAdmin: true };
    return next();
  }

  if (!token) {
    return res.status(401).json({ error: 'Authentication token is required.' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    return next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid or expired authentication token.' });
  }
}

function requireSponsorAccess(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Authentication required.' });
  }

  const requestedSponsorId = req.params.id || req.body.sponsorId;
  const isAdmin = Boolean(req.user.isAdmin);

  if (isAdmin || !requestedSponsorId || requestedSponsorId === req.user.sponsorId) {
    return next();
  }

  return res.status(403).json({ error: 'You do not have access to this sponsor resource.' });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.isAdmin) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access is required.' });
}

module.exports = {
  authenticateToken,
  requireSponsorAccess,
  requireAdmin,
};
