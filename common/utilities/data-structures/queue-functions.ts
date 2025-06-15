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
    private _isCurrentlyExecuting: boolean = false;
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

                // Remove the existing item
                this.queue.splice(existingIndex, 1);
            }
        }

        if (this.options.debug) {
            console.log(`[AsyncFunctionQueue] Enqueued function${id ? ` with ID: ${id}` : ''}`
                + `${finalDelayMs > 0 ? ` (delayed by ${finalDelayMs}ms)` : ''}`);
        }

        this.queue.push(item);

        // Auto-execute if enabled and not already executing
        if (this.options.autoExecute && !this._isCurrentlyExecuting) {
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
        if (this._isCurrentlyExecuting) {
            return; // Already executing
        }

        this._isCurrentlyExecuting = true;

        try {
            while (this.queue.length > 0) {
                await this.executeNext();
            }
        } finally {
            this._isCurrentlyExecuting = false;
        }
    }

    /**
     * Execute only the next function in the queue, respecting any delay
     * 
     * @returns Promise that resolves when the next function completes, or undefined if no suitable function was found
     */
    async executeNext(): Promise<QueueItemExecutionResult<T>> {
        // Return undefined result if queue is empty
        if (this.queue.length === 0) {
            return { data: undefined, timestamp: DateTime.now().toISO() };
        }

        if (this._isCurrentlyExecuting) {
            if (this.options.debug) {
                console.log(`[AsyncFunctionQueue] Queue is currently executing a function. Skipping this execution call.`);
            }
            return { data: undefined, timestamp: DateTime.now().toISO(), skipped: true };
        }

        this._isCurrentlyExecuting = true;

        try {
            // Get the next item but don't remove it from the queue yet
            const nextItem = this.queue[0];

            // Process delay if needed
            if (nextItem && nextItem.executeAfter) {
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

            // Now remove the item from the queue (which could have changed during the delay)
            // This ensures we're always processing the current first item
            const item = this.queue.shift();

            // This should rarely happen (only if another process modified the queue during the delay)
            if (!item) {
                return { data: undefined, timestamp: DateTime.now().toISO() };
            }

            if (this.options.debug) {
                console.log(`[AsyncFunctionQueue] Executing function${item.id ? ` with ID: ${item.id}` : ''}`);
            }

            // Execute the function
            try {
                const result = await item.func();

                // Store execution result in history
                const executionResult: QueueItemExecutionResult<T> = {
                    data: result,
                    timestamp: DateTime.now().toISO(),
                    id: item.id
                };

                this.executionHistory.push(executionResult);

                if (this.executionHistory.length > this.options.maxHistorySize) {
                    this.executionHistory.shift();
                }

                if (this.options.debug) {
                    console.log(`[AsyncFunctionQueue] Function${item.id ? ` with ID: ${item.id}` : ''} executed successfully`);
                }

                return executionResult;
            } catch (error) {
                // Capture execution errors
                const errorResult: QueueItemExecutionResult<T> = {
                    error,
                    timestamp: DateTime.now().toISO(),
                    id: item.id
                };

                this.executionHistory.push(errorResult);

                if (this.executionHistory.length > this.options.maxHistorySize) {
                    this.executionHistory.shift();
                }

                console.error(`[AsyncFunctionQueue] Error executing function${item.id ? ` with ID: ${item.id}` : ''}:`, error);
                throw error;
            }
        } finally {
            this._isCurrentlyExecuting = false;
        }
    }

    /**
     * Check if the queue is currently executing functions
     */
    isCurrentlyExecuting(): boolean {
        return this._isCurrentlyExecuting;
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

    async checkForPendingJobs(callback: () => void): Promise<boolean> {
        const wasExecuting = this.isCurrentlyExecuting();

        // If already executing, just return pending status
        if (wasExecuting) {
            return this.queue.length > 0;
        }

        // Execute all pending jobs
        await this.executeQueue();

        // Now invoke callback since jobs are done
        callback();

        return false; // No more pending jobs
    }
}
