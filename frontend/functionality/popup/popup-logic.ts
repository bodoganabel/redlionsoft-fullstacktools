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

interface IPopupInputProps {
  title?: string;
  onSave?: (value: string) => Promise<void> | void;
  value?: string;
  id?: string;
  message?: string;
  isSaveClose?: boolean;
  saveButtonTitle?: string;
  isTextarea?: boolean;
}

export const popupInput = (props: IPopupInputProps) => {
  const defaultProps: Required<IPopupInputProps> = {
    id: "popup-input",
    message: "",
    isSaveClose: false,
    saveButtonTitle: "Save",
    onSave: (value: string) => {},
    title: "",
    value: "",
    isTextarea: false,
  };
  const combinedProps: IPopupInputProps = { ...defaultProps, ...props };

  popup({
    id: combinedProps.id,
    title: combinedProps.title,
    message: combinedProps.message,
    component: PopupInputModal,
    componentProps: combinedProps,
  });
};
