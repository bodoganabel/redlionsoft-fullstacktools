/**
 * Handles delay logic for queued functions
 */

import { DateTime } from 'luxon';
import type { QueuedFunction } from '../types.js';
import { ExecutionManager } from './execution-manager.js';

export class DelayHandler<T> {
    private debug: boolean;
    private chambered: QueuedFunction<T> | null = null;
    private timeout: NodeJS.Timeout | null = null;
    private executionManager: ExecutionManager<T>;

    constructor(executionManager: ExecutionManager<T>, debug: boolean = false) {
        this.debug = debug;
        this.executionManager = executionManager;
    }

    getChambered(): QueuedFunction<T> | null {
        return this.chambered;
    }


    chamber(item: QueuedFunction<T>): boolean {

        const isDealyOccupied = this.chambered !== null;
        const isExecutorOccupied = this.executionManager.isExecuting();

        if (isDealyOccupied || isExecutorOccupied) {
            return false;
        }

        this.chambered = item;

        if (this.debug) {
            console.log(`[DelayHandler] Chambering function${item.id ? ` with ID: ${item.id}` : ''}`);
        }

        if (item.executeAfter_ms === undefined) {
            this.dechamber();
            this.executionManager.fire(item);
            return true;
        }

        this.timeout = setTimeout(() => {
            this.dechamber();
            this.executionManager.fire(item);
        }, item.executeAfter_ms);

        return true;
    }

    dechamber(): QueuedFunction<T> | null {
        const item = this.chambered;
        this.chambered = null;
        if (this.debug) {
            console.log(`[DelayHandler] Dechambering function${item?.id ? ` with ID: ${item.id}` : ''}`);
        }
        if (this.timeout) {
            clearTimeout(this.timeout);
        }
        return item;
    }

    /**
     * Wait for the specified delay time
     */
    async waitForDelay(delayMs: number): Promise<void> {
        if (delayMs <= 0) return;

        if (this.debug) {
            console.log(`[DelayHandler] Waiting ${delayMs}ms before execution`);
        }

        return new Promise(resolve => setTimeout(resolve, delayMs));
    }

    createExecuteAfterTimestamp(delayMs: number): number | undefined {
        if (delayMs <= 0) return undefined;
        return DateTime.now().plus({ milliseconds: delayMs }).toMillis();
    }
}
