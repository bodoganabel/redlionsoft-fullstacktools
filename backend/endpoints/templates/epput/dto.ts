// dto.ts

import z from "zod/v4";

export const SNamexxx_PUT_Body = z.object({
  input: z.string(),
});
export type TNamexxx_PUT_Body = z.infer<typeof SNamexxx_PUT_Body>

export const SNamexxx_PUT_Response = z.object({
  output: z.string(),
})
export type TNamexxx_PUT_Response = z.infer<typeof SNamexxx_PUT_Response>

export enum ENamexxx_PUT_ErrorCodes {
    ID_NOT_FOUND = "ID_NOT_FOUND",
    AUTO_TOAST = "AUTO_TOAST"
}