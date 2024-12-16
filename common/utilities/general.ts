import { isProduction } from "..";
import ShortUniqueId from "short-unique-id";

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export function uuidShort(length = 10) {
  return new ShortUniqueId({ length }).rnd();
}

export function UuidSimple() {
  const time = new Date().getTime();
  return time.toString();
}

export function devOnly(callOnlyAtDevelopmentMode: () => any) {
  if (!isProduction()) {
    callOnlyAtDevelopmentMode();
  }
}
