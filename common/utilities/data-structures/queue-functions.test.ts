import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { DateTime } from 'luxon';

// Mock DateTime.now() to return a consistent value for testing
vi.mock('luxon', () => {
    const mockDateTime = {
        now: () => ({
            toISO: () => '2025-06-15T15:00:00.000Z',
            diff: () => ({ milliseconds: 100 }) // Mock for duration calculation
        })
    };
    return { DateTime: mockDateTime };
});

describe('AsyncFunctionQueue', () => {
    // Setup and teardown
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    // Basic functionality tests
    describe('core functionality', () => {
        it('should create an empty queue', () => {
            const queue = new AsyncFunctionQueue();
            expect(queue.size()).toBe(0);
            expect(queue.isEmpty()).toBe(true);
        });

        it('should enqueue functions and track size correctly', () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });

            queue.enqueue(async () => 'result1');
            expect(queue.size()).toBe(1);
            expect(queue.isEmpty()).toBe(false);

            queue.enqueue(async () => 'result2');
            expect(queue.size()).toBe(2);
        });

        it('should clear all pending functions', () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });

            queue.enqueue(async () => 'result1');
            queue.enqueue(async () => 'result2');
            queue.enqueue(async () => 'result3');

            const clearedCount = queue.clear();

            expect(clearedCount).toBe(3);
            expect(queue.size()).toBe(0);
            expect(queue.isEmpty()).toBe(true);
        });
    });

    // Auto-execution tests
    describe('auto execution', () => {
        it('should auto-execute functions when enabled', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: true });
            const mockFn = vi.fn().mockResolvedValue('result');

            queue.enqueue(mockFn);

            // Fast-forward timers to allow for Promise resolution
            await vi.runAllTimersAsync();

            expect(mockFn).toHaveBeenCalled();
        });

        it('should not auto-execute when disabled', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            const mockFn = vi.fn().mockResolvedValue('result');

            queue.enqueue(mockFn);

            // Fast-forward timers to allow for Promise resolution
            await vi.runAllTimersAsync();

            expect(mockFn).not.toHaveBeenCalled();
        });
    });

    // Manual execution tests
    describe('manual execution', () => {
        it('should execute next function with executeNext', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            const mockFn1 = vi.fn().mockResolvedValue('result1');
            const mockFn2 = vi.fn().mockResolvedValue('result2');

            queue.enqueue(mockFn1);
            queue.enqueue(mockFn2);

            await queue.executeNext();

            expect(mockFn1).toHaveBeenCalled();
            expect(mockFn2).not.toHaveBeenCalled();
        });

        it('should execute all functions with executeQueue', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            const mockFn1 = vi.fn().mockResolvedValue('result1');
            const mockFn2 = vi.fn().mockResolvedValue('result2');
            const mockFn3 = vi.fn().mockResolvedValue('result3');

            queue.enqueue(mockFn1);
            queue.enqueue(mockFn2);
            queue.enqueue(mockFn3);

            await queue.executeQueue();

            expect(mockFn1).toHaveBeenCalled();
            expect(mockFn2).toHaveBeenCalled();
            expect(mockFn3).toHaveBeenCalled();
        });

        it('should handle executeNext on an empty queue', async () => {
            const queue = new AsyncFunctionQueue();
            await expect(queue.executeNext()).resolves.toBeUndefined();
        });
    });

    // Execution order tests
    describe('execution order', () => {
        it('should execute functions in FIFO order', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            const executionOrder: number[] = [];

            queue.enqueue(async () => {
                executionOrder.push(1);
                return 'result1';
            });

            queue.enqueue(async () => {
                executionOrder.push(2);
                return 'result2';
            });

            queue.enqueue(async () => {
                executionOrder.push(3);
                return 'result3';
            });

            await queue.executeQueue();

            expect(executionOrder).toEqual([1, 2, 3]);
        });
    });

    // Origin tracking tests
    describe('origin tracking', () => {
        it('should track function origins', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const queue = new AsyncFunctionQueue({
                autoExecute: false,
                debugShowOrigin: true
            });

            queue.enqueue(async () => 'result1', 'test-origin-1');
            await queue.executeNext();

            expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining('test-origin-1'));
        });

        it('should not log origins when debugShowOrigin is false', async () => {
            const consoleSpy = vi.spyOn(console, 'log');
            const queue = new AsyncFunctionQueue({
                autoExecute: false,
                debugShowOrigin: false
            });

            queue.enqueue(async () => 'result1', 'test-origin-1');
            await queue.executeNext();

            expect(consoleSpy).not.toHaveBeenCalledWith(expect.stringContaining('test-origin-1'));
        });
    });

    // Error handling tests
    describe('error handling', () => {
        it('should track errors in execution history', async () => {
            const errorSpy = vi.spyOn(console, 'error');
            const queue = new AsyncFunctionQueue({
                autoExecute: false,
                debugShowOrigin: true
            });

            const errorMessage = 'Test error';
            queue.enqueue(async () => {
                throw new Error(errorMessage);
            }, 'error-origin');

            await expect(queue.executeNext()).rejects.toThrow(errorMessage);

            const history = queue.getHistory();
            expect(history.length).toBe(1);

            // Ensure the error object exists before accessing its properties
            const historyItem = history[0];
            expect(historyItem).toBeDefined();
            const historyError = historyItem?.error;
            expect(historyError).toBeDefined();
            expect(historyError?.message).toBe(errorMessage);
            expect(errorSpy).toHaveBeenCalled();
        });

        it('should continue queue execution after error when executeQueue is called again', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });

            const errorFn = vi.fn().mockRejectedValue(new Error('Test error'));
            const successFn = vi.fn().mockResolvedValue('success');

            queue.enqueue(errorFn);
            queue.enqueue(successFn);

            // First execution should fail
            await expect(queue.executeQueue()).rejects.toThrow();

            // Second execution should continue with next function
            await queue.executeQueue();

            expect(errorFn).toHaveBeenCalled();
            expect(successFn).toHaveBeenCalled();
        });
    });

    // History management tests
    describe('execution history', () => {
        it('should maintain execution history', async () => {
            const queue = new AsyncFunctionQueue({
                autoExecute: false,
                maxHistorySize: 2
            });

            queue.enqueue(async () => 'result1', 'origin1');
            queue.enqueue(async () => 'result2', 'origin2');
            queue.enqueue(async () => 'result3', 'origin3');

            await queue.executeNext(); // Execute first item
            let history = queue.getHistory();
            expect(history.length).toBe(1);

            // Check if result exists and has expected value
            const firstHistoryItem = history[0];
            expect(firstHistoryItem).toBeDefined();
            const firstResult = firstHistoryItem?.result;
            expect(firstResult).toBe('result1');

            await queue.executeNext(); // Execute second item
            history = queue.getHistory();
            expect(history.length).toBe(2);

            // Check second result
            const secondResult = history[1]?.result;
            expect(secondResult).toBe('result2');

            await queue.executeNext(); // Execute third item, should trim history
            history = queue.getHistory();
            expect(history.length).toBe(2);

            // Check results after history trimming
            expect(history[0]?.result).toBe('result2'); // First item should be removed
            expect(history[1]?.result).toBe('result3');
        });
    });

    // Concurrent execution management tests
    describe('concurrent execution prevention', () => {
        it('should prevent concurrent executeQueue calls', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            const executionOrder: string[] = [];
            let executionCount = 0;

            // Add a task that tracks execution
            queue.enqueue(async () => {
                executionCount++;
                executionOrder.push('start-1');
                // Use vi.advanceTimersByTimeAsync instead of real setTimeout
                await vi.advanceTimersByTimeAsync(10);
                executionOrder.push('end-1');
                return 'result1';
            });

            // Start execution
            const promise1 = queue.executeQueue();

            // Try to execute again immediately (should be blocked)
            const promise2 = queue.executeQueue();

            await Promise.all([promise1, promise2]);

            // The function should only be executed once
            expect(executionCount).toBe(1);
            // Should only have one set of start/end entries
            expect(executionOrder).toEqual(['start-1', 'end-1']);
        });


        it('should report isCurrentlyExecuting correctly', async () => {
            const queue = new AsyncFunctionQueue({ autoExecute: false });
            let executionFlagDuringTask = false;

            queue.enqueue(async () => {
                executionFlagDuringTask = queue.isCurrentlyExecuting();
                return 'result';
            });

            expect(queue.isCurrentlyExecuting()).toBe(false);

            const promise = queue.executeQueue();

            // We need to await so the queue can complete
            await promise;

            expect(executionFlagDuringTask).toBe(true);
            expect(queue.isCurrentlyExecuting()).toBe(false);
        });
    });
});
