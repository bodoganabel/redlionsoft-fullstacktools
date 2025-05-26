import { writable } from 'svelte/store';
import { extractTemplateVariables, applyTemplateVariables, initializeTemplateVariableValues } from '../../../utils/template-variables';

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
  templateVariables: string[];
  templateVariableValues: Record<string, string>;
}

const MAX_ATTACHMENT_SIZE_MB = 25;
const MAX_EMAIL_BODY_SIZE_MB = 20;

function createEmailEditorStore() {
  // Debounce timers for variable detection
  let debouncedVariableDetectionTimer: ReturnType<typeof setTimeout>;
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
    templateVariables: [],
    templateVariableValues: {},
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
    // Update the subject immediately
    update((state) => ({ ...state, subject, subjectError: null }));
    
    // Debounce the variable detection
    debouncedDetectVariables();
  }

  function updateHtmlBody(htmlBody: string) {
    const { emailBodySizeMB, bodyTooLarge } = calculateBodySize(htmlBody);
    
    // Update the HTML body immediately
    update((state) => ({
      ...state,
      htmlBody,
      emailBodySizeMB,
      bodyTooLarge,
      bodyError: null
    }));
    
    updateSizeLimit();
    
    // Debounce the variable detection
    debouncedDetectVariables();
  }
  
  // Using the utility function instead of local implementation
  
  /**
   * Debounced function to detect template variables in both subject and body
   */
  const debouncedDetectVariables = debounce(() => {
    detectTemplateVariables();
  }, 800); // 800ms debounce time
  
  /**
   * Detect template variables in both subject and body
   */
  function detectTemplateVariables() {
    let currentState: EmailEditorState | undefined;
    const unsubscribe = subscribe(state => {
      currentState = state;
    });
    unsubscribe();
    
    if (!currentState) return;
    
    // Extract variables from both subject and body
    const subjectVariables = extractTemplateVariables(currentState.subject);
    const bodyVariables = extractTemplateVariables(currentState.htmlBody);
    
    // Combine all variables
    const allVariables = [...subjectVariables, ...bodyVariables];
    
    if (allVariables.length > 0) {
      updateTemplateVariables(allVariables);
    }
  }
  
  function updateTemplateVariables(variables: string[]) {
    update((state) => {
      // Remove duplicates from the variables array
      const uniqueVariables = [...new Set(variables)];
      
      // Use utility function to initialize variable values
      const newVariableValues = initializeTemplateVariableValues(
        state.templateVariableValues,
        uniqueVariables
      );
      
      return {
        ...state,
        templateVariables: uniqueVariables,
        templateVariableValues: newVariableValues
      };
    });
  }
  
  function updateTemplateVariableValue(variable: string, value: string) {
    update((state) => {
      const newVariableValues = { ...state.templateVariableValues, [variable]: value };
      return {
        ...state,
        templateVariableValues: newVariableValues
      };
    });
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

  /**
   * Apply template variables to the HTML body and return the processed content
   * This doesn't modify the store's htmlBody, it just returns the processed content
   */
  function getProcessedHtmlBody(): string {
    let state: EmailEditorState | undefined;
    const unsubscribe = subscribe(currentState => {
      state = currentState;
    });
    unsubscribe();
    
    if (!state) return '';
    
    // Use utility function to apply template variables
    return applyTemplateVariables(state.htmlBody, state.templateVariableValues);
  }
  
  function getProcessedSubject(): string {
    let state: EmailEditorState | undefined;
    const unsubscribe = subscribe(currentState => {
      state = currentState;
    });
    unsubscribe();
    
    if (!state) return '';
    
    // Use utility function to apply template variables
    return applyTemplateVariables(state.subject, state.templateVariableValues);
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
    updateTemplateVariables,
    updateTemplateVariableValue,
    getProcessedHtmlBody,
    getProcessedSubject,
  };
}

// --- Draft Save/Load Logic ---
const DRAFT_KEY = 'email-editor-draft';

function saveDraft(subject: string, htmlBody: string, templateVariableValues?: Record<string, string>) {
  if (!subject && !htmlBody && (!templateVariableValues || Object.keys(templateVariableValues).length === 0)) {
    localStorage.removeItem(DRAFT_KEY);
    return;
  }
  try {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({ 
      subject, 
      htmlBody,
      templateVariableValues: templateVariableValues || {}
    }));
  } catch (error) {
    if (
      error instanceof DOMException &&
      (error.name === 'QuotaExceededError' || error.code === 22)
    ) {
      // Try to save just the subject and variables without the body to preserve some state
      try {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ 
            subject, 
            htmlBody: 'Content too large to save',
            templateVariableValues: templateVariableValues || {}
          })
        );
      } catch {
        // Ignore
      }
    }
  }
}

function loadDraft(setters: { 
  setSubject: (v: string) => void; 
  setHtmlBody: (v: string) => void;
  setTemplateVariableValues?: (v: Record<string, string>) => void;
}) {
  const raw = localStorage.getItem(DRAFT_KEY);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    if (draft.subject) setters.setSubject(draft.subject);
    if (draft.htmlBody) setters.setHtmlBody(draft.htmlBody);
    if (draft.templateVariableValues && setters.setTemplateVariableValues) {
      setters.setTemplateVariableValues(draft.templateVariableValues);
    }
  } catch {}
}

function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
  let timeout: ReturnType<typeof setTimeout>;
  return ((...args: any[]) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn(...args), ms);
  }) as T;
}

const debouncedSaveDraft = debounce(
  (subject: string, htmlBody: string, templateVariableValues?: Record<string, string>) => 
    saveDraft(subject, htmlBody, templateVariableValues), 
  1200
);

export const emailEditorStore = Object.assign(createEmailEditorStore(), {
  saveDraft,
  loadDraft,
  debouncedSaveDraft,
});
