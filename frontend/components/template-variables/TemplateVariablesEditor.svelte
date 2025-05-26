<script lang="ts">
  import { onMount, createEventDispatcher } from 'svelte';

  /**
   * Component for editing template variables
   * Displays a form with input fields for each variable
   */

  // Props
  export let variables: string[] = [];
  export let values: Record<string, string> = {};
  export let onVariableChange: ((variable: string, value: string) => void) | undefined = undefined;

  // Create event dispatcher
  const dispatch = createEventDispatcher<{
    change: { variable: string; value: string };
  }>();

  // Initialize values when component mounts
  onMount(() => {
    console.log('TemplateVariablesEditor - Initial values:', values);

    // Make sure all variables have a value in the values object
    variables.forEach((variable) => {
      if (values[variable] === undefined) {
        // Update the parent's values object directly
        values[variable] = '';
        
        // Call the callback function if provided
        if (onVariableChange) {
          onVariableChange(variable, '');
        }
        
        // Also dispatch an event
        dispatch('change', { variable, value: '' });
      }
    });
  });

  // Update values when variables change
  $: if (variables.length > 0) {
    variables.forEach((variable) => {
      if (values[variable] === undefined) {
        values[variable] = '';
        
        // Call the callback function if provided
        if (onVariableChange) {
          onVariableChange(variable, '');
        }
        
        // Also dispatch an event
        dispatch('change', { variable, value: '' });
      }
    });
  }

  /**
   * Handle input change for a variable
   */
  function handleInputChange(variable: string, value: string) {
    console.log('Input changed:', variable, value);

    // Call the callback function if provided
    if (onVariableChange) {
      onVariableChange(variable, value);
    }
    
    // Also dispatch an event
    dispatch('change', { variable, value });
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
            bind:value={values[variable]}
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
