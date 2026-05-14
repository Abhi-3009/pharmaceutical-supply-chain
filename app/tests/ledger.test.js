const { HashChainLedger } = require('../src/ledger/hashChain');

describe('HashChainLedger', () => {
  let ledger;

  beforeEach(() => {
    ledger = new HashChainLedger();
  });

  describe('initialization', () => {
    test('should create a genesis block on initialization', () => {
      const chain = ledger.getChain();
      expect(chain).toHaveLength(1);
      expect(chain[0].index).toBe(0);
      expect(chain[0].previousHash).toBe('0');
      expect(chain[0].data.type).toBe('GENESIS');
    });

    test('genesis block should have a valid hash', () => {
      const genesis = ledger.getChain()[0];
      expect(genesis.hash).toBeDefined();
      expect(genesis.hash).toHaveLength(64); // SHA-256 hex
    });
  });

  describe('addBlock', () => {
    test('should add a new block to the chain', () => {
      const data = { type: 'DRUG_REGISTRATION', name: 'Aspirin' };
      const block = ledger.addBlock(data);

      expect(block.index).toBe(1);
      expect(block.data).toEqual(data);
      expect(block.previousHash).toBe(ledger.getChain()[0].hash);
      expect(ledger.getChain()).toHaveLength(2);
    });

    test('should correctly chain multiple blocks', () => {
      ledger.addBlock({ type: 'DRUG_REGISTRATION', name: 'Drug A' });
      ledger.addBlock({ type: 'SHIPMENT_CREATED', shipmentId: '123' });
      ledger.addBlock({ type: 'SHIPMENT_STATUS_UPDATE', status: 'delivered' });

      const chain = ledger.getChain();
      expect(chain).toHaveLength(4); // genesis + 3

      // Verify each block links to previous
      for (let i = 1; i < chain.length; i++) {
        expect(chain[i].previousHash).toBe(chain[i - 1].hash);
      }
    });
  });

  describe('verifyChain', () => {
    test('should return valid for an untampered chain', () => {
      ledger.addBlock({ type: 'DRUG_REGISTRATION', name: 'Aspirin' });
      ledger.addBlock({ type: 'SHIPMENT_CREATED', shipmentId: '456' });

      const result = ledger.verifyChain();
      expect(result.valid).toBe(true);
      expect(result.totalBlocks).toBe(3);
      expect(result.invalidBlocks).toHaveLength(0);
    });

    test('should detect tampering when block data is modified', () => {
      ledger.addBlock({ type: 'DRUG_REGISTRATION', name: 'Aspirin' });
      ledger.addBlock({ type: 'SHIPMENT_CREATED', shipmentId: '789' });

      // Tamper with block 1's data
      ledger.getChain()[1].data = { type: 'DRUG_REGISTRATION', name: 'FAKE_DRUG' };

      const result = ledger.verifyChain();
      expect(result.valid).toBe(false);
      expect(result.invalidBlocks).toContain(1);
    });

    test('should detect tampering when block hash is modified', () => {
      ledger.addBlock({ type: 'DRUG_REGISTRATION', name: 'Ibuprofen' });
      ledger.addBlock({ type: 'DRUG_REGISTRATION', name: 'Paracetamol' });

      // Tamper with block 1's hash — this breaks linkage to block 2
      ledger.getChain()[1].hash = 'tampered_hash_value';

      const result = ledger.verifyChain();
      expect(result.valid).toBe(false);
    });

    test('should return valid for chain with only genesis block', () => {
      const result = ledger.verifyChain();
      expect(result.valid).toBe(true);
      expect(result.totalBlocks).toBe(1);
    });
  });

  describe('getBlock', () => {
    test('should return block by index', () => {
      ledger.addBlock({ type: 'TEST', value: 42 });
      const block = ledger.getBlock(1);
      expect(block).toBeDefined();
      expect(block.data.value).toBe(42);
    });

    test('should return null for non-existent index', () => {
      const block = ledger.getBlock(999);
      expect(block).toBeNull();
    });
  });

  describe('getLatestBlock', () => {
    test('should return the most recent block', () => {
      ledger.addBlock({ type: 'FIRST' });
      ledger.addBlock({ type: 'SECOND' });
      ledger.addBlock({ type: 'THIRD' });

      const latest = ledger.getLatestBlock();
      expect(latest.data.type).toBe('THIRD');
      expect(latest.index).toBe(3);
    });
  });

  describe('calculateHash', () => {
    test('should produce consistent hashes for same input', () => {
      const hash1 = HashChainLedger.calculateHash('prev', { a: 1 }, '2024-01-01');
      const hash2 = HashChainLedger.calculateHash('prev', { a: 1 }, '2024-01-01');
      expect(hash1).toBe(hash2);
    });

    test('should produce different hashes for different inputs', () => {
      const hash1 = HashChainLedger.calculateHash('prev', { a: 1 }, '2024-01-01');
      const hash2 = HashChainLedger.calculateHash('prev', { a: 2 }, '2024-01-01');
      expect(hash1).not.toBe(hash2);
    });
  });
});
