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
import type {
    QueuedFunction,
    QueueItemExecutionResult,
    AsyncFunctionQueueOptions
} from './types.js';
import { DelayHandler } from './components/delay-handler.js';
import { HistoryManager } from './components/history-manager.js';
import { ExecutionManager } from './components/execution-manager.js';

export class AsyncFunctionQueue<T = any> {
    private queue: QueuedFunction<T>[] = [];
    private options: Required<AsyncFunctionQueueOptions>;
    private delayHandler: DelayHandler<T>;
    private historyManager: HistoryManager<T>;
    private executionManager: ExecutionManager<T>;

    constructor(options?: AsyncFunctionQueueOptions) {
        this.options = {
            autoExecute: true,
            debug: false,
            maxHistorySize: 100,
            defaultDelayMs: 0,
            ...options
        };

        this.delayHandler = new DelayHandler<T>(this.options.debug);
        this.historyManager = new HistoryManager<T>(this.options.maxHistorySize);
        this.executionManager = new ExecutionManager<T>(this.historyManager, this.options.debug);
    }

    /**
     * Add an async function to the execution queue
     */
    enqueue(func: () => Promise<T>, id?: string, delayMs?: number): number {
        const now = DateTime.now();
        const finalDelayMs = delayMs ?? this.options.defaultDelayMs;
        const executeAfter = this.delayHandler.createExecuteAfterTimestamp(finalDelayMs);

        const item: QueuedFunction<T> = {
            func,
            id,
            timestamp: now.toISO(),
            executeAfter
        };

        this.addToQueue(item);

        if (this.options.debug) {
            console.log(`[AsyncFunctionQueue] Enqueued function${id ? ` with ID: ${id}` : ''}`
                + `${finalDelayMs > 0 ? ` (delayed by ${finalDelayMs}ms)` : ''}`);
        }

        this.triggerAutoExecution();
        return this.queue.length;
    }

    /**
     * Execute all functions in the queue in order, respecting any delays
     */
    async executeQueue(): Promise<void> {
        if (this.executionManager.isExecuting()) {
            return;
        }

        while (this.queue.length > 0) {
            await this.executeNext();
        }
    }

    /**
     * Execute only the next function in the queue, respecting any delay
     */
    async executeNext(): Promise<QueueItemExecutionResult<T>> {
        return this.executionManager.executeSingleFunction(
            this.queue,
            () => this.queue.shift()
        );
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
     * @returns The number of functions cleared
     */
    clear(): number {
        const count = this.queue.length;
        this.queue = [];
        return count;
    }

    getExecutionHistory(): QueueItemExecutionResult<T>[] {
        return this.historyManager.getHistory();
    }

    /**
     * Find a function in the queue by its ID
     */
    findFunction(id: string): QueuedFunction<T> | undefined {
        return this.queue.find(item => item.id === id);
    }

    /**
     * Remove a function from the queue by its ID
     */
    removeFunction(id: string): boolean {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== id);
        return initialLength > this.queue.length;
    }

    /**
     * Add item to queue, handling ID-based replacement
     */
    private addToQueue(item: QueuedFunction<T>): void {
        if (!item.id) {
            this.queue.push(item);
            return;
        }

        const existingIndex = this.queue.findIndex(queueItem => queueItem.id === item.id);

        if (existingIndex !== -1) {
            if (this.options.debug) {
                console.log(`[AsyncFunctionQueue] Replacing function with ID: ${item.id}`);
            }
            this.queue[existingIndex] = item;
        } else {
            this.queue.push(item);
        }
    }

    /**
     * Trigger auto-execution if enabled and not already executing
     */
    private triggerAutoExecution(): void {
        if (this.options.autoExecute && !this.executionManager.isExecuting()) {
            // Use setTimeout to prevent race conditions in auto-execution
            setTimeout(() => this.executeQueue(), 0);
        }
    }
}
