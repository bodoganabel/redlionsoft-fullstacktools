// dto.ts

import z from "zod/v4";

export const SNamexxx_GET_Query = z.object({
  input: z.string(),
});
export type TNamexxx_GET_Query = z.infer<typeof SNamexxx_GET_Query>

export const SNamexxx_GET_Response = z.object({
  output: z.string(),
})
export type TNamexxx_GET_Response = z.infer<typeof SNamexxx_GET_Response>

export enum ENamexxx_GET_ErrorCodes {
    ID_NOT_FOUND = "ID_NOT_FOUND",
    AUTO_TOAST = "AUTO_TOAST"
}