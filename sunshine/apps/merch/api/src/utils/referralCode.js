const crypto = require('crypto');
const CryptoJS = require('crypto-js');
const { query } = require('../config/database');

function sanitizeSponsorCodeSegment(value) {
  return value.replace(/[^A-Z0-9]/g, '').slice(0, 6).padEnd(6, 'X');
}

function calculateChecksum(payload) {
  let sum = 0;
  for (const character of payload) {
    sum += character.charCodeAt(0);
  }
  return (sum % 97).toString().padStart(2, '0');
}

function buildReferralCode(sponsorIdentifier) {
  const normalizedId = sanitizeSponsorCodeSegment(String(sponsorIdentifier).toUpperCase());
  const timestamp = Date.now().toString(36).toUpperCase();
  const hash = CryptoJS.SHA256(`${normalizedId}:${timestamp}`).toString().slice(0, 6).toUpperCase();
  const payload = `WD-${normalizedId}-${timestamp}-${hash}`;
  const checksum = calculateChecksum(payload);
  return `${payload}-${checksum}`;
}

async function generateUniqueReferralCode(sponsorIdentifier) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = buildReferralCode(sponsorIdentifier);
    const { rowCount } = await query('SELECT 1 FROM referral_codes WHERE code_string = $1', [code]);
    if (!rowCount) {
      return code;
    }
  }
  throw new Error('Unable to generate a unique referral code.');
}

function validateReferralCodeFormat(code) {
  const pattern = /^WD-[A-Z0-9]{6}-[A-Z0-9]+-[A-F0-9]{6}-\d{2}$/;
  if (!pattern.test(code)) {
    return false;
  }
  const parts = code.split('-');
  const checksum = parts.pop();
  return calculateChecksum(parts.join('-')) === checksum;
}

function hashIp(ipAddress) {
  const salt = process.env.IP_HASH_SALT;
  if (!salt) {
    throw new Error('IP_HASH_SALT must be configured before hashing referral IP addresses.');
  }
  return crypto.createHmac('sha256', salt).update(ipAddress || 'unknown').digest('hex');
}

module.exports = {
  buildReferralCode,
  generateUniqueReferralCode,
  validateReferralCodeFormat,
  hashIp,
};
