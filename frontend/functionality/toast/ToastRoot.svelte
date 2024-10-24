<script lang="ts">
    import { removeToast, toastStore, type IToast } from "./toast-logic";
    import ToastComponent from "./ToastComponent.svelte";

    export let maxVisible = 3;

    let toasts: IToast[] = [];

    toastStore.subscribe(($toasts: IToast[]) => {
        toasts = $toasts.slice(-maxVisible);
    });
</script>

<div class="toast-root">
    {#each toasts as toast (toast.id)}
        <div class={`toast-component ${toasts.length > 1 ? "slide-up" : ""}`}>
            <ToastComponent
                message={toast.message}
                type={toast.type}
                id={toast.id}
            />
        </div>
    {/each}
</div>

<style>
    .toast-root {
        position: fixed;
        z-index: 100;
        bottom: 16px;
        left: 50%;
        transform: translateX(-50%);
        display: flex;
        flex-direction: column;
        align-items: center;
    }

    .toast-root .toast-component {
        margin-bottom: 8px;
        transition: margin-bottom 0.3s ease-in-out;
    }

    .toast-root .toast-component:not(:last-child) {
        margin-bottom: 0;
    }

    .toast-root .toast-component.slide-up {
        margin-bottom: 8px;
    }
</style>
