<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  
  /**
   * Component for editing template variables
   * Displays a form with input fields for each variable
   */
  
  // Props
  export let variables: string[] = [];
  export let values: Record<string, string> = {};
  
  // Event dispatcher for input changes
  const dispatch = createEventDispatcher<{
    change: { variable: string; value: string; allValues: Record<string, string> };
  }>();
  
  /**
   * Handle input change for a variable
   */
  function handleInputChange(variable: string, value: string) {
    // Create a new values object to maintain reactivity
    const newValues = { ...values, [variable]: value };
    
    // Dispatch the change event with the updated values
    dispatch('change', {
      variable,
      value,
      allValues: newValues
    });
  }
</script>

{#if variables.length > 0}
  <div class="template-variables-editor">
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      {#each variables as variable}
        <div class="flex flex-col">
          <label class="text-sm font-medium mb-1" for={`var-${variable}`}>{variable}</label>
          <input
            id={`var-${variable}`}
            class="input"
            type="text"
            value={values[variable] || ''}
            on:input={(e) => handleInputChange(variable, e.currentTarget.value)}
          />
        </div>
      {/each}
    </div>
  </div>
{:else}
  <div class="text-sm text-gray-500 italic">No template variables found</div>
{/if}

<style>
  .template-variables-editor {
    width: 100%;
  }
</style>
