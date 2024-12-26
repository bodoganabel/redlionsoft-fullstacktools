import { Database } from "../database";
import { DateTime } from "luxon";
import type JWT from "../jwt";
import type { ObjectId } from "mongodb";

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
  private jwt: JWT;
  constructor(initializer: { jwt: JWT }) {
    this.jwt = initializer.jwt;
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
    const insertedData = await temporaryTokensCollection.findOne(data);
    return insertedData as T;
  }

  public async get<T>(filter: any) {
    return (await temporaryTokensCollection.findOne(filter)) as T | null;
  }

  public async delete(filter: any) {
    await temporaryTokensCollection.deleteOne(filter);
  }

  public async addToken(data: any, expiresAt: DateTime) {
    const token = this.jwt.signToken(data);
    console.log("token:");
    console.log(token);
    return (
      (await this.add({ token }, expiresAt)) as {
        token: string;
        _id: ObjectId;
        expiresAt: Date;
      }
    ).token as string | null;
  }

  public async getToken<T>(token: string) {
    console.log("token:");
    console.log(token);
    const document = (await temporaryTokensCollection.findOne({ token })) as {
      _id: ObjectId;
      token: string;
    } | null;
    console.log("document:");
    console.log(document);
    if (document !== null) {
      return this.jwt.decode(document.token) as T;
    }
    return null;
  }
}
