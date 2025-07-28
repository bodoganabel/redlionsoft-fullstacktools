import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Queue, FunctionalQueue, ramdaQueueExamples, type QueueItem } from './queue';

// Mock DateTime.now() to return a consistent 

describe('Queue - Object-oriented implementation', () => {
  let queue: Queue<number>;

  beforeEach(() => {
    queue = new Queue<number>();
  });

  it('should create an empty queue', () => {
    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);
  });

  it('should enqueue items correctly', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    expect(queue.isEmpty()).toBe(false);
    expect(queue.size()).toBe(3);
  });

  it('should dequeue items in FIFO order', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    const item1 = queue.dequeue();
    expect(item1?.data).toBe(1);
    expect(queue.size()).toBe(2);

    const item2 = queue.dequeue();
    expect(item2?.data).toBe(2);
    expect(queue.size()).toBe(1);

    const item3 = queue.dequeue();
    expect(item3?.data).toBe(3);
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should return undefined when dequeuing from an empty queue', () => {
    expect(queue.dequeue()).toBeUndefined();
  });

  it('should peek at the first item without removing it', () => {
    queue.enqueue(1);
    queue.enqueue(2);

    expect(queue.peek()?.data).toBe(1);
    expect(queue.size()).toBe(2); // Size should remain unchanged
  });

  it('should return undefined when peeking an empty queue', () => {
    expect(queue.peek()).toBeUndefined();
  });

  it('should clear all items from the queue', () => {
    queue.enqueue(1);
    queue.enqueue(2);
    queue.enqueue(3);

    queue.clear();

    expect(queue.isEmpty()).toBe(true);
    expect(queue.size()).toBe(0);
  });

  it('should add timestamp to each item', () => {
    queue.enqueue(42);
    const item = queue.peek();

    expect(item?.timestamp).toBe('2025-06-15T15:00:00.000Z');
  });

  it('should return a copy of items with getItems', () => {
    queue.enqueue(1);
    queue.enqueue(2);

    const items = queue.getItems();

    expect(items.length).toBe(2);
    expect(items[0]?.data).toBe(1);
    expect(items[1]?.data).toBe(2);

    // Verify it's a copy by modifying the returned array
    // @ts-ignore - Deliberately trying to modify a readonly array for test
    items.push({ data: 3, timestamp: '2025-06-15T15:00:00.000Z' });

    expect(queue.size()).toBe(2); // Original queue should be unchanged
  });
});

describe('FunctionalQueue - Functional implementation', () => {
  it('should create an empty queue', () => {
    const queue = FunctionalQueue.create<number>();

    expect(FunctionalQueue.isEmpty(queue)).toBe(true);
    expect(FunctionalQueue.size(queue)).toBe(0);
  });

  it('should enqueue items correctly', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 1);
    queue = FunctionalQueue.enqueue(queue, 2);
    queue = FunctionalQueue.enqueue(queue, 3);

    expect(FunctionalQueue.isEmpty(queue)).toBe(false);
    expect(FunctionalQueue.size(queue)).toBe(3);
  });

  it('should dequeue items in FIFO order', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 1);
    queue = FunctionalQueue.enqueue(queue, 2);
    queue = FunctionalQueue.enqueue(queue, 3);

    let item1: QueueItem<number> | undefined;
    [item1, queue] = FunctionalQueue.dequeue(queue);
    expect(item1?.data).toBe(1);
    expect(FunctionalQueue.size(queue)).toBe(2);

    let item2: QueueItem<number> | undefined;
    [item2, queue] = FunctionalQueue.dequeue(queue);
    expect(item2?.data).toBe(2);
    expect(FunctionalQueue.size(queue)).toBe(1);

    let item3: QueueItem<number> | undefined;
    [item3, queue] = FunctionalQueue.dequeue(queue);
    expect(item3?.data).toBe(3);
    expect(FunctionalQueue.size(queue)).toBe(0);
    expect(FunctionalQueue.isEmpty(queue)).toBe(true);
  });

  it('should return undefined when dequeuing from an empty queue', () => {
    const queue = FunctionalQueue.create<number>();
    const [item, newQueue] = FunctionalQueue.dequeue(queue);

    expect(item).toBeUndefined();
    expect(newQueue).toEqual([]);
  });

  it('should peek at the first item without removing it', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 1);
    queue = FunctionalQueue.enqueue(queue, 2);

    const item = FunctionalQueue.peek(queue);

    expect(item?.data).toBe(1);
    expect(FunctionalQueue.size(queue)).toBe(2); // Size should remain unchanged
  });

  it('should return undefined when peeking an empty queue', () => {
    const queue = FunctionalQueue.create<number>();
    expect(FunctionalQueue.peek(queue)).toBeUndefined();
  });

  it('should add timestamp to each item', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 42);

    const item = FunctionalQueue.peek(queue);

    expect(item?.timestamp).toBe('2025-06-15T15:00:00.000Z');
  });

  it('should maintain immutability', () => {
    const emptyQueue = FunctionalQueue.create<number>();
    const queue1 = FunctionalQueue.enqueue(emptyQueue, 1);
    const queue2 = FunctionalQueue.enqueue(queue1, 2);

    // Original empty queue should remain empty
    expect(FunctionalQueue.isEmpty(emptyQueue)).toBe(true);

    // First queue should still have only one item
    expect(FunctionalQueue.size(queue1)).toBe(1);
    expect(FunctionalQueue.peek(queue1)?.data).toBe(1);

    // Second queue should have two items
    expect(FunctionalQueue.size(queue2)).toBe(2);
    expect(FunctionalQueue.peek(queue2)?.data).toBe(1);
  });
});

