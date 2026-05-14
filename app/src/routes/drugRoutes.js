const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ledger } = require('../ledger/hashChain');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory drug store
const drugs = new Map();

/**
 * POST /drugs
 * Register a new pharmaceutical drug/product.
 *
 * Body: { name, manufacturer, batchId, expiryDate, description? }
 * Response: 201 with created drug + ledger block
 */
router.post('/', (req, res) => {
  try {
    const { name, manufacturer, batchId, expiryDate, description } = req.body;

    // Validation
    if (!name || !manufacturer || !batchId || !expiryDate) {
      return res.status(400).json({
        error: 'Missing required fields: name, manufacturer, batchId, expiryDate',
      });
    }

    // Check for duplicate batchId
    for (const [, drug] of drugs) {
      if (drug.batchId === batchId) {
        return res.status(409).json({ error: `Drug with batchId '${batchId}' already exists` });
      }
    }

    const drugId = uuidv4();
    const drug = {
      id: drugId,
      name,
      manufacturer,
      batchId,
      expiryDate,
      description: description || '',
      registeredAt: new Date().toISOString(),
      status: 'registered',
    };

    // Store in memory
    drugs.set(drugId, drug);

    // Record in ledger
    const block = ledger.addBlock({
      type: 'DRUG_REGISTRATION',
      drugId,
      name,
      manufacturer,
      batchId,
    });

    logger.info('Drug registered', { drugId, name, batchId, blockIndex: block.index });

    return res.status(201).json({
      message: 'Drug registered successfully',
      drug,
      ledgerBlock: {
        index: block.index,
        hash: block.hash,
      },
    });
  } catch (error) {
    logger.error('Failed to register drug', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /drugs
 * List all registered drugs.
 *
 * Response: 200 with array of drugs
 */
router.get('/', (req, res) => {
  try {
    const allDrugs = Array.from(drugs.values());

    logger.info('Drug list retrieved', { count: allDrugs.length });

    return res.status(200).json({
      count: allDrugs.length,
      drugs: allDrugs,
    });
  } catch (error) {
    logger.error('Failed to retrieve drugs', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /drugs/:id
 * Get a specific drug by its ID.
 *
 * Response: 200 with drug details, or 404
 */
router.get('/:id', (req, res) => {
  try {
    const drug = drugs.get(req.params.id);

    if (!drug) {
      return res.status(404).json({ error: 'Drug not found' });
    }

    return res.status(200).json({ drug });
  } catch (error) {
    logger.error('Failed to retrieve drug', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export router and drugs map (for testing)
module.exports = { router, drugs };
