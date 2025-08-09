// dto.ts

import z from "zod/v4";

export const SNamexxx_PATCH_Body = z.object({
  input: z.string(),
});
export type TNamexxx_PATCH_Body = z.infer<typeof SNamexxx_PATCH_Body>

export const SNamexxx_PATCH_Response = z.object({
  output: z.string(),
})
export type TNamexxx_PATCH_Response = z.infer<typeof SNamexxx_PATCH_Response>

export enum ENamexxx_PATCH_ErrorCodes {
    ID_NOT_FOUND = "ID_NOT_FOUND",
    AUTO_TOAST = "AUTO_TOAST"
}