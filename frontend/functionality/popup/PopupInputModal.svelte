<script lang="ts">
  import { onDestroy, onMount } from "svelte";
  import { popupClose } from "./popup-logic";
  import SpinnerRls from "../../elements/SpinnerRls.svelte";

  export let value: string;
  export let onSave: (value: string) => void;
  export let isSaveClose: boolean;
  export let id: string;
  export let saveButtonTitle = "Save";
  export let isFetching = false;
  export let isTextarea = false;

  let inputElement: HTMLInputElement;
  let textareaElement: HTMLTextAreaElement;
  let textareaRef: HTMLTextAreaElement;

  onMount(() => {
    if (typeof window === undefined) return;

    window.addEventListener("keyup", (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
        onClick();
        return;
      }

      if (!isTextarea && event.key === "Enter") {
        onClick();
        return;
      }
    });

    // Focus input and move cursor to end
    if (inputElement) {
      inputElement.focus();
      inputElement.setSelectionRange(value.length, value.length);
    }

    if (textareaElement) {
      textareaElement.focus();
      textareaElement.setSelectionRange(value.length, value.length);
    }

    // Add textarea-specific keyboard handler
    if (textareaElement) {
      textareaElement.addEventListener(
        "keydown",
        (event: {
          metaKey: any;
          ctrlKey: any;
          key: string;
          preventDefault: () => void;
        }) => {
          if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
            event.preventDefault();
            onClick();
          }
        }
      );
    }
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
    isFetching = true;
    await onSave(value);
    isFetching = false;
    if (isSaveClose) {
      popupClose(id);
    }
  }
</script>

{#if isTextarea}
  <textarea bind:this={textareaElement} class="input" bind:value />
{:else}
  <input bind:this={inputElement} class="input" type="text" bind:value />
{/if}

{#if isFetching}
  <div class="mt-4 ml-4 mb-2 w-8 h-8">
    <SpinnerRls stroke={40}></SpinnerRls>
  </div>
{:else}
  <!-- else content here -->
  <button class="mt-3 variant-filled-primary" on:click={onClick}>
    {saveButtonTitle}</button
  >
{/if}
