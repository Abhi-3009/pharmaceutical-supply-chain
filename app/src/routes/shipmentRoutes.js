const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { ledger } = require('../ledger/hashChain');
const logger = require('../utils/logger');

const router = express.Router();

// In-memory shipment store
const shipments = new Map();

// Valid shipment statuses
const VALID_STATUSES = ['created', 'in-transit', 'at-checkpoint', 'delivered', 'recalled'];

/**
 * POST /shipments
 * Create a new shipment for a drug.
 *
 * Body: { drugId, drugName, origin, destination, quantity? }
 * Response: 201 with created shipment + ledger block
 */
router.post('/', (req, res) => {
  try {
    const { drugId, drugName, origin, destination, quantity } = req.body;

    // Validation
    if (!drugId || !drugName || !origin || !destination) {
      return res.status(400).json({
        error: 'Missing required fields: drugId, drugName, origin, destination',
      });
    }

    const shipmentId = uuidv4();
    const shipment = {
      id: shipmentId,
      drugId,
      drugName,
      origin,
      destination,
      quantity: quantity || 1,
      status: 'created',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      statusHistory: [
        {
          status: 'created',
          timestamp: new Date().toISOString(),
          location: origin,
        },
      ],
    };

    // Store in memory
    shipments.set(shipmentId, shipment);

    // Record in ledger
    const block = ledger.addBlock({
      type: 'SHIPMENT_CREATED',
      shipmentId,
      drugId,
      origin,
      destination,
    });

    logger.info('Shipment created', {
      shipmentId,
      drugId,
      origin,
      destination,
      blockIndex: block.index,
    });

    return res.status(201).json({
      message: 'Shipment created successfully',
      shipment,
      ledgerBlock: {
        index: block.index,
        hash: block.hash,
      },
    });
  } catch (error) {
    logger.error('Failed to create shipment', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /shipments
 * List all shipments.
 *
 * Response: 200 with array of shipments
 */
router.get('/', (req, res) => {
  try {
    const allShipments = Array.from(shipments.values());

    logger.info('Shipment list retrieved', { count: allShipments.length });

    return res.status(200).json({
      count: allShipments.length,
      shipments: allShipments,
    });
  } catch (error) {
    logger.error('Failed to retrieve shipments', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /shipments/:id
 * Track a specific shipment — returns full status history.
 *
 * Response: 200 with shipment details, or 404
 */
router.get('/:id', (req, res) => {
  try {
    const shipment = shipments.get(req.params.id);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    return res.status(200).json({ shipment });
  } catch (error) {
    logger.error('Failed to retrieve shipment', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /shipments/:id/status
 * Update shipment status (e.g., in-transit, at-checkpoint, delivered, recalled).
 *
 * Body: { status, location? }
 * Response: 200 with updated shipment + ledger block
 */
router.put('/:id/status', (req, res) => {
  try {
    const { status, location } = req.body;
    const shipment = shipments.get(req.params.id);

    if (!shipment) {
      return res.status(404).json({ error: 'Shipment not found' });
    }

    if (!status) {
      return res.status(400).json({ error: 'Missing required field: status' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`,
      });
    }

    // Update shipment
    shipment.status = status;
    shipment.updatedAt = new Date().toISOString();
    shipment.statusHistory.push({
      status,
      timestamp: new Date().toISOString(),
      location: location || 'Unknown',
    });

    // Record in ledger
    const block = ledger.addBlock({
      type: 'SHIPMENT_STATUS_UPDATE',
      shipmentId: shipment.id,
      drugId: shipment.drugId,
      status,
      location: location || 'Unknown',
    });

    logger.info('Shipment status updated', {
      shipmentId: shipment.id,
      status,
      location,
      blockIndex: block.index,
    });

    return res.status(200).json({
      message: 'Shipment status updated successfully',
      shipment,
      ledgerBlock: {
        index: block.index,
        hash: block.hash,
      },
    });
  } catch (error) {
    logger.error('Failed to update shipment status', { error: error.message });
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Export router and shipments map (for testing)
module.exports = { router, shipments };
