<!-- TipTap editor integration:  
https://tiptap.dev/
https://tiptap.dev/docs/editor/getting-started/install/svelte
 -->

<script lang="ts">
  import './EmailEditor.css';
  import { onMount, onDestroy } from 'svelte';
  import { writable } from 'svelte/store';
  import { Editor, type EditorEvents } from '@tiptap/core';
  import StarterKit from '@tiptap/starter-kit';
  import { Color } from '@tiptap/extension-color';
  import ListItem from '@tiptap/extension-list-item';
  import TextStyle from '@tiptap/extension-text-style';
  import Image from '@tiptap/extension-image';
  import { type TEmailTemplate } from './email-template.types';
  import EmailToolbar from './components/EmailToolbar.svelte';
  import EmailAttachments from './components/EmailAttachments.svelte';
  import { emailEditorStore } from './email-editor.store';
  import { UCrudResourceClient } from '../../../user-crud/user-crud.client';
  import TemplateVariablesEditor from '../../../components/template-variables/TemplateVariablesEditor.svelte';
  import EmailErrorBodyTooLarge from './components/EmailErrorBodyTooLarge.svelte';
  import EmailEditModeSelector from './components/EmailEditModeSelector.svelte';
  import EmailSubjectSection from './components/EmailSubjectSection.svelte';
  // No need to import debouncedSaveDraft - use it directly from emailEditorStore

  export let emailTemplateUCrudClient: UCrudResourceClient<TEmailTemplate>;

  let element: HTMLElement;
  let editor: Editor;
  // HTML mode toggle
  let htmlTextarea: HTMLTextAreaElement;

  function onHtmlModeChange(isHtmlMode: boolean) {
    if (isHtmlMode) {
      htmlTextarea.value = $emailEditorStore.htmlBody;
    } else {
      editor?.commands.setContent($emailEditorStore.htmlBody);
    }
  }

  onMount(() => {
    emailEditorStore.setOnHtmlModeChange(onHtmlModeChange);

    // Initialize the editor
    editor = new Editor({
      element,
      extensions: [
        Color.configure({ types: [TextStyle.name, ListItem.name] }),
        TextStyle,
        StarterKit,
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
      ],
      content: ``,
      onTransaction: (props: EditorEvents['transaction']) => {
        // PATCH: force re-render so `editor.isActive` works as expected
        editor = editor;
      },
      onContentError(contentError) {
        console.log(contentError);
      },
      onUpdate({ editor }) {
        const htmlBody = editor.getHTML();
        // Only update HTML body if it actually changed
        if (htmlBody !== $emailEditorStore.htmlBody) {
          emailEditorStore.updateHtmlBody(htmlBody);
          emailEditorStore.saveDraft();
          emailEditorStore.debouncedDetectVariables();

          // If we're in HTML mode, update the textarea
          if ($emailEditorStore.isHtmlMode && htmlTextarea) {
            htmlTextarea.value = htmlBody;
          }
        }
      },
      onCreate: () => {
        // Use the store's loadDraft function directly
        emailEditorStore.loadDraft();

        htmlTextarea.value = $emailEditorStore.htmlBody;
        editor.commands.setContent($emailEditorStore.htmlBody);
        emailEditorStore.detectTemplateVariables();
      },
    });
  });

  onDestroy(() => {
    if (editor) {
      editor.destroy();
    }
  });
</script>

<div class="email-editor">
  <div class="flex justify-between items-center"></div>

  {#if editor}
    <EmailSubjectSection
      bind:editor
      bind:emailTemplateUCrudClient
      htmlTextareaContent={htmlTextarea.value}
    />

    <EmailAttachments />

    <EmailToolbar bind:editor />
  {/if}
  <hr />
  <EmailEditModeSelector bind:editor bind:htmlTextarea />

  <textarea
    bind:this={htmlTextarea}
    class="textarea mt-2 bg-surface-50 font-mono text-sm"
    style="min-height: 300px; width: 100%;"
    class:hidden={!$emailEditorStore.isHtmlMode}
    on:input={(e) => {
      // Update the store when HTML is edited directly
      if ($emailEditorStore.isHtmlMode) {
        emailEditorStore.updateHtmlBody(e.currentTarget.value);
        emailEditorStore.debouncedDetectVariables();
      }
    }}
  />
  <div
    class="textarea mt-2 bg-surface-50"
    bind:this={element}
    class:hidden={$emailEditorStore.isHtmlMode}
  />

  <EmailErrorBodyTooLarge />
  <TemplateVariablesEditor />
</div>
