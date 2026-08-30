'use strict';

/**
 * routes/nurturedchef.js — Nurtured Chef ecosystem routes.
 *
 * In production this router is mounted when a thenurturedchef.* or
 * thenutur3dchef.com domain is detected.
 */

const express = require('express');
const router  = express.Router();

router.get('/health', function (req, res) {
  res.json({ status: 'ok', ecosystem: 'chef', domain: req.detectedDomain });
});

router.use(function (req, res) {
  res.status(404).json({ error: 'Not found', ecosystem: 'chef' });
});

module.exports = router;
