import { uuidShort } from "../../common/utilities/general";
import { Database } from "../database";
import type { DateTime } from "luxon";

/* Use this class as your login service in the backend at your app.
Good example: signaltuzfal /auth/login/+server.ts 2024.10.25 */

/*
 * Has email and password properties, which are required (i.e., cannot be null or undefined)
 * Can have any additional properties with string keys and values of any type
 */

export const temporaryTokensCollection = await Database.createCollection(
  "temporary-tokens"
);

export class TemporaryTokensService {
  constructor(initializer: {}) {
    this.initializeTTL();
  }

  private async initializeTTL() {
    await temporaryTokensCollection.createIndex(
      { expiresAt: 1 },
      { expireAfterSeconds: 0 }
    );
  }

  public async add<T>(data: any, expireDate: DateTime) {
    await temporaryTokensCollection.insertOne({
      ...data,
      expiresAt: expireDate.toJSDate(),
    });
    const insertedData = await temporaryTokensCollection.findOne({ data });
    return insertedData as T;
  }

  public async get<T>(filter: any) {
    return (await temporaryTokensCollection.findOne(filter)) as T | null;
  }

  public async delete(filter: any) {
    await temporaryTokensCollection.deleteOne(filter);
  }

  public async addToken(data: any, expiresAt: DateTime, uuidTokenLength = 8) {
    const token = uuidShort(uuidTokenLength);
    return await this.add({ ...data, token }, expiresAt);
  }
}
