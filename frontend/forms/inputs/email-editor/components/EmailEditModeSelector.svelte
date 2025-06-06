<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { popup } from '../../../../functionality/popup/popup-logic';
  import { emailEditorStore } from '../store/email-editor.store';
  import { onDestroy, onMount } from 'svelte';
  import { applyTemplateVariables } from '../../../../utils/template-variables';
  import IconEye from '../../../../icons/IconEye.svelte';
  import {
    toastError,
    toastNormal,
    toastSuccess,
    toastWarning,
  } from '../../../../functionality/toast/toast-logic';

  export let editor: Editor;
  export let htmlTextarea: HTMLTextAreaElement;
  /* You can modify the preview content if you want to */
  export let onPreviewContentUpdateTransformer: (currentValue: string) => string = (
    currentValue: string
  ) => currentValue;

  let popupWindow: Window | null = null;
  let unsubscribe: () => void;
  let updateTimeout: ReturnType<typeof setTimeout> | null = null;
  let fileInput: HTMLInputElement;

  // Function to handle file selection
  function handleFileSelection(event: Event) {
    const target = event.target as HTMLInputElement;
    const file = target.files?.[0];

    if (!file) return;

    // Check if the file is an HTML file
    if (!file.name.toLowerCase().endsWith('.html') && !file.name.toLowerCase().endsWith('.htm')) {
      toastWarning('Please select an HTML file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        emailEditorStore.updateHtmlBody(content);
        // Update the HTML content in the editor
        if (!$emailEditorStore.isHtmlMode) {
          // In Simple mode, update the editor directly by force
          editor.commands.setContent(content);
        }
        toastSuccess('HTML content loaded successfully');
      }
    };

    reader.onerror = () => {
      toastError('Error reading file');
    };

    reader.readAsText(file);

    // Reset the file input to allow selecting the same file again
    target.value = '';
  }

  // Debounced function to update the popup window content
  function debouncedUpdatePreviewContent(content: string) {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }

    updateTimeout = setTimeout(() => {
      if (popupWindow) {
        popupWindow.document.open();

        const templateVariablesAppliedHtml = applyTemplateVariables(
          content,
          $emailEditorStore.templateVariableValues
        );

        popupWindow.document.write(onPreviewContentUpdateTransformer(templateVariablesAppliedHtml));
        popupWindow.document.close();
      }
    }, 500); // 500ms debounce delay
  }

  onMount(() => {
    unsubscribe = emailEditorStore.subscribe((state) => {
      if (popupWindow) {
        debouncedUpdatePreviewContent(state.htmlBody);
      }
    });
  });

  onDestroy(() => {
    if (updateTimeout) {
      clearTimeout(updateTimeout);
    }
    unsubscribe();
    if (popupWindow) {
      popupWindow.close();
    }
  });
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
              if (editor && $emailEditorStore.isHtmlMode) {
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
      class="p-1 icon-btn btn-sm variant-outline-primary"
      on:click={() => {
        fileInput.click();
      }}
    >
      Upload Html
    </button>
    <button
      class="p-1 size-6 icon-btn btn-sm variant-outline-primary"
      on:click={() => {
        if (typeof window === 'undefined') return;
        const popup = window.open('about:blank', 'Event Embed', 'width=400,height=200');
        if (popup) {
          popupWindow = popup;
          debouncedUpdatePreviewContent($emailEditorStore.htmlBody);
        }
      }}
    >
      <IconEye />
    </button>
  </div>
</div>

<!-- Hidden file input for HTML file selection -->
<input
  bind:this={fileInput}
  type="file"
  accept=".html,.htm"
  on:change={handleFileSelection}
  class="hidden"
/>
