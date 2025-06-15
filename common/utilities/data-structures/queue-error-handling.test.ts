import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Error Handling', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should capture and rethrow function errors', async () => {
    const error = new Error('Test error');
    const mockFunction = vi.fn().mockRejectedValue(error);
    
    queue.enqueue(mockFunction);
    
    await expect(queue.executeNext()).rejects.toThrow('Test error');
    expect(mockFunction).toHaveBeenCalledOnce();
  });

  it('should continue execution after error', async () => {
    const error = new Error('Test error');
    const mockFunction1 = vi.fn().mockRejectedValue(error);
    const mockFunction2 = vi.fn().mockResolvedValue('success');
    
    queue.enqueue(mockFunction1);
    queue.enqueue(mockFunction2);
    
    // First function should throw
    await expect(queue.executeNext()).rejects.toThrow();
    
    // Second function should still execute
    const result = await queue.executeNext();
    expect(result?.data).toBeDefined();
    expect(result?.data).toBe('success');
    expect(mockFunction2).toHaveBeenCalledOnce();
  });

  it('should track errors in execution history', async () => {
    const error = new Error('Test error');
    queue.enqueue(vi.fn().mockRejectedValue(error), 'error-id');
    
    try {
      await queue.executeNext();
    } catch {
      // Expected to throw
    }
    
    const history = queue.getExecutionHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.error).toBe(error);
    expect(history[0]?.id).toBe('error-id');
  });
});
