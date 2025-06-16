/**
 * AsyncFunctionQueue - Manages queuing and ordered execution of async functions
 * 
 * This class allows enqueueing async functions from anywhere in your application
 * and ensures they are executed in FIFO order.
 * 
 * Features include:
 * - Function ID-based replacement (newer functions replace older ones with same ID)
 * - Delayed execution with configurable timeout
 * - Cancellation of delays when functions are replaced
 * - FIFO ordering for execution
 */

import { DateTime } from 'luxon';

export interface QueuedFunction<T> {
    func: () => Promise<T>;
    timestamp: string;
    id?: string;
    executeAfter?: string;
}

export interface QueueItemExecutionResult<T = any> {
    data?: T;
    error?: Error | unknown;
    timestamp: string;
    id?: string;
    skipped?: boolean;
}

export interface AsyncFunctionQueueOptions {
    autoExecute?: boolean;
    debug?: boolean;
    maxHistorySize?: number;
    defaultDelayMs?: number;
}

export class AsyncFunctionQueue<T = any> {
    private queue: QueuedFunction<T>[] = [];
    private executionHistory: QueueItemExecutionResult<T>[] = [];
    private _currentlyExecuting: QueuedFunction<T> | null = null;
    private options: Required<AsyncFunctionQueueOptions>;

    /**
     * Creates a new AsyncFunctionQueue instance
     * 
     * @param options Configuration options
     */
    constructor(options?: AsyncFunctionQueueOptions) {
        this.options = {
            autoExecute: true,
            debug: false,
            maxHistorySize: 100,
            defaultDelayMs: 0,
            ...options
        };
    }

    /**
     * Add an async function to the execution queue
     * 
     * @param func The async function to execute
     * @param id Optional unique identifier for the function (used for replacement)
     * @param delayMs Optional delay in milliseconds before execution
     * @returns The updated queue size
     */
    enqueue(func: () => Promise<T>, id?: string, delayMs?: number): number {
        const now = DateTime.now();
        const finalDelayMs = delayMs ?? this.options.defaultDelayMs;
        let executeAfter: string | undefined;

        if (finalDelayMs > 0) {
            executeAfter = now.plus({ milliseconds: finalDelayMs }).toISO();
        }

        const item: QueuedFunction<T> = {
            func,
            id,
            timestamp: now.toISO(),
            executeAfter
        };

        // If we have an ID, check if we need to replace an existing function
        if (id) {
            // Find index of any existing item with the same ID
            const existingIndex = this.queue.findIndex(queueItem => queueItem.id === id);

            if (existingIndex !== -1) {
                if (this.options.debug) {
                    console.log(`[AsyncFunctionQueue] Replacing function with ID: ${id}`);
                }

                // Replace the existing item at the same position
                this.queue[existingIndex] = item;
            } else {
                // Add new item with ID
                this.queue.push(item);
            }
        } else {
            // Add new item without ID
            this.queue.push(item);
        }

        if (this.options.debug) {
            console.log(`[AsyncFunctionQueue] Enqueued function${id ? ` with ID: ${id}` : ''}`
                + `${finalDelayMs > 0 ? ` (delayed by ${finalDelayMs}ms)` : ''}`);
        }

        // Auto-execute if enabled and not already executing
        if (this.options.autoExecute && this._currentlyExecuting === null) {
            this.executeQueue();
        }

        return this.queue.length;
    }

    /**
     * Execute all functions in the queue in order, respecting any delays
     * 
     * @returns Promise that resolves when all functions are executed
     */
    async executeQueue(): Promise<void> {
        if (this._currentlyExecuting !== null) {
            return; // Already executing
        }

        const targetFunction = this.queue[0];
        if (targetFunction === undefined) {
            this._currentlyExecuting = null;
            return;
        }

        this._currentlyExecuting = targetFunction;

        try {
            await this.executeNext();
            this.executeQueue();
        } catch (error) {
            this._currentlyExecuting = null;
            throw error;
        }
    }

