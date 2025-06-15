/**
 * Request deduplication utility
 * Provides a way to detect and prevent duplicate processing of the same request within a time window
 */

/**
 * In-memory store for tracking recent requests
 * Maps request keys to timestamps when they were last processed
 */
const recentRequests = new Map<string, number>();

/**
 * Default time window in milliseconds for considering a request as a duplicate
 */
const DEFAULT_DEDUPLICATION_WINDOW_MS = 5000; // 5 seconds

/**
 * Default time for cleanup of old entries
 */
const DEFAULT_CLEANUP_WINDOW_MS = 30000; // 30 seconds

/**
 * Interface for deduplication options
 */
interface DedupOptions {
  /** Time window in ms to consider a request as duplicate (default: 5000ms) */
  deduplicationWindowMs?: number;
  /** Time window in ms after which to clean up old entries (default: 30000ms) */
  cleanupWindowMs?: number;
}

/**
 * Check if a request with the given key has been processed recently
 * 
 * @param requestKey - A unique identifier for the request
 * @param options - Optional configuration for deduplication behavior
 * @returns True if this is a new request, false if it's a duplicate
 */
export function isUniqueRequest(
  requestKey: string,
  options: DedupOptions = {}
): boolean {
  const {
    deduplicationWindowMs = DEFAULT_DEDUPLICATION_WINDOW_MS,
    cleanupWindowMs = DEFAULT_CLEANUP_WINDOW_MS
  } = options;

  const now = Date.now();
  
  // Check if this request has been processed recently
  const lastProcessedTime = recentRequests.get(requestKey);
  if (lastProcessedTime && now - lastProcessedTime < deduplicationWindowMs) {
    // This is a duplicate request
    return false;
  }
  
  // Record this request
  recentRequests.set(requestKey, now);
  
  // Clean up old entries
  cleanupOldEntries(now, cleanupWindowMs);
  
  // This is a new request
  return true;
}

/**
 * Remove entries from the recentRequests map that are older than the cleanup window
 * 
 * @param currentTime - Current timestamp in milliseconds
 * @param cleanupWindowMs - Time window after which to clean up old entries
 */
function cleanupOldEntries(currentTime: number, cleanupWindowMs: number): void {
  for (const [key, timestamp] of recentRequests.entries()) {
    if (currentTime - timestamp > cleanupWindowMs) {
      recentRequests.delete(key);
    }
  }
}

/**
 * Get the current size of the deduplication cache
 * Useful for debugging or monitoring purposes
 * 
 * @returns The number of entries in the deduplication cache
 */
export function getDedupCacheSize(): number {
  return recentRequests.size;
}

/**
 * Clear all entries from the deduplication cache
 * Useful for testing or in special circumstances
 */
export function clearDedupCache(): void {
  recentRequests.clear();
}
