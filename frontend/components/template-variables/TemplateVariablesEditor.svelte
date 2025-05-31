<script lang="ts">
  import { onMount } from 'svelte';
  import { emailEditorStore } from '../../forms/inputs/email-editor/email-editor.store';

  /**
   * Component for editing template variables
   * Displays a form with input fields for each variable
   */

  // Props
  export let onVariableChange = (variable: string, value: string) => {
    // Update the variable value in the store
    emailEditorStore.updateTemplateVariableValue(variable, value || '');

    // Save draft with updated variables
    emailEditorStore.debouncedSaveDraft(
      $emailEditorStore.subject,
      $emailEditorStore.htmlBody,
      $emailEditorStore.templateVariableValues
    );
  };

  // Initialize values when component mounts
  onMount(() => {
    // Make sure all variables have a value in the store
    $emailEditorStore.templateVariables.forEach((variable) => {
      if ($emailEditorStore.templateVariableValues[variable] === undefined) {
        // Update the store
        onVariableChange(variable, '');
      }
    });
  });

  // Update values when variables change
  $: if ($emailEditorStore.templateVariables.length > 0) {
    $emailEditorStore.templateVariables.forEach((variable) => {
      if ($emailEditorStore.templateVariableValues[variable] === undefined) {
        onVariableChange(variable, '');
      }
    });
  }

  /**
   * Handle input change for a variable
   */
  function handleInputChange(variable: string, value: string) {
    onVariableChange(variable, value);
  }
</script>

<!-- Template Variables Section -->
{#if $emailEditorStore.templateVariables && $emailEditorStore.templateVariables.length > 0}
  <div class="mt-6 p-4 border border-surface-300 rounded-lg">
    <h3 class="text-lg font-semibold mb-3">Template Variables</h3>
    <p class="text-sm mb-4">
      These variables were found in your email template. Enter values to replace them in the email.
    </p>
    {#if $emailEditorStore.templateVariables.length > 0}
      <div class="template-variables-editor">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          {#each $emailEditorStore.templateVariables as variable}
            <div class="flex flex-col">
              <label class="text-sm font-medium mb-1" for={`var-${variable}`}>{variable}</label>
              <input
                id={`var-${variable}`}
                class="input"
                type="text"
                bind:value={$emailEditorStore.templateVariableValues[variable]}
                on:input={(e) => handleInputChange(variable, e.currentTarget.value)}
              />
            </div>
          {/each}
        </div>
      </div>
    {:else}
      <div class="text-sm text-gray-500 italic">No template variables found</div>
    {/if}
  </div>
{/if}

<style>
  .template-variables-editor {
    width: 100%;
  }
</style>
