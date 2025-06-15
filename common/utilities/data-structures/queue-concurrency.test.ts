import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Concurrency', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should track execution state', () => {
    const mockFunction1 = vi.fn().mockResolvedValue('result1');
    const mockFunction2 = vi.fn().mockResolvedValue('result2');
    
    queue.enqueue(mockFunction1);
    queue.enqueue(mockFunction2);
    
    expect(queue.isCurrentlyExecuting()).toBe(false);
    expect(queue.size()).toBe(2);
  });

  it('should handle queue size correctly', () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    expect(queue.size()).toBe(0);
    queue.enqueue(mockFunction);
    expect(queue.size()).toBe(1);
  });
});
