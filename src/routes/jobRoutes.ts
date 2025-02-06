import { Router } from "express";
import isAuthenticated from "../middleware/isAuthenticated.js";
import { jobController } from "../controllers/jobController.js";
import isAuthorized from "../middleware/isAuthorized.js";
import { SlowDownRequestHandler } from "express-slow-down";
import { RateLimitRequestHandler } from "express-rate-limit";
import createThrottler from "../middleware/throttler.js";
import createRateLimiter from "../middleware/rateLimiter.js";

const jobRouter = Router();

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


jobRouter.get(
    "/all", 
    isAuthenticated,
    throttler,
    limiter,
    jobController.getAllJobs
);

jobRouter.get(
    "/:id", 
    isAuthenticated, 
    throttler,
    limiter,
    jobController.getJobById
);

jobRouter.get(
    "/youtuber/:id",
    isAuthenticated,
    throttler,
    limiter,
    jobController.getJobsByYoutuberId
)

jobRouter.post(
    "/create", 
    isAuthenticated, 
    isAuthorized("YOUTUBER"), 
    throttler,
    limiter,
    jobController.createJob
);

jobRouter.put(
    "/update/:id", 
    isAuthenticated, 
    isAuthorized("YOUTUBER"), 
    throttler,
    limiter,
    jobController.updateJob
);

jobRouter.delete(
    "/delete/:id", 
    isAuthenticated, 
    isAuthorized("YOUTUBER"), 
    throttler,
    limiter,
    jobController.deleteJob
);

export default jobRouter;