// DELETE dto.ts

import z from "zod/v4";

export const SNamexxx_DELETE_Body = z.object({
  inDELETE: z.string(),
});
export type TNamexxx_DELETE_Body = z.infer<typeof SNamexxx_DELETE_Body>

export const SNamexxx_DELETE_Response = z.object({
  outDELETE: z.string(),
})
export type TNamexxx_DELETE_Response = z.infer<typeof SNamexxx_DELETE_Response>

export enum ENamexxx_DELETE_ErrorCodes {
    ID_NOT_FOUND = "ID_NOT_FOUND",
    AUTO_TOAST = "AUTO_TOAST"
}