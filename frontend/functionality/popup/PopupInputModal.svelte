<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { popupClose } from "./popup-logic";

  export let value: string;
  export let onSave: (value: string) => void;
  export let isSaveClose: boolean;
  export let id: string;
  export let saveButtonTitle = "Save";

  onMount(() => {
    if (typeof window === undefined) return;
    window.addEventListener("keyup", (event) => {
      if (event.key === "Enter") {
        onClick();
      }
    });
  });

  onDestroy(() => {
    if (typeof window !== undefined) {
      window.removeEventListener("keyup", (event) => {
        if (event.key === "Enter") {
          onClick();
        }
      });
    }
  });

  async function onClick() {
    await onSave(value);
    if (isSaveClose) {
      popupClose(id);
    }
  }
</script>

<input class="input" type="text" bind:value />

<button class="mt-3 variant-filled-primary" on:click={onClick}>
  {saveButtonTitle}</button
>
