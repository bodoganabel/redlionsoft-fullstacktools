// Integration/business logic tests for AsyncFunctionQueue
// These test real queue behavior: enqueuing, delays, replacement, execution order, etc.
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AsyncFunctionQueue } from './async-function-queue';
import { DateTime } from 'luxon';
import fs from 'fs';
import path from 'path';

// Simple file logger that bypasses all Vitest buffering
function logToFile(message: string) {
  const logDir = path.join(process.cwd(), 'test-logs');
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
  const logFile = path.join(logDir, 'debug.log');
  // Add timestamp to see exact execution order
  const timestamp = new Date().toISOString();
  fs.appendFileSync(logFile, `[${timestamp}] ${message}\n`);
}

describe('AsyncFunctionQueue Integration', async () => {
  let queue: AsyncFunctionQueue<any>;
  let consoleLogSpy: any;

  beforeEach(() => {
    queue = new AsyncFunctionQueue({ debug: true });
    // Create a spy that both captures calls for assertions and allows test logs to display
    consoleLogSpy = vi.spyOn(console, 'log').mockImplementation((...args) => {
      const message = args[0];

      // Always track the call for test assertions

      // Only filter out AsyncFunctionQueue's internal logs
      if (typeof message !== 'string' || !message.includes('[AsyncFunctionQueue]')) {
        // Pass through test logs to console
        console.info(...args);
      }
    });
  });

  it('should execute functions in FIFO order', async () => {
    const results: string[] = [];
    queue.push(async () => { results.push('a'); }, 'a');
    queue.push(async () => { results.push('b'); }, 'b');
    queue.push(async () => { results.push('c'); }, 'c');
    queue.push(async () => { results.push('d'); }, 'd');

    await queue.waitForFinish();
    expect(results).toEqual(['a', 'b', 'c', 'd']);
  });


  it('should allow debouncing -  overwriting even when the execution delay is already running', async () => {
    const results: string[] = [];
    const now = DateTime.utc();
    queue.push(async () => { results.push('should-be-debounced'); }, 'to-update', 10);
    queue.push(async () => { results.push('awaited'); }, 'awaited', 10);
    queue.push(async () => { results.push('should-overwrite'); }, 'to-update', 10);
    await queue.waitForFinish();

    const timeElapsed = DateTime.utc().diff(now).as('milliseconds');

    expect(timeElapsed).toBeGreaterThan(19);
    logToFile(`Time elapsed: ${timeElapsed.toFixed(2)}ms`);
    logToFile(`Results: ${JSON.stringify(results)}`);
    expect(results).toEqual(['awaited', 'should-overwrite']);
  });

  it('§ ', async () => {
    // Clear the log file at the start of the test
    const logDir = path.join(process.cwd(), 'test-logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.writeFileSync(path.join(logDir, 'debug.log'), '');

    const results: string[] = [];
    const now = DateTime.utc();

    logToFile('1. Starting test');
    logToFile('2. Pushing to-update');
    queue.push(async () => {
      results.push('should-run-before-debounce');
      logToFile('Function should-run-before-debounce executed');
    }, 'to-update', 10);

    logToFile('3. Pushing awaited');
    queue.push(async () => {
      results.push('awaited');
      logToFile('Function awaited executed');
    }, '####   awaited', 10);

    logToFile('4. Before waitForFinish');
    await queue.waitForFinish();
    logToFile('5. After waitForFinish');

    logToFile('6. Pushing should-not-debounce');
    queue.push(async () => {
      logToFile('Inside should-not-debounce function');
      results.push('should-not-debounce');
    }, 'to-update', 10);

    logToFile('7. After pushing to-update 2');
    // Add a small delay to ensure log file is written before assertions
    await new Promise(resolve => setTimeout(resolve, 20));

    logToFile('8. Before assertions');
    logToFile(`Current results: ${JSON.stringify(results)}`);
    const timeElapsed = DateTime.utc().diff(now).as('milliseconds');
    await queue.waitForFinish();
    expect(timeElapsed).toBeGreaterThan(19);
    expect(results).toEqual(['should-run-before-debounce', 'awaited', 'should-not-debounce']);
    logToFile('9. After assertions');
  });

  it('should execute with delays', async () => {
    const results: (string | number)[] = [];
    const now = DateTime.utc();
    queue.push(async () => {
      const timeElapsed = DateTime.utc().diff(now).as('milliseconds');
      results.push(`first`, timeElapsed);
    }, undefined, 101);
    queue.push(async () => {
      const timeElapsed = DateTime.utc().diff(now).as('milliseconds');
      results.push(`second`, timeElapsed);
    });
    await queue.waitForFinish();
    expect(results[0]).toEqual('first');
    expect(results[1]).toBeGreaterThan(100);
    expect(results[2]).toEqual('second');
    expect(results[3]).toBeGreaterThan(100);
    expect(results[3]).toBeLessThan(110);
  });

  it('should replace functions by ID before execution', async () => {
    const results: string[] = [];
    queue.push(async () => { results.push('old'); }, 'replace-me', 100);
    queue.push(async () => { results.push('new'); }, 'replace-me', 100);
    await queue.waitForFinish();

    expect(results).toEqual(['new']);
  });


  it('should allow removal before execution', async () => {
    const results: string[] = [];
    queue.push(async () => { results.push('will-run'); }, 'to-remove', 100);
    queue.removeFunction('to-remove');
    await queue.waitForFinish();
    expect(results).toEqual([]);
  });


  it('should log when executing console log functions', async () => {
    queue.push(async () => { console.log('msg1'); });
    expect(consoleLogSpy).toHaveBeenCalledWith('msg1');
  });
});
