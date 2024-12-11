<script>
  import IconInfo from "../icons/IconInfo.svelte";

  export let mt = "0";
</script>

<div class="mt-{mt} py-1 px-4 card bg-warning-300">
  <div class="flex justify-stretch items-start space-x-2">
    <div class="mt-[3px] min-w-5 w-5 text-gray-500">
      <IconInfo />
    </div>
    <div class="flex flex-1 w-max text-gray-500">
      <slot />
    </div>
  </div>
</div>
