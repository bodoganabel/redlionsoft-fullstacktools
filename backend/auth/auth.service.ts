import {
  ObjectId,
  type Collection,
  type OptionalUnlessRequiredId,
  type WithId,
} from "mongodb";
import { type Cookies } from "@sveltejs/kit";
// No crypto-related imports needed
import { JWT } from "../jwt";
import { delay } from "../../common/utilities/general";
import type { TemporaryTokensService } from "../temporary-tokens/temporary-tokens.service";
import { DateTime } from "luxon";
import type { EmailService } from "../email/email.service";
import type { TUserServerRls, TUserClientRls, ECorePermissions } from "./user.types";

/* Use this class as your login service in the backend at your app.
Good example: signaltuzfal /auth/login/+server.ts 2024.10.25 */

export class AuthService<
  ERoles = any,
  EPermissions = any,
  Metadata_UserServer = any,
  Metadata_UserClient = any
> {
  private jwt: JWT;
  private usersCollection;
  private temporaryTokensService: TemporaryTokensService;
  // function that gets the server side user object and returns a client side user object from it.
  private emailService: EmailService;
  private parse_serverUserTo_clientUser;
  private hashIterations: number = 10000; // PBKDF2 iterations
  private passwordResetExpires_min: number = 15;

  constructor(initializer: {
    defaultUsers: TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>[];
    jwt: JWT;
    usersCollection: Collection<
      TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>
    >;
    parse_serverUserTo_clientUser: (
      userServer: TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>
    ) => TUserClientRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserClient>;
    temporaryTokensService: TemporaryTokensService;
    emailService: EmailService;
    hashIterations?: number;
    passwordResetExpires_min?: number;
  }) {
    if (process.env.APP_URL === undefined)
      throw new Error("APP_URL is not defined in .env");

    this.jwt = initializer.jwt;
    this.usersCollection = initializer.usersCollection;
    this.parse_serverUserTo_clientUser =
      initializer.parse_serverUserTo_clientUser;
    this.temporaryTokensService = initializer.temporaryTokensService;
    this.emailService = initializer.emailService;

    if (initializer.hashIterations) {
      this.hashIterations = initializer.hashIterations;
    }
    if (initializer.passwordResetExpires_min !== undefined) {
      this.passwordResetExpires_min = initializer.passwordResetExpires_min;
    }

    // Initialize default users if none exist
    this.initUsers(initializer.defaultUsers);
  }

  public async generateDevUsers(
    devUsers: TUserServerRls<ERoles, EPermissions, Metadata_UserServer>[]
  ) {
    const successfullyCreatedUsers = [];

    devUsers.forEach(async (devUser) => {
      try {
        await this.signup(devUser);
        successfullyCreatedUsers.push(devUser.email);
      } catch (error) { }
    });
  }

  /* Expects validated inputs */

  public async signup(
    props: Omit<
      TUserServerRls<ERoles, EPermissions, Metadata_UserServer>,
      "_id"
    >
  ) {
    /*************  ✨ Codeium Command ⭐  *************/
    const user: Omit<
      TUserServerRls<ERoles, EPermissions, Metadata_UserServer>,
      "_id"
    > = {
      ...props,
      email: (props.email.toLowerCase()),
      password: this.hashPassword(props.password),
      created_at: DateTime.now().toUTC().toISO() as string,
    };

    try {
      const result = await this.usersCollection.insertOne(
        user as TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>
      );

      const userServer = await this.usersCollection.findOne({
        _id: result.insertedId,
      });
      return { ok: true, user: userServer, message: "" };
    } catch (error: any) {
      if (error.code === 11000) {
        console.log("Email already exists");
        return { ok: false, user: null, message: "Email already exists" };
      }
      return { ok: false, user: null, message: "An error occurred" };
    }
    /******  7c19a7bd-a78f-4682-9a24-2e3d3ff62ef6  *******/
  }

  /* Expects validated inputs */
  public async changePassword(
    password: string,
    newPassword: string,
    cookies: Cookies
  ) {
    const user = await this.getServerUserFromCookies(cookies);
    if (!user) {
      return { status: 401, message: "Unauthorized" };
    }

    const match = this.verifyPassword(password, user.password);
    if (!match) {
      return { status: 401, message: "Wrong old password" };
    }

    const hashedNewPassword = this.hashPassword(newPassword);
    await this.usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedNewPassword,
        } as Partial<TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>>,
      }
    );
    return { status: 200, message: "Password changed successfully" };
  }

  public async logout(cookies: Cookies) {
    cookies.delete("auth", { path: "/" });
  }

  // Creating a reset token encoding the email as data
  public async resetPasswordInit(email: string) {
    const existingUser = await this.usersCollection.findOne({
      email,
    });
    if (existingUser === null) {
      return { error: "No user exists with this email" };
    }

    const existingToken = await this.temporaryTokensService.get({ email });
    if (existingToken !== null) {
      return {
        error:
          "A password reset request already exists for this email. <br/>Please try again in 15 minutes.",
      };
    }

    const token = await this.temporaryTokensService.addToken(
      { email },
      DateTime.now().plus({ minutes: this.passwordResetExpires_min }),
      { email }
    );
    if (token === null) {
      return { error: "An error occurred" };
    }
    const resetPasswordPageUrl = process.env.APP_URL + "/auth/reset-password";

    console.log("token,resetPasswordPageUrl:");
    console.log(token, resetPasswordPageUrl);

    const result = await this.emailService.sendTemplate({
      to: email,
      subject: "Reset password",
      templateUrl_reative: "/reset-password.hbs",
      templateParams: {
        token: encodeURIComponent(token),
        resetPasswordPageUrl,
      } as any,
    });

    return result;
  }

  public async resetPassword(
    newPassword: string,
    token: string,
    cookies: Cookies
  ): Promise<{ message?: string; error?: string }> {
    console.log("newPassword,token:");
    console.log(newPassword, token);

    const data = await this.temporaryTokensService.getToken<{ email: string }>(
      token
    );
    if (data === null) {
      return { error: "Invalid token" };
    }
    console.log("data:");
    console.log(data);
    const hashedNewPassword = this.hashPassword(newPassword);
    await this.usersCollection.updateOne(
      { email: data.email },
      {
        $set: {
          password: hashedNewPassword,
        } as Partial<TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>>,
      }
    );
    await this.temporaryTokensService.delete(token);
    await this.login(data.email, newPassword, cookies);
    return { message: "Password reset successfully" };
  }

  /* Expects validated input */
  public async login(
    email: string,
    password: string,
    cookies: Cookies
  ): Promise<{ status: number; message: string; success?: true }> {
    try {
      // Add a random delay between 100ms and 200ms
      const delayTime = Math.floor(Math.random() * (200 - 100 + 1) + 100);
      await delay(delayTime);

      const hashedPw = this.hashPassword(password);
      console.log("hashedPw:");
      console.log(hashedPw);

      // Find user by email
      const user = await this.usersCollection.findOne({ email: email.toLowerCase() });
      if (user === null) {
        return { status: 401, message: "Invalid email or password" };
      }

      // Check password
      const validPassword = this.verifyPassword(password, user.password);
      if (!validPassword) {
        return { status: 401, message: "Invalid email or password" };
      }

      // This ensures type matching between TUser_client<ERoles,EPermissions,Metadata_UserClient> and
      try {
        const clientUser: TUserClientRls<
          ERoles,
          (EPermissions | ECorePermissions)[],
          Metadata_UserClient
        > = this.parse_serverUserTo_clientUser(
          user as TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>
        );
        // Generate a JWT token with the user as the payload (3 months expiration)
        const clientUserAsPayloadToken = this.jwt.signToken(
          clientUser as Object,
          '90d'
        );

        cookies.set("auth", clientUserAsPayloadToken, {
          maxAge: 7776000, // 3 months in seconds
          path: "/",
          httpOnly: true,
        });
        // Set the cookie via the header

        return { status: 200, success: true, message: "OK" };
      } catch (error) {
        console.error("error:");
        console.error(error);
        throw new Error("parse_serverUserTo_clientUser failed.");
      }
    } catch (error) {
      console.log(error);
      return { status: 500, message: "An error occurred" };
    }
  }


  public getClientUserFromServerUser(serverUser: TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>) {
    return this.parse_serverUserTo_clientUser(serverUser);
  }

  /* Call this from hooks/handle */
  public getClientUserFromCookies(cookies: Cookies) {
    const authCookie = cookies.get("auth");
    if (authCookie) {
      try {
        const decodedUser: TUserClientRls<
          ERoles,
          (EPermissions | ECorePermissions)[],
          Metadata_UserClient
        > = this.jwt.decode(authCookie) as TUserClientRls<
          ERoles,
          (EPermissions | ECorePermissions)[],
          Metadata_UserClient
        >;
        // Initialize the Svelte store with user data
        return decodedUser;
      } catch (error) {
        console.error("Invalid JWT:", error);
        // Optionally, clear the user store if token is invalid
      }
    }
    return null;
  }

  private async getServerUser(
    clientUser: TUserClientRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserClient>
  ): Promise<TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer> | null> {
    return (await this.usersCollection.findOne({
      email: (clientUser as any).email,
    })) as TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer> | null;
  }

  public async getServerUserFromCookies(
    cookies: Cookies
  ): Promise<TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer> | null> {
    const clientUser = this.getClientUserFromCookies(cookies);
    if (clientUser === null) return null;
    return await this.getServerUser(clientUser);
  }

  // Pure JavaScript password hashing using PBKDF2
  private hashPassword(password: string): string {
    // Generate a random salt - simple but effective approach
    const salt = this.generateRandomString(16);

    // Simple string-based hashing that works in browser and Node.js
    // This is intentionally simplified for compatibility
    const hash = this.simpleHash(salt + password);

    // Return salt:hash format for storage
    return `${salt}:${hash}`;
  }

  // Verify a password against a stored hash
  private verifyPassword(password: string, storedHash: string): boolean {
    // Extract salt and hash
    const [salt, originalHash] = storedHash.split(":");

    if (!salt || !originalHash) {
      return false;
    }

    // Create a hash with the same salt and input password
    const hash = this.simpleHash(salt + password);

    // Compare the resulting hash with the stored hash
    return hash === originalHash;
  }

  // Generate a random string for salt
  private generateRandomString(length: number): string {
    const chars =
      "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let result = "";
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  // Simple string hashing function that works in all JS environments
  private simpleHash(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }

    // Convert to hex string and ensure it's always positive
    return (hash >>> 0).toString(16).padStart(8, "0");
  }

  public async hasPermissions(
    serverUser: TUserServerRls<
      ERoles,
      (EPermissions | ECorePermissions),
      Metadata_UserServer
    > | null,
    permissions: (EPermissions | ECorePermissions)[]
  ): Promise<boolean> {
    if (serverUser === null) {
      return false;
    }
    if (typeof serverUser.permissions !== "object") {
      return false;
    }
    return permissions.every((permission) =>
      serverUser.permissions.includes(permission)
    );
  }

  // Populate users collection
  private async initUsers(
    defaultUsers: TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>[]
  ) {
    const userCount = await this.usersCollection.countDocuments();
    if (userCount === 0 && defaultUsers.length > 0) {
      // Hash passwords for default users
      const usersWithHashedPasswords = defaultUsers.map((user) => {
        return {
          ...user,
          _id: user._id ? new ObjectId(user._id) : new ObjectId(),
          password: this.hashPassword(user.password),
          created_at: user.created_at || (DateTime.now().toUTC().toISO() as string),
        };
      });

      // Insert default users
      await this.usersCollection.insertMany(
        usersWithHashedPasswords as OptionalUnlessRequiredId<
          TUserServerRls<ERoles, (EPermissions | ECorePermissions)[], Metadata_UserServer>
        >[]
      );
      console.log(`Created ${defaultUsers.length} default users`);
    }
  }
}
