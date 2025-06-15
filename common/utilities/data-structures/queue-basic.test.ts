import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';
import { setupTest, teardownTest } from './test-setup';

describe('AsyncFunctionQueue - Basic Operations', () => {
  let queue: AsyncFunctionQueue;

  beforeEach(() => {
    setupTest();
    queue = new AsyncFunctionQueue({ autoExecute: false });
  });

  afterEach(() => {
    teardownTest();
  });

  it('should create an empty queue', () => {
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
    expect(queue.isCurrentlyExecuting()).toBe(false);
  });

  it('should enqueue functions and update size', () => {
    const mockFunction = async () => 'result';
    
    expect(queue.enqueue(mockFunction)).toBe(1);
    expect(queue.size()).toBe(1);
    expect(queue.isEmpty()).toBe(false);
    
    queue.enqueue(mockFunction);
    expect(queue.size()).toBe(2);
  });

  it('should clear all functions from queue', () => {
    queue.enqueue(async () => '1');
    queue.enqueue(async () => '2');
    
    expect(queue.size()).toBe(2);
    expect(queue.clear()).toBe(2);
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should return undefined when executing empty queue', async () => {
    const result = await queue.executeNext();
    expect(result.data).toBeUndefined();
  });
});
