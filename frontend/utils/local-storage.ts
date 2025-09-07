export class LocalStorage {

    static get(key: string, defaultValue: string): string {
        if (typeof window === 'undefined') {
            return defaultValue;
        }
        const value = localStorage.getItem(key);
        if (value) {
            return value;
        }
        localStorage.setItem(key, defaultValue);
        return defaultValue;
    }
    static set(key: string, value: string): void {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.setItem(key, value);
    }
    static remove(key: string): void {
        if (typeof window === 'undefined') {
            return;
        }
        localStorage.removeItem(key);
    }
}