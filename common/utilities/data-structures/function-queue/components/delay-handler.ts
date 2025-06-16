/**
 * Handles delay logic for queued functions
 */

import { DateTime } from 'luxon';
import type { QueuedFunction } from '../types.js';

export class DelayHandler<T> {
    private debug: boolean;

    constructor(debug: boolean = false) {
        this.debug = debug;
    }

    /**
     * Check if a function should be delayed based on its executeAfter timestamp
     */
    shouldDelay(item: QueuedFunction<T>): boolean {
        if (!item.executeAfter) return false;
        return DateTime.now() < DateTime.fromISO(item.executeAfter);
    }

    /**
     * Calculate delay time in milliseconds for a function
     */
    getDelayTime(item: QueuedFunction<T>): number {
        if (!item.executeAfter) return 0;

        const now = DateTime.now();
        const executeTime = DateTime.fromISO(item.executeAfter);
        const delayMs = executeTime.toMillis() - now.toMillis();

        return Math.max(0, delayMs);
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

    createExecuteAfterTimestamp(delayMs: number): string | undefined {
        if (delayMs <= 0) return undefined;
        return DateTime.now().plus({ milliseconds: delayMs }).toISO();
    }
}
