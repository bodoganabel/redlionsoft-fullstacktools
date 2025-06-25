import { get } from "svelte/store";
import { DRAFT_HTMLBODY_KEY, DRAFT_IS_HTML_MODE_KEY, DRAFT_SUBJECT_KEY, DRAFT_VARIABLE_VALUES_KEY } from "../email-editor.types";
import { type Writable } from "svelte/store";
import { type EmailEditorState } from "./email-editor.store";

export function saveDraftSubject(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        localStorage.setItem(DRAFT_SUBJECT_KEY, state.subject || '');
    } catch (error) {
        console.error('Failed to save email subject draft:', error);
    }
}

export function forceSaveDraftSubjectImmediately(emailEditorStore: Writable<EmailEditorState>) {
    saveDraftSubject(emailEditorStore);
}

export function saveDraftHtmlBody(emailEditorStore: Writable<EmailEditorState>) {
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

export function saveDraftTemplateVariableValues(emailEditorStore: Writable<EmailEditorState>) {
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

export function saveDraftIsHtmlMode(emailEditorStore: Writable<EmailEditorState>) {
    if (!get(emailEditorStore).isInitialized) return;
    const state = get(emailEditorStore);
    try {
        localStorage.setItem(DRAFT_IS_HTML_MODE_KEY, JSON.stringify(state.isHtmlMode ?? false));
    } catch (error) {
        console.error('Failed to save HTML mode draft state:', error);
    }
}