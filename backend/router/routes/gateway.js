'use strict';

/**
 * routes/gateway.js — Landing / wenevergonnaclose.com routes.
 */

const path   = require('path');
const express = require('express');

const router = express.Router();
const LANDING_DIR = path.join(__dirname, '..', '..', '..', 'apps', 'landing', 'public');

router.use(express.static(LANDING_DIR));

router.get('/', function (req, res) {
  res.sendFile(path.join(LANDING_DIR, 'index.html'));
});

module.exports = router;
