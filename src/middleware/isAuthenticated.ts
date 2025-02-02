import { NextFunction, Response } from "express";
import jwt from 'jsonwebtoken'
import { Payload } from "../types/Payload.js";
import { RequestWithUser } from "../types/RequestWithUser.js";

const JWT_SECRET = process.env.JWT_SECRET as string;


export default function isAuthenticated(req: RequestWithUser, res: Response, next: NextFunction): any {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: "unauthorized" });
    if(!authHeader?.startsWith("Bearer ")) return res.status(401).json({ message: "unauthorized" });

    const token = authHeader.split(" ")[1];
    try{
        const decoded = jwt.verify(token, JWT_SECRET);

        if (typeof decoded !== "object" || !decoded) return res.status(403).json({ message: "invalid token payload" });

        const { role, userId } = decoded as Payload;
        if (!role || !userId) return res.status(403).json({ message: "forbidden" });

        req.userId = userId;
        req.role = role;
        next();
    } catch (e) {
        console.log(e);
        return res.status(401).json({ message: "unauthorized" });
    }

}