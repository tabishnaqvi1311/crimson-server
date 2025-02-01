
import { Router } from "express";
import { authController } from "../controllers/authController.js";
import createRateLimiter from "../middleware/rateLimiter.js";
import createThrottler from "../middleware/throttler.js";
import { SlowDownRequestHandler } from "express-slow-down";
import { RateLimitRequestHandler } from "express-rate-limit";

const authRouter = Router();

const throttler: SlowDownRequestHandler = createThrottler({
    windowMs: 15 * 60 * 1000,
    delayAfter: 2, // after the second request within 15 mins, start delaying
    delayMs: (hits) => hits * 300, // delay each request by 300ms
    maxDelayMs: 2500, // max delay of 2.5 seconds
})

const limiter: RateLimitRequestHandler = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 15, // can make at most 15 requests in 15 minutes, then they get 429
    standardHeaders: true,
    legacyHeaders: false,
})

authRouter.get("/google", authController.google);
authRouter.get("/google/callback", authController.callback);
authRouter.post("/login", throttler, limiter, authController.login);
authRouter.get("/verify", throttler, limiter, authController.verify);

// authRouter.get("/test", (req: any, res: any) => res.send("test"));

// next steps before we move on to crud 
// [] make ci/cd pipeline for server

export default authRouter;