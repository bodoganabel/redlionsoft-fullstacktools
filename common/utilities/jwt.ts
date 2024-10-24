
import jwt from "jsonwebtoken"
import { jwtDecode } from "jwt-decode"


export class JWT {
    private secretKey: string;

    constructor(secretKey: string) {
        this.secretKey = secretKey;
    }

    signToken(payload: object, expiresIn: string = '1h'): string {
        return jwt.sign(payload, this.secretKey, { expiresIn });
    }

    verifyToken(token: string): string | jwt.JwtPayload | null {
        try {
            return jwt.verify(token, this.secretKey);
        } catch (err) {
            return null;
        }
    }

    decode(token: string) {
        return jwtDecode(token)
    }
}

export default JWT;