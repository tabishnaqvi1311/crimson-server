import { Router } from "express";
import { userController } from "../controllers/userController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";

const userRouter = Router();

userRouter.get("/:role", isAuthenticated, userController.getUsersByRole);

// TODO (huge):
// implement filtering
// implement pagination
// implement search
// implement sorting

export default userRouter;