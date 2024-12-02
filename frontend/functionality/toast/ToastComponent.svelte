<script lang="ts">
  import { EToastTypes, removeToast } from "./toast-logic";

  /* Add this component to te +Layout.svelte */
  export let message;
  export let type: EToastTypes;
  export let id: string;

  let variant: string;
  switch (type) {
    case EToastTypes.SUCCESS:
      variant = "variant-filled-success";
      break;
    case EToastTypes.NORMAL:
      variant = "variant-filled-secondary";
      break;
    case EToastTypes.WARNING:
      variant = "variant-filled-warning";
      break;
    case EToastTypes.ERROR:
      variant = "variant-filled-error";
      break;

    default:
      variant = "variant-filled-secondary";
      break;
  }
</script>

<div class="flex justify-center items-center">
  <div
    class="toast flex justify-between items-center pointer-events-auto max-w-[640px] px-3 py-1 space-x-4 rounded-container-token shadow-lg {variant}"
  >
    <div class="text-base">{@html message}</div>
    <div class="toast-actions flex items-center space-x-2">
      <button
        on:click={() => {
          removeToast(id);
        }}
        class="btn-icon btn-icon-sm variant-filled w-6"
        aria-label="Dismiss toast">✕</button
      >
    </div>
  </div>
</div>
