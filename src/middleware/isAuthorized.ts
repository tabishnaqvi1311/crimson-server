import { NextFunction, Response } from "express";
import { RequestWithUser } from "../types/RequestWithUser.js";

// this is a factory function that returns a middleware function
// factory functions = functions that return functions
// think of it like a class with one method that returns an instance of that class
export default function isAuthorized(role: "YOUTUBER" | "TALENT"){
    return (req: RequestWithUser, res: Response, next: NextFunction): any => {
        console.log("inside middleware");
        if(!req.role || req.role !== role) {
            return res.status(403).json({ message: "forbidden"});
        }
        next();
    }
}