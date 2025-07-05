/**
 * Manages execution logic for queued functions
 */

import { DateTime } from 'luxon';
import type { QueuedFunction } from '../types';
import { HistoryManager } from './history-manager';

export class ExecutionManager<T> {
    private historyManager: HistoryManager<T>;
    private currentlyExecuting: QueuedFunction<T> | null = null;
    private debug: boolean;
    private cycle: () => void;

    constructor(
        historyManager: HistoryManager<T>,
        debug: boolean = false,
        cycle: () => void
    ) {
        this.historyManager = historyManager;
        this.debug = debug;
        this.cycle = cycle;
    }

    /**
     * Check if currently executing
     */
    isExecuting(): boolean {
        return this.currentlyExecuting !== null;
    }


    async fire(item: QueuedFunction<T>): Promise<void> {
        const isExecuting = this.isExecuting();
        if (isExecuting) {
            return;
        }

        this.currentlyExecuting = item;
        try {
            const result = await item.func();
            this.currentlyExecuting = null;
            this.historyManager.addResult({
                data: result,
                timestamp: DateTime.now().toUTC().toISO(),
                id: item.id
            });
        } catch (error) {
            this.currentlyExecuting = null;
            this.historyManager.addResult({
                error,
                timestamp: DateTime.now().toUTC().toISO(),
                id: item.id
            });
        }
        this.currentlyExecuting = null;
        this.cycle();
    }
}
