import { Editor } from "@tiptap/core";
import { emailEditorStore } from "../email-editor.store";
import { toastError } from "../../../../functionality/toast/toast-logic";

// --- Draft Save/Load/Helpers ---
export const DRAFT_KEY = 'email-editor-draft';
export function saveDraft(subject: string, body: string) {
    if (!subject && !body) {
        localStorage.removeItem(DRAFT_KEY);
        return;
    }

    try {
        localStorage.setItem(DRAFT_KEY, JSON.stringify({ subject, body }));
    } catch (error) {
        // Handle quota exceeded error
        if (
            error instanceof DOMException &&
            (error.name === 'QuotaExceededError' || error.code === 22)
        ) {
            toastError(
                'Email content is too large to save as draft. Please make the email body shorter or use smaller/fewer images.'
            );

            // Try to save just the subject without the body to preserve some state
            try {
                localStorage.setItem(
                    DRAFT_KEY,
                    JSON.stringify({ subject, body: 'Content too large to save' })
                );
            } catch {
                // If even that fails, just log it
                console.error('Failed to save even minimal draft content');
            }
        } else {
            console.error('Error saving draft:', error);
        }
    }
}
export function loadDraft(editor: Editor) {
    emailEditorStore.loadDraft({
        setSubject: (subject) => emailEditorStore.updateSubject(subject),
        setHtmlBody: (htmlBody) => {
            if (editor?.commands?.setContent) {
                editor.commands.setContent(htmlBody);
                emailEditorStore.updateHtmlBody(htmlBody);
            }
        },
        setTemplateVariableValues: (values) => {
            // The store will handle updating the template variable values
            Object.entries(values).forEach(([variable, value]) => {
                emailEditorStore.updateTemplateVariableValue(variable, value);
            });
        },
    });
}
// Simple debounce helper
function debounce(fn: (...args: any[]) => void, ms: number) {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), ms);
    };
}
// Debounced save
export const debouncedSaveDraft = debounce(
    (subject: string, body: string) => saveDraft(subject, body),
    1200
);
