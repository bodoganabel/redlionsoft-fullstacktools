import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';

// Mock DateTime to control time
vi.mock('luxon', () => {
  let mockTime = new Date('2024-01-01T10:00:00.000Z');
  return {
    DateTime: {
      now: vi.fn(() => ({
        toISO: () => mockTime.toISOString(),
        plus: ({ milliseconds }: { milliseconds: number }) => ({
          toISO: () => new Date(mockTime.getTime() + milliseconds).toISOString()
        })
      })),
      fromISO: vi.fn((iso: string) => ({
        diff: (other: any) => ({
          milliseconds: new Date(iso).getTime() - new Date(other.toISO()).getTime()
        }),
        toISO: () => iso
      }))
    }
  };
});

describe('AsyncFunctionQueue', () => {
  let queue: AsyncFunctionQueue<any>;
  let mockFn: ReturnType<typeof vi.fn>;
  let consoleLogSpy: any;
  let consoleErrorSpy: any;

  beforeEach(() => {
    queue = new AsyncFunctionQueue({ autoExecute: false, debug: false });
    mockFn = vi.fn();
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllTimers();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  describe('Constructor & Configuration', () => {
    it('should use default options when none provided', () => {
      const defaultQueue = new AsyncFunctionQueue();
      expect(defaultQueue.isEmpty()).toBe(true);
    });

    it('should merge provided options with defaults', () => {
      const customQueue = new AsyncFunctionQueue({ 
        autoExecute: false, 
        debug: true, 
        maxHistorySize: 50 
      });
      expect(customQueue.isEmpty()).toBe(true);
    });
  });

  describe('Basic Queue Operations', () => {
    it('should enqueue functions correctly', () => {
      const size = queue.enqueue(async () => 'test');
      expect(size).toBe(1);
      expect(queue.size()).toBe(1);
      expect(queue.isEmpty()).toBe(false);
    });

    it('should clear queue and return count', () => {
      queue.enqueue(async () => 'test1');
      queue.enqueue(async () => 'test2');
      
      const cleared = queue.clear();
      expect(cleared).toBe(2);
      expect(queue.size()).toBe(0);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should check for function existence by ID', () => {
      queue.enqueue(async () => 'test', 'test-id');
      
      expect(queue.hasFunction('test-id')).toBe(true);
      expect(queue.hasFunction('nonexistent')).toBe(false);
    });

    it('should remove functions by ID', () => {
      queue.enqueue(async () => 'test1', 'id1');
      queue.enqueue(async () => 'test2', 'id2');
      
      const removed = queue.removeFunction('id1');
      expect(removed).toBe(true);
      expect(queue.size()).toBe(1);
      expect(queue.hasFunction('id1')).toBe(false);
      expect(queue.hasFunction('id2')).toBe(true);
    });
  });

  describe('Function Replacement by ID', () => {
    it('should replace existing function with same ID', () => {
      const oldFn = vi.fn(async () => 'old');
      const newFn = vi.fn(async () => 'new');
      
      queue.enqueue(oldFn, 'test-id');
      expect(queue.size()).toBe(1);
      
      queue.enqueue(newFn, 'test-id');
      expect(queue.size()).toBe(1); // Should still be 1, not 2
    });

    it('should maintain queue order when replacing', () => {
      queue.enqueue(async () => 'first');
      queue.enqueue(async () => 'old', 'replace-me');
      queue.enqueue(async () => 'last');
      
      queue.enqueue(async () => 'new', 'replace-me');
      expect(queue.size()).toBe(3);
    });
  });

  describe('Execution Flow', () => {
    it('should execute functions in FIFO order', async () => {
      const results: string[] = [];
      
      queue.enqueue(async () => { results.push('first'); return 'first'; });
      queue.enqueue(async () => { results.push('second'); return 'second'; });
      queue.enqueue(async () => { results.push('third'); return 'third'; });
      
      await queue.executeQueue();
      
      expect(results).toEqual(['first', 'second', 'third']);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should handle empty queue execution gracefully', async () => {
      await expect(queue.executeQueue()).resolves.not.toThrow();
      expect(queue.isEmpty()).toBe(true);
    });

    it('should prevent concurrent execution', async () => {
      let executions = 0;
      const slowFn = vi.fn(async () => {
        executions++;
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow';
      });
      
      queue.enqueue(slowFn);
      
      // Start execution
      const promise1 = queue.executeQueue();
      const promise2 = queue.executeQueue(); // Should return early
      
      vi.advanceTimersByTime(100);
      await Promise.all([promise1, promise2]);
      
      expect(executions).toBe(1); // Should only execute once
    });

    it('should track execution state correctly', async () => {
      expect(queue.isCurrentlyExecuting()).toBe(false);
      
      const slowFn = async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow';
      };
      
      queue.enqueue(slowFn);
      
      const promise = queue.executeQueue();
      expect(queue.isCurrentlyExecuting()).toBe(true);
      
      vi.advanceTimersByTime(100);
      await promise;
      
      expect(queue.isCurrentlyExecuting()).toBe(false);
    });
  });

  describe('CRITICAL BUG: Auto-execution Race Conditions', () => {
    it('should handle race condition in auto-execute enqueue', async () => {
      // Use real timers for auto-execute tests
      vi.useRealTimers();
      
      const autoQueue = new AsyncFunctionQueue({ autoExecute: true });
      let executions = 0;
      
      // Enqueue multiple functions rapidly
      autoQueue.enqueue(async () => { executions++; return 'a'; });
      autoQueue.enqueue(async () => { executions++; return 'b'; });
      autoQueue.enqueue(async () => { executions++; return 'c'; });
      
      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 50));
      
      expect(executions).toBe(3);
      expect(autoQueue.isEmpty()).toBe(true);
      
      // Restore fake timers
      vi.useFakeTimers();
    }, 1000);

    it('should NOT create multiple concurrent executions with auto-execute', async () => {
      // Use real timers for auto-execute tests
      vi.useRealTimers();
      
      const autoQueue = new AsyncFunctionQueue({ autoExecute: true });
      let concurrentExecutions = 0;
      let maxConcurrent = 0;
      
      const trackingFn = async (id: string) => {
        concurrentExecutions++;
        maxConcurrent = Math.max(maxConcurrent, concurrentExecutions);
        
        await new Promise(resolve => setTimeout(resolve, 10));
        
        concurrentExecutions--;
        return id;
      };
      
      // Rapidly enqueue functions
      autoQueue.enqueue(() => trackingFn('a'));
      autoQueue.enqueue(() => trackingFn('b'));
      autoQueue.enqueue(() => trackingFn('c'));
      
      // Wait for all to complete
      await new Promise(resolve => setTimeout(resolve, 100));
      
      expect(maxConcurrent).toBe(1); // Should never exceed 1
      
      // Restore fake timers
      vi.useFakeTimers();
    }, 1000);
  });

  describe('Delayed Execution', () => {
    it('should delay execution correctly', async () => {
      let executedCount = 0;
      
      queue.enqueue(async () => {
        executedCount++;
        return 'delayed';
      }, undefined, 100);
      
      // Function should be in queue but not executed yet
      expect(queue.size()).toBe(1);
      expect(executedCount).toBe(0);
      
      // Execute the queue
      await queue.executeQueue();
      
      // Function should have been executed
      expect(executedCount).toBe(1);
      expect(queue.isEmpty()).toBe(true);
    });

    it('CRITICAL: should handle queue modification during delay', async () => {
      const results: string[] = [];
      
      // Add function with delay
      queue.enqueue(async () => { results.push('delayed'); return 'delayed'; }, 'delayed', 100);
      
      // Start execution (will begin delay)
      const executePromise = queue.executeQueue();
      
      // During delay, modify the queue
      setTimeout(() => {
        queue.enqueue(async () => { results.push('immediate'); return 'immediate'; });
      }, 50);
      
      vi.advanceTimersByTime(150);
      await executePromise;
      
      // Both functions should execute, delayed first
      expect(results).toEqual(['delayed', 'immediate']);
    });

    it('should handle replacement during delay correctly', async () => {
      const results: string[] = [];
      
      // Add function with delay and ID
      queue.enqueue(async () => { results.push('old'); return 'old'; }, 'replace-me', 100);
      expect(queue.size()).toBe(1);
      
      // Replace function with same ID (should replace in same position)
      queue.enqueue(async () => { results.push('new'); return 'new'; }, 'replace-me');
      expect(queue.size()).toBe(1); // Should still be 1 item (replaced, not added)
      
      // Execute the queue
      await queue.executeQueue();
      
      // Should execute the replacement, not the original
      expect(results).toEqual(['new']);
      expect(queue.isEmpty()).toBe(true);
    }, 2000);
  });

  describe('Error Handling', () => {
    it('should capture and store function errors', async () => {
      const error = new Error('Test error');
      queue.enqueue(async () => { throw error; });
      
      await expect(queue.executeQueue()).rejects.toThrow('Test error');
      
      const history = queue.getExecutionHistory();
      expect(history).toHaveLength(1);
      expect(history[0]).toBeDefined();
      expect(history[0]?.error).toBe(error);
      expect(history[0]?.data).toBeUndefined();
    });

    it('should continue execution after error', async () => {
      const results: string[] = [];
      
      queue.enqueue(async () => { results.push('first'); return 'first'; });
      queue.enqueue(async () => { throw new Error('fail'); });
      queue.enqueue(async () => { results.push('third'); return 'third'; });
      
      await expect(queue.executeQueue()).rejects.toThrow('fail');
      
      expect(results).toEqual(['first']); // Only first should execute
      expect(queue.size()).toBe(1); // Third function should remain
    });

    it('should handle errors in delay logic', async () => {
      // Mock DateTime.fromISO to throw error
      const { DateTime } = await import('luxon');
      vi.mocked(DateTime.fromISO).mockImplementationOnce(() => {
        throw new Error('DateTime error');
      });
      
      queue.enqueue(async () => 'test', undefined, 100);
      
      await expect(queue.executeQueue()).rejects.toThrow('DateTime error');
    });
  });

  describe('Execution History', () => {
    it('should track successful executions', async () => {
      queue.enqueue(async () => 'result1', 'id1');
      queue.enqueue(async () => 'result2', 'id2');
      
      await queue.executeQueue();
      
      const history = queue.getExecutionHistory();
      expect(history).toHaveLength(2);
      expect(history[0]).toBeDefined();
      expect(history[0]?.data).toBe('result1');
      expect(history[0]?.id).toBe('id1');
      expect(history[0]?.error).toBeUndefined();
      expect(history[1]).toBeDefined();
      expect(history[1]?.data).toBe('result2');
      expect(history[1]?.id).toBe('id2');
      expect(history[1]?.error).toBeUndefined();
    });

    it('should limit history size', async () => {
      const limitedQueue = new AsyncFunctionQueue({ autoExecute: false, maxHistorySize: 2 });
      
      limitedQueue.enqueue(async () => 'result1');
      limitedQueue.enqueue(async () => 'result2');
      limitedQueue.enqueue(async () => 'result3');
      
      await limitedQueue.executeQueue();
      
      const history = limitedQueue.getExecutionHistory();
      expect(history).toHaveLength(2);
      // Should keep the most recent executions
      expect(history[0]).toBeDefined();
      expect(history[0]?.data).toBe('result2');
      expect(history[1]).toBeDefined();
      expect(history[1]?.data).toBe('result3');
    });

    it('should return copy of history (not reference)', () => {
      const history1 = queue.getExecutionHistory();
      const history2 = queue.getExecutionHistory();
      
      expect(history1).not.toBe(history2); // Different objects
      expect(history1).toEqual(history2); // Same content
    });
  });

  describe('checkForPendingJobs', () => {
    it('should execute all jobs and call callback', async () => {
      const callback = vi.fn();
      const results: string[] = [];
      
      queue.enqueue(async () => { results.push('job1'); return 'job1'; });
      queue.enqueue(async () => { results.push('job2'); return 'job2'; });
      
      const hasPending = await queue.checkForPendingJobs(callback);
      
      expect(hasPending).toBe(false);
      expect(callback).toHaveBeenCalledOnce();
      expect(results).toEqual(['job1', 'job2']);
    });

    it('should return true if already executing', async () => {
      const callback = vi.fn();
      
      queue.enqueue(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
        return 'slow';
      });
      
      // Start execution
      const executePromise = queue.executeQueue();
      
      // Check while executing
      const hasPending = await queue.checkForPendingJobs(callback);
      
      expect(hasPending).toBe(true);
      expect(callback).not.toHaveBeenCalled();
      
      vi.advanceTimersByTime(100);
      await executePromise;
    });
  });

  describe('STRESS TESTS: Edge Cases & Race Conditions', () => {
    it('should handle rapid enqueue/dequeue operations', async () => {
      const results: number[] = [];
      
      // Rapidly add many functions
      for (let i = 0; i < 100; i++) {
        queue.enqueue(async () => {
          results.push(i);
          return i;
        }, `job-${i}`);
      }
      
      await queue.executeQueue();
      
      expect(results).toHaveLength(100);
      expect(queue.isEmpty()).toBe(true);
    });

    it('should handle function replacement stress test', () => {
      // Rapidly replace the same function ID
      for (let i = 0; i < 50; i++) {
        queue.enqueue(async () => `version-${i}`, 'constant-id');
      }
      
      expect(queue.size()).toBe(1); // Should only have one function
    });

    it('should handle mixed delays and immediate execution', async () => {
      const results: string[] = [];
      
      queue.enqueue(async () => { results.push('immediate1'); return 'immediate1'; });
      queue.enqueue(async () => { results.push('delayed1'); return 'delayed1'; }, undefined, 50);
      queue.enqueue(async () => { results.push('immediate2'); return 'immediate2'; });
      queue.enqueue(async () => { results.push('delayed2'); return 'delayed2'; }, undefined, 25);
      
      const executePromise = queue.executeQueue();
      vi.advanceTimersByTime(100);
      await executePromise;
      
      expect(results).toEqual(['immediate1', 'delayed1', 'immediate2', 'delayed2']);
    });
  });

  describe('DEBUG MODE', () => {
    it('should log debug messages when enabled', () => {
      const debugQueue = new AsyncFunctionQueue({ debug: true, autoExecute: false });
      
      debugQueue.enqueue(async () => 'test', 'test-id', 100);
      
      expect(consoleLogSpy).toHaveBeenCalledWith(
        expect.stringContaining('[AsyncFunctionQueue] Enqueued function with ID: test-id (delayed by 100ms)')
      );
    });

    it('should not log when debug disabled', () => {
      queue.enqueue(async () => 'test', 'test-id');
      
      expect(consoleLogSpy).not.toHaveBeenCalled();
    });
  });
});
