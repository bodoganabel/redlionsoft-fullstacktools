
import type { Collection, OptionalUnlessRequiredId } from 'mongodb';
import { type Cookies, type RequestEvent } from "@sveltejs/kit";
import bcrypt from 'bcrypt';
import { JWT } from '../../common/utilities/jwt'
import { delay } from '../../common/utilities/general'

/* Use this class as your login service in the backend at your app.
Good example: signaltuzfal /auth/login/+server.ts 2024.10.25 */


/* 
* Has email and password properties, which are required (i.e., cannot be null or undefined)
* Can have any additional properties with string keys and values of any type 
*/
type TBareMinimumUserType = { email: string, password: string, permissions: string[] } & { [key: string]: any };


export class AuthService<
    TUserServer extends TBareMinimumUserType, TUserClient> {
    private jwt: JWT;
    private usersCollection;
    // function that gets the server side user object and returns a client side user object from it.
    private parse_serverUserTo_clientUser;
    constructor(initializer: {
        jwt: JWT,
        usersCollection: Collection<TUserServer>,
        parse_serverUserTo_clientUser: (userServer: TUserServer) => TUserClient

    }) {
        this.jwt = initializer.jwt;
        this.usersCollection = initializer.usersCollection;
        this.parse_serverUserTo_clientUser = initializer.parse_serverUserTo_clientUser;
    }


    public async generateDevUsers(devUsers: TUserServer[]) {

        const successfullyCreatedUsers = [];

        devUsers.forEach(async devUser => {
            try {

                await this.signup(devUser)
                successfullyCreatedUsers.push(devUser.email);
            } catch (error) {

            }
        });
    }

    /* Expects validated inputs */

    public async signup(props: TUserServer) {
        /*************  ✨ Codeium Command ⭐  *************/
        const user: TUserServer = {
            ...props,
            password: await bcrypt.hash(props.password, 10),
            created_at: new Date(),

        };

        try {
            const result = await this.usersCollection.insertOne(user as OptionalUnlessRequiredId<TUserServer>);
            if (!result.acknowledged) {
                return { status: 500, message: 'An error occurred' };
            }
        } catch (error: any) {
            if (error.code === 11000) {
                return { status: 400, message: 'Email already exists' };
            }
            return { status: 500, message: 'An error occurred' };
        }
        /******  7c19a7bd-a78f-4682-9a24-2e3d3ff62ef6  *******/
    }

    public async logout(cookies: Cookies) {
        cookies.delete('auth', { path: '/' });

    }

    /* Expects validated input */
    public async login(email: string, password: string, cookies: Cookies): Promise<{ status: number, message: string, success?: true }> {
        try {
            // Add a random delay between 100ms and 200ms
            const delayTime = Math.floor(Math.random() * (200 - 100 + 1) + 100);
            await delay(delayTime);

            const hashedPw = await bcrypt.hash(password, 10);
            console.log('hashedPw:');
            console.log(hashedPw);

            // Find user by email
            const user = await this.usersCollection.findOne({ email } as TUserServer);
            if (!user) {
                return { status: 401, message: 'Invalid email or password' };
            }

            // Check password
            const validPassword = await bcrypt.compare(password, user.password);
            if (!validPassword) {
                return { status: 401, message: 'Invalid email or password' };
            }

            // This ensures type matching between TUser_client and 
            try {
                const clientUser: TUserClient =
                    this.parse_serverUserTo_clientUser(user as TUserServer)
                // Generate a JWT token with the user as the payload
                const clientUserAsPayloadToken = this.jwt.signToken(clientUser as Object);

                cookies.set('auth', clientUserAsPayloadToken, { maxAge: 3600, path: '/', httpOnly: true });
                // Set the cookie via the header

                return { status: 200, success: true, message: "OK" };
            } catch (error) {
                console.error('error:');
                console.error(error);
                throw new Error("parse_serverUserTo_clientUser failed.")
            }
        } catch (error) {
            return { status: 500, message: 'An error occurred' }
        }
    }


    /* Call this from hooks/handle */
    public getUserFromCookie(event: RequestEvent) {
        const authCookie = event.cookies.get('auth');
        if (authCookie) {
            try {
                const decodedUser: TUserClient = this.jwt.decode(authCookie) as TUserClient;
                // Initialize the Svelte store with user data
                return decodedUser;
            } catch (error) {
                console.error('Invalid JWT:', error);
                // Optionally, clear the user store if token is invalid
            }
        }
        return null;
    }

    public async hasPermissions(clientUser: TUserClient | null, permissions: string[]): Promise<boolean> {
        if (clientUser === null || clientUser === undefined) { return false }
        try {
            const serverUser = await this.usersCollection.findOne({
                email: (clientUser as any).email,
                permissions: { $all: permissions }
            });

            if (serverUser !== null) {
                return true;
            }

        } catch (error) {
            return false;
        }
        return false;
    }
}
