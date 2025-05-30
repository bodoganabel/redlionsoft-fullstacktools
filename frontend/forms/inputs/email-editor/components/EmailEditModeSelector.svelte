<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { type Writable } from 'svelte/store';
  import { popup } from '../../../../functionality/popup/popup-logic';

  export let isHtmlMode: Writable<boolean>;
  export let editor: Editor;
  export let htmlTextarea: HTMLTextAreaElement;
</script>

<div class="flex justify-between items-center mt-2">
  <h2 class="text-left">Email Body</h2>
  <div class="flex gap-2">
    <button
      class="btn btn-sm {!$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
      on:click={() => {
        if (!$isHtmlMode) {
          popup({
            title: 'Are you sure?',
            message: 'Switching to Simple mode may break html structure',
            onAccept: () => {
              isHtmlMode.set(false);
            },
            onClose: () => {},
          });
        }
      }}
    >
      Simple Mode
    </button>
    <button
      class="btn btn-sm {$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
      on:click={() => {
        if (!$isHtmlMode && editor !== undefined) {
          // When switching to HTML mode, update textarea with current HTML
          htmlTextarea.value = editor.getHTML();
        }
        isHtmlMode.set(true);
      }}
    >
      HTML Mode
    </button>
  </div>
</div>
