import { JwtPayload } from "jsonwebtoken";

export interface Payload extends JwtPayload {
    role: string;
    userId: string;
    picture?: string;
    isVerified?: boolean;
} 