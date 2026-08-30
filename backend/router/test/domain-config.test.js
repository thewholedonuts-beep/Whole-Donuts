'use strict';

/**
 * test/domain-config.test.js
 *
 * Unit tests for the domain-config module using Node's built-in test runner.
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const { serviceForDomain, allDomains } = require('../domain-config');

describe('serviceForDomain', function () {
  it('returns "landing" for wenevergonnaclose.com', function () {
    assert.equal(serviceForDomain('wenevergonnaclose.com'), 'landing');
  });

  it('returns "wholedonuts" for wholedonuts.org', function () {
    assert.equal(serviceForDomain('wholedonuts.org'), 'wholedonuts');
  });

  it('returns "merch" for wholedonuts.store', function () {
    assert.equal(serviceForDomain('wholedonuts.store'), 'merch');
  });

  it('returns "nurturedchef" for thenurturedchef.com', function () {
    assert.equal(serviceForDomain('thenurturedchef.com'), 'nurturedchef');
  });

  it('returns "merch" for thenutur3dchef.com', function () {
    assert.equal(serviceForDomain('thenutur3dchef.com'), 'merch');
  });

  it('returns null for an unknown domain', function () {
    assert.equal(serviceForDomain('unknown.example'), null);
  });
});

describe('allDomains', function () {
  it('returns an array with at least 10 entries', function () {
    const domains = allDomains();
    assert.ok(Array.isArray(domains));
    assert.ok(domains.length >= 10);
  });

  it('every entry has a domain and service field', function () {
    allDomains().forEach(function (d) {
      assert.ok(typeof d.domain  === 'string', 'domain must be a string');
      assert.ok(typeof d.service === 'string', 'service must be a string');
    });
  });
});
