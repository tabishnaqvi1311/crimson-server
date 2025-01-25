
import { Router } from "express";
import { authController } from "../controllers/authController.js";

const authRouter = Router();

authRouter.get("/google", authController.google);
authRouter.get("/google/callback", authController.callback);
authRouter.post("/login", authController.login);
authRouter.get("/verify", authController.verify);

// next steps before we move on to crud 
// [] make ci/cd pipeline for server
// [] make sure auth and prisma works in prod 

export default authRouter;