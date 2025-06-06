<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { type Writable } from 'svelte/store';
  import { popup } from '../../../../functionality/popup/popup-logic';
  import { emailEditorStore } from '../store/email-editor.store';

  export let editor: Editor;
  export let htmlTextarea: HTMLTextAreaElement;
</script>

<div class="flex justify-between items-center mt-2">
  <h2 class="text-left">Email Body</h2>
  <div class="flex gap-2">
    <button
      class="btn btn-sm {!$emailEditorStore.isHtmlMode
        ? 'variant-filled-primary'
        : 'variant-outline-primary'}"
      on:click={() => {
        if ($emailEditorStore.isHtmlMode) {
          popup({
            title: 'Are you sure?',
            message: 'Switching to Simple mode may break html structure',
            onAccept: () => {
              // When switching to Simple mode, update editor with current HTML from textarea
              if (editor && htmlTextarea) {
                editor.commands.setContent(htmlTextarea.value);
              }
              emailEditorStore.updateIsHtmlMode(false);
            },
            onClose: () => {},
          });
        }
      }}
    >
      Simple Mode
    </button>
    <button
      class="btn btn-sm {$emailEditorStore.isHtmlMode
        ? 'variant-filled-primary'
        : 'variant-outline-primary'}"
      on:click={() => {
        if (!$emailEditorStore.isHtmlMode && editor !== undefined) {
          // When switching to HTML mode, update textarea with current HTML
          htmlTextarea.value = editor.getHTML();
        }
        emailEditorStore.updateIsHtmlMode(true);
      }}
    >
      HTML Mode
    </button>
    <button
      class="btn btn-sm variant-outline-primary"
      on:click={() => {
        if (typeof window === 'undefined') return;
        const popup = window.open('about:blank', 'Event Embed', 'width=400,height=200');
        if (popup) {
          popup.document.write($emailEditorStore.htmlBody);
          popup.document.close();
        }
      }}
    >
      Preview
    </button>
  </div>
</div>
