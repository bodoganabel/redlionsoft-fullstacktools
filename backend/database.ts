import type { Db } from "mongodb";
import dotenv from "dotenv";
import { connectToMongoDatabase } from ".";
import { isProduction } from "../common";
import { devOnly } from "../common/utilities/general";

// Has to be here because of circular dependency (sveltekit does not let load database first before anything else )

export class Database {
  private static _database: Db;
  private static _isDatabaseInitialized = false;

  public static async initializeDatabase() {
    if (this._isDatabaseInitialized) return;
    dotenv.config({
      path: isProduction() ? ".env.production" : ".env.development",
    });
    devOnly(() => console.log("Connecting database"));
    if (process.env.DATABASE_NAME === undefined)
      throw new Error("DATABASE_NAME is not defined in .env");
    this._database = await connectToMongoDatabase(process.env.DATABASE_NAME);
    this._isDatabaseInitialized = true;
    console.log(`Connected to database ${process.env.DATABASE_NAME}`);
  }

  public static getDatabase() {
    return Database._database;
  }

  public static async createCollection(collectionName: string) {
    console.log(typeof Database._database);

    if (typeof Database._database === "undefined") {
      await Database.initializeDatabase();
    }
    return Database._database.collection(collectionName);
  }
}
