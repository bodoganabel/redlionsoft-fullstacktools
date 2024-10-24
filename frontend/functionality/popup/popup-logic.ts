// src/routes/popups/popup-logic.ts
import { writable } from 'svelte/store';
import type { SvelteComponent } from 'svelte';

export interface IPopup {
    id: string;
    title?: string;
    message?: string;
    component?: typeof SvelteComponent | undefined;
    componentProps?: Record<string, any>;
    isOutsideClickClose?: boolean;
    onClose?: () => void;
    onAccept?: () => void;
    acceptText?: string;
    closeText?: string;
}

const popupStore = writable<IPopup[]>([]);

const popup = (popup: Omit<IPopup, 'id'>) => {
    const id = crypto.randomUUID();
    const newPopup = { id, ...popup };
    popupStore.update((popups) => [...popups, newPopup]);
    return id;
};

const popupClose = (id: string) => {
    popupStore.update((popups) => popups.filter((popup) => popup.id !== id));
};

export { popupStore, popup, popupClose as removePopup };
