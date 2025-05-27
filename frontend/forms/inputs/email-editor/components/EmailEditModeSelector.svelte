<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { Writable } from 'svelte/store';

  export let isHtmlMode: Writable<boolean>;
  export let editor: Editor;
  export let htmlTextarea: HTMLTextAreaElement;
</script>

<div class="flex justify-between items-center mt-2">
  <h2 class="text-left">Email Body</h2>
  <div class="flex gap-2">
    <button
      class="btn btn-sm {!$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
      on:click={() => isHtmlMode.set(false)}
    >
      Simple Mode
    </button>
    <button
      class="btn btn-sm {$isHtmlMode ? 'variant-filled-primary' : 'variant-outline-primary'}"
      on:click={() => {
        console.log('btch');
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
