import { describe, it, expect } from 'vitest';
import { debounce } from './debounce';
import { delay } from '../../../utilities/general';

// Helper function to create delays

describe('debounce utility', () => {

    /**
     * Basic Test: Verifies that debounce executes a function after waiting
     * the specified amount of time.
     */
    it('executes a function after waiting for the delay period', async () => {
        // Setup a test function and configuration
        const results: string[] = [];
        const testFunction = () => { results.push('called'); };
        const functionId = 'test-1';
        const waitTimeMs = 20;

        // Call debounce with our test function
        debounce(testFunction, functionId, waitTimeMs);

        // Verify function hasn't been called immediately
        expect(results).toStrictEqual([]);

        // Wait for the function to execute
        await delay(waitTimeMs + 10); // Add extra time for reliability

        // Now the function should have been called exactly once
        expect(results).toStrictEqual(['called']);
    });

    /**
     * Replacement Test: Shows that when debounce is called with the same ID,
     * the previous function is canceled and only the new one executes.
     */
    it('replaces previous function when called with the same ID', async () => {
        // Setup two test functions that we'll use with the same ID
        const results: string[] = [];
        const firstFunction = () => { results.push('first called'); };
        const replacementFunction = () => { results.push('replacement called'); };
        const functionId = 'test-2';
        const waitTimeMs = 20;

        // First debounce call
        debounce(firstFunction, functionId, waitTimeMs);

        // Wait part of the time (10ms) but not enough for execution
        await delay(10);

        // Replace with second function before first one executes
        debounce(replacementFunction, functionId, waitTimeMs);

        // Make sure nothing has been called yet
        expect(results).toStrictEqual([]);

        // Wait enough time for the replacement function to execute
        await delay(waitTimeMs + 10);

        // Only the replacement function should have executed
        expect(results).toStrictEqual(['replacement called']);
    });

    /**
     * Multiple IDs Test: Shows that functions with different IDs
     * operate independently of each other.
     */
    it('handles multiple independent functions with different IDs', async () => {
        // Setup functions with different IDs
        const results: string[] = [];
        const firstFunction = () => { results.push('called'); };
        const secondFunction = () => { results.push('called2'); };

        // Schedule both functions with different IDs and delays
        debounce(firstFunction, 'function-a', 15);
        debounce(secondFunction, 'function-b', 30);

        // Initially neither should be called
        expect(results).toStrictEqual([]);

        // Wait enough time for first function to execute but not the second
        await delay(20);

        // First function should execute, second should still be waiting
        expect(results).toStrictEqual(['called']);

        // Wait enough time for second function
        await delay(15);

        // Now both functions should have executed exactly once
        expect(results).toStrictEqual(['called', 'called2']);
    });

    /**
     * Async Function Test: Verifies that debounce works correctly with
     * functions that return promises.
     */
    it('correctly handles async functions', async () => {
        let callCount = 0;
        const asyncFunction = async () => {
            callCount++;
            await delay(10); // Simulate some async work
            // No return value, matching the expected debounce signature
        };

        // Debounce our async function
        debounce(asyncFunction, 'async-test', 15);

        // Wait for debounce timeout and function execution
        await delay(30);

        // Verify async function was called
        expect(callCount).toBe(1);
    });

    /**
     * Error Handling Test: Ensures that debounce properly handles
     * and cleans up after errors in the called function.
     */
    it('handles errors in functions and still cleans up properly', async () => {
        // Original console.error 
        const originalConsoleError = console.error;
        const errors: any[] = [];

        // Override console.error to capture errors
        console.error = (...args: any[]) => {
            errors.push(args);
        };

        let errorFunctionCalled = 0;
        let cleanupFunctionCalled = 0;

        // Create a function that throws an error when called
        const errorFunction = () => {
            errorFunctionCalled++;
            throw new Error('Test error');
        };

        // Debounce our error-throwing function
        debounce(errorFunction, 'error-test', 15);

        // Wait for function to be called
        await delay(20);

        // Verify the function was called despite throwing an error
        expect(errorFunctionCalled).toBe(1);

        // Verify the error was logged properly
        expect(errors.length).toBeGreaterThan(0);
        expect(errors[0][0]).toContain('Error in debounced function with id error-test');

        // Verify that cleanup occurred by scheduling a new function with the same ID
        const cleanupTestFunction = () => { cleanupFunctionCalled++; };
        debounce(cleanupTestFunction, 'error-test', 15);

        await delay(20);

        // New function should execute properly
        expect(cleanupFunctionCalled).toBe(1);

        // Restore console.error
        console.error = originalConsoleError;
    });
});
