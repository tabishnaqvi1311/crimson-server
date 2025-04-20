import { Request } from "express";
import { Payload } from "./Payload.js";

export interface RequestWithUser extends Request {
    user?: Payload;
}
