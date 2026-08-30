const jwt = require('jsonwebtoken');
const { equalValues } = require('./security');

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const [, bearerToken] = authHeader.split(' ');
  const token = bearerToken || req.cookies?.wd_session;
  const operatorKey = process.env.OPERATOR_API_KEY;
  const headerKey = req.headers['x-operator-key'];

  if (!token && operatorKey && equalValues(headerKey, operatorKey)) {
    req.user = { isOperator: true };
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
  const isAdmin = Boolean(req.user.isOperator);

  if (isAdmin || !requestedSponsorId || requestedSponsorId === req.user.sponsorId) {
    return next();
  }

  return res.status(403).json({ error: 'You do not have access to this sponsor resource.' });
}

function requireAdmin(req, res, next) {
  if (req.user && req.user.isOperator) {
    return next();
  }

  return res.status(403).json({ error: 'Admin access is required.' });
}

module.exports = {
  authenticateToken,
  requireSponsorAccess,
  requireAdmin,
};
