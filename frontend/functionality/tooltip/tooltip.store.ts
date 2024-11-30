import { get, writable } from "svelte/store";

export const tooltipStore = writable<{
  content: string;
  visible: boolean;
  x: number;
  y: number;
}>({
  content: "",
  visible: false,
  x: 0,
  y: 0,
});

export function tooltip(event: MouseEvent, content: string) {
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;
  try {
    // Temporarily hide the tooltip
    tooltipStore.set({ content: "", visible: false, x: 0, y: 0 });

    const tooltipX = event.pageX;
    const tooltipY = event.pageY - 12;

    /* This is a debouncer, otherwise the initiating click event will trigger the hiding mechanism of the tooltip */
    setTimeout(() => {
      tooltipStore.set({ content, visible: true, x: tooltipX, y: tooltipY });
    }, 10);
  } catch (error) {
    console.warn(error);
  }
}
