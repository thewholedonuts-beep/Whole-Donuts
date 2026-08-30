'use strict';

/**
 * routes/merch.js — Shared merch-store routes.
 *
 * Serves both wholedonuts.store (Whole Donuts ecosystem) and
 * thenutur3dchef.com (Nurtured Chef ecosystem). The `req.detectedDomain`
 * value set by domainDetector is available here for any domain-specific logic.
 */

const express = require('express');
const router  = express.Router();

router.get('/health', function (req, res) {
  res.json({ status: 'ok', service: 'merch', domain: req.detectedDomain });
});

router.use(function (req, res) {
  res.status(404).json({ error: 'Not found', service: 'merch' });
});

module.exports = router;
