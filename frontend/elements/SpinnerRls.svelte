<script lang="ts">
  import { ProgressRadial } from "@skeletonlabs/skeleton";
  export let size = "w-full";
  export let stroke = 10;
  export let meter = "stroke-primary-500";
  export let track = "stroke-primary-500/30";
</script>

<ProgressRadial {stroke} {meter} {track} width={size} />
