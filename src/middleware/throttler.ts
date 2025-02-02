import slowDown, { SlowDownRequestHandler } from "express-slow-down";
import { SlowOptions } from "../types/SlowOptions.js";


/**
 * 
 * @param options 
 * @param {number} options.windowMs: make this short so user can try again soon and dont get too penalised, else make it long if its something that gets hit less often
 * @param {number} options.delayAfter how many requests can be made in the windowMs time period. more if its something that gets hit often, less if its something that gets hit less often
 * @param {Function} options.delayMs - how long to delay the response, increases with each request and caps at maxDelayMs
 * @param {number} options.maxDelayMs - the maximum delay to apply, no request will be delayed longer than this
 * @returns The middleware that slows down clients based on your configuration.
 */
const createThrottler = (options: SlowOptions): SlowDownRequestHandler => {
    return slowDown({
        windowMs: options.windowMs,
        delayAfter: options.delayAfter,
        delayMs: options.delayMs,
        maxDelayMs: options.maxDelayMs
    })
}

export default createThrottler;