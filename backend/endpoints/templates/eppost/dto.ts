// dto.ts

import z from "zod/v4";

export const SNamexxx_POST_Body = z.object({
  input: z.string(),
});
export type TNamexxx_POST_Body = z.infer<typeof SNamexxx_POST_Body>

export const SNamexxx_POST_Response = z.object({
  output: z.string(),
})
export type TNamexxx_POST_Response = z.infer<typeof SNamexxx_POST_Response>

export enum ENamexxx_POST_ErrorCodes {
    ID_NOT_FOUND = "ID_NOT_FOUND",
    AUTO_TOAST = "AUTO_TOAST"
}