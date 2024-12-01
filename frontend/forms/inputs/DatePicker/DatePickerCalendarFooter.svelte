<script lang="ts">
  export let onSetToToday: () => void;
  export let onSetToTomorrow: () => void;
  export let onReset: () => void;
</script>

<div class="flex justify-between mt-3">
  <button
    class="px-3 py-1 border border-primary text-primary rounded"
    on:click={onReset}
  >
    Reset
  </button>
  <button class="px-3 py-1 bg-gray-200 rounded" on:click={onSetToToday}>
    Today
  </button>
  <button
    class="px-3 py-1 bg-blue-500 text-white rounded"
    on:click={onSetToTomorrow}
  >
    Tomorrow
  </button>
</div>
