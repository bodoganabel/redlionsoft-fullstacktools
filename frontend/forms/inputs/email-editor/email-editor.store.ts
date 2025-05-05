import { writable } from 'svelte/store';

export interface EmailEditorState {
  recipient: string;
  subject: string;
  htmlBody: string;
  attachedFiles: File[];
  isSending: boolean;
  recipientError: string | null;
  subjectError: string | null;
  bodyError: string | null;
  fileSizeLimitExceeded: boolean;
  totalFileSizeMB: number;
  bodyTooLarge: boolean;
  emailBodySizeMB: number;
  sizeLimitExceeded: boolean;
}

const MAX_ATTACHMENT_SIZE_MB = 25;
const MAX_EMAIL_BODY_SIZE_MB = 20;

function createEmailEditorStore() {
  const initialState: EmailEditorState = {
    recipient: '',
    subject: '',
    htmlBody: '',
    attachedFiles: [],
    isSending: false,
    recipientError: null,
    subjectError: null,
    bodyError: null,
    fileSizeLimitExceeded: false,
    totalFileSizeMB: 0,
    bodyTooLarge: false,
    emailBodySizeMB: 0,
    sizeLimitExceeded: false,
  };

  const { subscribe, update, set } = writable<EmailEditorState>({ ...initialState });

  function calculateFileSize(files: File[]): { totalFileSizeMB: number; fileSizeLimitExceeded: boolean } {
    const totalFileSizeMB = files.reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);
    return {
      totalFileSizeMB,
      fileSizeLimitExceeded: totalFileSizeMB > MAX_ATTACHMENT_SIZE_MB,
    };
  }

  function calculateBodySize(htmlBody: string): { emailBodySizeMB: number; bodyTooLarge: boolean } {
    const emailBodySizeMB = new Blob([htmlBody]).size / (1024 * 1024);
    return {
      emailBodySizeMB,
      bodyTooLarge: emailBodySizeMB > MAX_EMAIL_BODY_SIZE_MB,
    };
  }

  function updateRecipient(recipient: string) {
    update((state) => ({ ...state, recipient, recipientError: null }));
  }

  function updateSubject(subject: string) {
    update((state) => ({ ...state, subject, subjectError: null }));
  }

  function updateHtmlBody(htmlBody: string) {
    const { emailBodySizeMB, bodyTooLarge } = calculateBodySize(htmlBody);
    update((state) => ({ ...state, htmlBody, emailBodySizeMB, bodyTooLarge, bodyError: null }));
    updateSizeLimit();
  }

  function updateAttachedFiles(attachedFiles: File[]) {
    const { totalFileSizeMB, fileSizeLimitExceeded } = calculateFileSize(attachedFiles);
    update((state) => ({ ...state, attachedFiles, totalFileSizeMB, fileSizeLimitExceeded }));
    updateSizeLimit();
  }

  function updateSizeLimit() {
    update((state) => ({
      ...state,
      sizeLimitExceeded: state.fileSizeLimitExceeded || state.bodyTooLarge,
    }));
  }

  function setIsSending(isSending: boolean) {
    update((state) => ({ ...state, isSending }));
  }

  function validate(): boolean {
    let valid = true;
    update((state) => {
      let recipientError = null;
      let subjectError = null;
      let bodyError = null;
      if (!state.recipient || !state.recipient.trim()) {
        recipientError = 'Recipient is required';
        valid = false;
      }
      if (!state.subject || !state.subject.trim()) {
        subjectError = 'Subject is required';
        valid = false;
      }
      if (!state.htmlBody || !state.htmlBody.trim()) {
        bodyError = 'Body is required';
        valid = false;
      }
      if (state.fileSizeLimitExceeded) {
        bodyError = `Attachments exceed ${MAX_ATTACHMENT_SIZE_MB} MB limit`;
        valid = false;
      }
      if (state.bodyTooLarge) {
        bodyError = `Email body exceeds ${MAX_EMAIL_BODY_SIZE_MB} MB limit.`;
        valid = false;
      }
      return {
        ...state,
        recipientError,
        subjectError,
        bodyError,
      };
    });
    return valid;
  }

  function reset() {
    set({ ...initialState });
  }

  return {
    subscribe,
    updateRecipient,
    updateSubject,
    updateHtmlBody,
    updateAttachedFiles,
    setIsSending,
    validate,
    reset,
  };
}

// --- Draft Save/Load Logic ---
const DRAFT_KEY = 'email-editor-draft';

function saveDraft(subject: string, htmlBody: string) {
  if (!subject && !htmlBody) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, htmlBody }));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22)
    ) {
      // Try to save just the subject
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ subject, htmlBody: 'Content too large to save' })
        );
      } catch {
        // Ignore
      }
    }
  }
}

function loadDraft(setters: { setSubject: (v: string) => void; setHtmlBody: (v: string) => void }) {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (draft.subject) setters.setSubject(draft.subject);
    if (draft.htmlBody) setters.setHtmlBody(draft.htmlBody);
  } catch {}
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}

const debouncedSaveDraft = debounce((subject: string, htmlBody: string) => saveDraft(subject, htmlBody), 1200);

export const emailEditorStore = Object.assign(createEmailEditorStore(), {
  saveDraft,
  loadDraft,
  debouncedSaveDraft,
});
