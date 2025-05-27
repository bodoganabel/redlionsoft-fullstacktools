<script lang="ts">
  import { emailEditorStore } from '../email-editor.store';
</script>

{#if $emailEditorStore.bodyTooLarge}
  <div
    class="bg-error-100 border border-error-400 text-error-700 px-4 py-3 rounded mt-2"
    role="alert"
  >
    <p>
      Email body size: {$emailEditorStore.emailBodySizeMB.toFixed(2)} MB (exceeds 20 MB limit)
    </p>
    <p>
      Please reduce the email body size by using fewer images or smaller images, or by using Google
      Drive links.
    </p>
  </div>
{/if}
