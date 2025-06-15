import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - ID Management', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should replace function with same ID', () => {
    const mockFunction1 = vi.fn().mockResolvedValue('result1');
    const mockFunction2 = vi.fn().mockResolvedValue('result2');
    
    queue.enqueue(mockFunction1, 'same-id');
    queue.enqueue(mockFunction2, 'same-id');
    
    expect(queue.size()).toBe(1);
  });

  it('should not replace functions with different IDs', () => {
    const mockFunction1 = vi.fn().mockResolvedValue('result1');
    const mockFunction2 = vi.fn().mockResolvedValue('result2');
    
    queue.enqueue(mockFunction1, 'id-1');
    queue.enqueue(mockFunction2, 'id-2');
    
    expect(queue.size()).toBe(2);
  });

  it('should find function by ID', () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction, 'test-id');
    
    expect(queue.hasFunction('test-id')).toBe(true);
    expect(queue.hasFunction('non-existent')).toBe(false);
  });

  it('should remove function by ID', () => {
    const mockFunction1 = vi.fn().mockResolvedValue('result1');
    const mockFunction2 = vi.fn().mockResolvedValue('result2');
    
    queue.enqueue(mockFunction1, 'id-1');
    queue.enqueue(mockFunction2, 'id-2');
    
    expect(queue.removeFunction('id-1')).toBe(true);
    expect(queue.size()).toBe(1);
    expect(queue.hasFunction('id-1')).toBe(false);
    expect(queue.hasFunction('id-2')).toBe(true);
    
    expect(queue.removeFunction('non-existent')).toBe(false);
  });
});
