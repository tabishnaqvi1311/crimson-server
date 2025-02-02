import { Router } from "express";
import { verificationController } from "../controllers/verificationController.js";

const verificationRouter = Router();

verificationRouter.get("/verify-youtuber", verificationController.verifyYoutuber)
verificationRouter.get("/google/callback", verificationController.callback)

export default verificationRouter;