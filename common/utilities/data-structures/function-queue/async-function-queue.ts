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
    private finishPromiseResolvers: (() => void)[] = [];

    constructor(options?: AsyncFunctionQueueOptions) {
        this.options = {
            debug: false,
            maxHistorySize: 100,
            ...options
        };

        this.historyManager = new HistoryManager<T>(this.options.maxHistorySize);
        this.executionManager = new ExecutionManager<T>(this.historyManager, this.options.debug, () => this.cycle());
        this.delayHandler = new DelayHandler<T>(
            this.executionManager,
            this.options.debug
        );
    }

    /**
     * Add an async function to the execution queue
     */
    push(func: () => Promise<T>, id?: string, delayMs?: number): number {
        const now = DateTime.now();

        const item: QueuedFunction<T> = {
            func,
            id,
            timestamp: now.toISO(),
            executeAfter_ms: delayMs
        };

        // debouncing from queue
        if (item.id !== undefined) {
            this.queue = this.queue.filter(existingItem => existingItem.id !== item.id);
        }

        // debouncing from delay chamber
        if (item.id !== undefined && this.delayHandler.getChambered()?.id === item.id) {
            this.delayHandler.dechamber();
        }

        this.queue.push(item);
        if (this.options.debug) {
            console.log(`[AsyncFunctionQueue] Enqueued function${id ? ` with ID: ${id}` : ''}`
                + `${delayMs !== undefined && delayMs > 0 ? ` (delayed by ${delayMs}ms)` : ''}`);
        }
        this.cycle();

        return this.queue.length + (this.delayHandler.getChambered() ? 1 : 0);
    }

    private cycle(): void {

        const isDealyOccupied = this.delayHandler.getChambered() !== null;
        const isExecutorOccupied = this.executionManager.isExecuting();

        if (this.queue.length === 0 && !isDealyOccupied && !isExecutorOccupied) {
            this.finish();
            return;
        }

        if (this.queue.length > 0 && (isDealyOccupied || isExecutorOccupied)) {
            return;
        }

        const item = this.queue.shift();
        if (item) {
            this.delayHandler.chamber(item);
        } else {
            this.finish();
            return;
        }
    }


    /**
     * Get the current size of the queue
     */
    size(): number {
        return this.queue.length + (this.delayHandler.getChambered() ? 1 : 0);
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
        const count = this.queue.length + (this.delayHandler.getChambered() ? 1 : 0);
        this.delayHandler.dechamber();
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
        let item: QueuedFunction<T> | undefined | null = this.queue.find(item => item.id === id);
        if (item) {
            return item;
        }
        item = this.delayHandler.getChambered();
        if (item !== null && item?.id === id) {
            return item;
        }
        return undefined;
    }

    /**
     * Remove a function from the queue by its ID
     */
    removeFunction(id: string): boolean {
        const initialLength = this.queue.length;
        this.queue = this.queue.filter(item => item.id !== id);

        if (this.options.debug && initialLength > this.queue.length) {
            console.log(`[AsyncFunctionQueue] Removed function from queue with ID: ${id}`);
        }

        if (this.delayHandler.getChambered()?.id === id) {
            this.delayHandler.dechamber();
            this.cycle();
        }
        return initialLength > this.queue.length;
    }

    finish(): void {
        // Resolve all pending waitForFinish promises
        const resolvers = [...this.finishPromiseResolvers];
        this.finishPromiseResolvers = [];
        resolvers.forEach(resolve => resolve());
    }

    /**
     * Wait for the queue to finish processing all items
     * @returns Promise that resolves when queue is finished
     */
    async waitForFinish(): Promise<void> {
        // If queue is already empty and nothing is executing, resolve immediately
        if (this.isEmpty() && !this.delayHandler.getChambered() && !this.executionManager.isExecuting()) {
            return Promise.resolve();
        }

        return new Promise<void>((resolve) => {
            this.finishPromiseResolvers.push(resolve);
        });
    }
}
