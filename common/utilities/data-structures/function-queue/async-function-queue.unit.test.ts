// Unit tests for AsyncFunctionQueue: Each public method is tested in isolation.
// No business logic, timing, or integration scenarios here.
import { describe, it, expect, beforeEach } from 'vitest';
import { AsyncFunctionQueue } from './async-function-queue';

describe('AsyncFunctionQueue Unit', () => {
  let queue: AsyncFunctionQueue<any>;

  beforeEach(() => {
    queue = new AsyncFunctionQueue();
  });

  it('should initialize empty', () => {
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should enqueue and update size', async () => {
    const fn = async () => 'test';
    expect(queue.push(fn)).toBe(0);
    expect(queue.push(fn, undefined, 10)).toBe(1);
    expect(queue.size()).toBe(1);
    expect(queue.isEmpty()).toBe(false);
  });

  it('should clear all functions', () => {
    queue.push(async () => '1', 'id1', 50);
    queue.push(async () => '2', 'id2', 50);
    expect(queue.size()).toBe(2);
    expect(queue.clear()).toBe(2);
    expect(queue.size()).toBe(0);
    expect(queue.isEmpty()).toBe(true);
  });

  it('should check for function existence by ID', () => {
    queue.push(async () => 'test', 'test-id', 50);
    expect(queue.findFunction('test-id')?.id).toBe('test-id');
    expect(queue.findFunction('nonexistent')).toBe(undefined);
  });

  it('should remove functions by ID', () => {
    queue.push(async () => 'test1', 'id1', 50);
    queue.push(async () => 'test2', 'id2', 50);
    expect(queue.removeFunction('id1')).toBe(true);
    expect(queue.size()).toBe(1);
    expect(queue.findFunction('id1')).toBe(undefined);
    expect(queue.findFunction('id2')?.id).toBe('id2');
  });

  it('should replace existing function with same ID', () => {
    const oldFn = async () => 'old';
    const newFn = async () => 'new';
    queue.push(oldFn, 'test-id', 50);
    expect(queue.size()).toBe(1);
    queue.push(newFn, 'test-id', 50);
    expect(queue.size()).toBe(1);
  });

  it('should return execution history as a copy', () => {
    queue.push(async () => 'a');
    queue.push(async () => 'b');
    // simulate execution
    expect(Array.isArray(queue.getExecutionHistory())).toBe(true);
    expect(queue.getExecutionHistory()).not.toBe(queue.getExecutionHistory());
  });
});
