'use strict';

/**
 * domain-config.js
 *
 * Loads and exports the domain → service mapping from domains.yaml.
 * This module is read-only configuration; it performs no DNS operations.
 */

const fs   = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const CONFIG_PATH = path.join(__dirname, 'config', 'domains.yaml');

/** @type {{ domains: Array<{ domain: string, service: string, ecosystem?: string, type?: string }> }} */
let _config = null;

function loadConfig() {
  if (_config) return _config;
  const raw = fs.readFileSync(CONFIG_PATH, 'utf8');
  _config = yaml.load(raw);
  return _config;
}

/**
 * Returns the service name for a given hostname, or null if unknown.
 * @param {string} hostname
 * @returns {string|null}
 */
function serviceForDomain(hostname) {
  const { domains } = loadConfig();
  const entry = domains.find(function (d) {
    return d.domain === hostname;
  });
  return entry ? entry.service : null;
}

/**
 * Returns the full domain configuration array.
 * @returns {Array}
 */
function allDomains() {
  return loadConfig().domains;
}

module.exports = { serviceForDomain, allDomains };
