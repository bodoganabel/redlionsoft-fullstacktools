import { describe, it, expect } from 'vitest';
import { AsyncFunctionQueue } from './queue-functions';

describe('AsyncFunctionQueue - Auto Execution', () => {
  it('should create queue with auto-execute enabled', () => {
    const queue = new AsyncFunctionQueue({ autoExecute: true });
    expect(queue).toBeDefined();
  });

  it('should create queue with auto-execute disabled', () => {
    const queue = new AsyncFunctionQueue({ autoExecute: false });
    expect(queue).toBeDefined();
  });
});
