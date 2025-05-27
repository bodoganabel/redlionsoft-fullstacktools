<script lang="ts">
  import { emailEditorStore } from '../email-editor.store';
  import { get } from 'svelte/store';

  function handleFileInput(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files) return;
    emailEditorStore.updateAttachedFiles(Array.from(input.files));
    input.value = '';
  }

  function handleRemoveFile(index: number) {
    const files = get(emailEditorStore).attachedFiles;
    const updatedFiles = files.slice(0, index).concat(files.slice(index + 1));
    emailEditorStore.updateAttachedFiles(updatedFiles);
  }
</script>

<!-- File Upload UI -->
<div class="mt-3 flex flex-col items-start">
  {#if $emailEditorStore.fileSizeLimitExceeded}
    <div
      class="bg-error-100 border border-error-400 text-error-700 px-4 py-3 rounded mb-2"
      role="alert"
    >
      <p class="font-semibold">Total attachment size exceeds 25 MB.</p>
      <p>Please upload your files to Google Drive and insert the sharing links instead.</p>
    </div>
  {/if}
  {#if $emailEditorStore.attachedFiles.length}
    <strong>Attached files:</strong>
    <ul class="ml-2">
      {#each $emailEditorStore.attachedFiles as file, i}
        <li class="flex items-center space-x-1">
          <small>{file.name.length > 20 ? `${file.name.slice(0, 20)}...` : file.name} ({Math.round(file.size/1024)} KB)</small>
          <button
            type="button"
            class="p-1 btn btn-xs btn-error ml-1"
            on:click={() => handleRemoveFile(i)}
            title="Remove">✕</button>
        </li>
      {/each}
    </ul>
    <div class="text-xs text-gray-600 mt-1">Total size: {$emailEditorStore.totalFileSizeMB.toFixed(2)} MB</div>
  {/if}
  <input id="attach-file" type="file" multiple on:change={handleFileInput} class="hidden" />
  <label for="attach-file" class="btn btn-sm variant-filled-primary cursor-pointer mt-2">
    Attach files
  </label>
</div>
