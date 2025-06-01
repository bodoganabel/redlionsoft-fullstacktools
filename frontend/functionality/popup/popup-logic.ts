// src/routes/popups/popup-logic.ts
import { get, writable } from "svelte/store";
import type { ComponentType, SvelteComponent, ComponentProps } from "svelte";
import PopupInputModal from "./PopupInputModal.svelte";

export interface IPopup<TComponent extends ComponentType<SvelteComponent> = ComponentType<SvelteComponent>> {
  id?: string;
  title?: string;
  message?: string;
  component?: TComponent; // Typescript fails when passing svelte component. Use any svelte component here.
  componentProps?: TComponent extends ComponentType<infer T> ? ComponentProps<T> : Record<string, any>;
  isOutsideClickClose?: boolean;
  onClose?: () => void;
  onAccept?: () => void;
  acceptMessage?: string;
  closeMessage?: string;
  isEnterAccept?: boolean;
}

export const popupStore = writable<IPopup[]>([]);

export const popup = <TComponent extends ComponentType<SvelteComponent>>(popup: IPopup<TComponent>): string => {
  const id = typeof popup?.id === "undefined" ? crypto.randomUUID() : popup.id;
  const newPopup = { ...popup, id };
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
  isEnterAccept?: boolean;
}

export const popupInput = (props: IPopupInputProps) => {
  const defaultProps: Required<IPopupInputProps> = {
    id: "popup-input",
    message: "",
    isSaveClose: true,
    saveButtonTitle: "Save",
    onSave: (value: string) => { },
    title: "",
    value: "",
    isTextarea: false,
    isEnterAccept: false, // PopupInputModal should handle onEnter events instead of default popup
  };

  const combinedProps = {
    ...defaultProps,
    ...props,
  } as Required<IPopupInputProps>;

  popup({
    id: combinedProps.id === undefined ? "popup-input" : combinedProps.id,
    title: combinedProps.title,
    message: combinedProps.message,
    component: PopupInputModal,
    componentProps: combinedProps,
    isEnterAccept: combinedProps.isEnterAccept,
  });
};
