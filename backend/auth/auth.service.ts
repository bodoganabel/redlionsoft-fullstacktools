import type { Collection, OptionalUnlessRequiredId, WithId } from "mongodb";
import { type Cookies } from "@sveltejs/kit";
import bcrypt from "bcrypt";
import { JWT } from "../jwt";
import { delay } from "../../common/utilities/general";
import type { TemporaryTokensService } from "../temporary-tokens/temporary-tokens.service";
import { DateTime } from "luxon";
import type { EmailService } from "../email/email.service";

/* Use this class as your login service in the backend at your app.
Good example: signaltuzfal /auth/login/+server.ts 2024.10.25 */

/*
 * Has email and password properties, which are required (i.e., cannot be null or undefined)
 * Can have any additional properties with string keys and values of any type
 */
type TBareMinimumUserType = {
  email: string;
  password: string;
  permissions: string[];
} & {
  [key: string]: any;
};

export class AuthService<
  TUserServer extends TBareMinimumUserType,
  TUserClient
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
    jwt: JWT;
    usersCollection: Collection<TUserServer>;
    parse_serverUserTo_clientUser: (userServer: TUserServer) => TUserClient;
    temporaryTokensService: TemporaryTokensService;
    emailService: EmailService;
    saltOrRounds?: number | string;
    passwordResetExpires_min?: number;
  }) {
    this.jwt = initializer.jwt;
    this.usersCollection = initializer.usersCollection;
    this.temporaryTokensService = initializer.temporaryTokensService;
    this.emailService = initializer.emailService;
    this.parse_serverUserTo_clientUser =
      initializer.parse_serverUserTo_clientUser;

    if (initializer.saltOrRounds) {
      this.saltOrRounds = initializer.saltOrRounds;
    }
    if (initializer.passwordResetExpires_min !== undefined) {
      this.passwordResetExpires_min = initializer.passwordResetExpires_min;
    }
  }

  public async generateDevUsers(devUsers: TUserServer[]) {
    const successfullyCreatedUsers = [];

    devUsers.forEach(async (devUser) => {
      try {
        await this.signup(devUser);
        successfullyCreatedUsers.push(devUser.email);
      } catch (error) {}
    });
  }

  /* Expects validated inputs */

  public async signup(props: TUserServer) {
    /*************  ✨ Codeium Command ⭐  *************/
    const user: TUserServer = {
      ...props,
      password: await bcrypt.hash(props.password, this.saltOrRounds),
      created_at: new Date(),
    };

    try {
      const result = await this.usersCollection.insertOne(
        user as OptionalUnlessRequiredId<TUserServer>
      );
      if (!result.acknowledged) {
        return { status: 500, message: "An error occurred" };
      }
    } catch (error: any) {
      if (error.code === 11000) {
        return { status: 400, message: "Email already exists" };
      }
      return { status: 500, message: "An error occurred" };
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
      { _id: user._id } as OptionalUnlessRequiredId<TUserServer>,
      {
        $set: {
          password: hashedNewPassword,
        } as Partial<TUserServer>,
      }
    );
    return { status: 200, message: "Password changed successfully" };
  }

  public async logout(cookies: Cookies) {
    cookies.delete("auth", { path: "/" });
  }

  // Creating a reset token encoding the email as data
  public async resetPasswordInit(email: string) {
    const token = await this.temporaryTokensService.addToken(
      { email },
      DateTime.now().plus({ minutes: this.passwordResetExpires_min })
    );
    if (token === null) {
      return { error: "An error occurred" };
    }
    const result = await this.emailService.sendTemplate({
      to: email,
      subject: "Reset password",
      templateUrl_reative: "/reset-password.hbs",
      options: { token } as any,
    });

    return result;
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
      const user = await this.usersCollection.findOne({ email } as TUserServer);
      if (user === null) {
        return { status: 401, message: "Invalid email or password" };
      }

      // Check password
      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        return { status: 401, message: "Invalid email or password" };
      }

      // This ensures type matching between TUser_client and
      try {
        const clientUser: TUserClient = this.parse_serverUserTo_clientUser(
          user as TUserServer
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
        const decodedUser: TUserClient = this.jwt.decode(
          authCookie
        ) as TUserClient;
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
    clientUser: TUserClient
  ): Promise<WithId<TUserServer> | null> {
    return await this.usersCollection.findOne({
      email: (clientUser as any).email,
    } as TUserServer);
  }

  public async getServerUserFromCookies(
    cookies: Cookies
  ): Promise<WithId<TUserServer> | null> {
    const clientUser = this.getClientUserFromCookies(cookies);
    if (clientUser === null) return null;
    return await this.getServerUser(clientUser);
  }

  public async hasPermissions(
    serverUser: TUserServer | null,
    permissions: string[]
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
}
