
/**
 * Determines if the application is running in production mode by process.env.NODE_ENV === 'production'.
 * 
 * @returns {boolean} - True if the application is running in production mode, false otherwise.
 */
export const isProduction = (): boolean => {
    // Check if the environment variable is defined and is set to 'production'.
    return process.env.NODE_ENV === 'production';
};
