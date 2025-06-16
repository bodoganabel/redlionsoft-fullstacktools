// Integration/business logic tests for AsyncFunctionQueue
// These test real queue behavior: enqueuing, delays, replacement, execution order, etc.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsyncFunctionQueue } from './async-function-queue';
import { DateTime } from 'luxon';
import { delay } from '../../general';

describe('AsyncFunctionQueue Integration', async () => {
  let queue: AsyncFunctionQueue<any>;
  let consoleLogSpy: any;

  beforeEach(() => {
    queue = new AsyncFunctionQueue({ autoExecute: false });
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation(() => { });
  });

  it('should execute functions in FIFO order', async () => {
    const results: string[] = [];
    queue.enqueue(async () => { results.push('a'); });
    queue.enqueue(async () => { results.push('b'); });
    await queue.executeQueue();
    expect(results).toEqual(['a', 'b']);
  });


  it('should allow debouncing -  overwriting even when the execution delay is already running', async () => {
    const results: string[] = [];
    const now = DateTime.now();
    queue.enqueue(async () => { results.push('should-be-debounced'); }, 'to-update', 10);
    queue.executeQueue();
    queue.enqueue(async () => { results.push('awaited'); }, 'awaited', 10);
    queue.enqueue(async () => { results.push('should-overwrite'); }, 'to-update', 10);
    await delay(10);
    const timeElapsed = DateTime.now().diff(now).as('milliseconds');
    expect(timeElapsed).toBeGreaterThan(20);
    expect(results).toEqual(['awaited', 'should-overwrite']);
  });

  it('should respect async/await sequence while auto-execute', async () => {
    const results: string[] = [];
    queue = new AsyncFunctionQueue({ autoExecute: true });
    queue.enqueue(async () => { results.push('should-run-before-debounce'); }, 'to-update', 10);
    queue.enqueue(async () => { results.push('awaited'); }, 'awaited', 10);
    queue.enqueue(async () => { results.push('should-debounce'); }, 'to-update', 10);
    expect(results).toEqual(['awaited', 'should-debounce']);
  });
  it('should respect async/await sequence, even if the business logic makes no sense', async () => {
    const results: string[] = [];
    const now = DateTime.now();
    queue.enqueue(async () => { results.push('should-run-before-debounce'); }, 'to-update', 10);
    await queue.executeQueue(); // wait until first function is executed
    queue.enqueue(async () => { results.push('awaited'); }, 'awaited', 10);
    queue.enqueue(async () => { results.push('should-not-debounce'); }, 'to-update', 10);
    await delay(10);
    await queue.executeQueue();
    const timeElapsed = DateTime.now().diff(now).as('milliseconds');
    expect(timeElapsed).toBeGreaterThan(20);
    expect(results).toEqual(['should-run-before-debounce', 'awaited', 'should-not-debounce']);
  });

  it('should execute with delays', async () => {
    const results: (string | number)[] = [];
    const now = DateTime.now();
    queue.enqueue(async () => {
      const timeElapsed = DateTime.now().diff(now).as('milliseconds');
      results.push(`first`, timeElapsed);
    }, undefined, 100);
    queue.enqueue(async () => {
      const timeElapsed = DateTime.now().diff(now).as('milliseconds');
      results.push(`second`, timeElapsed);
    });
    const exec = queue.executeQueue();
    await exec;
    expect(results[0]).toEqual('first');
    expect(results[1]).toBeGreaterThan(100);
    expect(results[2]).toEqual('second');
    expect(results[3]).toBeGreaterThan(100);
    expect(results[3]).toBeLessThan(105);
  });

  it('should replace functions by ID before execution', async () => {
    const results: string[] = [];
    queue.enqueue(async () => { results.push('old'); }, 'replace-me', 100);
    queue.enqueue(async () => { results.push('new'); }, 'replace-me', 100);
    await queue.executeQueue();
    expect(results).toEqual(['new']);
  });

  it('should allow removal before execution', async () => {
    const results: string[] = [];
    queue.enqueue(async () => { results.push('will-run'); }, 'to-remove');
    queue.removeFunction('to-remove');
    await queue.executeQueue();
    expect(results).toEqual([]);
  });

  it('should log when executing console log functions', async () => {
    queue.enqueue(async () => { console.log('msg1'); });
    await queue.executeQueue();
    expect(consoleLogSpy).toHaveBeenCalledWith('msg1');
  });
});
