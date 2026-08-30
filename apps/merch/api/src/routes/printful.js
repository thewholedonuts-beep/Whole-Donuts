const express = require('express');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { getStoreInfo } = require('../services/printful');

const router = express.Router();

router.get('/status', authenticateToken, requireAdmin, async (_req, res, next) => {
  try {
    const data = await getStoreInfo();
    return res.json({
      configured: true,
      connected: true,
      storeId: data?.result?.id || null,
    });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;
