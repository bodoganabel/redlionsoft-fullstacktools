import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Execution', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should execute single function with executeNext', async () => {
    const mockFunction = vi.fn().mockResolvedValue('result1');
    
    queue.enqueue(mockFunction);
    expect(queue.size()).toBe(1);

    const result = await queue.executeNext();
    
    expect(mockFunction).toHaveBeenCalledOnce();
    expect(result?.data).toBe('result1');
    expect(queue.size()).toBe(0);
  });

  it('should track execution state', async () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction);
    expect(queue.isCurrentlyExecuting()).toBe(false);
    
    await queue.executeNext();
    expect(queue.isCurrentlyExecuting()).toBe(false);
  });
});
