'use strict';

/**
 * middleware/routeSelector.js
 *
 * Express middleware: dispatches to the correct sub-router based on
 * `req.detectedService` (set by domainDetector).
 *
 * Unknown services fall through to the next middleware (typically a 404 handler).
 */

const gatewayRouter    = require('../routes/gateway');
const wholeDonutsRouter = require('../routes/wholedonuts');
const nurturedChefRouter = require('../routes/nurturedchef');
const merchRouter       = require('../routes/merch');

const SERVICE_MAP = {
  landing:      gatewayRouter,
  wholedonuts:  wholeDonutsRouter,
  merch:        merchRouter,
  nurturedchef: nurturedChefRouter
};

/**
 * @param {import('http').IncomingMessage & { detectedService: string }} req
 * @param {import('http').ServerResponse}                                res
 * @param {Function}                                                     next
 */
function routeSelector(req, res, next) {
  const router = SERVICE_MAP[req.detectedService];
  if (router) {
    return router(req, res, next);
  }
  next();
}

module.exports = routeSelector;
