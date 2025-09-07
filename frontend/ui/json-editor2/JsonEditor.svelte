<script lang="ts">
  import { devOnly } from './../../../common/utilities/general';
  import { onMount } from 'svelte';
  import { AsyncFunctionQueue } from './../../../common/utilities/data-structures/function-queue';
  import { logFocusedValidationErrors } from './../../../common/utilities/validation-error-formatter';
  import { LocalStorage } from '../../utils/local-storage';
  import { ZodObject } from 'zod/v4';
  import IconTickCircle from '../../icons/IconTickCircle.svelte';

  let textareaElement: HTMLTextAreaElement;
  export let value: string;
  let errors = '';
  export let schema: ZodObject;
  // Used to identify local storage save props
  export let jsonEditorId: string;
  export let textareaRows: number = 10;
  export let onSave: ((value: string) => void | Promise<void>) | undefined = undefined;
  export let onCancel: ((value: string) => void | Promise<void>) | undefined = undefined;
  export let onInput: ((value: string) => void | Promise<void>) | undefined = undefined;

  const editorQueue = new AsyncFunctionQueue();

  //Arrangement of JSON editor at this page
  let isLeftRight = false;
  const isLeftRightLocalKey = 'isLeftRight' + jsonEditorId;

  devOnly(() => {
    console.log(`Simple JSON editor - no Monaco dependencies`);
  });

  function handleInput(event: Event) {
    const target = event.target as HTMLTextAreaElement;
    value = target.value;

    onInput?.(value);

    try {
      const parsed = JSON.parse(value);
      console.log('✅ JSON parsed successfully:', parsed);

      const validated = schema.safeParse(parsed);
      if (validated.success) {
        errors = '';
      } else {
        errors = logFocusedValidationErrors({
          zodError: validated.error,
          originalInput: parsed,
          origin: '',
        });
      }
    } catch (error: any) {
      console.log('❌ JSON parse failed:', error.message);
      console.log('📝 Input that failed to parse:', value);
      errors = 'Parse error: ' + error.message;
    }
  }

  function saveTextareaHeight() {
    if (textareaElement) {
      const height = textareaElement.style.height;
      if (height) {
        LocalStorage.set(jsonEditorId + '_height', height);
      }
    }
  }

  onMount(() => {
    if (textareaElement) {
      textareaElement.value = value;

      // Restore saved height
      const savedHeight = LocalStorage.get(jsonEditorId + '_height', '');
      if (savedHeight) {
        textareaElement.style.height = savedHeight;
      }
    }
    isLeftRight = LocalStorage.get(isLeftRightLocalKey, 'false') === 'true';
    handleInput({
      target: textareaElement,
    } as any);

    textareaRows = parseInt(LocalStorage.get(jsonEditorId, '10')) || 10;
  });
</script>

<div class="p-4 card overflow-y-auto h-full w-full">
  <div class="flex justify-between gap-2">
    <div>
      {#if onSave}
        <!-- content here -->
        <button
          disabled={errors !== ""}
          class="btn variant-filled-primary"
          on:click={() => {
            onSave(value);
          }}
        >
          Save
        </button>
      {/if}
      {#if onCancel}
        <!-- content here -->
        <button
          class="btn variant-filled-primary"
          on:click={() => {
            onCancel(value);
          }}
        >
          Cancel
        </button>
      {/if}
      <button
        class="btn variant-filled-primary"
        on:click={() => {
          try {
            value = JSON.stringify(JSON.parse(value), null, 2);
          } catch (error) {
            /* @ts-ignore */
            errors = error.message;
          }
        }}
      >
        Format
      </button>
    </div>
    <div class="">
      <button
        class="btn btn-sm variant-outline-secondary"
        on:click={() => {
          LocalStorage.set(isLeftRightLocalKey, 'true');
          isLeftRight = true;
        }}
      >
        Left/Right
      </button>
      <button
        class="btn btn-sm variant-outline-secondary"
        on:click={() => {
          LocalStorage.set(isLeftRightLocalKey, 'false');
          isLeftRight = false;
        }}
      >
        Top/Bottom
      </button>
    </div>
  </div>
  <div
    class="flex gap-2"
    class:justify-center={isLeftRight}
    class:justify-start={isLeftRight}
    class:flex-col={!isLeftRight}
    class:flex-row={isLeftRight}
  >
    <textarea
      bind:this={textareaElement}
      bind:value
      on:input={handleInput}
      on:mouseup={saveTextareaHeight}
      rows={textareaRows}
      class="mt-3 w-full h-full font-mono text-sm p-4 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-y"
      placeholder="Enter JSON here..."
      spellcheck="false"
    ></textarea>

    {#if errors}
      <pre
        class="w-full bg-red-50 border border-red-200 rounded p-4 mt-4 text-sm font-mono whitespace-pre-wrap">{errors}</pre>
    {:else}
      <pre
        class="w-full bg-green-50 border border-green-200 rounded p-4 mt-4 text-sm font-mono whitespace-pre-wrap flex justify-center"><div
          class="flex items-center gap-2 text-success-500">All good <div
            class="size-6"><IconTickCircle /></div></div></pre>
    {/if}
  </div>
</div>