describe('ramdaQueueExamples - Ramda integration', () => {
  it('should process queue items with processQueue', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 1);
    queue = FunctionalQueue.enqueue(queue, 2);
    queue = FunctionalQueue.enqueue(queue, 3);

    const results = ramdaQueueExamples.processQueue(queue, x => x * 2);

    expect(results).toEqual([2, 4, 6]);
    // Original queue should be unchanged
    expect(FunctionalQueue.size(queue)).toBe(3);
  });

  it('should filter queue items with filterQueue', () => {
    let queue = FunctionalQueue.create<number>();
    queue = FunctionalQueue.enqueue(queue, 1);
    queue = FunctionalQueue.enqueue(queue, 2);
    queue = FunctionalQueue.enqueue(queue, 3);
    queue = FunctionalQueue.enqueue(queue, 4);

    const filteredQueue = ramdaQueueExamples.filterQueue(queue, x => x % 2 === 0);

    expect(filteredQueue.length).toBe(2);
    expect(filteredQueue[0]?.data).toBe(2);
    expect(filteredQueue[1]?.data).toBe(4);
    // Original queue should be unchanged
    expect(FunctionalQueue.size(queue)).toBe(4);
  });

  it('should create and fill a queue with createAndFillQueue', () => {
    const items = [1, 2, 3, 4, 5];
    const queue = ramdaQueueExamples.createAndFillQueue(items);

    expect(queue.length).toBe(5);
    expect(queue[0]?.data).toBe(1);
    expect(queue[4]?.data).toBe(5);
    expect(queue.every(item => item.timestamp === '2025-06-15T15:00:00.000Z')).toBe(true);
  });

  it('should process all items with processAllItems', () => {
    const queue = ramdaQueueExamples.createAndFillQueue([1, 2, 3, 4]);

    const [results, emptyQueue] = ramdaQueueExamples.processAllItems(queue, x => x * 2);

    expect(results).toEqual([2, 4, 6, 8]);
    expect(emptyQueue).toEqual([]);
  });

  it('should handle empty queue with processAllItems', () => {
    const queue = FunctionalQueue.create<number>();

    const [results, emptyQueue] = ramdaQueueExamples.processAllItems(queue, x => x * 2);

    expect(results).toEqual([]);
    expect(emptyQueue).toEqual([]);
  });

  it('should handle complex data types', () => {
    interface User {
      id: number;
      name: string;
    }

    const users: User[] = [
      { id: 1, name: 'Alice' },
      { id: 2, name: 'Bob' },
      { id: 3, name: 'Charlie' }
    ];

    const queue = ramdaQueueExamples.createAndFillQueue(users);

    const [userIds, _] = ramdaQueueExamples.processAllItems(queue, user => user.id);

    expect(userIds).toEqual([1, 2, 3]);
  });
});
