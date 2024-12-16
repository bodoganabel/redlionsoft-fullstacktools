<script lang="ts">
  import {
    onDestroy,
    onMount,
    type ComponentType,
    type SvelteComponent,
  } from "svelte";
  import { popupClose } from "./popup-logic";
  export let id: string;
  export let title: string;
  export let message: string;
  export let component: ComponentType<SvelteComponent> | undefined = undefined;
  export let componentProps: Record<string, any> = {};
  export let isOutsideClickClose: boolean = true;
  export let onClose: (() => void) | undefined;
  export let onAccept: (() => void) | undefined;
  export let acceptMessage: string = "Ok";
  export let closeMessage: string = "Cancel";

  console.log("componentProps:");
  console.log(componentProps);

  const removePopup = () => {
    onClose !== undefined ? onClose() : null;

    if (onClose !== undefined) {
      onClose();
    }
    popupClose(id);
  };

  const acceptPopup = () => {
    onAccept !== undefined ? onAccept() : null;
    popupClose(id);
  };

  const handleOutsideClick = (e: MouseEvent) => {
    if (
      isOutsideClickClose &&
      (e.target as HTMLElement).classList.contains("popup-overlay")
    ) {
      removePopup();
    }
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Esc") {
      removePopup();
    }
  };

  onMount(() => {
    document.addEventListener("keydown", handleKeyDown);
  });

  onDestroy(() => {
    document.removeEventListener("keydown", handleKeyDown);
  });
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<!-- svelte-ignore a11y-no-static-element-interactions -->
<div
  class="popup-overlay fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
  on:click={handleOutsideClick}
>
  <div
    class="popup bg-surface-200 dark:bg-surface-700 p-6 rounded-md shadow-md max-w-lg w-full"
  >
    <header class="flex justify-between items-center mb-4">
      <h2 class="text-lg font-semibold">{@html title}</h2>
      <button class="text-xl font-bold" on:click={removePopup}>✕</button>
    </header>

    {#if message}
      <p class="mb-4">{@html message}</p>
    {/if}

    {#if component}
      <svelte:component this={component} {...componentProps} />
    {/if}

    {#if onClose !== undefined || onAccept !== undefined}
      <footer class="flex justify-end mt-4 space-x-2">
        {#if onClose !== undefined}
          <button class="btn variant-outline-secondary" on:click={removePopup}
            >{@html closeMessage}</button
          >
        {/if}
        {#if onAccept !== undefined}
          <button class="btn variant-filled-primary" on:click={acceptPopup}
            >{@html acceptMessage}</button
          >
        {/if}
      </footer>
    {/if}
  </div>
</div>

<style>
  .popup-overlay {
    background: rgba(0, 0, 0, 0.5);
  }
  .popup {
    max-width: 500px;
    border-radius: 8px;
    padding: 16px;
  }
</style>
