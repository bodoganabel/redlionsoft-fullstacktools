// src/routes/popups/popup-logic.ts
import { writable } from "svelte/store";
import type { ComponentType, SvelteComponent } from "svelte";

export interface IPopup {
  id?: string;
  title?: string;
  message?: string;
  component?: ComponentType<SvelteComponent>; // Typescript fails when passing svelte component. Use any svelte component here.
  componentProps?: Record<string, any>;
  isOutsideClickClose?: boolean;
  onClose?: () => void;
  onAccept?: () => void;
  acceptMessage?: string;
  closeMessage?: string;
}

export const popupStore = writable<IPopup[]>([]);

export const popup = (popup: IPopup) => {
  const id = popup.id === undefined ? crypto.randomUUID() : popup.id;
  const newPopup = { id, ...popup };
  popupStore.update((popups) => [...popups, newPopup]);
  return id;
};

export const popupClose = (id: string) => {
  popupStore.update((popups) => popups.filter((popup) => popup.id !== id));
};
