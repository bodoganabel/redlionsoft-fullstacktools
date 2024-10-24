
// src/routes/notifications/toast/toast.store.ts
import { writable } from 'svelte/store';

export interface IToast {
    id: string;
    message: string;
    type: EToastTypes;
    ttl: number; // time to live in milliseconds
    onClick: () => void;
    timeoutId?: NodeJS.Timeout;
}

const toastStore = writable<IToast[]>([]);

const createToast = (toast: Omit<IToast, 'id'>) => {
    const id = crypto.randomUUID();
    const newToast = { id, ...toast };

    if (newToast.ttl > 0) {
        const timeoutId = setTimeout(() => removeToast(id), newToast.ttl);
        newToast.timeoutId = timeoutId;
    }

    toastStore.update((toasts) => [...toasts, newToast]);
    return id;
};

const removeToast = (id: string) => {
    toastStore.update((toasts) => {
        const updatedToasts = toasts.map((toast) => {
            if (toast.id === id) {
                clearTimeout(toast.timeoutId);
                return { ...toast, timeoutId: undefined };
            }
            return toast;
        });
        return updatedToasts.filter((toast) => toast.id !== id);
    });
};
const updateToast = (id: string, updates: Partial<IToast>) => {
    toastStore.update((toasts) =>
        toasts.map((toast) => (toast.id === id ? { ...toast, ...updates } : toast))
    );
};

export { toastStore, createToast, removeToast, updateToast };

export enum EToastTypes {
    SUCCESS = 'success',
    NORMAL = 'normal',
    WARNING = 'warning',
    ERROR = 'error',
}
export function toast(message: string, type: EToastTypes, ttl = 4000, onClick = () => { }) {
    const toastId = createToast({
        message, type, ttl, onClick,
    });
    return toastId;
}