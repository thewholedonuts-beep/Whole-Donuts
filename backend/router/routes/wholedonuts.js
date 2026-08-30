'use strict';

/**
 * routes/wholedonuts.js — Whole Donuts ecosystem routes.
 *
 * In production this router is mounted when a wholedonuts.* or
 * wholedonuts.store domain is detected. Extend with real handlers as the
 * apps/web and apps/merch applications are built out.
 */

const express = require('express');
const router  = express.Router();

router.get('/health', function (req, res) {
  res.json({ status: 'ok', ecosystem: 'donuts', domain: req.detectedDomain });
});

router.use(function (req, res) {
  res.status(404).json({ error: 'Not found', ecosystem: 'donuts' });
});

module.exports = router;
