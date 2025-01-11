import { Database } from "../database";

export const UsersCollection = await Database.createCollection("users");
export const GuestUsersCollection = await Database.createCollection(
  "guestUsers"
);
