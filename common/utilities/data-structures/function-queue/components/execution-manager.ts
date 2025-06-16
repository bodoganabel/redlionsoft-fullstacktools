/**
 * Manages execution logic for queued functions
 */

import { DateTime } from 'luxon';
import type { QueuedFunction, QueueItemExecutionResult } from '../types.js';
import { DelayHandler } from './delay-handler.js';
import { HistoryManager } from './history-manager.js';

export class ExecutionManager<T> {
    private delayHandler: DelayHandler<T>;
    private historyManager: HistoryManager<T>;
    private currentlyExecuting: QueuedFunction<T> | null = null;
    private debug: boolean;

    constructor(
        historyManager: HistoryManager<T>,
        debug: boolean = false
    ) {
        this.historyManager = historyManager;
        this.delayHandler = new DelayHandler<T>(debug);
        this.debug = debug;
    }

    /**
     * Check if currently executing
     */
    isExecuting(): boolean {
        return this.currentlyExecuting !== null;
    }

    /**
     * Execute a single function from the queue
     */
    async executeSingleFunction(
        queue: QueuedFunction<T>[],
        removeFromQueue: () => QueuedFunction<T> | undefined
    ): Promise<QueueItemExecutionResult<T>> {
        if (this.currentlyExecuting !== null) {
            throw new Error('Already executing a function');
        }

        const nextItem = queue[0];
        if (!nextItem) {
            return {
                data: undefined,
                timestamp: DateTime.now().toISO()
            };
        }

        this.currentlyExecuting = nextItem;

        try {
            // Handle delay if needed
            if (this.delayHandler.shouldDelay(nextItem)) {
                const delayMs = this.delayHandler.getDelayTime(nextItem);
                await this.delayHandler.waitForDelay(delayMs);

                // Check if function was replaced during delay
                const currentFirstItem = queue[0];
                if (this.wasReplacedDuringDelay(nextItem, currentFirstItem)) {
                    this.currentlyExecuting = null;
                    return this.executeSingleFunction(queue, removeFromQueue);
                }
            }

            // Remove from queue and execute
            const item = removeFromQueue();
            if (!item) {
                this.currentlyExecuting = null;
                return {
                    data: undefined,
                    timestamp: DateTime.now().toISO()
                };
            }

            if (this.debug) {
                console.log(`[ExecutionManager] Executing function${item.id ? ` with ID: ${item.id}` : ''}`);
            }

            const result = await item.func();
            const executionResult: QueueItemExecutionResult<T> = {
                data: result,
                id: item.id,
                error: undefined,
                timestamp: DateTime.now().toISO()
            };

            this.historyManager.addResult(executionResult);

            if (this.debug) {
                console.log(`[ExecutionManager] Function${item.id ? ` with ID: ${item.id}` : ''} executed successfully`);
            }

            this.currentlyExecuting = null;
            return executionResult;

        } catch (error) {
            const executionResult: QueueItemExecutionResult<T> = {
                data: undefined,
                id: nextItem.id,
                error,
                timestamp: DateTime.now().toISO()
            };

            this.historyManager.addResult(executionResult);

            if (this.debug) {
                console.error(`[ExecutionManager] Function${nextItem.id ? ` with ID: ${nextItem.id}` : ''} failed:`, error);
            }

            this.currentlyExecuting = null;
            throw error;
        }
    }

    /**
     * Check if function was replaced during delay
     */
    private wasReplacedDuringDelay(
        originalItem: QueuedFunction<T>,
        currentFirstItem: QueuedFunction<T> | undefined
    ): boolean {
        if (!currentFirstItem) return true;

        // If the item has an ID and it doesn't match the current first item, it was replaced
        if (originalItem.id && currentFirstItem.id !== originalItem.id) {
            return true;
        }

        // If items are different objects but neither has ID, the queue was modified
        if (!originalItem.id && originalItem !== currentFirstItem) {
            return true;
        }

        return false;
    }
}
