import dotenv from "dotenv";
import { isProduction } from "../common";

let loadedEnv = false;

export function loadEnv(message = "") {
  if (loadedEnv) return;
  const path = isProduction() ? ".env.production" : ".env.development";
  dotenv.config({
    path,
  });

  if (message) console.log(message);
  console.log("env file is loaded from " + path);

  loadedEnv = true;
}
