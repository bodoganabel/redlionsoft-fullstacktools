import { z } from "zod";

export const EmailTemplateSchema = z.object({
    content: z.string(),
    attachedFiles: z.array(z.instanceof(File)),
    isShared: z.boolean(),
    ownerUserId: z.string(),
});

export type TEmailTemplate = z.infer<typeof EmailTemplateSchema>;


export const POPUP_TEMPLATE_MANAGER = 'email-template-manager-popup';
export const POPUP_EMAIL_TEMPLATE_EDIT_ID = 'edit-email-template-popup';
