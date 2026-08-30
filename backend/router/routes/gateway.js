'use strict';

/**
 * routes/gateway.js — Landing / wenevergonnaclose.com routes.
 */

const path   = require('path');
const express = require('express');

const router = express.Router();
const LANDING_DIR = path.join(__dirname, '..', '..', '..', 'apps', 'landing', 'public');

router.use(express.static(LANDING_DIR));

module.exports = router;
