/**
 * Manages execution history for the queue
 */

import type { QueueItemExecutionResult } from '../types.js';

export class HistoryManager<T> {
    private executionHistory: QueueItemExecutionResult<T>[] = [];
    private maxHistorySize: number;

    constructor(maxHistorySize: number = 100) {
        this.maxHistorySize = maxHistorySize;
    }

    /**
     * Add execution result to history
     */
    addResult(result: QueueItemExecutionResult<T>): void {
        this.executionHistory.push(result);

        if (this.executionHistory.length > this.maxHistorySize) {
            this.executionHistory.shift();
        }
    }

    /**
     * Get execution history copy
     */
    getHistory(): QueueItemExecutionResult<T>[] {
        return [...this.executionHistory];
    }

    /**
     * Clear execution history
     */
    clear(): void {
        this.executionHistory = [];
    }

    /**
     * Get history size
     */
    size(): number {
        return this.executionHistory.length;
    }
}
