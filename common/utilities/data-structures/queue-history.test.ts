import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Execution History', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ 
      autoExecute: false, 
      maxHistorySize: 3 
    });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should track execution history', async () => {
    const mockFunction = vi.fn().mockResolvedValue('result');
    
    queue.enqueue(mockFunction, 'test-id');
    await queue.executeNext();
    
    const history = queue.getExecutionHistory();
    expect(history).toHaveLength(1);
    expect(history[0]?.id).toBe('test-id');
    expect(history[0]?.data).toBe('result');
  });

  it('should limit history size', async () => {
    for (let i = 0; i < 5; i++) {
      const mockFunction = vi.fn().mockResolvedValue(`result${i}`);
      queue.enqueue(mockFunction, `id-${i}`);
      await queue.executeNext();
    }
    
    const history = queue.getExecutionHistory();
    expect(history).toHaveLength(3); // maxHistorySize is 3
  });

  it('should return empty history initially', () => {
    const history = queue.getExecutionHistory();
    expect(history).toHaveLength(0);
  });
});
