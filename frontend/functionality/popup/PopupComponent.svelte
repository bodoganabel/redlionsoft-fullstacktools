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
  export let isEnterAccepts: boolean = true;

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
      e.stopPropagation();
      removePopup();
    }
  };

  const handleClose = (e: MouseEvent) => {
    e.stopPropagation();
    removePopup();
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape" || e.key === "Esc") {
      removePopup();
    } else if (e.key === "Enter" && isEnterAccepts) {
      console.log("default component accepted enter");
      acceptPopup();
      e.preventDefault();
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
  class="popup-overlay fixed inset-0 bg-surface-500/50 flex items-center justify-center z-50"
  on:click|stopPropagation={handleOutsideClick}
>
  <div
    class="popup card max-w-lg w-full mx-auto my-8 flex flex-col"
    style="max-height: calc(100vh - 4rem);"
  >
    <header
      class="card-header flex justify-between items-center p-4 bg-inherit border-b border-surface-500/30"
    >
      <h2 class="h3">{@html title}</h2>
      <button
        class="btn-icon variant-ghost-surface"
        on:click|stopPropagation={handleClose}>✕</button
      >
    </header>

    <div class="flex-1 overflow-y-auto p-4">
      {#if message}
        <p class="mb-4">{@html message}</p>
      {/if}

      {#if component}
        <svelte:component this={component} {...componentProps} />
      {/if}
    </div>

    {#if onClose !== undefined || onAccept !== undefined}
      <footer
        class="card-footer flex justify-end p-4 bg-inherit border-t border-surface-500/30"
      >
        {#if onClose !== undefined}
          <button
            class="btn variant-ghost-surface"
            on:click|stopPropagation={handleClose}>{@html closeMessage}</button
          >
        {/if}
        {#if onAccept !== undefined}
          <button
            class="btn variant-filled-primary ml-2"
            on:click|stopPropagation={acceptPopup}>{@html acceptMessage}</button
          >
        {/if}
      </footer>
    {/if}
  </div>
</div>

<style>
  .popup-overlay {
    backdrop-filter: blur(2px);
  }
</style>
