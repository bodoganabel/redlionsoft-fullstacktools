import { get, writable } from 'svelte/store';
import { extractTemplateVariables, applyTemplateVariables, initializeTemplateVariableValues } from '../../../../utils/template-variables';
import { DRAFT_HTMLBODY_KEY, DRAFT_IS_HTML_MODE_KEY, DRAFT_SUBJECT_KEY, DRAFT_VARIABLE_VALUES_KEY } from '../email-editor.types';
import { debouncedSaveDraftHtmlBody, debouncedSaveDraftSubject, debouncedSaveDraftTemplateVariableValues, saveDraftIsHtmlMode } from './draft.utils';

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
  isHtmlMode: boolean;
  isInitialized: boolean;
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
    isHtmlMode: false,
    isInitialized: false, // Flag for disabling premature saving
  };

  const store = writable<EmailEditorState>({ ...initialState });
  const { subscribe, update, set } = store;

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
    debouncedSaveDraftSubject(store);
  }

  function updateHtmlBody(htmlBody: string, saveDraft = true) {
    const { emailBodySizeMB, bodyTooLarge } = calculateBodySize(htmlBody);

    // Update the HTML body immediately
    update((state) => ({
      ...state,
      htmlBody,
      emailBodySizeMB,
      bodyTooLarge,
      bodyError: null
    }));

    console.log('htmlBody', get(store).htmlBody);

    // Debounce the variable detection
    updateSizeLimit();
    if (saveDraft) {
      debouncedSaveDraftHtmlBody(store);
    }
    debouncedDetectVariables();
  }

  function updateIsHtmlMode(isHtmlMode: boolean) {
    update((state) => {
      // This triggers reactivity for editor & html textarena to detect change in their value too 
      const updatedState = { ...state, isHtmlMode };
      return updatedState;
    });
    saveDraftIsHtmlMode(store);
  }

  // Using the utility function instead of local implementation

  // Track the last detected variables for optimization
  let lastSubject = '';
  let lastHtmlBody = '';
  let lastVariables: string[] = [];

  /**
   * Debounced function to detect template variables in both subject and body
   */
  function debouncedDetectVariables() {
    clearTimeout(debouncedVariableDetectionTimer);
    debouncedVariableDetectionTimer = setTimeout(() => {
      detectTemplateVariables();
    }, 1000); // Increased debounce time to 1000ms for better performance
  }

  /**
   * Detect template variables in both subject and body
   */
  function detectTemplateVariables() {
    let currentState: EmailEditorState | undefined;
    const unsubscribe = subscribe(state => {
      currentState = state;
    });
    unsubscribe();

    if (!currentState) return [];

    // Skip processing if content hasn't changed
    if (currentState.subject === lastSubject && currentState.htmlBody === lastHtmlBody) {
      return lastVariables;
    }

    // Remember current state for next comparison
    lastSubject = currentState.subject;
    lastHtmlBody = currentState.htmlBody;

    // Extract variables from both subject and body
    const subjectVariables = extractTemplateVariables(currentState.subject);
    const bodyVariables = extractTemplateVariables(currentState.htmlBody);

    // Combine all variables and remove duplicates
    const allVariables = [...new Set([...subjectVariables, ...bodyVariables])];

    // Only update if variables have actually changed
    if (JSON.stringify(allVariables) !== JSON.stringify(lastVariables)) {
      lastVariables = allVariables;
      updateTemplateVariables(allVariables);
    }

    return allVariables;
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
    debouncedSaveDraftTemplateVariableValues(store);
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

  function loadDraft() {
    const rawHtmlBody = localStorage.getItem(DRAFT_HTMLBODY_KEY);
    const rawSubject = localStorage.getItem(DRAFT_SUBJECT_KEY);
    const rawVariableValues = localStorage.getItem(DRAFT_VARIABLE_VALUES_KEY);
    const rawIsHtmlMode = localStorage.getItem(DRAFT_IS_HTML_MODE_KEY);

    try {
      if (rawIsHtmlMode !== null) {
        updateIsHtmlMode(JSON.parse(rawIsHtmlMode));
      }
      if (rawHtmlBody !== null) {
        updateHtmlBody(rawHtmlBody, false);
      }
      if (rawSubject !== null) {
        updateSubject(rawSubject);
      }
      if (rawVariableValues !== null) {
        for (const [key, value] of Object.entries(JSON.parse(rawVariableValues))) {
          updateTemplateVariableValue(key as string, value as string);
        }
      }
    } catch (error) {
      console.error('Failed to load draft:', error);
    }
    update((state) => ({ ...state, isInitialized: true }));
  }



  return {
    subscribe,
    updateRecipient,
    updateSubject,
    updateHtmlBody,
    updateAttachedFiles,
    updateIsHtmlMode,
    setIsSending,
    validate,
    reset,
    updateTemplateVariables,
    updateTemplateVariableValue,
    getProcessedHtmlBody,
    getProcessedSubject,
    loadDraft,
  };
}


// Export the store with the additional functions
export const emailEditorStore = createEmailEditorStore();
