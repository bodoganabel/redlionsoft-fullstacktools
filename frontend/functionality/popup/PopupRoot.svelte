<script lang="ts">
  import { popupStore, type IPopup } from "./popup-logic";
  import PopupComponent from "./PopupComponent.svelte";

  let popups: IPopup[] = [];

  popupStore.subscribe(($popups) => {
    popups = $popups.slice(-1); // Only show the most recent popup
  });
</script>

{#if popups.length > 0}
  <!-- content here -->
  <div
    class="popup-root fixed top-0 left-0 right-0 bottom-0 z-20 flex justify-center items-center"
  >
    {#each popups as popup (popup.id)}
      <PopupComponent
        id={popup.id || "default-popup"}
        title={popup.title || ""}
        message={popup.message || ""}
        component={popup.component}
        componentProps={popup.componentProps}
        isOutsideClickClose={popup.isOutsideClickClose}
        onClose={popup.onClose}
        onAccept={popup.onAccept}
        acceptMessage={popup.acceptMessage}
        closeMessage={popup.closeMessage}
        isEnterAccepts={popup.isEnterAccept}
      />
    {/each}
  </div>
{/if}
