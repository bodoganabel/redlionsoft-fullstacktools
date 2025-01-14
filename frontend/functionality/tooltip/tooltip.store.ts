import { get, writable } from "svelte/store";
import type { ComponentType, SvelteComponent } from "svelte";

export type TooltipPosition = "top" | "bottom";

export interface ITooltip {
  content: string | null;
  component: ComponentType<SvelteComponent> | null;
  componentProps: Record<string, any> | null;
  visible: boolean;
  x: number;
  y: number;
  position: TooltipPosition;
}

export const tooltipStore = writable<ITooltip>({
  content: null,
  visible: false,
  x: 0,
  y: 0,
  component: null,
  componentProps: null,
  position: "top",
});

export function tooltip(
  event: MouseEvent,
  contentOrComponent: string | ComponentType<SvelteComponent>,
  componentProps: Record<string, any> | null = null,
  position: TooltipPosition = "top"
) {
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;
  try {
    // Temporarily hide the tooltip
    tooltipStore.set({
      visible: false,
      x: 0,
      y: 0,
      content: null,
      component: null,
      componentProps: null,
      position: "top",
    });

    const tooltipX = event.pageX;
    const tooltipY = position === "top" ? event.pageY - 12 : event.pageY + 12;

    /* This is a debouncer, otherwise the initiating click event will trigger the hiding mechanism of the tooltip */
    setTimeout(() => {
      if (typeof contentOrComponent === "string") {
        tooltipStore.set({
          content: contentOrComponent,
          visible: true,
          x: tooltipX,
          y: tooltipY,
          component: null,
          componentProps: null,
          position,
        });
      } else {
        tooltipStore.set({
          component: contentOrComponent,
          componentProps,
          visible: true,
          x: tooltipX,
          y: tooltipY,
          content: null,
          position,
        });
      }
    }, 10);
  } catch (error) {
    console.warn(error);
  }
}