    /**
     * Execute only the next function in the queue, respecting any delay
     * 
     * @returns Promise that resolves when the next function completes, or undefined if no suitable function was found
     */
    async executeNext(): Promise<QueueItemExecutionResult<T>> {
        if (this.queue.length === 0) {
            this._currentlyExecuting = null;
            return { data: undefined, timestamp: DateTime.now().toISO() };
        }

        // Peek at the next item without removing it yet
        const nextItem = this.queue[0];
        if (!nextItem) {
            this._currentlyExecuting = null;
            return { data: undefined, timestamp: DateTime.now().toISO() };
        }

        try {
            // Process delay if needed
            if (nextItem.executeAfter) {
                const now = DateTime.now();
                const executeAfterTime = DateTime.fromISO(nextItem.executeAfter);

                // If the execution time hasn't arrived yet
                if (executeAfterTime > now) {
                    const waitTimeMs = executeAfterTime.diff(now).milliseconds;

                    if (this.options.debug) {
                        console.log(`[AsyncFunctionQueue] Waiting ${waitTimeMs}ms before executing${nextItem.id ? ` function with ID: ${nextItem.id}` : ''}`);
                    }

                    // Wait for the required delay
                    await new Promise(resolve => setTimeout(resolve, waitTimeMs));
                }
            }

            // After delay, check if the item is still the first in queue (might have been replaced)
            const currentFirstItem = this.queue[0];
            if (!currentFirstItem) {
                // Queue is empty, nothing to execute
                this._currentlyExecuting = null;
                return { data: undefined, timestamp: DateTime.now().toISO() };
            }

            // If the item has an ID and it doesn't match the current first item, it was replaced
            if (nextItem.id && currentFirstItem.id !== nextItem.id) {
                // Item was replaced during delay, execute the new item instead
                this._currentlyExecuting = null;
                return this.executeNext();
            }

            // If items are different objects but neither has ID, the queue was modified
            if (!nextItem.id && currentFirstItem !== nextItem) {
                // Non-ID item was removed/replaced during delay, execute current first item
                this._currentlyExecuting = null;
                return this.executeNext();
            }

            // Now remove the item from the queue
            const item = this.queue.shift();
            if (!item) {
                this._currentlyExecuting = null;
                return { data: undefined, timestamp: DateTime.now().toISO() };
            }

            if (this.options.debug) {
                console.log(`[AsyncFunctionQueue] Executing function${item.id ? ` with ID: ${item.id}` : ''}`);
            }

            // Execute the function
            const result = await item.func();
            const executionResult = {
                data: result,
                id: item.id,
                error: undefined,
                timestamp: DateTime.now().toISO()
            };

            // Add to history
            this.addToHistory(executionResult);

            if (this.options.debug) {
                console.log(`[AsyncFunctionQueue] Function${item.id ? ` with ID: ${item.id}` : ''} executed successfully`);
            }

            this._currentlyExecuting = null;

            return executionResult;

        } catch (error) {
            // Remove the failed item from queue
            if (this.queue[0] === nextItem) {
                this.queue.shift();
            }

            const executionResult = {
                data: undefined,
                id: nextItem.id,
                error,
                timestamp: DateTime.now().toISO()
            };

            // Add to history
            this.addToHistory(executionResult);

            if (this.options.debug) {
                console.error(`[AsyncFunctionQueue] Function${nextItem.id ? ` with ID: ${nextItem.id}` : ''} failed:`, error);
            }

            throw error;
        }
    }

    /**
     * Get the current size of the queue
     */
    size(): number {
        return this.queue.length;
    }

    /**
     * Check if the queue is empty
     */
    isEmpty(): boolean {
        return this.queue.length === 0;
    }

    /**
     * Clear all pending functions from the queue
     * 
     * @returns The number of items cleared
     */
    clear(): number {
        const count = this.queue.length;
        this.queue = [];
        return count;
    }

    /**
     * Get the execution history
     * 
     * @returns A copy of the execution history
     */
    getExecutionHistory(): QueueItemExecutionResult<T>[] {
        return [...this.executionHistory];
    }

    /**
     * Find a function in the queue by its ID
     * 
     * @param id The function ID to look for
     * @returns True if a function with the ID exists in the queue
     */
    hasFunction(id: string): boolean {
        return this.queue.some(item => item.id === id);
    }

    /**
     * Remove a function from the queue by its ID
     * 
     * @param id The function ID to remove
     * @returns True if a function was found and removed, false otherwise
     */
    removeFunction(id: string): boolean {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== id);
        return initialLength > this.queue.length;
    }

    private addToHistory(result: QueueItemExecutionResult<T>) {
        this.executionHistory.push(result);

        if (this.executionHistory.length > this.options.maxHistorySize) {
            this.executionHistory.shift();
        }
    }
}
