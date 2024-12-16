// src/routes/popups/popup-logic.ts
import { writable } from "svelte/store";
import type { ComponentType, SvelteComponent } from "svelte";

export interface IPopup {
  id: string;
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

const popupStore = writable<IPopup[]>([]);

const popup = (popup: Omit<IPopup, "id">) => {
  const id = crypto.randomUUID();
  const newPopup = { id, ...popup };
  popupStore.update((popups) => [...popups, newPopup]);
  return id;
};

const popupClose = (id: string) => {
  popupStore.update((popups) => popups.filter((popup) => popup.id !== id));
};

export { popupStore, popup, popupClose as removePopup };
