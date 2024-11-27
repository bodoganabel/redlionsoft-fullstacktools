<script lang="ts">
  import { tooltip } from "../functionality/tooltip/tooltip.store";
  import InfoIcon from "../icons/InfoIcon.svelte";

  export let message: string;
</script>

<button
  on:click={(event) => {
    console.log("asdf");
    tooltip(event, message);
  }}
  class="btn-icon w-4 h-4"
>
  <InfoIcon></InfoIcon>
</button>
