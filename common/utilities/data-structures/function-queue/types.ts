/**
 * Core types and interfaces for AsyncFunctionQueue
 */

export interface QueuedFunction<T> {
    func: () => Promise<T>;
    timestamp: string;
    id?: string;
    executeAfter?: string;
}

export interface QueueItemExecutionResult<T = any> {
    data?: T;
    error?: Error | unknown;
    timestamp: string;
    id?: string;
    skipped?: boolean;
}

export interface AsyncFunctionQueueOptions {
    autoExecute?: boolean;
    debug?: boolean;
    maxHistorySize?: number;
    defaultDelayMs?: number;
}

export interface ExecutionState<T> {
    currentlyExecuting: QueuedFunction<T> | null;
    isProcessing: boolean;
}
