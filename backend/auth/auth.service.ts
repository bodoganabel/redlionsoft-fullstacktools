import type { Collection, OptionalUnlessRequiredId, WithId } from "mongodb";
import { type Cookies } from "@sveltejs/kit";
import bcrypt from "bcrypt";
import { JWT } from "../jwt";
import { delay } from "../../common/utilities/general";
import type { TemporaryTokensService } from "../temporary-tokens/temporary-tokens.service";
import { DateTime } from "luxon";
import type { EmailService } from "../email/email.service";
import type { TUserServerRls, TUserClientRls } from "./user.types";

/* Use this class as your login service in the backend at your app.
Good example: signaltuzfal /auth/login/+server.ts 2024.10.25 */

export class AuthService<
  ERoles,
  EPermissions,
  Metadata_UserServer,
  Metadata_UserClient
> {
  private jwt: JWT;
  private usersCollection;
  private temporaryTokensService: TemporaryTokensService;
  // function that gets the server side user object and returns a client side user object from it.
  private emailService: EmailService;
  private parse_serverUserTo_clientUser;
  private saltOrRounds: string | number = 10;
  private passwordResetExpires_min: number = 15;

  constructor(initializer: {
    defaultUsers: Omit<
      TUserServerRls<ERoles, EPermissions, Metadata_UserServer>,
      "_id"
    >[];
    jwt: JWT;
    usersCollection: Collection<
      TUserServerRls<ERoles, EPermissions, Metadata_UserServer>
    >;
    parse_serverUserTo_clientUser: (
      userServer: TUserServerRls<ERoles, EPermissions, Metadata_UserServer>
    ) => TUserClientRls<ERoles, EPermissions, Metadata_UserClient>;
    temporaryTokensService: TemporaryTokensService;
    emailService: EmailService;
    saltOrRounds?: number | string;
    passwordResetExpires_min?: number;
  }) {
    if (process.env.FRONTEND_URL === undefined)
      throw new Error("FRONTEND_URL is not defined in .env");

    this.jwt = initializer.jwt;
    this.usersCollection = initializer.usersCollection;
    this.parse_serverUserTo_clientUser =
      initializer.parse_serverUserTo_clientUser;
    this.temporaryTokensService = initializer.temporaryTokensService;
    this.emailService = initializer.emailService;

    if (initializer.saltOrRounds) {
      this.saltOrRounds = initializer.saltOrRounds;
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
      } catch (error) {}
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
      password: await bcrypt.hash(props.password, this.saltOrRounds),
      created_at: DateTime.now().toISO() as string,
    };

    try {
      const result = await this.usersCollection.insertOne(
        user as TUserServerRls<ERoles, EPermissions, Metadata_UserServer>
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

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return { status: 401, message: "Wrong old password" };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltOrRounds);
    await this.usersCollection.updateOne(
      { _id: user._id },
      {
        $set: {
          password: hashedNewPassword,
        } as Partial<TUserServerRls<ERoles, EPermissions, Metadata_UserServer>>,
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
    const resetPasswordPageUrl =
      process.env.FRONTEND_URL + "/auth/reset-password";

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
    const hashedNewPassword = await bcrypt.hash(newPassword, this.saltOrRounds);
    await this.usersCollection.updateOne(
      { email: data.email },
      {
        $set: {
          password: hashedNewPassword,
        } as Partial<TUserServerRls<ERoles, EPermissions, Metadata_UserServer>>,
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

      const hashedPw = await bcrypt.hash(password, 10);
      console.log("hashedPw:");
      console.log(hashedPw);

      // Find user by email
      const user = await this.usersCollection.findOne({ email });
      if (user === null) {
        return { status: 401, message: "Invalid email or password" };
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { status: 401, message: "Invalid email or password" };
      }

      // This ensures type matching between TUser_client<ERoles,EPermissions,Metadata_UserClient> and
      try {
        const clientUser: TUserClientRls<
          ERoles,
          EPermissions,
          Metadata_UserClient
        > = this.parse_serverUserTo_clientUser(
          user as TUserServerRls<ERoles, EPermissions, Metadata_UserServer>
        );
        // Generate a JWT token with the user as the payload
        const clientUserAsPayloadToken = this.jwt.signToken(
          clientUser as Object
        );

        cookies.set("auth", clientUserAsPayloadToken, {
          maxAge: 3600,
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

  /* Call this from hooks/handle */
  public getClientUserFromCookies(cookies: Cookies) {
    const authCookie = cookies.get("auth");
    if (authCookie) {
      try {
        const decodedUser: TUserClientRls<
          ERoles,
          EPermissions,
          Metadata_UserClient
        > = this.jwt.decode(authCookie) as TUserClientRls<
          ERoles,
          EPermissions,
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
    clientUser: TUserClientRls<ERoles, EPermissions, Metadata_UserClient>
  ): Promise<TUserServerRls<ERoles, EPermissions, Metadata_UserServer> | null> {
    return (await this.usersCollection.findOne({
      email: (clientUser as any).email,
    })) as TUserServerRls<ERoles, EPermissions, Metadata_UserServer> | null;
  }

  public async getServerUserFromCookies(
    cookies: Cookies
  ): Promise<TUserServerRls<ERoles, EPermissions, Metadata_UserServer> | null> {
    const clientUser = this.getClientUserFromCookies(cookies);
    if (clientUser === null) return null;
    return await this.getServerUser(clientUser);
  }

  public async hasPermissions(
    serverUser: TUserServerRls<
      ERoles,
      EPermissions,
      Metadata_UserServer
    > | null,
    permissions: EPermissions[]
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
    defaultUsers: Omit<
      TUserServerRls<ERoles, EPermissions, Metadata_UserServer>,
      "_id"
    >[]
  ) {
    const userCount = await this.usersCollection.countDocuments();
    if (userCount === 0 && defaultUsers.length > 0) {
      // Hash passwords for default users
      const usersWithHashedPasswords = await Promise.all(
        defaultUsers.map(async (user) => {
          const hashedPassword = await bcrypt.hash(
            user.password,
            this.saltOrRounds
          );
          return {
            ...user,
            password: hashedPassword,
          };
        })
      );

      // Insert default users
      await this.usersCollection.insertMany(
        usersWithHashedPasswords as OptionalUnlessRequiredId<
          TUserServerRls<ERoles, EPermissions, Metadata_UserServer>
        >[]
      );
      console.log(`Created ${defaultUsers.length} default users`);
    }
  }
}
