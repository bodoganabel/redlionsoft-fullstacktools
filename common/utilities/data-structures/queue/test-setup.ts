import { vi } from 'vitest';

// Mock Luxon DateTime for consistent testing
vi.mock('luxon', () => {
  let mockTime = 1000;
  return {
    DateTime: {
      now: () => ({
        toISO: () => new Date(mockTime).toISOString(),
        plus: ({ milliseconds }: { milliseconds: number }) => ({
          toISO: () => new Date(mockTime + milliseconds).toISOString()
        })
      })
    }
  };
});

export function setupTest() {
  const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
  vi.spyOn(console, 'error').mockImplementation(() => {});
  vi.clearAllTimers();
  vi.useFakeTimers();
  
  return { consoleSpy };
}

export function teardownTest() {
  vi.useRealTimers();
  vi.restoreAllMocks();
}
