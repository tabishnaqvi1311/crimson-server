import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken'
import { Payload } from "../types/Payload.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

const JWT_SECRET = process.env.JWT_SECRET as string;


export default function isAuthenticated(req: RequestWithUser, res: Response, next: NextFunction): any {
    const token = req.cookies.auth_token;

    if (!token) {
        return res.status(401).json({ message: "Unauthorized" });
    }

    try {
        const payload = jwt.verify(token, JWT_SECRET as string) as Payload;
        if(!payload || !payload.userId || !payload.role || !payload.picture) {
            return res.status(401).json({ message: "Invalid token" });
        }
        req.user = payload;
        next();
    } catch (err) {
        console.error("Token verification failed:", err);
        return res.status(403).json({ message: "Invalid or expired token" });
    }
}