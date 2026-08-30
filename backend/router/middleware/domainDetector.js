'use strict';

/**
 * middleware/domainDetector.js
 *
 * Express middleware: attaches `req.detectedDomain` and `req.detectedService`
 * from the incoming Host header.
 */

const { serviceForDomain } = require('../domain-config');

/**
 * @param {import('http').IncomingMessage} req
 * @param {import('http').ServerResponse}  res
 * @param {Function}                       next
 */
function domainDetector(req, res, next) {
  const host = (req.headers.host || '').split(':')[0].toLowerCase();
  req.detectedDomain  = host;
  req.detectedService = serviceForDomain(host);
  next();
}

module.exports = domainDetector;
