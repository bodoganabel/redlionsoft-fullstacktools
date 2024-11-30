<script lang="ts">
  import { tooltip } from "../functionality/tooltip/tooltip.store";
  import IconInfo from "../icons/IconInfo.svelte";

  export let message: string;
</script>

<button
  on:click={(event) => {
    console.log("asdf");
    tooltip(event, message);
  }}
  class="btn-icon w-4 h-4"
>
  <IconInfo></IconInfo>
</button>
