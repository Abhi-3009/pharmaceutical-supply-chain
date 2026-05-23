const express = require('express');
const { ledger } = require('../ledger/hashChain');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * GET /verify
 * Verify the integrity of the entire hash-chain ledger.
 * This is the core counterfeit-detection endpoint.
 *
 * Response: 200 with verification result
 *   - valid: true/false
 *   - totalBlocks: number of blocks in the chain
 *   - invalidBlocks: array of tampered block indices (empty if valid)
 */
router.get('/verify', (req, res) => {
  try {
    const result = ledger.verifyChain();

    if (result.valid) {
      logger.info('Ledger verification passed', { totalBlocks: result.totalBlocks });
    } else {
      logger.warn('Ledger verification FAILED — potential tampering detected', {
        totalBlocks: result.totalBlocks,
        invalidBlocks: result.invalidBlocks,
      });
    }

    return res.status(200).json({
      message: result.valid
        ? '✅ Supply chain integrity verified — no tampering detected'
        : '❌ ALERT: Supply chain integrity compromised — tampering detected!',
      verification: result,
    });
  } catch (error) {
    logger.error('Verification failed', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /ledger
 * Return the full hash-chain ledger for inspection.
 *
 * Response: 200 with full chain
 */
router.get('/ledger', (req, res) => {
  try {
    const chain = ledger.getChain();

    logger.info('Ledger retrieved', { totalBlocks: chain.length });

    return res.status(200).json({
      totalBlocks: chain.length,
      chain,
    });
  } catch (error) {
    logger.error('Failed to retrieve ledger', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});


/**
 * GET /api/info
 * API information endpoint.
 */
router.get('/api/info', (req, res) => {
  return res.status(200).json({
    name: 'Pharmaceutical Supply Chain API',
    version: '1.0.0',
    description: 'Secure supply chain management with hash-chain ledger for counterfeit detection',
    endpoints: {
      'POST /drugs': 'Register a new drug',
      'GET /drugs': 'List all drugs',
      'GET /drugs/:id': 'Get drug by ID',
      'POST /shipments': 'Create a shipment',
      'GET /shipments': 'List all shipments',
      'GET /shipments/:id': 'Track a shipment',
      'PUT /shipments/:id/status': 'Update shipment status',
      'GET /verify': 'Verify supply chain integrity',
      'GET /ledger': 'View full hash-chain ledger',
      'GET /health': 'Health check',
    },
  });
});

module.exports = router;
