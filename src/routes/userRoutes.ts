import { Router } from "express";
import { userController } from "../controllers/userController.js";
import isAuthenticated from "../middleware/isAuthenticated.js";
import createThrottler from "../middleware/throttler.js";
import { SlowDownRequestHandler } from "express-slow-down";
import { RateLimitRequestHandler } from "express-rate-limit";
import createRateLimiter from "../middleware/rateLimiter.js";
import isAuthorized from "../middleware/isAuthorized.js";

const userRouter = Router();

const throttler: SlowDownRequestHandler = createThrottler({
    windowMs: 15 * 60 * 1000,
    delayAfter: 10, // after the tenth request within 15 mins, start delaying, lenient
    delayMs: (hits) => hits * 100, // delay each request by 100ms
    maxDelayMs: 2000, // max delay of 2 second
})

const limiter: RateLimitRequestHandler = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    max: 100, // can make at most 100 request / 15 min, more lenient
    standardHeaders: true,
    legacyHeaders: false,
})

userRouter.get(
    "/me",
    isAuthenticated,
    throttler,
    limiter,
    userController.getCurrentProfile
)

userRouter.get(
    "/verified",
    isAuthenticated,
    isAuthorized("YOUTUBER"),
    throttler,
    limiter,
    userController.getYoutuberVerifedStatus
)
userRouter.get(
    "/:id",
    isAuthenticated,
    throttler,
    limiter,
    userController.getUserById
)

userRouter.get(
    "/profile/youtuber/:id",
    isAuthenticated,
    // isAuthorized("YOUTUBER"),
    throttler,
    limiter,
    userController.getYoutuberProfileById
)
userRouter.get(
    "/profile/talent/:id",
    isAuthenticated,
    // isAuthorized("TALENT"),
    throttler,
    limiter,
    userController.getTalentProfileById
)


userRouter.get(
    "/roles/:role", 
    isAuthenticated, 
    throttler, 
    limiter, 
    userController.getUsersByRole
);


// TODO (huge):
// implement filtering
// implement pagination
// implement search
// implement sorting

export default userRouter;