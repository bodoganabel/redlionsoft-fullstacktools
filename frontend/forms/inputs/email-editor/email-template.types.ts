import { z } from "zod/v4";

export const EmailTemplateSchema = z.object({
    subject: z.string().default(""),
    content: z.string(),
    isHtmlMode: z.boolean().default(false),
    isShared: z.boolean(),
    ownerUserId: z.string(),
});

export type TEmailTemplate = z.infer<typeof EmailTemplateSchema>;


export const POPUP_TEMPLATE_MANAGER = 'email-template-manager-popup';
export const POPUP_EMAIL_TEMPLATE_EDIT_ID = 'edit-email-template-popup';
