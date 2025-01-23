import { Router } from "express";
import { authController } from "../controllers/authController.js";
const authRouter = Router();
authRouter.get("/google", authController.google);
authRouter.get("/google/callback", authController.callback);
authRouter.post("/login", authController.login);
authRouter.get("/verify", authController.verify);
// next steps
// implement sign up with google using OAuth2
// implement sign up with magic link using Resend
export default authRouter;
