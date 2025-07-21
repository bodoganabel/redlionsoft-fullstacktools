import { describe, it, expect } from 'vitest';
import { ObjectIdGenerate, SObjectIdClient } from './objectid';

describe('MongoDB ObjectId Implementation', () => {
  describe('ObjectIdGenerate', () => {
    it('should generate a 24-character hexadecimal string', () => {
      const objectId = ObjectIdGenerate();
      expect(objectId).toMatch(/^[0-9a-f]{24}$/i);
    });

    it('should generate unique IDs on multiple calls', () => {
      const id1 = ObjectIdGenerate();
      const id2 = ObjectIdGenerate();
      const id3 = ObjectIdGenerate();
      
      expect(id1).not.toEqual(id2);
      expect(id1).not.toEqual(id3);
      expect(id2).not.toEqual(id3);
    });

    it('should contain a timestamp in the first 8 characters', () => {
      // Get current timestamp in seconds (Unix epoch)
      const now = Math.floor(Date.now() / 1000);
      const objectId = ObjectIdGenerate();
      
      // Extract timestamp from the first 8 characters (4 bytes)
      const timestampHex = objectId.substring(0, 8);
      const timestamp = parseInt(timestampHex, 16);
      
      // The timestamp should be very close to now (within 5 seconds)
      expect(Math.abs(timestamp - now)).toBeLessThanOrEqual(5);
    });
  });

  describe('SObjectIdClient Schema', () => {
    it('should validate valid ObjectIds', () => {
      const validId = ObjectIdGenerate();
      const result = SObjectIdClient.safeParse(validId);
      expect(result.success).toBe(true);
    });

    it('should reject strings shorter than 24 characters', () => {
      const shortId = '123456789012345678901234'.substring(0, 23); // 23 chars
      const result = SObjectIdClient.safeParse(shortId);
      expect(result.success).toBe(false);
    });

    it('should reject strings longer than 24 characters', () => {
      const longId = '123456789012345678901234' + '5'; // 25 chars
      const result = SObjectIdClient.safeParse(longId);
      expect(result.success).toBe(false);
    });

    it('should generate a valid ObjectId when using default', () => {
      const schema = SObjectIdClient.parse(undefined);
      expect(schema).toMatch(/^[0-9a-f]{24}$/i);
    });
  });

  describe('MongoDB ObjectId Structure Compliance', () => {
    it('should follow MongoDB ObjectId structure with correct byte allocation', () => {
      const objectId = ObjectIdGenerate();
      
      // According to MongoDB docs, ObjectId is a 12-byte value consisting of:
      // - 4-byte timestamp value (seconds since Unix epoch) = 8 hex chars
      // - 5-byte random value = 10 hex chars
      // - 3-byte incrementing counter = 6 hex chars
      
      expect(objectId.length).toBe(24); // 12 bytes = 24 hex chars
      
      // Extract parts
      const timestampPart = objectId.substring(0, 8);   // First 4 bytes (8 hex chars)
      const randomPart = objectId.substring(8, 18);     // Next 5 bytes (10 hex chars)
      const counterPart = objectId.substring(18, 24);   // Last 3 bytes (6 hex chars)
      
      // Verify each part is valid hexadecimal
      expect(timestampPart).toMatch(/^[0-9a-f]{8}$/i);
      expect(randomPart).toMatch(/^[0-9a-f]{10}$/i);
      expect(counterPart).toMatch(/^[0-9a-f]{6}$/i);
    });
  });
});
