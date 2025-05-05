<script lang="ts">
  import { Editor } from '@tiptap/core';
  import { toastError, toastSuccess } from '$redlionsoft/frontend/functionality/toast/toast-logic';
  export let editor: Editor;
  let uploadingImage = false;

  // Maximum image size in MB that can be safely embedded
  const MAX_IMAGE_SIZE_MB = 2;

  function handleImageFileChange(e: Event) {
    const input = e.target as HTMLInputElement;
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    
    // Check file size before attempting to read it
    const fileSizeMB = file.size / (1024 * 1024);
    if (fileSizeMB > MAX_IMAGE_SIZE_MB) {
      toastError(`Image is too large (${fileSizeMB.toFixed(1)} MB). Please use an image smaller than ${MAX_IMAGE_SIZE_MB} MB or consider using Google Drive links for large images.`);
      input.value = '';
      return;
    }

    uploadingImage = true;
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      if (base64 && editor) {
        // Check if adding this image might exceed localStorage quota
        try {
          editor.chain().focus().setImage({ src: base64 }).run();
          toastSuccess('Image inserted!');
        } catch (error) {
          // If we get an error here, it's likely due to quota being exceeded
          if (error instanceof DOMException && error.name === 'QuotaExceededError') {
            toastError('Cannot add this image. Email content is too large. Please make the email body shorter or use smaller images.');
          } else {
            toastError('Failed to insert image');
          }
        }
      } else {
        toastError('Failed to read image');
      }
      uploadingImage = false;
      input.value = '';
    };
    reader.onerror = () => {
      toastError('Failed to read image');
      uploadingImage = false;
      input.value = '';
    };
    reader.readAsDataURL(file);
  }
</script>

<div class="mt-2 control-group">
  <div class="button-group space-x-1">
    <button
      on:click={() => editor.chain().focus().toggleBold().run()}
      disabled={!editor.can().chain().focus().toggleBold().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('bold')}
    >
      Bold
    </button>
    <button
      on:click={() => editor.chain().focus().toggleItalic().run()}
      disabled={!editor.can().chain().focus().toggleItalic().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('italic')}
    >
      Italic
    </button>
    <button
      on:click={() => editor.chain().focus().toggleStrike().run()}
      disabled={!editor.can().chain().focus().toggleStrike().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('strike')}
    >
      Strike
    </button>
    <button
      on:click={() => editor.chain().focus().toggleCode().run()}
      disabled={!editor.can().chain().focus().toggleCode().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('code')}
    >
      Code
    </button>
    <button on:click={() => editor.chain().focus().unsetAllMarks().run()}>Clear marks</button>
    <button on:click={() => editor.chain().focus().clearNodes().run()}>Clear nodes</button>
    <button
      on:click={() => editor.chain().focus().setParagraph().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('paragraph')}
    >
      Paragraph
    </button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('heading', { level: 1 })}
    >
      H1
    </button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('heading', { level: 2 })}
    >
      H2
    </button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('heading', { level: 3 })}
    >
      H3
    </button>
    <button
      on:click={() => editor.chain().focus().toggleHeading({ level: 4 }).run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('heading', { level: 4 })}
    >
      H4
    </button>

    <button
      on:click={() => editor.chain().focus().toggleBulletList().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('bulletList')}
    >
      Bullet list
    </button>
    <button
      on:click={() => editor.chain().focus().toggleOrderedList().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('orderedList')}
    >
      Ordered list
    </button>
    <input
      type="file"
      accept="image/*"
      id="image-upload-input"
      style="display: none;"
      on:change={handleImageFileChange}
    />
    <button
      type="button"
      class="p-1 text-sm variant-outline-primary"
      on:click={() => {
        document.getElementById('image-upload-input')?.click();
      }}
      disabled={uploadingImage}
    >
      {uploadingImage ? 'Uploading…' : 'Insert image'}
    </button>
    <button
      on:click={() => editor.chain().focus().toggleCodeBlock().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('codeBlock')}
    >
      Code block
    </button>
    <button
      on:click={() => editor.chain().focus().toggleBlockquote().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('blockquote')}
    >
      Blockquote
    </button>
    <button
      on:click={() => editor.chain().focus().setHorizontalRule().run()}
      class:variant-filled-primary={editor.isActive('horizontalRule')}
    >
      Horizontal rule
    </button>
    <button
      on:click={() => editor.chain().focus().setHardBreak().run()}
      class="p-1 text-sm variant-outline-primary"
      class:variant-filled-primary={editor.isActive('hardBreak')}
    >
      Hard break
    </button>
    <button
      on:click={() => editor.chain().focus().undo().run()}
      disabled={!editor.can().chain().focus().undo().run()}
    >
      Undo
    </button>
    <button
      on:click={() => editor.chain().focus().redo().run()}
      disabled={!editor.can().chain().focus().redo().run()}
    >
      Redo
    </button>
  </div>
</div>
