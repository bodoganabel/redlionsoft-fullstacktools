let debouncedFunctions: { callback: () => Promise<void> | void, id: string, delay: number, timeout: NodeJS.Timeout }[] = [];

export function debounce(callback: () => Promise<void> | void, id: string, delay: number) {
    // Find existing function with same ID only once
    const existingFunction = debouncedFunctions.find((item) => item.id === id);

    // Clear timeout if exists
    if (existingFunction) {
        clearTimeout(existingFunction.timeout);
        debouncedFunctions = debouncedFunctions.filter((item) => item.id !== id);
    }

    const timeout = setTimeout(async () => {
        try {
            await callback();
        } catch (error) {
            console.error(`Error in debounced function with id ${id}:`, error);
        } finally {
            // Always clean up regardless of success or error
            debouncedFunctions = debouncedFunctions.filter((item) => item.id !== id);
        }
    }, delay);

    debouncedFunctions.push({ callback, id, delay, timeout });
}