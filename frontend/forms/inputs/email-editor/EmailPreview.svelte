<script lang="ts">
  import { DateTime } from 'luxon';
  import { Avatar } from '@skeletonlabs/skeleton';
  
  export let subject: string;
  export let body: string;
  export let recipient: string;
  export let sender: string = 'you@example.com';
  export let senderName: string = 'You';
  
  // Format current time as Gmail would show it
  const now = DateTime.utc();
  const emailDate = now.toFormat('MMM d, yyyy, h:mm a');
  
  // Extract initials for avatar
  function getInitials(name: string): string {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase();
  }
</script>

<div class="email-preview card p-4 shadow-lg">
  <!-- Email header section -->
  <header class="email-header">
    <div class="flex items-start gap-3">
      <!-- Sender avatar -->
      <div class="flex-none">
        <Avatar width="w-10" initials="{getInitials(senderName)}" background="bg-primary-500" />
      </div>
      <div class="flex-auto">
        <!-- Sender info line -->
        <div class="flex justify-between items-baseline">
          <div>
            <span class="font-semibold">{senderName}</span>
            <span class="text-sm text-surface-500 ml-2">&lt;{sender}&gt;</span>
          </div>
          <div class="text-sm text-surface-500">{emailDate}</div>
        </div>
        
        <!-- Recipient line -->
        <div class="text-sm text-surface-500 mb-2">
          to {recipient}
        </div>
        
        <!-- Subject line -->
        <h3 class="text-xl font-semibold mb-4">{subject}</h3>
      </div>
    </div>
  </header>
  
  <!-- Email body section -->
  <div class="email-body mt-4 pb-6 border-b border-surface-300">
    <div class="prose max-w-none">
      {@html body}
    </div>
  </div>
  
  <!-- Email footer with actions -->
  <footer class="email-footer mt-4 flex gap-2">
    <button class="btn btn-sm variant-soft">Reply</button>
    <button class="btn btn-sm variant-soft">Forward</button>
  </footer>
</div>

<style>
  .email-preview {
    max-width: 800px;
    margin: 0 auto;
    background-color: white;
    border-radius: 8px;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  }
  
  .email-body {
    line-height: 1.5;
    color: #202124;
  }
  
  /* Ensure proper spacing for HTML content */
  :global(.email-body p) {
    margin-bottom: 1em;
  }
  
  :global(.email-body a) {
    color: var(--color-primary-500);
    text-decoration: none;
  }
  
  :global(.email-body a:hover) {
    text-decoration: underline;
  }
</style>
