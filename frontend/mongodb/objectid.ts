import { z } from "zod/v4";

export const SObjectIdClient = z.string().min(24).max(24).default(() => {
    return ObjectIdGenerate();
});

export type ObjectIdClient = z.infer<typeof SObjectIdClient>;


export function ObjectIdGenerate(): ObjectIdClient {
  // Implementation based on MongoDB ObjectId specification
  // https://www.mongodb.com/docs/manual/reference/method/ObjectId/
  
  // 1. 4-byte timestamp value (seconds since Unix epoch)
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  
  // 2. 5-byte random value
  const randomValue = Array.from({ length: 5 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // 3. 3-byte incrementing counter, initialized to a random value
  // Since we can't maintain state between function calls in this context,
  // we'll use a random value for all 3 bytes
  const counter = Array.from({ length: 3 }, () => 
    Math.floor(Math.random() * 256).toString(16).padStart(2, '0')
  ).join('');
  
  // Combine all parts to form the 24-character hexadecimal string
  return timestamp + randomValue + counter;
}
    