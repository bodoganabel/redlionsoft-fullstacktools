/**
 * Queue implementation in TypeScript
 * 
 * This file provides both object-oriented and functional approaches to queues.
 * The functional approach is compatible with Ramda's functional programming style.
 */

import * as R from 'ramda';
import { DateTime } from 'luxon';

// Type definitions
export type QueueItem<T> = {
    data: T;
    timestamp: string; // ISO string format for dates
};

/**
 * Object-oriented Queue implementation
 * 
 * Strengths:
 * - Simpler syntax for repeated operations
 * - Intuitive method chaining
 * - No variable reassignment needed
 * - Familiar for OOP developers
 * 
 * Drawbacks:
 * - Mutable state (modified in place)
 * - Potential side effects with shared references
 * - Less predictable in async contexts
 */
export class Queue<T> {
    private items: QueueItem<T>[] = [];

    /**
     * Add an item to the end of the queue
     */
    enqueue(item: T): void {
        this.items.push({
            data: item,
            timestamp: DateTime.now().toISO()
        });
    }

    /**
     * Remove and return the first item from the queue
     * Returns undefined if queue is empty
     */
    dequeue(): QueueItem<T> | undefined {
        return this.items.shift();
    }

    /**
     * View the first item without removing it
     * Returns undefined if queue is empty
     */
    peek(): QueueItem<T> | undefined {
        return this.items[0];
    }

    /**
     * Check if the queue is empty
     */
    isEmpty(): boolean {
        return this.items.length === 0;
    }

    /**
     * Get the current size of the queue
     */
    size(): number {
        return this.items.length;
    }

    /**
     * Clear all items from the queue
     */
    clear(): void {
        this.items = [];
    }

    /**
     * Get all items in the queue without modifying it
     */
    getItems(): ReadonlyArray<QueueItem<T>> {
        return [...this.items];
    }
}

/**
 * Functional Queue implementation (compatible with Ramda)
 * 
 * Strengths:
 * - True immutability - operations return new queues
 * - Predictable state management
 * - Works well with functional composition (pipe, compose)
 * - Better for Svelte's reactivity system
 * - Safer for async operations
 * 
 * Drawbacks:
 * - More verbose (requires reassignment: queue = enqueue(queue, item))
 * - Steeper learning curve for FP concepts
 * - More tedious for sequential operations
 */
export const FunctionalQueue = {
    /**
     * Create a new empty queue
     */
    create: <T>(): QueueItem<T>[] => [],

    /**
     * Add an item to the end of the queue
     */
    enqueue: <T>(queue: QueueItem<T>[], item: T): QueueItem<T>[] => {
        return [...queue, {
            data: item,
            timestamp: DateTime.now().toISO()
        }];
    },

    /**
     * Remove and return the first item from the queue
     * Returns [item, newQueue] tuple where item is the dequeued item and newQueue is the updated queue
     * If queue is empty, returns [undefined, queue]
     */
    dequeue: <T>(queue: QueueItem<T>[]): [QueueItem<T> | undefined, QueueItem<T>[]] => {
        if (queue.length === 0) return [undefined, queue];
        const [item, ...rest] = queue;
        return [item, rest];
    },

    /**
     * View the first item without removing it
     */
    peek: <T>(queue: QueueItem<T>[]): QueueItem<T> | undefined => queue[0],

    /**
     * Check if the queue is empty
     */
    isEmpty: <T>(queue: QueueItem<T>[]): boolean => queue.length === 0,

    /**
     * Get the current size of the queue
     */
    size: <T>(queue: QueueItem<T>[]): number => queue.length,
};

/**
 * Example usage with Ramda
 * 
 * These examples demonstrate how to leverage Ramda's functional utilities
 * with the immutable queue implementation for complex data transformations.
 * Ideal for reactive contexts and state management in SvelteKit.
 */
export const ramdaQueueExamples = {
    /**
     * Process a queue with Ramda
     */
    processQueue: <T, R>(queue: QueueItem<T>[], processor: (item: T) => R): R[] => {
        return R.map((queueItem: QueueItem<T>) => processor(queueItem.data), queue);
    },

    /**
     * Filter a queue with Ramda
     */
    filterQueue: <T>(queue: QueueItem<T>[], predicate: (item: T) => boolean): QueueItem<T>[] => {
        return R.filter((queueItem: QueueItem<T>) => predicate(queueItem.data), queue);
    },

    /**
     * Create a queue and add multiple items using Ramda's pipe
     */
    createAndFillQueue: <T>(items: T[]): QueueItem<T>[] => {
        return R.pipe(
            () => FunctionalQueue.create<T>(),
            (q) => R.reduce(
                (acc: QueueItem<T>[], item: T) => FunctionalQueue.enqueue(acc, item),
                q,
                items
            )
        )();
    },

    /**
     * Process all items in a queue using Ramda's pipe
     */
    processAllItems: <T, R>(queue: QueueItem<T>[], processor: (item: T) => R): [R[], QueueItem<T>[]] => {
        const results: R[] = [];
        let currentQueue = [...queue];
        let currentItem: QueueItem<T> | undefined;

        while (!FunctionalQueue.isEmpty(currentQueue)) {
            [currentItem, currentQueue] = FunctionalQueue.dequeue(currentQueue);
            if (currentItem) {
                results.push(processor(currentItem.data));
            }
        }

        return [results, currentQueue];
    }
};
