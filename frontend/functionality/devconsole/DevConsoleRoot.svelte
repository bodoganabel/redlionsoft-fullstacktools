<script lang="ts">
  import DevConsoleModal from "./DevConsoleModal.svelte";
  import IconCode from "../../icons/IconCode.svelte";
  import { isProduction } from "../../../common/index";
  import type { IQuickloginUser } from "./devconsole.types";
  import { popup } from "../popup/popup-logic";
  import { onDestroy, onMount } from "svelte";

  export let quickloginUsers: IQuickloginUser[];

  const isDevelopment = !isProduction();

  const cmdDListener = (event: any) => {
    const isWindows = navigator.platform.indexOf("Win") !== -1;
    const isCorrectKey = event.key === "d";
    const isCorrectModifier = isWindows ? event.altKey : event.metaKey;
    if (isCorrectKey && isCorrectModifier) {
      event.preventDefault();
      toggleDevtools();
    }
  };

  onMount(() => {
    if (typeof window !== "undefined") {
      document.addEventListener("keydown", cmdDListener);
    }
  });

  onDestroy(() => {
    if (typeof window !== "undefined") {
      document.removeEventListener("keydown", cmdDListener);
    }
  });

  function toggleDevtools() {
    popup({
      title: "Devconsole",
      component: DevConsoleModal,
      componentProps: { quickloginUsers },
    });
  }
</script>

{#if isDevelopment}
  <div class="fixed bottom-2 left-2 z-50">
    <button
      class="icon variant-outline-warning"
      on:click={() => toggleDevtools()}
    >
      <IconCode />
    </button>
  </div>
{/if}
