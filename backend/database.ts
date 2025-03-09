import type { Db, WithId } from "mongodb";
import dotenv from "dotenv";
import { connectToMongoDatabase } from ".";
import { isProduction } from "../common";
import { devOnly } from "../common/utilities/general";

// Has to be here because of circular dependency (sveltekit does not let load database first before anything else )

import { building } from "$app/environment";
import { loadEnv } from "./env";

export class Database {
  private static _database: Db;
  private static _isDatabaseInitialized = false;
  private static _collections: Map<string, any> = new Map();

  public static async initializeDatabase() {
    if (this._isDatabaseInitialized) return;

    loadEnv("env file is loaded from database.ts");

    devOnly(() => console.log("Connecting database"));
    if (process.env.DATABASE_NAME === undefined)
      throw new Error("DATABASE_NAME is not defined in .env");

    this._database = await connectToMongoDatabase(process.env.DATABASE_NAME);
    this._isDatabaseInitialized = true;
    console.log(`Connected to database ${process.env.DATABASE_NAME}`);
  }

  public static getDatabase() {
    if (building) return undefined;
    return Database._database;
  }

  public static async createCollection<T = any>(collectionName: string) {
    if (typeof Database._database === "undefined") {
      await Database.initializeDatabase();
    }
    return Database._database.collection<WithId<T>>(collectionName);
  }
}
