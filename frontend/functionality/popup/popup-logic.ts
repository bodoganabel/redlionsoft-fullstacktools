// src/routes/popups/popup-logic.ts
import { writable } from "svelte/store";
import type { ComponentType, SvelteComponent } from "svelte";
import PopupInputModal from "./PopupInputModal.svelte";

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

export const popupInput = (
  title: string,
  onSave: (newValue: string) => {},
  initialValue = "",
  props: {
    id: string;
    message?: string;
    isSaveClose: boolean;
  } = {
    id: "popup-input",
    message: undefined,
    isSaveClose: true,
  }
) => {
  const { id, message, isSaveClose } = props;

  popup({
    id,
    title,
    message,
    component: PopupInputModal,
    componentProps: {
      value: initialValue,
      onSave,
      id,
      isSaveClose,
    },
  });
};
