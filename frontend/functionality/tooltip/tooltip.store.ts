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
  console.log("listen");
  console.log("content:");
  console.log(content);
  if (typeof window === "undefined") return;
  if (typeof document === "undefined") return;
  try {
    // Temporarily hide the tooltip
    tooltipStore.set({ content: "", visible: false, x: 0, y: 0 });

    const rect = (event?.target as any).getBoundingClientRect();
    const tooltipX = event.pageX;
    const tooltipY = event.pageY - 12;

    setTimeout(() => {
      console.log(rect);
      tooltipStore.set({ content, visible: true, x: tooltipX, y: tooltipY });
    }, 10);

    console.log("set");
    console.log(get(tooltipStore));
  } catch (error) {
    console.warn(error);
  }
}
