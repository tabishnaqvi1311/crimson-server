import { Router } from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { SlowDownRequestHandler } from "express-slow-down";
import { RateLimitRequestHandler } from "express-rate-limit";
import createThrottler from "../middleware/throttler.js";
import createRateLimiter from "../middleware/rateLimiter.js";
import isAuthorized from "../middleware/isAuthorized.js";
import { applicationController } from "../controllers/applicationController.js";
const applicationRouter = Router();


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


applicationRouter.get(
    "/:id",
    isAuthenticated,
    throttler,
    limiter,
    applicationController.getApplicationById
);

applicationRouter.get(
    "/job/:id",
    isAuthenticated,
    throttler,
    limiter,
    applicationController.getApplicationsByJob
);
applicationRouter.get(
    "/user/:id",
    isAuthenticated,
    throttler,
    limiter,
    applicationController.getApplicationsByUser
);

applicationRouter.post(
    "/apply/:id",
    isAuthenticated,
    isAuthorized("TALENT"),
    throttler,
    limiter,
    applicationController.createApplication
);

applicationRouter.put(
    "/update/:id",
    isAuthenticated,
    throttler,
    limiter,
    applicationController.updateApplication
);

applicationRouter.delete(
    "/delete/:id",
    isAuthenticated,
    isAuthorized("TALENT"),
    throttler,
    limiter,
    applicationController.deleteApplication
)


export default applicationRouter;