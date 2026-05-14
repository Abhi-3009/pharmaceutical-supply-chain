const request = require('supertest');
const app = require('../src/server');
const { shipments } = require('../src/routes/shipmentRoutes');

describe('Shipment Routes', () => {
  // Clear shipments store before each test
  beforeEach(() => {
    shipments.clear();
  });

  describe('POST /shipments', () => {
    const validShipment = {
      drugId: 'drug-123',
      drugName: 'Aspirin',
      origin: 'Mumbai Warehouse',
      destination: 'Delhi Hospital',
      quantity: 500,
    };

    test('should create a new shipment successfully', async () => {
      const res = await request(app).post('/shipments').send(validShipment);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('Shipment created successfully');
      expect(res.body.shipment.drugId).toBe('drug-123');
      expect(res.body.shipment.origin).toBe('Mumbai Warehouse');
      expect(res.body.shipment.destination).toBe('Delhi Hospital');
      expect(res.body.shipment.status).toBe('created');
      expect(res.body.shipment.statusHistory).toHaveLength(1);
      expect(res.body.ledgerBlock).toBeDefined();
    });

    test('should return 400 when required fields are missing', async () => {
      const res = await request(app)
        .post('/shipments')
        .send({ drugId: 'drug-123' }); // missing drugName, origin, destination

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required fields');
    });

    test('should default quantity to 1 when not provided', async () => {
      const { quantity, ...shipmentWithoutQty } = validShipment;
      const res = await request(app).post('/shipments').send(shipmentWithoutQty);

      expect(res.status).toBe(201);
      expect(res.body.shipment.quantity).toBe(1);
    });
  });

  describe('GET /shipments', () => {
    test('should return empty array when no shipments exist', async () => {
      const res = await request(app).get('/shipments');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(0);
      expect(res.body.shipments).toEqual([]);
    });

    test('should return all shipments', async () => {
      await request(app).post('/shipments').send({
        drugId: 'drug-1',
        drugName: 'Drug A',
        origin: 'Origin A',
        destination: 'Dest A',
      });
      await request(app).post('/shipments').send({
        drugId: 'drug-2',
        drugName: 'Drug B',
        origin: 'Origin B',
        destination: 'Dest B',
      });

      const res = await request(app).get('/shipments');

      expect(res.status).toBe(200);
      expect(res.body.count).toBe(2);
    });
  });

  describe('GET /shipments/:id', () => {
    test('should return a shipment by ID with status history', async () => {
      const createRes = await request(app).post('/shipments').send({
        drugId: 'drug-1',
        drugName: 'Aspirin',
        origin: 'Warehouse',
        destination: 'Hospital',
      });

      const shipmentId = createRes.body.shipment.id;
      const res = await request(app).get(`/shipments/${shipmentId}`);

      expect(res.status).toBe(200);
      expect(res.body.shipment.id).toBe(shipmentId);
      expect(res.body.shipment.statusHistory).toHaveLength(1);
    });

    test('should return 404 for non-existent shipment', async () => {
      const res = await request(app).get('/shipments/non-existent-id');

      expect(res.status).toBe(404);
      expect(res.body.error).toBe('Shipment not found');
    });
  });

  describe('PUT /shipments/:id/status', () => {
    let shipmentId;

    beforeEach(async () => {
      const createRes = await request(app).post('/shipments').send({
        drugId: 'drug-1',
        drugName: 'Aspirin',
        origin: 'Warehouse',
        destination: 'Hospital',
      });
      shipmentId = createRes.body.shipment.id;
    });

    test('should update shipment status successfully', async () => {
      const res = await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({ status: 'in-transit', location: 'Highway 101' });

      expect(res.status).toBe(200);
      expect(res.body.shipment.status).toBe('in-transit');
      expect(res.body.shipment.statusHistory).toHaveLength(2);
      expect(res.body.ledgerBlock).toBeDefined();
    });

    test('should track multiple status updates in history', async () => {
      await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({ status: 'in-transit', location: 'Highway 101' });
      await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({ status: 'at-checkpoint', location: 'Checkpoint Alpha' });
      const res = await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({ status: 'delivered', location: 'Hospital' });

      expect(res.body.shipment.statusHistory).toHaveLength(4); // created + 3 updates
      expect(res.body.shipment.status).toBe('delivered');
    });

    test('should return 400 for invalid status', async () => {
      const res = await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({ status: 'invalid-status' });

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Invalid status');
    });

    test('should return 400 when status is missing', async () => {
      const res = await request(app)
        .put(`/shipments/${shipmentId}/status`)
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.error).toContain('Missing required field');
    });

    test('should return 404 for non-existent shipment', async () => {
      const res = await request(app)
        .put('/shipments/non-existent/status')
        .send({ status: 'in-transit' });

      expect(res.status).toBe(404);
    });
  });
});
