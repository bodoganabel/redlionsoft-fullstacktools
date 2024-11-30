<script lang="ts">
  import DevConsoleModal from "./DevConsoleModal.svelte";
  import IconCode from "../../icons/IconCode.svelte";
  import { isProduction } from "../../../common/index";
  import type { IQuickloginUser } from "./devconsole.types";
  import { popup } from "../popup/popup-logic";

  export let quickloginUsers: IQuickloginUser[];

  const isDevelopment = !isProduction();
</script>

{#if isDevelopment}
  <div class="fixed bottom-2 left-2 z-50">
    <button
      class="icon variant-outline-warning"
      on:click={() => {
        popup({
          title: "Devconsole",
          component: DevConsoleModal,
          componentProps: { quickloginUsers },
        });
      }}
    >
      <IconCode />
    </button>
  </div>
{/if}
