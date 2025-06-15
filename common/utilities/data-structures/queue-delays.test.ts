import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Delays', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false, defaultDelayMs: 100 });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should enqueue functions with custom delay', () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction, 'test-id', 500);
    expect(queue.size()).toBe(1);
  });

  it('should enqueue functions with default delay', () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction);
    expect(queue.size()).toBe(1);
  });

  it('should handle zero delay', () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction, 'test-id', 0);
    expect(queue.size()).toBe(1);
  });

  it('should create queue with custom default delay', () => {
    const customQueue = new AsyncFunctionQueue({ 
      autoExecute: false, 
      defaultDelayMs: 1000 
    });
    
    expect(customQueue.size()).toBe(0);
  });
});
