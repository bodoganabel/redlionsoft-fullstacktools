<script lang="ts">
  import type { TQuickActions } from '../devconsole.types';

  export let quickActions: TQuickActions[];
  let quickActionInputs: Record<string, string> = {};
</script>

{#each quickActions as action}
  <div class="flex gap-1 items-center">
    <button class="variant-outline-primary w-min" on:click={() => {
      const input = action.inputLabel !== undefined ? quickActionInputs[action.inputLabel] : undefined; 
      action.action(input || "")
      }}
      >{action.label}</button
    >
    <label for={action.label} class="text-xs">{action.label}</label>
    {#if action.inputLabel}
      <input
      class="input input-small small input-sm"
        type="text"
        placeholder={action.inputLabel}
        bind:value={quickActionInputs[action.inputLabel]}
        on:change={(event) =>
          {quickActionInputs = {
            ...quickActionInputs,

            //@ts-ignore
            [action.inputLabel]: event.target.value,
          }
          console.log(quickActionInputs);
          }}
      />
    {/if}
  </div>
{/each}
