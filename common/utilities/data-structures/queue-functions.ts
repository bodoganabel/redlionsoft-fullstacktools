/**
 * AsyncFunctionQueue - Manages queuing and ordered execution of async functions
 * 
 * This class allows enqueueing async functions from anywhere in your application
 * and ensures they are executed in FIFO order.
 */

import { DateTime } from 'luxon';

type AsyncFunction<T = any> = () => Promise<T>;

type QueueItem<T = any> = {
    func: AsyncFunction<T>;
    origin?: string;
    timestamp: string; // ISO format
};

export interface AsyncFunctionQueueOptions {
    /** Automatically execute functions as they are added */
    autoExecute?: boolean;
    /** Show debug logs for function origins */
    debugShowOrigin?: boolean;
    /** Maximum number of items to keep in execution history */
    maxHistorySize?: number;
}

export class AsyncFunctionQueue {
    private queue: QueueItem[] = [];
    private executionHistory: Array<{item: QueueItem, result?: any, error?: Error}> = [];
    private isExecuting = false;
    private options: Required<AsyncFunctionQueueOptions>;
    
    /**
     * Creates a new AsyncFunctionQueue instance
     * 
     * @param options Configuration options
     */
    constructor(options?: AsyncFunctionQueueOptions) {
        this.options = {
            autoExecute: true,
            debugShowOrigin: false,
            maxHistorySize: 100,
            ...options
        };
    }
    
    /**
     * Add an async function to the execution queue
     * 
     * @param func The async function to execute
     * @param origin Optional string identifying where this function came from
     * @returns The updated queue size
     */
    enqueue<T>(func: AsyncFunction<T>, origin?: string): number {
        const item: QueueItem<T> = {
            func,
            origin,
            timestamp: DateTime.now().toISO()
        };
        
        if (this.options.debugShowOrigin && origin) {
            console.log(`[AsyncFunctionQueue] Enqueued function from origin: ${origin}`);
        }
        
        this.queue.push(item);
        
        // Auto-execute if enabled and not already executing
        if (this.options.autoExecute && !this.isExecuting) {
            this.executeQueue();
        }
        
        return this.queue.length;
    }
    
    /**
     * Execute all functions in the queue in order
     * 
     * @returns Promise that resolves when all functions are executed
     */
    async executeQueue(): Promise<void> {
        if (this.isExecuting) {
            return; // Already executing
        }
        
        this.isExecuting = true;
        
        try {
            while (this.queue.length > 0) {
                await this.executeNext();
            }
        } finally {
            this.isExecuting = false;
        }
    }
    
    /**
     * Execute only the next function in the queue
     * 
     * @returns Promise that resolves when the next function completes
     */
    async executeNext(): Promise<void> {
        if (this.queue.length === 0) {
            return; // Nothing to execute
        }
        
        const wasExecuting = this.isExecuting;
        this.isExecuting = true;
        
        const item = this.queue.shift();
        if (!item) return;
        
        try {
            if (this.options.debugShowOrigin && item.origin) {
                console.log(`[AsyncFunctionQueue] Executing function from origin: ${item.origin}`);
            }
            
            const startTime = DateTime.now();
            const result = await item.func();
            const endTime = DateTime.now();
            const duration = endTime.diff(startTime).milliseconds;
            
            if (this.options.debugShowOrigin) {
                console.log(`[AsyncFunctionQueue] Completed function${item.origin ? ` from ${item.origin}` : ''} in ${duration}ms`);
            }
            
            // Add to history
            this.addToHistory(item, result);
            
            return result;
        } catch (error) {
            if (this.options.debugShowOrigin) {
                console.error(`[AsyncFunctionQueue] Error executing function${item.origin ? ` from ${item.origin}` : ''}:`, error);
            }
            
            // Still add to history, but with error
            this.addToHistory(item, undefined, error as Error);
            
            throw error;
        } finally {
            // Only reset execution flag if we were not already executing (i.e., executeNext was called directly)
            if (!wasExecuting) {
                this.isExecuting = false;
            }
        }
    }
    
    /**
     * Check if the queue is currently executing functions
     */
    isCurrentlyExecuting(): boolean {
        return this.isExecuting;
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
     */
    getHistory() {
        return [...this.executionHistory];
    }
    
    /**
     * Add an item to the execution history
     */
    private addToHistory(item: QueueItem, result?: any, error?: Error): void {
        this.executionHistory.push({
            item,
            result,
            error
        });
        
        // Trim history if needed
        if (this.executionHistory.length > this.options.maxHistorySize) {
            this.executionHistory = this.executionHistory.slice(
                this.executionHistory.length - this.options.maxHistorySize
            );
        }
    }
}
