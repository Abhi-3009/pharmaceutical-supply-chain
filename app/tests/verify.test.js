const request = require('supertest');
const app = require('../src/server');

describe('Verify & System Routes', () => {
  describe('GET /api/info', () => {
    test('should return API information', async () => {
      const res = await request(app).get('/api/info');

      expect(res.status).toBe(200);
      expect(res.body.name).toBe('Pharmaceutical Supply Chain API');
      expect(res.body.version).toBe('1.0.0');
      expect(res.body.endpoints).toBeDefined();
    });
  });

  describe('GET /health', () => {
    test('should return healthy status', async () => {
      const res = await request(app).get('/health');

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('healthy');
      expect(res.body.service).toBe('pharma-supply-chain');
      expect(res.body.uptime).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });
  });

  describe('GET /verify', () => {
    test('should verify chain integrity (valid chain)', async () => {
      const res = await request(app).get('/verify');

      expect(res.status).toBe(200);
      expect(res.body.verification.valid).toBe(true);
      expect(res.body.message).toContain('no tampering detected');
    });

    test('should verify chain after adding drugs and shipments', async () => {
      // Add some data to the ledger
      await request(app).post('/drugs').send({
        name: 'Test Drug',
        manufacturer: 'Test Corp',
        batchId: 'VERIFY-001',
        expiryDate: '2026-12-31',
      });

      await request(app).post('/shipments').send({
        drugId: 'drug-1',
        drugName: 'Test Drug',
        origin: 'Origin',
        destination: 'Destination',
      });

      const res = await request(app).get('/verify');

      expect(res.status).toBe(200);
      expect(res.body.verification.valid).toBe(true);
      expect(res.body.verification.totalBlocks).toBeGreaterThan(1);
    });
  });

  describe('GET /ledger', () => {
    test('should return the full ledger chain', async () => {
      const res = await request(app).get('/ledger');

      expect(res.status).toBe(200);
      expect(res.body.totalBlocks).toBeGreaterThanOrEqual(1);
      expect(res.body.chain).toBeDefined();
      expect(Array.isArray(res.body.chain)).toBe(true);
    });
  });

  describe('404 Handler', () => {
    test('should return 404 for unknown routes', async () => {
      const res = await request(app).get('/nonexistent-route');

      expect(res.status).toBe(404);
      expect(res.body.error).toContain('not found');
    });
  });
});
