import { get } from "svelte/store";
import { DRAFT_HTMLBODY_KEY, DRAFT_IS_HTML_MODE_KEY, DRAFT_SUBJECT_KEY, DRAFT_VARIABLE_VALUES_KEY } from "../email-editor.types";
import { type Writable } from "svelte/store";
import { type EmailEditorState } from "./email-editor.store";


function debounce<T extends (...args: any[]) => void>(fn: T, ms: number): T {
    let timeout: ReturnType<typeof setTimeout>;
    return ((...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    }) as T;
}

function saveDraftSubject(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        localStorage.setItem(DRAFT_SUBJECT_KEY, state.subject || '');
    } catch (error) {
        console.error('Failed to save email subject draft:', error);
    }
}

function saveDraftHtmlBody(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        localStorage.setItem(DRAFT_HTMLBODY_KEY, state.htmlBody || '');
    } catch (error) {
        if (
            error instanceof DOMException &&
            (error.name === 'QuotaExceededError' || error.code === 22)
        ) {
            // Try to save a truncated version of the HTML body
            try {
                const truncatedHtml = (state.htmlBody || '').substring(0, 1000) + '... [truncated due to size limitations]';
                localStorage.setItem(DRAFT_HTMLBODY_KEY, truncatedHtml);
            } catch {
                // Ignore if even the fallback fails
            }
        }
    }
}

function saveDraftTemplateVariableValues(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        if (state.templateVariableValues) {
            localStorage.setItem(DRAFT_VARIABLE_VALUES_KEY, JSON.stringify(state.templateVariableValues));
        }
    } catch (error) {
        console.error('Failed to save template variable values draft:', error);
    }
}

// Define the debounced save draft functions
export const debouncedSaveDraftSubject = debounce((emailEditorStore: Writable<EmailEditorState>) => {
    saveDraftSubject(emailEditorStore);
    console.log('Draft subject saved');
}, 500);
export const debouncedSaveDraftHtmlBody = debounce((emailEditorStore: Writable<EmailEditorState>) => {
    saveDraftHtmlBody(emailEditorStore);
    console.log('Draft html saved');
}, 500);
export const debouncedSaveDraftTemplateVariableValues = debounce((emailEditorStore: Writable<EmailEditorState>) => {
    saveDraftTemplateVariableValues(emailEditorStore);
    console.log('Draft template variable values saved');
}, 500);

export function saveDraftIsHtmlMode(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        localStorage.setItem(DRAFT_IS_HTML_MODE_KEY, JSON.stringify(state.isHtmlMode ?? false));
    } catch (error) {
        console.error('Failed to save HTML mode draft state:', error);
    }
}