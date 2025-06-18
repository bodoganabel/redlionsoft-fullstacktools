/**
 * Core types and interfaces for AsyncFunctionQueue
 */

export interface QueuedFunction<T> {
    func: () => Promise<T>;
    timestamp: string;
    id?: string;
    executeAfter_ms: number | undefined;
}

export interface QueueItemExecutionResult<T = any> {
    data?: T;
    error?: Error | unknown;
    timestamp: string;
    id?: string;
    skipped?: boolean;
    cancelled?: boolean;
}

export interface AsyncFunctionQueueOptions {
    debug?: boolean;
    maxHistorySize?: number;
}

export interface ExecutionState<T> {
    currentlyExecuting: QueuedFunction<T> | null;
    isProcessing: boolean;
}
