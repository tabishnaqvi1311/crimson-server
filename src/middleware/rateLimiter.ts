import rateLimit, { RateLimitRequestHandler } from "express-rate-limit";
import { RateOptions } from "../types/RateOptions.js";


/**
 * 
 * @param {Object} options 
 * @param {number} options.windowMs - make this short so user can try again soon and dont get too penalised, else make it long if its something that gets hit less often
 * @param {number} options.max - how many requests can be made in the windowMs time period. more if its something that gets hit often, less if its something that gets hit less often
 * @returns The middleware that rate-limits clients based on your configuration.
*/
const createRateLimiter = (options: RateOptions): RateLimitRequestHandler => {
    return rateLimit({
        windowMs: options.windowMs,
        max: options.max,
        standardHeaders: options.standardHeaders || true,
        legacyHeaders: options.legacyHeaders || false,
    })
}

export default createRateLimiter;