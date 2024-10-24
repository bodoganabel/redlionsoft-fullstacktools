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
    <div class="popup-root">
        {#each popups as popup (popup.id)}
            <PopupComponent
                id={popup.id}
                title={popup.title || ""}
                message={popup.message || ""}
                component={popup.component}
                componentProps={popup.componentProps}
                isOutsideClickClose={popup.isOutsideClickClose}
                onClose={popup.onClose}
                onAccept={popup.onAccept}
                acceptText={popup.acceptText}
                closeText={popup.closeText}
            />
        {/each}
    </div>
{/if}

<style>
    .popup-root {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        align-items: center;
    }
</style>
