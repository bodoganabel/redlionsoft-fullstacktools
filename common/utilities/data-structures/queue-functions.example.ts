/**
 * Example usage of AsyncFunctionQueue
 */

import { AsyncFunctionQueue } from './queue-functions';

// Example 1: Basic usage with auto-execution
async function basicExample() {
    console.log('\n--- Basic Usage Example ---');
    
    // Create queue with auto-execution enabled (default)
    const queue = new AsyncFunctionQueue({ 
        debugShowOrigin: true 
    });
    
    // Add async functions - they'll execute automatically in order
    queue.enqueue(async () => {
        console.log('Task 1 started');
        await new Promise(resolve => setTimeout(resolve, 1000));
        console.log('Task 1 completed');
        return 'Result 1';
    }, 'homepage');
    
    queue.enqueue(async () => {
        console.log('Task 2 started');
        await new Promise(resolve => setTimeout(resolve, 500));
        console.log('Task 2 completed');
        return 'Result 2';
    }, 'product-page');
    
    queue.enqueue(async () => {
        console.log('Task 3 started');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Task 3 completed');
        return 'Result 3';
    }, 'checkout');
    
    // Wait for all tasks to complete
    while (queue.isCurrentlyExecuting() || !queue.isEmpty()) {
        await new Promise(resolve => setTimeout(resolve, 100));
    }
    
    console.log('All tasks completed');
    console.log('History:', queue.getHistory().map(h => ({ 
        origin: h.item.origin, 
        result: h.result 
    })));
}

// Example 2: Manual execution control
async function manualExecutionExample() {
    console.log('\n--- Manual Execution Example ---');
    
    // Create queue with auto-execution disabled
    const queue = new AsyncFunctionQueue({
        autoExecute: false,
        debugShowOrigin: true
    });
    
    // Add several tasks
    queue.enqueue(async () => {
        console.log('Manual Task 1 started');
        await new Promise(resolve => setTimeout(resolve, 800));
        console.log('Manual Task 1 completed');
        return 'Manual Result 1';
    }, 'api-call-1');
    
    queue.enqueue(async () => {
        console.log('Manual Task 2 started');
        await new Promise(resolve => setTimeout(resolve, 400));
        console.log('Manual Task 2 completed');
        return 'Manual Result 2';
    }, 'api-call-2');
    
    console.log(`Queue size before execution: ${queue.size()}`);
    
    // Execute just the first task
    console.log('Executing next task:');
    await queue.executeNext();
    
    console.log(`Queue size after executing one task: ${queue.size()}`);
    
    // Execute the rest of the queue
    console.log('Executing remaining tasks:');
    await queue.executeQueue();
    
    console.log('All manual tasks completed');
}

// Example 3: Error handling
async function errorHandlingExample() {
    console.log('\n--- Error Handling Example ---');
    
    const queue = new AsyncFunctionQueue({
        autoExecute: false,
        debugShowOrigin: true
    });
    
    // Add tasks with one that will fail
    queue.enqueue(async () => {
        console.log('Normal task started');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Normal task completed');
        return 'Success';
    }, 'normal-task');
    
    queue.enqueue(async () => {
        console.log('Failing task started');
        await new Promise(resolve => setTimeout(resolve, 300));
        throw new Error('Task failed intentionally');
    }, 'failing-task');
    
    queue.enqueue(async () => {
        console.log('Task after failure started');
        await new Promise(resolve => setTimeout(resolve, 300));
        console.log('Task after failure completed');
        return 'Still executed';
    }, 'after-failure');
    
    try {
        await queue.executeQueue();
    } catch (err) {
        console.log('Caught error from queue execution:', (err as Error).message);
        
        // Queue continues processing after error
        if (!queue.isEmpty()) {
            console.log(`${queue.size()} tasks remaining in queue, continuing execution...`);
            await queue.executeQueue();
        }
    }
    
    console.log('Error handling example completed');
    console.log('Error history:', queue.getHistory()
        .map(h => ({ 
            origin: h.item.origin, 
            success: !h.error,
            error: h.error?.message 
        }))
    );
}

// Run all examples
async function runAllExamples() {
    await basicExample();
    await manualExecutionExample();
    await errorHandlingExample();
    console.log('\nAll examples completed');
}

// Uncomment to run the examples
// runAllExamples().catch(console.error);

// SvelteKit component usage example (pseudo-code)
/*
<script lang="ts">
    import { onMount } from 'svelte';
    import { AsyncFunctionQueue } from '$lib/utilities/data-structures/queue-functions';
    
    // Create a singleton queue for this component
    const apiQueue = new AsyncFunctionQueue({
        debugShowOrigin: true
    });
    
    // Function to fetch data from API
    async function fetchUserData(userId: string) {
        return apiQueue.enqueue(
            async () => {
                // Simulated API call
                const response = await fetch(`/api/users/${userId}`);
                return await response.json();
            },
            `user-${userId}`
        );
    }
    
    // Add multiple API calls that will execute in sequence
    onMount(() => {
        fetchUserData('user1');
        fetchUserData('user2');
        fetchUserData('user3');
    });
</script>
*/

export { runAllExamples };
